import { ensureNonEmpty, isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { on } from "@elyukai/utils/function"
import { isNotNullish } from "@elyukai/utils/nullable"
import { omitKeys, sortObjectKeysByIndex } from "@elyukai/utils/object"
import { compareNumber } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { romanize } from "@elyukai/utils/roman"
import { sign } from "@elyukai/utils/string/number"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  AmmunitionishIdentifier,
  ArmorComplexity,
  ArmorType_ID,
  AttackModifier,
  BookCost,
  BookCostVariant,
  BookRules,
  BookType,
  BurningTime,
  CloseCombatTechnique,
  CloseCombatTechnique_ID,
  CloseCombatTechniqueSpecialRules,
  CombatUse,
  Complexity,
  Cost,
  Encumbrance,
  EquipmentIdentifier,
  Errata,
  GemOrPreciousStone,
  GemOrPreciousStoneTranslation,
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
  RangedCombatTechnique_ID,
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
} from "@optolith/database-schema/gen"
import { mapNullable } from "@optolith/helpers/nullable"
import { createEntityDescriptionCreator, type TaggedEntity } from "../creator.js"
import type { StdEnv, StdReader } from "../env.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { LocaleCompare, LocaleJoin } from "../helpers/locale.js"
import {
  type Format,
  type LocaleMap,
  type Translate,
  type TranslateMap,
} from "../helpers/translate.js"
import {
  type LabeledEntityDescriptionSection,
  type RawEntityDescriptionSectionContent,
  type RawNestedDefinitionListEntityDescriptionSection,
  type RawTabularEntityDescription,
} from "../index.js"
import { renderDice, renderDiceAndFlat } from "./partial/dice.js"
import {
  attributedName,
  attributedNameFromInstance,
  attributedNameFromText,
} from "./partial/markdown.js"
import { additionFormatter, subtractionFormatter } from "./partial/mathOperation.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import {
  attributedCustomNameR,
  formatNumber,
  getInstanceByIdR,
  localeSortR,
  nameR,
  sequence,
  translateMapR,
  translateR,
} from "./partial/reader.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"
import {
  adjustWeight,
  formatAdjustedWeight,
  formatArbitrarySilverthalers,
  formatArbitraryWeight,
  formatSilverthalers,
} from "./partial/units/simple.js"
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
        translateMap(getInstanceById("SocialStatus", entry.content.socialStatus)?.translations)
          ?.name ?? MISSING_VALUE

      return translate("Clothing Package {$socialStatus}", {
        socialStatus: socialStatusName,
      })
    }
    case "Book":
      return translateMap(entry.content.translations)?.name ?? MISSING_VALUE
    case "Ammunition":
    case "Animal":
    case "AnimalCare":
    case "Armor":
    case "BandageOrRemedy":
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
    case "WorkingSupernaturalCreature":
      return translateMap<{ name: string }>(entry.content.translations)?.name ?? MISSING_VALUE
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
    translateMap(getInstanceById("Attribute", attrId)?.translations)?.abbreviation ?? MISSING_VALUE

  switch (damageThreshold.kind) {
    case "Default":
      return `${
        closeCombatTechnique?.primary_attribute.map(getAttrAbbrv).join("/") ?? MISSING_VALUE
      } ${damageThreshold.Default.threshold.toFixed()}`
    case "List":
      if (isNotEmpty(damageThreshold.List.list)) {
        const { list } = damageThreshold.List
        if (list.some(item => item.threshold !== list[0].threshold)) {
          return list
            .map(item => `${getAttrAbbrv(item.attribute)} ${item.threshold.toFixed()}`)
            .join("/")
        } else {
          return `${list.map(item => getAttrAbbrv(item.attribute)).join("/")} ${list[0].threshold.toFixed()}`
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
  localeJoin: LocaleJoin,
  getInstanceById: GetInstanceById<"Reach">,
  reaches: Reach_ID[] | undefined,
): string =>
  reaches === undefined
    ? "—"
    : localeJoin(
        reaches
          .map((reach): [number, string] => {
            const instance = getInstanceById("Reach", reach)
            return [
              instance?.position ?? 0,
              attributedNameFromInstance(translateMap, instance, "equipment", "Reach", reach) ??
                MISSING_VALUE,
            ]
          })
          .toSorted(on(e => e[0], compareNumber))
          .map(e => e[1]),
        "conjunction",
      )

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
  localeJoin: LocaleJoin,
  getInstanceById: GetInstanceById<"Attribute" | "CloseCombatTechnique" | "Reach">,
  measurements: Required<LocaleMeasurementAdjustments>,
  renderDamage: (damage: Damage) => string,
  closeCombatTechniqueId: string,
  use: GenMeleeWeapon<Damage>,
): LabeledEntityDescriptionSection<RawEntityDescriptionSectionContent> => {
  const combatTechnique = getInstanceById("CloseCombatTechnique", closeCombatTechniqueId)

  const fields: CloseCombatTechniqueSpecialRules = combatTechnique?.special ?? {
    can_parry: { kind: "Prohibited" },
    has_damage_threshold: { kind: "Prohibited" },
    has_reach: { kind: "Prohibited" },
    has_length: { kind: "Prohibited" },
    has_shield_size: { kind: "Prohibited" },
  }

  return {
    type: "labeled",
    label: translate("Combat Technique {$name}", {
      name: translateMap(combatTechnique?.translations)?.name ?? MISSING_VALUE,
    }),
    value: {
      type: "definitionList",
      items: [
        {
          label: translate("Damage Points"),
          value: renderDamage(use.damage),
        },
        fields.has_damage_threshold.kind === "Prohibited"
          ? undefined
          : {
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
        fields.has_reach.kind === "Prohibited"
          ? undefined
          : {
              label: translate("Reach"),
              value: renderReach(translateMap, localeJoin, getInstanceById, use.reach),
            },
        fields.has_length.kind === "Prohibited"
          ? undefined
          : {
              label: translate("Length"),
              value: renderLength(translate, measurements, use.length),
            },
      ],
    },
  }
}

const renderReloadTime = (
  translate: Translate,
  translateMap: TranslateMap,
  format: Format,
  reloadTime: ReloadTime[],
) =>
  isNotEmpty(reloadTime)
    ? reloadTime.length > 1
      ? translate("{$value} actions", {
          value: reloadTime.map(time => time.value).join("/"),
        })
      : formatTimeSpan(
          translate,
          translateMap,
          format,
          ResponsiveTextSize.Full,
          "Actions",
          reloadTime[0].value,
        )
    : MISSING_VALUE

const renderRangeBrackets = (rangeBrackets: RangeBrackets) =>
  `${rangeBrackets.close.toFixed()}/${rangeBrackets.medium.toFixed()}/${rangeBrackets.far.toFixed()}`

const renderAmmunition = (
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<AmmunitionishIdentifier["kind"]>,
  ammunition: AmmunitionishIdentifier | undefined,
) =>
  ammunition === undefined
    ? "—"
    : (attributedName(translateMap, getInstanceById, "equipment", ammunition) ?? MISSING_VALUE)

const renderMeleeDamage = (translate: Translate) => (damage: MeleeDamage) =>
  renderDiceAndFlat(translate, damage.dice, damage.flat)

/**
 * Render combat values of a ranged weapon.
 */
export const renderRangedWeapon = <Damage>(
  translate: Translate,
  translateMap: TranslateMap,
  format: Format,
  getInstanceById: GetInstanceById<"RangedCombatTechnique" | AmmunitionishIdentifier["kind"]>,
  measurements: Required<LocaleMeasurementAdjustments>,
  renderDamage: (damage: Damage) => string,
  rangedCombatTechniqueId: string,
  use: GenRangedWeapon<Damage>,
): LabeledEntityDescriptionSection<RawEntityDescriptionSectionContent> => {
  const combatTechnique = getInstanceById("RangedCombatTechnique", rangedCombatTechniqueId)

  return {
    type: "labeled",
    label: translate("Combat Technique {$name}", {
      name: translateMap(combatTechnique?.translations)?.name ?? MISSING_VALUE,
    }),
    value: {
      type: "definitionList",
      items: [
        {
          label: translate("Damage Points"),
          value: renderDamage(use.damage),
        },
        {
          label: translate("Reload Time"),
          value: renderReloadTime(translate, translateMap, format, use.reload_time),
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
    },
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

const renderComplexity = (complexity: ArmorComplexity | Complexity | undefined) =>
  mapNullable(complexity, c => {
    switch (c.kind) {
      case "Primitive":
        return translateR("Primitive")
      case "Simple":
        return translateR("Simple")
      case "Complex":
        return sequence`${translateR("Complex")} (${translateR("{$value} AP", {
          value: c.Complex.ap_value.toFixed(),
        })})`
      case "Various":
        return translateR("Various")
      default:
        return assertExhaustive(c)
    }
  }) ?? Reader.of("—")

const renderBlessedTraditionRestriction = (
  translate: Translate,
  translateMap: TranslateMap,
  localeJoin: LocaleJoin,
  getInstanceById: GetInstanceById<"BlessedTradition">,
  name: string,
  restriction: RestrictedToBlessedTraditions,
): string => {
  const getName = (traditionId: string): string | undefined =>
    translateMap(getInstanceById("BlessedTradition", traditionId)?.translations)?.name

  if (restriction.isSanctifiedBy) {
    switch (restriction.scope.kind) {
      case "Specific":
        if (!isNotEmpty(restriction.scope.Specific)) {
          return translate(
            "Sanctified ({$tradition}); only Blessed Ones of {$tradition} may purchase weapons sanctified by {$tradition}.",
            { tradition: MISSING_VALUE },
          )
        } else if (restriction.scope.Specific.length > 1) {
          const list = restriction.scope.Specific.map(getName).filter(isNotNullish)
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
              tradition: getName(restriction.scope.Specific[0]) ?? MISSING_VALUE,
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
                  translateMap(getInstanceById("BlessedTradition", traditionId)?.translations)
                    ?.name,
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
              translateMap(getInstanceById("MagicalTradition", traditionId)?.translations)?.name,
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
          .map(id => translateMap(getInstanceById("Race", id)?.translations)?.name ?? MISSING_VALUE)
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
            id => translateMap(getInstanceById("Culture", id)?.translations)?.name ?? MISSING_VALUE,
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

const renderWeightLabel = (entityName: EquipmentIdentifier["kind"]) => {
  if (entityName === "Jewelry") {
    return translateR("Weight (Bronze/Silver/Gold)")
  } else {
    return translateR("Weight")
  }
}

const renderWeightValue = (weight: Weight | JewelryMaterialDifference<Weight> | undefined) => {
  if (weight === undefined) {
    return Reader.of("—")
  }

  if (typeof weight === "number") {
    return formatAdjustedWeight(weight)
  } else {
    return Reader.traverse([weight.bronze, weight.silver, weight.gold], adjustWeight).thenW(
      values => formatArbitraryWeight(values.join("/")),
    )
  }
}

const renderCostLabel = (entityName: EquipmentIdentifier["kind"]) => {
  if (entityName === "Jewelry") {
    return translateR("Cost (Bronze/Silver/Gold)")
  } else if (entityName === "GemOrPreciousStone") {
    return translateR("Cost/10 carats")
  } else {
    return translateR("Cost")
  }
}

const renderCost = (
  cost: Cost | BookCost | JewelryMaterialDifference<number> | undefined,
): StdReader<string, "fn" | "t" | "tm" | "rts"> => {
  if (cost === undefined) {
    return Reader.of("—")
  }

  const renderBookCostVariant = (
    bookCostVariant: BookCostVariant,
  ): StdReader<string, "fn" | "t" | "tm" | "rts"> => {
    switch (bookCostVariant.kind) {
      case "Definite":
        return translateMapR(bookCostVariant.Definite.translations).thenW(translation =>
          renderCost(bookCostVariant.Definite.cost).map(
            value => value + parensIf(translation?.label),
          ),
        )

      case "Indefinite":
        return translateMapR(bookCostVariant.Indefinite.translations).map(
          translation => (translation?.description ?? MISSING_VALUE) + parensIf(translation?.label),
        )

      default:
        return assertExhaustive(bookCostVariant)
    }
  }

  if ("bronze" in cost) {
    return Reader.traverse([cost.bronze, cost.silver, cost.gold], formatNumber).thenW(values =>
      formatArbitrarySilverthalers(values.join("/")),
    )
  } else {
    switch (cost.kind) {
      case "Free":
        return translateR("free")
      case "Various":
        return translateR("various")
      case "Invaluable":
        return translateR("invaluable")
      case "Fixed": {
        return translateMapR(cost.Fixed.translations).thenW(translation =>
          formatSilverthalers(cost.Fixed.value).thenW(main =>
            translation?.wrap_in_text === undefined
              ? Reader.of(main)
              : sequence`${UNHANDLED_VALUE} ${main}`,
          ),
        )
      }
      case "Range":
        return translateR(
          ".input {$from :number} .input {$to :number} {{{$from}–{$to} silverthalers}}",
          {
            from: cost.Range.from,
            to: cost.Range.to,
          },
        )
      case "Single":
        return renderBookCostVariant(cost.Single)
      case "Multiple":
        return Reader.traverse(cost.Multiple, renderBookCostVariant).map(list => list.join(", "))
      default:
        return assertExhaustive(cost)
    }
  }
}

type BaseItem = {
  cost?: Cost | BookCost | JewelryMaterialDifference<number>
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
  topics?: string[]
  placeOfPublication?: string
  appearance?: string
  components?: string
  use?: string
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
  entity: TaggedEntity<Exclude<EquipmentIdentifier["kind"], "Elixir" | "Poison" | "Book">>,
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
    case "WeaponAccessory":
    case "WorkingSupernaturalCreature": {
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

const renderBookTypes = (
  translate: Translate,
  translateMap: TranslateMap,
  localeJoin: LocaleJoin,
  localeCompare: LocaleCompare,
  getInstanceById: GetInstanceById<"Skill">,
  types: BookType[],
): string =>
  types
    .map((type): [main: string, sub?: string] => {
      switch (type.kind) {
        case "Mundane":
          switch (type.Mundane.kind) {
            case "RomanceNovel":
              return [translate("Romance Novel")]
            case "Poetry":
              return [translate("Poetry")]
            case "PoliticalPamphlet":
              return [translate("Political Pamphlet")]
            case "CrimeStory":
              return [translate("Crime Story")]
            case "FairyTale":
              return [translate("Fairy Tale")]
            case "Novel":
              return [translate("Novel")]
            case "ProfessionalPublication":
              return [
                translate("Professional Publication"),
                translateMap(
                  getInstanceById("Skill", type.Mundane.ProfessionalPublication)?.translations,
                )?.name ?? MISSING_VALUE,
              ]
            default:
              return assertExhaustive(type.Mundane)
          }
        case "Magical":
          return [translate("Magical Book")]
        case "Religious":
          return [translate("Religious Works")]
        default:
          return assertExhaustive(type)
      }
    })
    .reduce<[main: string, sub?: string[]][]>((accTypes, [main, sub]) => {
      const last = accTypes.at(-1)
      return last?.[1] === undefined || sub === undefined
        ? [...accTypes, [main, sub === undefined ? undefined : [sub]]]
        : [...accTypes.slice(0, -1), [last[0], [...last[1], sub]]]
    }, [])
    .map(([main, sub]) =>
      sub === undefined
        ? main
        : `${main} (${localeJoin(sub.toSorted(localeCompare), "conjunction")})`,
    )
    .join(", ")

const renderBookRules = (
  translate: Translate,
  rules: BookRules,
):
  | string
  | (
      | RawEntityDescriptionSectionContent<RawNestedDefinitionListEntityDescriptionSection>
      | undefined
    )[] => {
  switch (rules.kind) {
    case "Plain":
      if (
        rules.Plain.reconstruction === undefined &&
        rules.Plain.references === undefined &&
        rules.Plain.textAfter === undefined
      ) {
        return rules.Plain.text
      }

      return [
        {
          type: "plain",
          text: rules.Plain.text,
        },
        {
          type: "definitionList",
          style: "nested",
          items: [
            mapNullable(rules.Plain.reconstruction, reconstruction => ({
              label: translate("Reconstruction"),
              value: reconstruction,
            })),
            mapNullable(rules.Plain.references, references => ({
              label: translate("References"),
              value: references,
            })),
          ],
        },
        mapNullable(rules.Plain.textAfter, textAfter => ({
          type: "plain",
          text: textAfter,
        })),
      ]
    case "Entertainment":
      return translate("Entertainment")
    case "ByEdition":
      return [
        {
          type: "definitionList",
          style: "nested",
          items: [
            ...rules.ByEdition.editions.map(
              (
                edition,
              ): {
                label: string
                value:
                  | string
                  | (
                      | RawEntityDescriptionSectionContent<RawNestedDefinitionListEntityDescriptionSection>
                      | undefined
                    )[]
              } => {
                if (edition.reconstruction === undefined && edition.references === undefined) {
                  return {
                    label: edition.label,
                    value: edition.text,
                  }
                }

                return {
                  label: edition.label,
                  value: [
                    {
                      type: "plain",
                      text: edition.text,
                    },
                    {
                      type: "definitionList",
                      style: "nested",
                      items: [
                        mapNullable(edition.reconstruction, reconstruction => ({
                          label: translate("Reconstruction"),
                          value: reconstruction,
                        })),
                        mapNullable(edition.references, references => ({
                          label: translate("References"),
                          value: references,
                        })),
                      ],
                    },
                  ],
                }
              },
            ),
          ],
        },
        mapNullable(rules.ByEdition.textAfter, textAfter => ({
          type: "plain",
          text: textAfter,
        })),
      ]
    default:
      return assertExhaustive(rules)
  }
}

const renderStructurePoints = (structurePoints: StructurePoints | undefined) =>
  structurePoints !== undefined && isNotEmpty(structurePoints)
    ? structurePoints.length === 1
      ? translateR(".input {$value :number} {{{$value} Structure Points}}", {
          value: structurePoints[0].points,
        })
      : translateR("{$value} Structure Points", {
          value: structurePoints.map(elem => elem.points).join("/"),
        })
    : Reader.of("—")

const meleeWeaponColumns = {
  name: translateR("Name"),
  damagePoints: translateR("DP"),
  primaryAttributeDamageThreshold: translateR("P+T"),
  attackParryModifier: translateR("AT/PA Mod"),
  reach: translateR("RE"),
  weight: translateR("Weight"),
  length: translateR("Length"),
  cost: translateR("Cost"),
  complexity: translateR("Complexity"),
} satisfies Record<string, StdReader<string, "t">>

type MeleeWeaponColumns = keyof typeof meleeWeaponColumns

const rangedWeaponColumns = {
  name: translateR("Name"),
  damagePoints: translateR("DP"),
  reloadTime: translateR("RT"),
  range: translateR("RA"),
  ammunition: translateR("Ammunition"),
  weight: translateR("Weight"),
  length: translateR("Length"),
  cost: translateR("Cost"),
  complexity: translateR("Complexity"),
} satisfies Record<string, StdReader<string, "t">>

type RangedWeaponColumns = keyof typeof rangedWeaponColumns

const armorColumns = {
  name: translateR("Name"),
  protection: translateR("PRO"),
  encumbrance: translateR("ENC"),
  additionalPenalties: translateR("Additional Penalties"),
  weight: translateR("Weight"),
  cost: translateR("Cost"),
  complexity: translateR("Complexity"),
} satisfies Record<string, StdReader<string, "t">>

type ArmorColumns = keyof typeof armorColumns

type GenEquipmentTableEntry<Cols extends string, E> = Pick<
  RawTabularEntityDescription<Cols, E>,
  "category" | "labels" | "values" | "additionalInformation"
>

const createMeleeWeaponTableEntry = (
  name: string,
  entityName: EquipmentIdentifier["kind"],
  instance: {
    weight?: Weight | JewelryMaterialDifference<Weight>
    cost?: Cost | BookCost | JewelryMaterialDifference<number>
    restrictedTo?: RestrictedTo
    complexity?: ArmorComplexity | Complexity
  },
  instanceTranslation: {
    note?: string
    rules?: string
    advantage?: string
    disadvantage?: string
  },
  combatTechniqueId: CloseCombatTechnique_ID,
  use: GenMeleeWeapon<MeleeDamage>,
): GenEquipmentTableEntry<
  MeleeWeaponColumns,
  StdEnv<
    "fn" | "t" | "tm" | "ibi" | "lj" | "ma" | "rts",
    "Attribute" | "Reach" | "CloseCombatTechnique"
  >
> => {
  const combatTechnique = getInstanceByIdR("CloseCombatTechnique", combatTechniqueId)
  const combatTechniqueName = nameR("CloseCombatTechnique", combatTechniqueId)
  const attributedCombatTechniqueName = combatTechniqueName.map(ctName =>
    ctName === undefined
      ? MISSING_VALUE
      : attributedNameFromText(
          ctName,
          "equipment-table",
          "CloseCombatTechnique",
          combatTechniqueId,
        ),
  )

  return {
    category: {
      label: attributedCombatTechniqueName,
      value: combatTechniqueName.map(ctName => `1-${ctName ?? MISSING_VALUE}`),
    },
    labels: sortObjectKeysByIndex(
      {
        ...meleeWeaponColumns,
        weight: renderWeightLabel(entityName),
        cost: renderCostLabel(entityName),
      },
      Object.keys(meleeWeaponColumns) as (keyof typeof meleeWeaponColumns)[],
    ),
    values: {
      name: Reader.of(name),
      damagePoints: Reader.asks(env => renderMeleeDamage(env.translate)(use.damage)),
      primaryAttributeDamageThreshold: combatTechnique.thenW(ct =>
        Reader.asks(env =>
          renderPrimaryAttributeAndDamageThreshold(
            env.translateMap,
            env.getInstanceById,
            ct,
            use.damage_threshold,
          ),
        ),
      ),
      attackParryModifier: Reader.of(
        renderAttackParryModifier(use.attackModifier, use.parryModifier),
      ),
      reach: Reader.asks(env =>
        renderReach(env.translateMap, env.localeJoin, env.getInstanceById, use.reach),
      ),
      weight: renderWeightValue(instance.weight),
      length: Reader.asks(env =>
        renderLength(env.translate, env.measurementAdjustments, use.length),
      ),
      cost: renderCost(instance.cost),
      complexity: renderComplexity(instance.complexity),
    },
    additionalInformation: [
      instanceTranslation.note === undefined
        ? undefined
        : {
            label: translateR("Note"),
            id: "note",
            value: Reader.of(instanceTranslation.note),
          },
      instanceTranslation.rules === undefined
        ? undefined
        : {
            label: translateR("Rules"),
            id: "rules",
            value: Reader.of(instanceTranslation.rules),
          },
      instanceTranslation.advantage === undefined
        ? undefined
        : {
            label: translateR("Weapon Advantage"),
            id: "advantage",
            value: Reader.of(instanceTranslation.advantage),
          },
      instanceTranslation.disadvantage === undefined
        ? undefined
        : {
            label: translateR("Weapon Disadvantage"),
            id: "disadvantage",
            value: Reader.of(instanceTranslation.disadvantage),
          },
    ],
  }
}

const createRangedWeaponTableEntry = (
  name: string,
  entityName: EquipmentIdentifier["kind"],
  instance: {
    weight?: Weight | JewelryMaterialDifference<Weight>
    cost?: Cost | BookCost | JewelryMaterialDifference<number>
    restrictedTo?: RestrictedTo
    complexity?: ArmorComplexity | Complexity
  },
  instanceTranslation: {
    note?: string
    rules?: string
    advantage?: string
    disadvantage?: string
  },
  combatTechniqueId: RangedCombatTechnique_ID,
  use: GenRangedWeapon<RangedDamage>,
): GenEquipmentTableEntry<
  RangedWeaponColumns,
  StdEnv<
    "f" | "fn" | "t" | "tm" | "ibi" | "lj" | "ma" | "rts",
    | "Attribute"
    | "Ammunition"
    | "Weapon"
    | "RangedCombatTechnique"
    | "Race"
    | "Culture"
    | "MagicalTradition"
    | "BlessedTradition"
    | "Profession"
  >
> => {
  const combatTechniqueName = nameR("RangedCombatTechnique", combatTechniqueId)
  const attributedCombatTechniqueName = combatTechniqueName.map(ctName =>
    ctName === undefined
      ? MISSING_VALUE
      : attributedNameFromText(
          ctName,
          "equipment-table",
          "RangedCombatTechnique",
          combatTechniqueId,
        ),
  )

  return {
    category: {
      label: attributedCombatTechniqueName,
      value: combatTechniqueName.map(ctName => `2-${ctName ?? MISSING_VALUE}`),
    },
    labels: sortObjectKeysByIndex(
      {
        ...rangedWeaponColumns,
        weight: renderWeightLabel(entityName),
        cost: renderCostLabel(entityName),
      },
      Object.keys(rangedWeaponColumns) as (keyof typeof rangedWeaponColumns)[],
    ),
    values: {
      name: Reader.of(name),
      damagePoints: Reader.asks(env => renderRangedDamage(env.translate)(use.damage)),
      reloadTime: Reader.asks(env =>
        renderReloadTime(env.translate, env.translateMap, env.format, use.reload_time),
      ),
      range: Reader.of(renderRangeBrackets(use.range)),
      ammunition: Reader.asks(env =>
        renderAmmunition(env.translateMap, env.getInstanceById, use.ammunition),
      ),
      weight: renderWeightValue(instance.weight),
      length: Reader.asks(env =>
        renderLength(env.translate, env.measurementAdjustments, use.length),
      ),
      cost: renderCost(instance.cost),
      complexity: renderComplexity(instance.complexity),
    },
    additionalInformation: [
      {
        label: translateR("Note"),
        id: "note",
        value: Reader.asks(env =>
          renderNote(
            env.translate,
            env.translateMap,
            env.getInstanceById,
            env.localeJoin,
            undefined,
            instance.restrictedTo,
            name,
            instanceTranslation.note,
          ),
        ),
      },
      {
        label: translateR("Rules"),
        id: "rules",
        value: Reader.of(instanceTranslation.rules),
      },
      {
        label: translateR("Weapon Advantage"),
        id: "advantage",
        value: Reader.of(instanceTranslation.advantage),
      },
      {
        label: translateR("Weapon Disadvantage"),
        id: "disadvantage",
        value: Reader.of(instanceTranslation.disadvantage),
      },
    ],
  }
}

const createArmorTableEntry = (
  name: string,
  entityName: EquipmentIdentifier["kind"],
  instance: {
    weight?: Weight | JewelryMaterialDifference<Weight>
    cost?: Cost | BookCost | JewelryMaterialDifference<number>
    restrictedTo?: RestrictedTo
    complexity?: ArmorComplexity | Complexity
  },
  instanceTranslation: {
    note?: string
    rules?: string
    advantage?: string
    disadvantage?: string
  },
  values: NormalizedArmorValues,
): GenEquipmentTableEntry<
  ArmorColumns,
  StdEnv<
    "fn" | "t" | "tm" | "ibi" | "lj" | "lc" | "ma" | "idm" | "rts",
    | "Race"
    | "Culture"
    | "MagicalTradition"
    | "BlessedTradition"
    | "Profession"
    | "DerivedCharacteristic"
  >
> => ({
  labels: sortObjectKeysByIndex(
    { ...armorColumns, weight: renderWeightLabel(entityName), cost: renderCostLabel(entityName) },
    Object.keys(armorColumns) as (keyof typeof armorColumns)[],
  ),
  values: {
    name: Reader.of(name),
    protection: Reader.of(values.protection.toFixed()),
    encumbrance: Reader.of(values.encumbrance.toFixed()),
    additionalPenalties: values.has_additional_penalties
      ? Reader.asks((env: StdEnv<"idm">) => [
          env.idMap.DerivedCharacteristic.Movement,
          env.idMap.DerivedCharacteristic.Initiative,
        ])
          .thenW(dcIds =>
            Reader.traverse(dcIds, id =>
              attributedCustomNameR(
                "equipment-table",
                t => t.abbreviation,
                "DerivedCharacteristic",
                id,
              ).map(dcName => `${sign(-1)} ${dcName ?? MISSING_VALUE}`),
            ),
          )
          .thenW(localeSortR)
          .map(names => names.join(", "))
      : Reader.of("—"),
    weight: renderWeightValue(instance.weight),
    cost: renderCost(instance.cost),
    complexity: renderComplexity(instance.complexity),
  },
  additionalInformation: [
    {
      label: translateR("Note"),
      id: "note",
      value: Reader.asks(env =>
        renderNote(
          env.translate,
          env.translateMap,
          env.getInstanceById,
          env.localeJoin,
          undefined,
          instance.restrictedTo,
          name,
          instanceTranslation.note,
        ),
      ),
    },
    {
      label: translateR("Rules"),
      id: "rules",
      value: Reader.of(instanceTranslation.rules),
    },
    {
      label: translateR("Armor Advantage"),
      id: "advantage",
      value: Reader.of(instanceTranslation.advantage),
    },
    {
      label: translateR("Armor Disadvantage"),
      id: "disadvantage",
      value: Reader.of(instanceTranslation.disadvantage),
    },
  ],
})

const createGemOrPreciousStoneTableEntry = (
  name: string,
  instance: GemOrPreciousStone,
  instanceTranslation: GemOrPreciousStoneTranslation | undefined,
): GenEquipmentTableEntry<
  "name" | "color" | "cost",
  StdEnv<
    "fn" | "t" | "tm" | "lj" | "ma" | "ibi" | "rts",
    "Race" | "Culture" | "Profession" | "BlessedTradition" | "MagicalTradition"
  >
> => ({
  labels: {
    name: translateR("Name"),
    color: translateR("Color"),
    cost: renderCostLabel("GemOrPreciousStone"),
  },
  values: {
    name: Reader.of(name),
    color: Reader.of(instanceTranslation?.color ?? "—"),
    cost: renderCost(instance.cost),
  },
  additionalInformation: [
    {
      label: translateR("Note"),
      id: "note",
      value: Reader.asks(env =>
        renderNote(
          env.translate,
          env.translateMap,
          env.getInstanceById,
          env.localeJoin,
          undefined,
          undefined,
          name,
          instanceTranslation?.note,
        ),
      ),
    },
    {
      label: translateR("Rules"),
      id: "rules",
      value: Reader.of(instanceTranslation?.rules),
    },
  ],
})

type SimpleTableEntryColumns = "name" | "weight" | "structurePoints" | "cost" | "complexity"
const allSimpleKeys = ["name", "weight", "structurePoints", "cost", "complexity"] as const

type SimpleTableEnv = StdEnv<
  "fn" | "t" | "tm" | "lj" | "ma" | "ibi" | "rts",
  "Race" | "Culture" | "Profession" | "BlessedTradition" | "MagicalTradition"
>

const createSimpleTableEntry = <R extends { [K in SimpleTableEntryColumns]?: null }>(
  name: string,
  entityName: EquipmentIdentifier["kind"],
  useKeys: R,
  instance: {
    weight?: Weight | JewelryMaterialDifference<Weight>
    structure_points?: StructurePoints
    cost?: Cost | BookCost | JewelryMaterialDifference<number>
    restrictedTo?: RestrictedTo
    complexity?: ArmorComplexity | Complexity
  },
  instanceTranslation: BaseItemTranslation | undefined,
): GenEquipmentTableEntry<Extract<keyof R, SimpleTableEntryColumns>, SimpleTableEnv> => ({
  labels: omitKeys(
    {
      name: translateR("Name"),
      weight: renderWeightLabel(entityName),
      structurePoints: translateR("Structure Points"),
      cost: renderCostLabel(entityName),
      complexity: translateR("Complexity"),
    },
    ...allSimpleKeys.filter(key => !(key in useKeys)),
  ) as Record<Extract<keyof R, SimpleTableEntryColumns>, Reader<SimpleTableEnv, string>>,
  values: omitKeys(
    {
      name: Reader.of(name),
      structurePoints: renderStructurePoints(instance.structure_points),
      weight: renderWeightValue(instance.weight),
      cost: renderCost(instance.cost),
      complexity: renderComplexity(instance.complexity),
    },
    ...allSimpleKeys.filter(key => !(key in useKeys)),
  ) as Record<Extract<keyof R, SimpleTableEntryColumns>, Reader<SimpleTableEnv, string>>,
  additionalInformation: [
    {
      label: translateR("Note"),
      id: "note",
      value: Reader.asks(env =>
        renderNote(
          env.translate,
          env.translateMap,
          env.getInstanceById,
          env.localeJoin,
          undefined,
          instance.restrictedTo,
          name,
          instanceTranslation?.note,
        ),
      ),
    },
    {
      label: translateR("Rules"),
      id: "rules",
      value: Reader.of(instanceTranslation?.rules),
    },
  ],
})

/**
 * Get a JSON representation of the rules text for equipment.
 */
export const getEquipmentEntityDescription = createEntityDescriptionCreator<
  Exclude<EquipmentIdentifier["kind"], "Elixir" | "Poison">,
  StdEnv<
    "f" | "fn" | "t" | "tm" | "lj" | "lc" | "ma" | "idm" | "ibi" | "rts",
    | "Publication"
    | "Attribute"
    | "Reach"
    | "SocialStatus"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "MagicalTradition"
    | "BlessedTradition"
    | "DerivedCharacteristic"
    | AmmunitionishIdentifier["kind"]
    | "Race"
    | "Culture"
    | "Profession"
    | "Skill"
  >
>((env, locale, entry) => {
  const { translate, translateMap } = locale

  const name = getEquipmentName(translate, translateMap, env.getInstanceById, entry)

  if (entry.entity === "Book") {
    const translation = translateMap(entry.content.translations)

    if (translation === undefined) {
      return undefined
    }

    return {
      title: name,
      className: "equipment",
      body: [
        {
          type: "definitionList",
          items: [
            {
              label: translate("Name"),
              value: name,
            },
            {
              label: translate("Type"),
              value: renderBookTypes(
                translate,
                translateMap,
                locale.join,
                locale.compare,
                env.getInstanceById,
                entry.content.types,
              ),
            },
            translation.language !== undefined || translation.script !== undefined
              ? {
                  label: translate("Language/Script"),
                  value: [translation.language, translation.script]
                    .map(value => value ?? "—")
                    .join(" / "),
                }
              : undefined,
            entry.content.contentQuality === undefined
              ? undefined
              : {
                  label: translate("Content Quality"),
                  value: (() => {
                    switch (entry.content.contentQuality.kind) {
                      case "Modest":
                        return translate("Modest")
                      case "Average":
                        return translate("Average")
                      case "Demanding":
                        return (
                          translate("Demanding") +
                          parensIf(
                            translate("CL {$level}", {
                              level: romanize(entry.content.contentQuality.Demanding),
                            }),
                          )
                        )
                      default:
                        return assertExhaustive(entry.content.contentQuality)
                    }
                  })(),
                },
            mapNullable(entry.content.cost, cost => ({
              label: translate("Cost"),
              value: renderCost(cost).run(env),
            })),
            translation.note === undefined
              ? undefined
              : {
                  label: translate("Note"),
                  value: translation.note,
                },
            translation.rules === undefined
              ? undefined
              : {
                  label: translate("Rules"),
                  value: renderBookRules(translate, translation.rules),
                },
            translation.legality === undefined
              ? undefined
              : {
                  label: translate("Legality"),
                  value: translation.legality,
                },
            translation.availability === undefined
              ? undefined
              : {
                  label: translate("Availability"),
                  value: translation.availability,
                },
            translation.special === undefined
              ? undefined
              : {
                  label: translate("Special"),
                  value: translation.special,
                },
          ],
        },
      ],
      errata: translation.errata,
      references: entry.content.src,
    }
  }

  const translation =
    entry.entity === "ClothingPackage" ? undefined : translateMap(entry.content.translations)

  if (entry.entity !== "ClothingPackage" && translation === undefined) {
    return undefined
  }

  const baseItem: BaseItem = entry.content
  const baseItemTranslation: BaseItemTranslation | undefined = translation
  const combatValues = normalizeCombatValues(entry)
  const combatTranslation = translateMap(combatValues?.values.translations)

  const baseProperties = {
    type: "tabular" as const,
    title: name,
    className: "equipment",
    errata: baseItemTranslation?.errata,
    references: entry.content.src,
  }

  return [
    ...(baseItemTranslation !== undefined && combatValues?.type === "Weapon"
      ? Object.entries(combatValues.values.melee_uses ?? {}).map(([combatTechniqueId, use]) => ({
          ...baseProperties,
          ...createMeleeWeaponTableEntry(
            name,
            entry.entity,
            baseItem,
            { ...combatTranslation, ...baseItemTranslation },
            combatTechniqueId,
            use,
          ),
        }))
      : []),
    ...(baseItemTranslation !== undefined && combatValues?.type === "Weapon"
      ? Object.entries(combatValues.values.ranged_uses ?? {}).map(([combatTechniqueId, use]) => ({
          ...baseProperties,
          ...createRangedWeaponTableEntry(
            name,
            entry.entity,
            baseItem,
            { ...combatTranslation, ...baseItemTranslation },
            combatTechniqueId,
            use,
          ),
        }))
      : []),
    ...(baseItemTranslation !== undefined && combatValues?.type === "Armor"
      ? [
          {
            ...baseProperties,
            ...createArmorTableEntry(
              name,
              entry.entity,
              baseItem,
              { ...combatTranslation, ...baseItemTranslation },
              combatValues.values,
            ),
          },
        ]
      : []),
    ...(entry.entity === "Weapon" || entry.entity === "Armor"
      ? []
      : entry.entity === "GemOrPreciousStone"
        ? [
            {
              ...baseProperties,
              ...createGemOrPreciousStoneTableEntry(
                name,
                entry.content,
                translateMap(entry.content.translations),
              ),
            },
          ]
        : entry.entity === "MusicalInstrument" ||
            entry.entity === "Animal" ||
            entry.entity === "AnimalCare" ||
            entry.entity === "Vehicle"
          ? [
              {
                ...baseProperties,
                ...createSimpleTableEntry(
                  name,
                  entry.entity,
                  {
                    name: null,
                    weight: null,
                    cost: null,
                  },
                  baseItem,
                  baseItemTranslation,
                ),
              },
            ]
          : [
              {
                ...baseProperties,
                ...createSimpleTableEntry(
                  name,
                  entry.entity,
                  {
                    name: null,
                    weight: null,
                    structurePoints: null,
                    cost: null,
                    complexity: null,
                  },
                  baseItem,
                  baseItemTranslation,
                ),
              },
            ]),
    // {
    //   title: name,
    //   className: "equipment",
    //   body: [
    //     {
    //       type: "definitionList",
    //       items: [
    //         renderComplexity(translate, baseItem.complexity),
    //         mapNullable(baseItem.burning_time, burningTime => ({
    //           label: translate("Burning Time"),
    //           value:
    //             burningTime.kind === "Unlimited"
    //               ? translate("unlimited")
    //               : formatTimeSpan(
    //                   translate,
    //                   translateMap,
    //                   format,
    //                   ResponsiveTextSize.Full,
    //                   burningTime.Limited.unit,
    //                   burningTime.Limited.value,
    //                 ),
    //         })),
    //         mapNullable(baseItemTranslation?.color, color => ({
    //           label: translate("Color"),
    //           value: color,
    //         })),
    //         baseItem.structure_points !== undefined && isNotEmpty(baseItem.structure_points)
    //           ? {
    //               label: translate("Structure Points"),
    //               value:
    //                 baseItem.structure_points.length === 1
    //                   ? translate(".input {$value :number} {{{$value} Structure Points}}", {
    //                       value: baseItem.structure_points[0].points,
    //                     })
    //                   : translate("{$value} Structure Points", {
    //                       value: baseItem.structure_points.map(elem => elem.points).join("/"),
    //                     }),
    //             }
    //           : undefined,
    //         mapNullable(baseItem.weight, weight =>
    //           renderWeight(translate, locale.formatNumber, locale.measurementAdjustments, weight),
    //         ),
    //         mapNullable(baseItem.cost, cost =>
    //           renderCost(translate, translateMap, locale.formatNumber, cost),
    //         ),
    //         mapNullable(
    //           renderNote(
    //             translate,
    //             translateMap,
    //             getInstanceById,
    //             locale.join,
    //             combatValues?.type === "Weapon" ? combatValues.values.melee_uses : undefined,
    //             combatValues?.values.restrictedTo,
    //             name,
    //             baseItemTranslation?.note,
    //           ),
    //           note => ({
    //             label: translate("Note"),
    //             value: note,
    //           }),
    //         ),
    //         baseItemTranslation?.rules !== undefined
    //           ? {
    //               label: translate("Rules"),
    //               value: baseItemTranslation.rules,
    //             }
    //           : undefined,
    //         combatValues?.type === "Weapon" && combatTranslation?.advantage !== undefined
    //           ? {
    //               label: translate("Weapon Advantage"),
    //               value: combatTranslation.advantage,
    //             }
    //           : undefined,
    //         combatValues?.type === "Weapon" && combatTranslation?.disadvantage !== undefined
    //           ? {
    //               label: translate("Weapon Disadvantage"),
    //               value: combatTranslation.disadvantage,
    //             }
    //           : undefined,
    //         combatValues?.type === "Armor" && combatTranslation?.advantage !== undefined
    //           ? {
    //               label: translate("Armor Advantage"),
    //               value: combatTranslation.advantage,
    //             }
    //           : undefined,
    //         combatValues?.type === "Armor" && combatTranslation?.disadvantage !== undefined
    //           ? {
    //               label: translate("Armor Disadvantage"),
    //               value: combatTranslation.disadvantage,
    //             }
    //           : undefined,
    //         baseItemTranslation?.placeOfPublication !== undefined
    //           ? {
    //               label: translate("Place of Publication"),
    //               value: baseItemTranslation.placeOfPublication,
    //             }
    //           : undefined,
    //         baseItemTranslation?.topics !== undefined
    //           ? {
    //               label: translate("Topics"),
    //               value: baseItemTranslation.topics.toSorted(locale.compare).join(", "),
    //             }
    //           : undefined,
    //         baseItemTranslation?.appearance !== undefined
    //           ? {
    //               label: translate("Appearance"),
    //               value: baseItemTranslation.appearance,
    //             }
    //           : undefined,
    //         baseItemTranslation?.components !== undefined
    //           ? {
    //               label: translate("Components"),
    //               value: baseItemTranslation.components,
    //             }
    //           : undefined,
    //         baseItemTranslation?.use !== undefined
    //           ? {
    //               label: translate("Use"),
    //               value: baseItemTranslation.use,
    //             }
    //           : undefined,
    //       ],
    //     },
    //   ] as (RawEntityDescriptionSection | undefined)[],
    //   errata: baseItemTranslation?.errata,
    //   references: entry.content.src,
    // },
  ]
})
