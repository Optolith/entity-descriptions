import { on } from "@elyukai/utils/function"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  Cost,
  EquipmentIdentifier,
  EquipmentPackageItem,
  LocaleMeasurementAdjustments,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator, type TaggedEntity } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { Translate } from "../helpers/translate.js"
import { getEquipmentName } from "./equipment.js"
import { attributedInstance } from "./partial/markdown.js"

type AtomicCost = number | "Various" | "Invaluable" | [from: number, to: number]

const sumAtomicEquipmentCost = (acc: AtomicCost, current: AtomicCost): AtomicCost => {
  if (typeof acc === "string") {
    return acc
  }

  if (typeof current === "string") {
    return current
  }

  if (Array.isArray(current)) {
    if (Array.isArray(acc)) {
      return [acc[0] + current[0], acc[1] + current[1]]
    } else {
      return [acc + current[0], acc + current[1]]
    }
  } else if (Array.isArray(acc)) {
    return [acc[0] + current, acc[1] + current]
  } else {
    return acc + current
  }
}

const sumAtomicEquipmentWeight = (acc: AtomicWeight, current: AtomicWeight): AtomicWeight => {
  if (Array.isArray(current)) {
    if (Array.isArray(acc)) {
      return [acc[0] + current[0], acc[1] + current[1]]
    } else {
      return [acc + current[0], acc + current[1]]
    }
  } else if (Array.isArray(acc)) {
    return [acc[0] + current, acc[1] + current]
  } else {
    return acc + current
  }
}

const rangeAtomicEquipmentCost = (
  acc: AtomicCost,
  current: AtomicCost,
): Exclude<AtomicCost, number> => {
  if (typeof acc === "string") {
    return acc
  }

  if (typeof current === "string") {
    return current
  }

  const normAcc: [number, number] = typeof acc === "number" ? [acc, acc] : acc
  const normCurrent: [number, number] = typeof current === "number" ? [current, current] : current
  return [Math.min(normAcc[0], normCurrent[0]), Math.max(normAcc[1], normCurrent[1])]
}

const getAtomicCost = (cost: Cost): AtomicCost => {
  switch (cost.kind) {
    case "Free":
      return 0
    case "Various":
      return "Various"
    case "Invaluable":
      return "Invaluable"
    case "Fixed":
      return cost.Fixed.value
    case "Range":
      return [cost.Range.from, cost.Range.to]
    default:
      return assertExhaustive(cost)
  }
}

const getAtomicEquipmentCost = (entry: TaggedEntity<EquipmentIdentifier["kind"]>): AtomicCost => {
  switch (entry.entity) {
    case "AnimalCare":
      switch (entry.content.type.kind) {
        case "General":
          return getAtomicCost(entry.content.type.General.cost)
        case "Feed":
          return entry.content.type.Feed.cost.PerWeek.value
        default:
          return assertExhaustive(entry.content.type)
      }
    case "Book": {
      switch (entry.content.cost.kind) {
        case "Single":
          switch (entry.content.cost.Single.kind) {
            case "Definite":
              return getAtomicCost(entry.content.cost.Single.Definite.cost)
            case "Indefinite":
              return "Various"
            default:
              return assertExhaustive(entry.content.cost.Single)
          }
        case "Multiple":
          return (
            entry.content.cost.Multiple.reduce((acc: AtomicCost | null, cost): AtomicCost => {
              if (typeof acc === "string") {
                return acc
              }

              switch (cost.kind) {
                case "Definite":
                  return acc === null
                    ? getAtomicCost(cost.Definite.cost)
                    : rangeAtomicEquipmentCost(acc, getAtomicCost(cost.Definite.cost))
                case "Indefinite":
                  return "Various"
                default:
                  return assertExhaustive(cost)
              }
            }, null) ?? 0
          )
        default:
          return assertExhaustive(entry.content.cost)
      }
    }
    case "Jewelry": {
      const costs: AtomicCost[] = [
        entry.content.cost.bronze,
        entry.content.cost.silver,
        entry.content.cost.gold,
      ]
      return costs.reduce(rangeAtomicEquipmentCost)
    }
    case "Ammunition":
    case "Animal":
    case "Armor":
    case "BandageOrRemedy":
    case "CeremonialItem":
    case "Clothes":
    case "ClothingPackage":
    case "Container":
    case "EquipmentOfBlessedOnes":
    case "GemOrPreciousStone":
    case "IlluminationLightSource":
    case "IlluminationRefillOrSupply":
    case "Laboratory":
    case "Liebesspielzeug":
    case "LuxuryGood":
    case "MagicalArtifact":
    case "MusicalInstrument":
    case "Newspaper":
    case "OrienteeringAid":
    case "RopeOrChain":
    case "Stationery":
    case "ThievesTool":
    case "ToolOfTheTrade":
    case "TravelGearOrTool":
    case "Vehicle":
    case "Weapon":
    case "WeaponAccessory":
    case "WorkingSupernaturalCreature":
      return getAtomicCost(entry.content.cost)
    case "Elixir":
      return [entry.content.cost_per_ingredient_level, entry.content.cost_per_ingredient_level * 6]
    case "Poison":
      switch (entry.content.cost?.kind) {
        case undefined:
        case "CannotBeExtracted":
        case "None":
          return 0
        case "Constant":
          return entry.content.cost.Constant
        case "Indefinite":
          return "Various"
        case "DependingOnPurchaseOrSale":
          return entry.content.cost.DependingOnPurchaseOrSale.purchase
        default:
          return assertExhaustive(entry.content.cost)
      }
    default:
      return assertExhaustive(entry)
  }
}

type AtomicWeight = number | [from: number, to: number]

const getAtomicEquipmentWeight = (
  entry: TaggedEntity<EquipmentIdentifier["kind"]>,
): AtomicWeight => {
  switch (entry.entity) {
    case "Ammunition":
    case "Animal":
    case "ClothingPackage":
    case "Elixir":
    case "EquipmentOfBlessedOnes":
    case "Newspaper":
    case "Poison":
    case "WorkingSupernaturalCreature":
      return 0
    case "AnimalCare":
      switch (entry.content.type.kind) {
        case "General":
          return entry.content.type.General.weight
        case "Feed":
          return 0
        default:
          return assertExhaustive(entry.content.type)
      }
    case "Jewelry": {
      const { bronze, silver, gold } = entry.content.weight
      const values = [bronze, silver, gold]
      return [Math.min(...values), Math.max(...values)]
    }
    case "Armor":
    case "BandageOrRemedy":
    case "Book":
    case "CeremonialItem":
    case "Clothes":
    case "Container":
    case "GemOrPreciousStone":
    case "IlluminationLightSource":
    case "IlluminationRefillOrSupply":
    case "Laboratory":
    case "Liebesspielzeug":
    case "LuxuryGood":
    case "MagicalArtifact":
    case "MusicalInstrument":
    case "OrienteeringAid":
    case "RopeOrChain":
    case "Stationery":
    case "ThievesTool":
    case "ToolOfTheTrade":
    case "TravelGearOrTool":
    case "Vehicle":
    case "Weapon":
    case "WeaponAccessory":
      return entry.content.weight ?? 0
    default:
      return assertExhaustive(entry)
  }
}

const renderAtomicCost = (translate: Translate, cost: AtomicCost): string => {
  if (typeof cost === "number") {
    return translate(".input {$value :number} {{{$value} silverthalers}}", {
      value: cost,
    })
  } else if (typeof cost === "string") {
    switch (cost) {
      case "Various":
        return translate("various")
      case "Invaluable":
        return translate("invaluable")
      default:
        return assertExhaustive(cost)
    }
  } else {
    return translate(
      ".input {$from :number} .input {$to :number} {{{$from}–{$to} silverthalers}}",
      {
        from: cost[0],
        to: cost[1],
      },
    )
  }
}

const renderAtomicWeight = (
  translate: Translate,
  measurements: Required<LocaleMeasurementAdjustments>,
  cost: AtomicWeight,
): string => {
  if (typeof cost === "number") {
    return translate(".input {$value :number} {{{$value} pounds}}", {
      value: measurements.stonesMultiplier * cost,
    })
  } else {
    return translate(".input {$from :number} .input {$to :number} {{{$from}–{$to} pounds}}", {
      from: measurements.stonesMultiplier * cost[0],
      to: measurements.stonesMultiplier * cost[1],
    })
  }
}

/**
 * Get a JSON representation of the rules text for an equipment package.
 */
export const getEquipmentPackageEntityDescription = createEntityDescriptionCreator<
  "EquipmentPackage",
  {
    getInstanceById: GetInstanceById<"Publication" | EquipmentIdentifier["kind"] | "SocialStatus">
  }
>(({ getInstanceById }, locale, { content }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(content.translations)

  if (translation === undefined) {
    return undefined
  }

  const actualItems =
    content.items
      ?.map(item => ({
        ...item,
        content: { entity: item.id.kind, content: getInstanceById(item.id) },
      }))
      .filter(
        (
          item,
        ): item is EquipmentPackageItem & {
          content: TaggedEntity<EquipmentIdentifier["kind"]>
        } => item.content.content !== undefined,
      ) ?? []

  return {
    title: translation.name,
    className: "equipment-package",
    body: [
      {
        type: "table",
        header: [translation.name, translate("Weight"), translate("Cost")],
        rows: actualItems
          .map((item): [string, string, string] => [
            attributedInstance(
              getEquipmentName(translate, translateMap, getInstanceById, item.content),
              item.content.entity,
              item.content.id,
              { context: '"equipment-package"' },
            ),
            renderAtomicWeight(
              translate,
              locale.measurementAdjustments,
              getAtomicEquipmentWeight(item.content),
            ),
            renderAtomicCost(translate, getAtomicEquipmentCost(item.content)),
          ])
          .toSorted(on(item => item[0], locale.compare)),
        footer: [
          translate("Total"),
          renderAtomicWeight(
            translate,
            locale.measurementAdjustments,
            actualItems
              .map(item => getAtomicEquipmentWeight(item.content))
              .reduce(sumAtomicEquipmentWeight, 0),
          ),
          renderAtomicCost(
            translate,
            actualItems
              .map(item => getAtomicEquipmentCost(item.content))
              .reduce(sumAtomicEquipmentCost, 0),
          ),
        ],
      },
    ],
    references: content.src,
  }
})
