import { ensureNonEmpty, isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { isNotNullish } from "@elyukai/utils/nullable"
import { sign } from "@elyukai/utils/string/number"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { mapNullable } from "@optolith/helpers/nullable"
import type {
  Ammunition_ID,
  ArmorComplexity,
  ArmorType_ID,
  AttackModifier,
  BookCost,
  BookCostVariant,
  BurningTime,
  CloseCombatTechnique,
  CombatUse,
  Complexity,
  Cost,
  Encumbrance,
  EquipmentIdentifier,
  Errata,
  GenMeleeWeapon,
  GenRangedWeapon,
  HasAdditionalPenalties,
  HitZone,
  ImprovisedWeaponTranslation,
  JewelryMaterialDifference,
  Length,
  LocaleMeasurementAdjustments,
  MeleeDamage,
  MeleeWeaponUse,
  ParryModifier,
  PrimaryAttributeDamageThreshold,
  Protection,
  PublicationRefs,
  RangeBrackets,
  RangedDamage,
  RangedWeaponUse,
  Reach_ID,
  ReloadTime,
  RestrictedTo,
  RestrictedToBlessedTraditions,
  RestrictedToCultures,
  RestrictedToMagicalTraditions,
  RestrictedToProfessions,
  RestrictedToRaces,
  SecondaryArmorTranslation,
  StructurePoints,
  Weight,
} from "optolith-database-schema/gen"
import {
  createEntityDescriptionCreator,
  type TaggedEntity,
} from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { LocaleCompare, LocaleJoin } from "../helpers/locale.js"
import type {
  LocaleMap,
  Translate,
  TranslateMap,
} from "../helpers/translate.js"
import type { EntityDescriptionSection, IdMap } from "../index.js"
import { renderDice, renderDiceAndFlat } from "./partial/dice.js"
import {
  additionFormatter,
  subtractionFormatter,
} from "./partial/mathOperation.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"
import { formatTimeSpan } from "./partial/units/timeSpan.js"
import { MISSING_VALUE, UNHANDLED_VALUE } from "./partial/unknown.js"

/**
 * Get the name of an equipment item.
 */
export const getEquipmentName = (
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"SocialStatus">,
  entry: TaggedEntity<EquipmentIdentifier["kind"]>,
) => {
  switch (entry.entity) {
    case "ClothingPackage": {
      const socialStatusName =
        translateMap(
          getInstanceById("SocialStatus", entry.content.socialStatus)
            ?.translations,
        )?.name ?? MISSING_VALUE

      return translate("Clothing Package {$socialStatus}", {
        socialStatus: socialStatusName,
      })
    }
    case "Ammunition":
    case "Animal":
    case "AnimalCare":
    case "Armor":
    case "BandageOrRemedy":
    case "Book":
    case "CeremonialItem":
    case "Clothes":
    case "Container":
    case "Elixir":
    case "EquipmentOfBlessedOnes":
    case "GemOrPreciousStone":
    case "IlluminationLightSource":
    case "IlluminationRefillOrSupply":
    case "Jewelry":
    case "Laboratory":
    case "Liebesspielzeug":
    case "LuxuryGood":
    case "MagicalArtifact":
    case "MusicalInstrument":
    case "Newspaper":
    case "OrienteeringAid":
    case "Poison":
    case "RopeOrChain":
    case "Stationery":
    case "ThievesTool":
    case "ToolOfTheTrade":
    case "TravelGearOrTool":
    case "Vehicle":
    case "Weapon":
    case "WeaponAccessory":
      return (
        translateMap<BaseItemTranslation>(entry.content.translations)?.name ??
        MISSING_VALUE
      )
    default:
      return assertExhaustive(entry)
  }
}

const renderPrimaryAttributeAndDamageThreshold = (
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"Attribute">,
  closeCombatTechnique: CloseCombatTechnique | undefined,
  damageThreshold: PrimaryAttributeDamageThreshold | undefined,
): string => {
  if (damageThreshold === undefined) {
    return "—"
  }

  const getAttrAbbrv = (attrId: string): string =>
    translateMap(getInstanceById("Attribute", attrId)?.translations)
      ?.abbreviation ?? MISSING_VALUE

  switch (damageThreshold.kind) {
    case "Default":
      return `${
        closeCombatTechnique?.primary_attribute.map(getAttrAbbrv).join("/") ??
        MISSING_VALUE
      } ${damageThreshold.Default.threshold}`
    case "List":
      if (isNotEmpty(damageThreshold.List.list)) {
        const { list } = damageThreshold.List
        if (list.some(item => item.threshold !== list[0].threshold)) {
          return list
            .map(item => `${getAttrAbbrv(item.attribute)} ${item.threshold}`)
            .join("/")
        } else {
          return `${list
            .map(item => getAttrAbbrv(item.attribute))
            .join("/")} ${list[0].threshold}`
        }
      } else {
        return MISSING_VALUE
      }
    default:
      return assertExhaustive(damageThreshold)
  }
}

const renderAttackParryModifier = (
  attackModifier: AttackModifier | undefined,
  parryModifier: ParryModifier | undefined,
): string =>
  attackModifier === undefined && parryModifier === undefined
    ? "—"
    : `${attackModifier === undefined ? "—" : sign(attackModifier)}/${parryModifier === undefined ? "—" : sign(parryModifier)}`

const renderReach = (
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"Reach">,
  reach: Reach_ID | undefined,
): string =>
  reach === undefined
    ? "—"
    : (translateMap(getInstanceById("Reach", reach)?.translations)?.name ??
      MISSING_VALUE)

const renderLength = (
  translate: Translate,
  measurements: Required<LocaleMeasurementAdjustments>,
  length: Length | undefined,
): string =>
  length === undefined
    ? "—"
    : translate(".input {$value :number} {{{$value} inches}}", {
        value: length * measurements.halffingersMultiplier,
      })

/**
 * Render combat values of a melee weapon.
 */
export const renderMeleeWeapon = <Damage>(
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<
    "Attribute" | "CloseCombatTechnique" | "Reach"
  >,
  measurements: Required<LocaleMeasurementAdjustments>,
  renderDamage: (damage: Damage) => string,
  closeCombatTechniqueId: string,
  use: GenMeleeWeapon<Damage>,
): EntityDescriptionSection => {
  const combatTechnique = getInstanceById(
    "CloseCombatTechnique",
    closeCombatTechniqueId,
  )

  return {
    label: translate("Combat Technique {$name}", {
      name: translateMap(combatTechnique?.translations)?.name ?? MISSING_VALUE,
    }),
    value: [
      { label: translate("Damage Points"), value: renderDamage(use.damage) },
      {
        label: translate("Primary Attribute + Damage Threshold"),
        value: renderPrimaryAttributeAndDamageThreshold(
          translateMap,
          getInstanceById,
          combatTechnique,
          use.damage_threshold,
        ),
      },
      {
        label: translate("Attack/Parry Modifier"),
        value: renderAttackParryModifier(use.attackModifier, use.parryModifier),
      },
      {
        label: translate("Reach"),
        value: renderReach(translateMap, getInstanceById, use.reach),
      },
      {
        label: translate("Length"),
        value: renderLength(translate, measurements, use.length),
      },
    ],
  }
}

const renderReloadTime = (translate: Translate, reloadTime: ReloadTime[]) =>
  isNotEmpty(reloadTime)
    ? reloadTime.length > 1
      ? translate("{$value} actions", {
          value: reloadTime.map(time => time.value).join("/"),
        })
      : translate(".input {$value :number} {{{$value} actions}}", {
          value: reloadTime[0].value,
        })
    : MISSING_VALUE

const renderRangeBrackets = (rangeBrackets: RangeBrackets) =>
  `${rangeBrackets.close}/${rangeBrackets.medium}/${rangeBrackets.far}`

const renderAmmunition = (
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"Ammunition">,
  ammunition: Ammunition_ID | undefined,
) =>
  ammunition === undefined
    ? "—"
    : (translateMap(getInstanceById("Ammunition", ammunition)?.translations)
        ?.name ?? MISSING_VALUE)

const renderMeleeDamage = (translate: Translate) => (damage: MeleeDamage) =>
  renderDiceAndFlat(translate, damage.dice, damage.flat)

/**
 * Render combat values of a ranged weapon.
 */
export const renderRangedWeapon = <Damage>(
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"RangedCombatTechnique" | "Ammunition">,
  measurements: Required<LocaleMeasurementAdjustments>,
  renderDamage: (damage: Damage) => string,
  rangedCombatTechniqueId: string,
  use: GenRangedWeapon<Damage>,
): EntityDescriptionSection => {
  const combatTechnique = getInstanceById(
    "RangedCombatTechnique",
    rangedCombatTechniqueId,
  )

  return {
    label: translate("Combat Technique {$name}", {
      name: translateMap(combatTechnique?.translations)?.name ?? MISSING_VALUE,
    }),
    value: [
      { label: translate("Damage Points"), value: renderDamage(use.damage) },
      {
        label: translate("Reload Time"),
        value: renderReloadTime(translate, use.reload_time),
      },
      {
        label: translate("Range Brackets"),
        value: renderRangeBrackets(use.range),
      },
      {
        label: translate("Ammunition"),
        value: renderAmmunition(translateMap, getInstanceById, use.ammunition),
      },
      {
        label: translate("Length"),
        value: renderLength(translate, measurements, use.length),
      },
    ],
  }
}

const renderRangedDamage = (translate: Translate) => (damage: RangedDamage) => {
  switch (damage.kind) {
    case "Default": {
      const renderedDice = renderDice(translate, damage.Default.dice)
      return damage.Default.flat === undefined || damage.Default.flat === 0
        ? renderedDice
        : damage.Default.flat > 0
          ? additionFormatter(renderedDice, damage.Default.flat)
          : subtractionFormatter(renderedDice, damage.Default.flat)
    }
    case "NotApplicable":
      return "—"
    case "Special":
      return translate("Special")
    default:
      return assertExhaustive(damage)
  }
}

const renderComplexity = (
  translate: Translate,
  complexity: ArmorComplexity | Complexity | undefined,
) =>
  mapNullable(complexity, c => ({
    label: translate("Complexity"),
    value: (() => {
      switch (c.kind) {
        case "Primitive":
          return translate("Primitive")
        case "Simple":
          return translate("Simple")
        case "Complex":
          return `${translate("Complex")} (${translate("{$value} AP", {
            value: c.Complex.ap_value,
          })})`
        case "Various":
          return translate("Various")
        default:
          return assertExhaustive(c)
      }
    })(),
  }))

const renderBlessedTraditionRestriction = (
  translate: Translate,
  translateMap: TranslateMap,
  localeJoin: LocaleJoin,
  getInstanceById: GetInstanceById<"BlessedTradition">,
  name: string,
  restriction: RestrictedToBlessedTraditions,
): string => {
  const getName = (traditionId: string): string | undefined =>
    translateMap(getInstanceById("BlessedTradition", traditionId)?.translations)
      ?.name

  if (restriction.isSanctifiedBy) {
    switch (restriction.scope.kind) {
      case "Specific":
        if (!isNotEmpty(restriction.scope.Specific)) {
          return translate(
            "Sanctified ({$tradition}); only Blessed Ones of {$tradition} may purchase weapons sanctified by {$tradition}.",
            { tradition: MISSING_VALUE },
          )
        } else if (restriction.scope.Specific.length > 1) {
          const list =
            restriction.scope.Specific.map(getName).filter(isNotNullish)
          return translate(
            "Sanctified ({$sanctifiedTraditions}); only Blessed Ones of {$traditions} may purchase weapons sanctified by {$traditions}, respectively.",
            {
              sanctifiedTraditions: localeJoin(list, "unit"),
              traditions: localeJoin(list, "disjunction"),
            },
          )
        } else {
          return translate(
            "Sanctified ({$tradition}); only Blessed Ones of {$tradition} may purchase weapons sanctified by {$tradition}.",
            {
              tradition:
                getName(restriction.scope.Specific[0]) ?? MISSING_VALUE,
            },
          )
        }
      case "Church":
        return UNHANDLED_VALUE
      case "Shamanistic":
        return UNHANDLED_VALUE
      default:
        return assertExhaustive(restriction.scope)
    }
  } else {
    switch (restriction.scope.kind) {
      case "Specific":
        return translate(
          "To buy a {$itemName} during hero creation, the character must have Tradition ({$traditions}).",
          {
            itemName: name,
            traditions: localeJoin(
              restriction.scope.Specific.map(
                traditionId =>
                  translateMap(
                    getInstanceById("BlessedTradition", traditionId)
                      ?.translations,
                  )?.name,
              ).filter(isNotNullish),
              "disjunction",
            ),
          },
        )
      case "Church":
        return UNHANDLED_VALUE
      case "Shamanistic":
        return translate(
          "To buy a {$itemName} during hero creation, the character must have a shamanistic tradition.",
          {
            itemName: name,
          },
        )
      default:
        return assertExhaustive(restriction.scope)
    }
  }
}

const renderMagicalTraditionRestriction = (
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"MagicalTradition">,
  localeJoin: LocaleJoin,
  name: string,
  restriction: RestrictedToMagicalTraditions,
): string =>
  translate(
    "To buy a {$itemName} during hero creation, the character must have Tradition ({$traditions}).",
    {
      itemName: name,
      traditions: localeJoin(
        restriction.scope
          .map(
            traditionId =>
              translateMap(
                getInstanceById("MagicalTradition", traditionId)?.translations,
              )?.name,
          )
          .filter(isNotNullish),
        "disjunction",
      ),
    },
  )

const renderRaceRestriction = (
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"Race">,
  localeJoin: LocaleJoin,
  name: string,
  restriction: RestrictedToRaces,
): string =>
  translate(
    "To buy a {$name} during hero creation, the character must be from a culture common to the race of {$races}.",
    {
      name,
      races: localeJoin(
        restriction.scope
          .map(
            id =>
              translateMap(getInstanceById("Race", id)?.translations)?.name ??
              MISSING_VALUE,
          )
          .filter(isNotNullish),
        "disjunction",
      ),
    },
  )

const renderCultureRestriction = (
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<"Culture">,
  localeJoin: LocaleJoin,
  name: string,
  restriction: RestrictedToCultures,
): string =>
  translate(
    "To buy a {$name} during hero creation, the character must be from the culture of the {$cultures}.",
    {
      name,
      cultures: localeJoin(
        restriction.scope
          .map(
            id =>
              translateMap(getInstanceById("Culture", id)?.translations)
                ?.name ?? MISSING_VALUE,
          )
          .filter(isNotNullish),
        "disjunction",
      ),
    },
  )

const renderProfessionRestriction = (
  _translate: Translate,
  _translateMap: TranslateMap,
  _getInstanceById: GetInstanceById<"Profession">,
  _localeJoin: LocaleJoin,
  _name: string,
  _restriction: RestrictedToProfessions,
): string => UNHANDLED_VALUE

const renderNote = (
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<
    "Race" | "Culture" | "Profession" | "BlessedTradition" | "MagicalTradition"
  >,
  localeJoin: LocaleJoin,
  melee_uses:
    | {
        [closeCombatTechniqueId: string]: MeleeWeaponUse
      }
    | undefined,
  restrictedTo: RestrictedTo | undefined,
  name: string,
  note: string | undefined,
) =>
  ensureNonEmpty(
    [
      Object.values(melee_uses ?? {}).some(use => use.is_parrying_weapon)
        ? translate("Parrying weapon (PA bonus +1 for the main weapon)")
        : undefined,
      restrictedTo?.blessedTraditions === undefined
        ? undefined
        : renderBlessedTraditionRestriction(
            translate,
            translateMap,
            localeJoin,
            getInstanceById,
            name,
            restrictedTo.blessedTraditions,
          ),
      restrictedTo?.races === undefined
        ? undefined
        : renderRaceRestriction(
            translate,
            translateMap,
            getInstanceById,
            localeJoin,
            name,
            restrictedTo.races,
          ),
      restrictedTo?.cultures === undefined
        ? undefined
        : renderCultureRestriction(
            translate,
            translateMap,
            getInstanceById,
            localeJoin,
            name,
            restrictedTo.cultures,
          ),
      restrictedTo?.professions === undefined
        ? undefined
        : renderProfessionRestriction(
            translate,
            translateMap,
            getInstanceById,
            localeJoin,
            name,
            restrictedTo.professions,
          ),
      restrictedTo?.magicalTraditions === undefined
        ? undefined
        : renderMagicalTraditionRestriction(
            translate,
            translateMap,
            getInstanceById,
            localeJoin,
            name,
            restrictedTo.magicalTraditions,
          ),
      note,
    ].filter(isNotNullish),
  )?.join("; ")

const renderWeight = (
  translate: Translate,
  measurements: Required<LocaleMeasurementAdjustments>,
  weight: Weight | JewelryMaterialDifference<Weight>,
): EntityDescriptionSection => {
  if (typeof weight === "number") {
    return {
      label: translate("Weight"),
      value: translate(".input {$value :number} {{{$value} pounds}}", {
        value: weight * measurements.stonesMultiplier,
      }),
    }
  } else {
    return {
      label: translate("Weight (Bronze/Silver/Gold)"),
      value: translate("{$value} pounds", {
        value: [weight.bronze, weight.silver, weight.gold]
          .map(value => value * measurements.stonesMultiplier)
          .join("/"),
      }),
    }
  }
}

const renderCost = (
  translate: Translate,
  translateMap: TranslateMap,
  cost: Cost | BookCost | JewelryMaterialDifference<Cost>,
): EntityDescriptionSection => {
  const renderBookCostVariant = (bookCostVariant: BookCostVariant) => {
    switch (bookCostVariant.kind) {
      case "Definite": {
        const translation = translateMap(bookCostVariant.Definite.translations)
        return (
          renderCost(translate, translateMap, bookCostVariant.Definite.cost) +
          parensIf(translation?.label)
        )
      }
      case "Indefinite": {
        const translation = translateMap(
          bookCostVariant.Indefinite.translations,
        )
        return (
          (translation?.description ?? MISSING_VALUE) +
          parensIf(translation?.label)
        )
      }
      default:
        return assertExhaustive(bookCostVariant)
    }
  }

  if ("bronze" in cost) {
    return {
      label: translate("Cost (Bronze/Silver/Gold)"),
      value: translate("{$value} silverthalers", {
        value: [cost.bronze, cost.silver, cost.gold].join("/"),
      }),
    }
  } else {
    return {
      label: translate("Cost"),
      value: (() => {
        switch (cost.kind) {
          case "Free":
            return translate("free")
          case "Various":
            return translate("various")
          case "Invaluable":
            return translate("invaluable")
          case "Fixed": {
            const translation = translateMap(cost.Fixed.translations)
            const main = translate(
              ".input {$value :number} {{{$value} silverthalers}}",
              {
                value: cost.Fixed.value,
              },
            )

            if (translation?.wrap_in_text === undefined) {
              return main
            }

            return `${UNHANDLED_VALUE} ${translate(
              ".input {$value :number} {{{$value} silverthalers}}",
              {
                value: cost.Fixed.value,
              },
            )}`
          }
          case "Range":
            return translate(
              ".input {$from :number} .input {$to :number} {{{$from}–{$to} silverthalers}}",
              {
                from: cost.Range.from,
                to: cost.Range.to,
              },
            )
          case "Single":
            return renderBookCostVariant(cost.Single)
          case "Multiple":
            return cost.Multiple.map(renderBookCostVariant).join(", ")
          default:
            return assertExhaustive(cost)
        }
      })(),
    }
  }
}

const renderArmorValues = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  getInstanceById: GetInstanceById<"DerivedCharacteristic">,
  idMap: IdMap,
  values: NormalizedArmorValues,
) => [
  { label: translate("Protection"), value: values.protection },
  { label: translate("Encumbrance"), value: values.encumbrance },
  {
    label: translate("Additional Penalties"),
    value: values.has_additional_penalties
      ? [
          idMap.DerivedCharacteristic.Movement,
          idMap.DerivedCharacteristic.Initiative,
        ]
          .map(
            dcId =>
              `${sign(-1)} ${
                translateMap(
                  getInstanceById("DerivedCharacteristic", dcId)?.translations,
                )?.abbreviation ?? MISSING_VALUE
              }`,
          )
          .toSorted(localeCompare)
          .join(", ")
      : "—",
  },
]

type BaseItem = {
  cost?: Cost | BookCost | JewelryMaterialDifference<Cost>
  weight?: Weight | JewelryMaterialDifference<Weight>
  complexity?: ArmorComplexity | Complexity
  structure_points?: StructurePoints
  burning_time?: BurningTime
  melee_uses?: {
    [closeCombatTechniqueId: string]: MeleeWeaponUse
  }
  ranged_uses?: {
    [rangedCombatTechniqueId: string]: RangedWeaponUse
  }
  combat_use?: CombatUse
  restrictedTo?: RestrictedTo
  src: PublicationRefs
  translations?: LocaleMap<BaseItemTranslation>
}

type BaseItemTranslation = {
  name: string
  secondary_name?: string
  note?: string
  rules?: string
  advantage?: string
  disadvantage?: string
  color?: string
  language?: string
  script?: string
  errata?: Errata
}

type NormalizedCombatValues<GenMeleeDamage, GenRangedDamage> =
  | {
      type: "Weapon"
      values: {
        melee_uses?: {
          [closeCombatTechniqueId: string]: GenMeleeWeapon<GenMeleeDamage>
        }
        ranged_uses?: {
          [rangedCombatTechniqueId: string]: GenRangedWeapon<GenRangedDamage>
        }
        restrictedTo?: RestrictedTo
        translations?: {
          [localeId: string]: ImprovisedWeaponTranslation
        }
      }
    }
  | {
      type: "Armor"
      values: NormalizedArmorValues
    }

type NormalizedArmorValues = {
  protection: Protection
  encumbrance: Encumbrance
  has_additional_penalties: HasAdditionalPenalties
  armor_type: ArmorType_ID
  hit_zone?: HitZone
  restrictedTo?: RestrictedTo
  translations?: {
    [localeId: string]: SecondaryArmorTranslation
  }
}

const normalizeCombatValues = (
  entity: TaggedEntity<
    Exclude<EquipmentIdentifier["kind"], "Elixir" | "Poison">
  >,
): NormalizedCombatValues<MeleeDamage, RangedDamage> | undefined => {
  switch (entity.entity) {
    case "Weapon":
      return {
        type: "Weapon",
        values: entity.content,
      }
    case "Armor":
      return {
        type: "Armor",
        values: entity.content,
      }
    case "Ammunition":
    case "Animal":
    case "AnimalCare":
    case "BandageOrRemedy":
    case "Book":
    case "CeremonialItem":
    case "Clothes":
    case "ClothingPackage":
    case "Container":
    case "EquipmentOfBlessedOnes":
    case "GemOrPreciousStone":
    case "IlluminationLightSource":
    case "IlluminationRefillOrSupply":
    case "Jewelry":
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
    case "WeaponAccessory": {
      const baseItem: BaseItem = entity.content

      if (baseItem.combat_use === undefined) {
        return undefined
      }

      switch (baseItem.combat_use.kind) {
        case "Weapon":
          return {
            type: "Weapon",
            values: baseItem.combat_use.Weapon,
          }
        case "Armor":
          return {
            type: "Armor",
            values: baseItem.combat_use.Armor,
          }
        default:
          return assertExhaustive(baseItem.combat_use)
      }
    }
    default:
      return assertExhaustive(entity)
  }
}

/**
 * Get a JSON representation of the rules text for equipment.
 */
export const getEquipmentEntityDescription = createEntityDescriptionCreator<
  Exclude<EquipmentIdentifier["kind"], "Elixir" | "Poison">,
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "Reach"
      | "SocialStatus"
      | "CloseCombatTechnique"
      | "RangedCombatTechnique"
      | "MagicalTradition"
      | "BlessedTradition"
      | "DerivedCharacteristic"
      | "Ammunition"
      | "Race"
      | "Culture"
      | "Profession"
    >
    idMap: IdMap
  }
>(({ getInstanceById, idMap }, locale, entry) => {
  const { translate, translateMap } = locale
  const translation =
    entry.entity === "ClothingPackage"
      ? undefined
      : translateMap(entry.content.translations)

  if (entry.entity !== "ClothingPackage" && translation === undefined) {
    return undefined
  }

  const baseItem: BaseItem = entry.content
  const baseItemTranslation: BaseItemTranslation | undefined = translation
  const name = getEquipmentName(translate, translateMap, getInstanceById, entry)
  const combatValues = normalizeCombatValues(entry)
  const combatTranslation = translateMap(combatValues?.values.translations)

  return {
    title: name,
    className: "equipment",
    body: [
      renderComplexity(translate, baseItem.complexity),
      ...(combatValues?.type === "Weapon"
        ? Object.entries(combatValues.values.melee_uses ?? {}).map(
            ([combatTechniqueId, use]) =>
              renderMeleeWeapon(
                translate,
                translateMap,
                getInstanceById,
                locale.measurementAdjustments,
                renderMeleeDamage(translate),
                combatTechniqueId,
                use,
              ),
          )
        : []),
      ...(combatValues?.type === "Weapon"
        ? Object.entries(combatValues.values.ranged_uses ?? {}).map(
            ([combatTechniqueId, use]) =>
              renderRangedWeapon(
                translate,
                translateMap,
                getInstanceById,
                locale.measurementAdjustments,
                renderRangedDamage(translate),
                combatTechniqueId,
                use,
              ),
          )
        : []),
      ...(combatValues?.type === "Armor"
        ? renderArmorValues(
            translate,
            translateMap,
            locale.compare,
            getInstanceById,
            idMap,
            combatValues.values,
          )
        : []),
      mapNullable(baseItem.burning_time, burningTime => ({
        label: translate("Burning Time"),
        value:
          burningTime.kind === "Unlimited"
            ? translate("unlimited")
            : formatTimeSpan(
                translate,
                ResponsiveTextSize.Full,
                burningTime.Limited.unit,
                burningTime.Limited.value,
              ),
      })),
      mapNullable(baseItemTranslation?.color, color => ({
        label: translate("Color"),
        value: color,
      })),
      baseItemTranslation?.language !== undefined ||
      baseItemTranslation?.script !== undefined
        ? {
            label: translate("Language/Script"),
            value: [baseItemTranslation?.language, baseItemTranslation?.script]
              .map(value => value ?? "—")
              .join(" / "),
          }
        : undefined,
      baseItem.structure_points !== undefined &&
      isNotEmpty(baseItem.structure_points)
        ? {
            label: translate("Structure Points"),
            value:
              baseItem.structure_points.length === 1
                ? translate(
                    ".input {$value :number} {{{$value} Structure Points}}",
                    { value: baseItem.structure_points[0].points },
                  )
                : translate("{$value} Structure Points", {
                    value: baseItem.structure_points
                      .map(elem => elem.points)
                      .join("/"),
                  }),
          }
        : undefined,
      mapNullable(baseItem.weight, weight =>
        renderWeight(translate, locale.measurementAdjustments, weight),
      ),
      mapNullable(baseItem.cost, cost =>
        renderCost(translate, translateMap, cost),
      ),
      mapNullable(
        renderNote(
          translate,
          translateMap,
          getInstanceById,
          locale.join,
          combatValues?.type === "Weapon"
            ? combatValues.values.melee_uses
            : undefined,
          combatValues?.values.restrictedTo,
          name,
          baseItemTranslation?.note,
        ),
        note => ({
          label: translate("Note"),
          value: note,
        }),
      ),
      baseItemTranslation?.rules !== undefined
        ? {
            label: translate("Rules"),
            value: baseItemTranslation.rules,
          }
        : undefined,
      combatValues?.type === "Weapon" &&
      combatTranslation?.advantage !== undefined
        ? {
            label: translate("Weapon Advantage"),
            value: combatTranslation.advantage,
          }
        : undefined,
      combatValues?.type === "Weapon" &&
      combatTranslation?.disadvantage !== undefined
        ? {
            label: translate("Weapon Disadvantage"),
            value: combatTranslation.disadvantage,
          }
        : undefined,
      combatValues?.type === "Armor" &&
      combatTranslation?.advantage !== undefined
        ? {
            label: translate("Armor Advantage"),
            value: combatTranslation.advantage,
          }
        : undefined,
      combatValues?.type === "Armor" &&
      combatTranslation?.disadvantage !== undefined
        ? {
            label: translate("Armor Disadvantage"),
            value: combatTranslation.disadvantage,
          }
        : undefined,
    ],
    errata: baseItemTranslation?.errata,
    references: entry.content.src,
  }
})
