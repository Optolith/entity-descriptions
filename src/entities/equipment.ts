import { partition } from "@elyukai/utils/array/groups"
import { ensureNonEmpty, isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { on } from "@elyukai/utils/function"
import { isNotNullish, mapNullable } from "@elyukai/utils/nullable"
import { omitKeys, sortObjectKeysByIndex } from "@elyukai/utils/object"
import { compareNumber } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { romanize } from "@elyukai/utils/roman"
import { sign } from "@elyukai/utils/string/number"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  AmmunitionishIdentifier,
  AnimalFeedCost,
  Armor_ID,
  ArmorComplexity,
  ArmorType,
  AssociatedTradition,
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
  CostRange,
  DefaultEquipmentCategoryTypeRules,
  Encumbrance,
  EquipmentCategory,
  EquipmentCategoryTranslation,
  EquipmentIdentifier,
  Errata,
  FixedCost,
  GemOrPreciousStone,
  GemOrPreciousStoneTranslation,
  GenMeleeWeapon,
  GenRangedWeapon,
  HasAdditionalPenalties,
  HitZone,
  ImprovisedWeaponTranslation,
  Item,
  ItemTranslation,
  JewelryMaterialDifference,
  Length,
  LocaleMeasurementAdjustments,
  MeleeDamage,
  MeleeWeaponUse,
  ParryModifier,
  PlainBookRulesTranslation,
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
  RestrictedToBlessedTraditionsTranslation,
  RestrictedToCultures,
  RestrictedToMagicalTraditions,
  RestrictedToProfessions,
  RestrictedToRaces,
  SecondaryArmorTranslation,
  ShieldSize,
  StandardArmorType,
  StructurePoints,
  VariantArmorTypeTranslation,
  Weight,
} from "@optolith/database-schema/gen"
import { type Case, fromUniformCase } from "tsondb/schema/gen"
import { createEntityDescriptionCreator, type TaggedEntity } from "../creator.js"
import type { StdEnv, StdReader } from "../env.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import type { LocaleCompare, LocaleJoin } from "../helpers/locale.js"
import type {
  Format,
  LocaleMap,
  Translate,
  TranslateMap,
  TranslationKeyMatchingParams,
  TranslationKeysWithoutParams,
  TranslationParams,
  TranslationParamsInArray,
  Translations,
} from "../helpers/translate.js"
import type { WrapInNestedReaders } from "../nestedReaders.js"
import type {
  RawDefinitionListEntityDescriptionSectionItem,
  RawLabeledEntityDescriptionSection,
  RawNestedDefinitionListEntityDescriptionSection,
  RawPlainEntityDescriptionSection,
  RawTabularEntityDescription,
  RawTextEntityDescription,
} from "../rawEntityDescription.js"
import { getDerivedCharacteristicPositionAndTranslation } from "./partial/derivedCharacteristics.js"
import { renderDiceAndFlatR } from "./partial/dice.js"
import {
  attributedName,
  attributedNameFromInstance,
  attributedNameFromText,
} from "./partial/markdown.js"
import { parensIf, parensIfR } from "./partial/rated/activatable/parensIf.js"
import {
  attributedCustomNameFromInstanceR,
  attributedCustomNameR,
  attributedNameFromInstanceR,
  attributedNameR,
  formatNumber,
  getInstanceByIdR,
  localeJoinR,
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
import { formatTimeSpan, formatTimeSpanR } from "./partial/units/timeSpan.js"
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
    case "ArmorAccessory":
    case "BandageOrRemedy":
    case "CeremonialItem":
    case "Clothes":
    case "Container":
    case "Elixir":
    case "EquipmentOfBlessedOnes":
    case "GemOrPreciousStone":
    case "IlluminationLightSource":
    case "IlluminationRefillOrSupply":
    case "ItemComponent":
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
): RawLabeledEntityDescriptionSection => {
  const combatTechnique = getInstanceById("CloseCombatTechnique", closeCombatTechniqueId)

  const fields: CloseCombatTechniqueSpecialRules = combatTechnique?.special ?? {
    hasAttackModifier: { kind: "Prohibited" },
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

const renderMeleeDamage = (damage: MeleeDamage) => renderDiceAndFlatR(damage.dice, damage.flat)

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
): RawLabeledEntityDescriptionSection => {
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

const renderRangedDamage = (damage: RangedDamage) => {
  switch (damage.kind) {
    case "Default":
      return renderDiceAndFlatR(damage.Default.dice, damage.Default.flat)
    case "NotApplicable":
      return Reader.of("—")
    case "Special":
      return translateR("Special (Damage)")
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

type TranslationParamsWithPossibleItemName<
  T1 extends keyof Translations,
  N extends string | undefined,
> =
  TranslationParams<T1> extends undefined
    ? { itemName: N }
    : TranslationParams<T1> & { itemName: N }

const renderRestrictionTextWithPossiblyUnknownItemName = <T1 extends keyof Translations>(
  translationKeyWithoutName: T1,
  translationKeyWithName: TranslationKeyMatchingParams<
    TranslationParamsWithPossibleItemName<T1, string>
  >,
  params: TranslationParamsWithPossibleItemName<T1, string | undefined>,
) => {
  if (params.itemName === undefined) {
    return translateR(
      translationKeyWithoutName,
      ...([omitKeys(params, "itemName")] as TranslationParamsInArray<T1>),
    )
  } else {
    return translateR(
      translationKeyWithName,
      ...([params] as TranslationParamsInArray<
        TranslationKeyMatchingParams<
          TranslationParams<T1> extends undefined
            ? { itemName: string }
            : TranslationParams<T1> & { itemName: string }
        >
      >),
    )
  }
}

const renderSanctifiedPrefix = (
  translation: RestrictedToBlessedTraditionsTranslation | undefined,
  traditions: string,
) =>
  translation?.sanctified === undefined
    ? translateR("Sanctified ({$traditions})", { traditions })
    : Reader.of(translation.sanctified)

const renderSanctified = (
  translation: RestrictedToBlessedTraditionsTranslation | undefined,
  traditions: string,
  renderPart2: StdReader<string, "t">,
) =>
  renderSanctifiedPrefix(translation, traditions).then(part1 =>
    renderPart2.map(part2 => [part1, part2].join("; ")),
  )

const renderBlessedTraditionRestriction = (
  restriction: RestrictedToBlessedTraditions,
): StdReader<string, "t" | "tm" | "lj" | "ibi", "BlessedTradition"> => {
  if (restriction.isSanctifiedBy) {
    switch (restriction.scope.kind) {
      case "Specific":
        if (!isNotEmpty(restriction.scope.Specific)) {
          return translateMapR(restriction.translations).thenW(translation =>
            renderSanctified(
              translation,
              MISSING_VALUE,
              translateR("only {$blessedOnes} may purchase weapons sanctified by {$god}.", {
                blessedOnes: MISSING_VALUE,
                god: MISSING_VALUE,
              }),
            ),
          )
        } else if (restriction.scope.Specific.length > 1) {
          return Reader.traverse(restriction.scope.Specific, restrictionId =>
            attributedCustomNameR(
              "equipment",
              t => t.nameOfBlessedOnes,
              "BlessedTradition",
              restrictionId,
            )
              .map(restrictionName => restrictionName ?? MISSING_VALUE)
              .thenW(nameOfBlessedOnes =>
                attributedCustomNameR(
                  "equipment",
                  t => t.nameOfGod ?? t.name,
                  "BlessedTradition",
                  restrictionId,
                )
                  .map(restrictionName => restrictionName ?? MISSING_VALUE)
                  .map(nameOfGod => [nameOfBlessedOnes, nameOfGod] as const),
              ),
          ).thenW(list =>
            localeJoinR(list.map(e => e[1]).filter(isNotNullish), "unit").thenW(traditions =>
              localeJoinR(list.map(e => e[1]).filter(isNotNullish), "disjunction").thenW(gods =>
                localeJoinR(list.map(e => e[0]).filter(isNotNullish), "disjunction").thenW(
                  blessedOnes =>
                    translateMapR(restriction.translations).thenW(translation =>
                      renderSanctified(
                        translation,
                        traditions,
                        translateR(
                          "only {$blessedOnes} may purchase weapons sanctified by {$gods}, respectively.",
                          {
                            blessedOnes: translation?.blessedOnes ?? blessedOnes,
                            gods,
                          },
                        ),
                      ),
                    ),
                ),
              ),
            ),
          )
        } else {
          const [traditionId] = restriction.scope.Specific
          return attributedCustomNameR(
            "equipment",
            t => t.nameOfBlessedOnes,
            "BlessedTradition",
            traditionId,
          )
            .map(restrictionName => restrictionName ?? MISSING_VALUE)
            .thenW(blessedOnes =>
              attributedCustomNameR(
                "equipment",
                t => t.nameOfGod ?? t.name,
                "BlessedTradition",
                traditionId,
              )
                .map(restrictionName => restrictionName ?? MISSING_VALUE)
                .thenW(god =>
                  translateMapR(restriction.translations).thenW(translation =>
                    renderSanctified(
                      translation,
                      god,
                      translateR("only {$blessedOnes} may purchase weapons sanctified by {$god}.", {
                        blessedOnes: translation?.blessedOnes ?? blessedOnes,
                        god,
                      }),
                    ),
                  ),
                ),
            )
        }
      case "Church":
        return Reader.of(UNHANDLED_VALUE)
      case "Shamanistic":
        return Reader.of(UNHANDLED_VALUE)
      default:
        return assertExhaustive(restriction.scope)
    }
  } else {
    switch (restriction.scope.kind) {
      case "Specific":
        return Reader.traverse(restriction.scope.Specific, restrictionId =>
          attributedNameR("equipment", "BlessedTradition", restrictionId).map(
            restrictionName => restrictionName ?? MISSING_VALUE,
          ),
        )
          .thenW(list => localeJoinR(list.filter(isNotNullish), "disjunction"))
          .thenW(traditions =>
            translateMapR(restriction.translations).thenW(translation =>
              renderRestrictionTextWithPossiblyUnknownItemName(
                "To buy this item during hero creation, the character must have Tradition ({$traditions}).",
                "To buy {$itemName} during hero creation, the character must have Tradition ({$traditions}).",
                {
                  itemName: translation?.item,
                  traditions,
                },
              ),
            ),
          )
      case "Church":
        return Reader.of(UNHANDLED_VALUE)
      case "Shamanistic":
        return translateMapR(restriction.translations).thenW(translation =>
          renderRestrictionTextWithPossiblyUnknownItemName(
            "To buy this item during hero creation, the character must have a shamanistic tradition.",
            "To buy {$itemName} during hero creation, the character must have a shamanistic tradition.",
            {
              itemName: translation?.item,
            },
          ),
        )
      default:
        return assertExhaustive(restriction.scope)
    }
  }
}

const renderMagicalTraditionRestriction = (
  restriction: RestrictedToMagicalTraditions,
): StdReader<string, "t" | "tm" | "lj" | "ibi", "MagicalTradition"> =>
  Reader.traverse(restriction.scope, restrictionId =>
    attributedNameR("equipment", "MagicalTradition", restrictionId).map(
      restrictionName => restrictionName ?? MISSING_VALUE,
    ),
  )
    .thenW(list => localeJoinR(list.filter(isNotNullish), "disjunction"))
    .thenW(traditions =>
      translateMapR(restriction.translations).thenW(translation =>
        renderRestrictionTextWithPossiblyUnknownItemName(
          "To buy this item during hero creation, the character must have Tradition ({$traditions}).",
          "To buy {$itemName} during hero creation, the character must have Tradition ({$traditions}).",
          {
            itemName: translation?.item,
            traditions,
          },
        ),
      ),
    )

const renderRaceRestriction = (
  restriction: RestrictedToRaces,
): StdReader<string, "t" | "tm" | "lj" | "ibi", "Race"> =>
  Reader.traverse(restriction.scope, restrictionId =>
    attributedNameR("equipment", "Race", restrictionId).map(
      restrictionName => restrictionName ?? MISSING_VALUE,
    ),
  )
    .thenW(list => localeJoinR(list.filter(isNotNullish), "disjunction"))
    .thenW(races =>
      translateMapR(restriction.translations).thenW(translation =>
        renderRestrictionTextWithPossiblyUnknownItemName(
          "To buy this item during hero creation, the character must be from {$cultures}.",
          "To buy {$itemName} during hero creation, the character must be from {$cultures}.",
          {
            itemName: translation?.item,
            cultures: translation?.groupOfCultures ?? races,
          },
        ),
      ),
    )

const renderCultureRestriction = (
  restriction: RestrictedToCultures,
): StdReader<string, "t" | "tm" | "lj" | "ibi", "Culture"> =>
  Reader.traverse(restriction.scope, restrictionId =>
    attributedNameR("equipment", "Culture", restrictionId).map(
      restrictionName => restrictionName ?? MISSING_VALUE,
    ),
  )
    .thenW(list => localeJoinR(list.filter(isNotNullish), "disjunction"))
    .thenW(cultures =>
      translateMapR(restriction.translations).thenW(translation =>
        renderRestrictionTextWithPossiblyUnknownItemName(
          "To buy this item during hero creation, the character must be from {$cultures}.",
          "To buy {$itemName} during hero creation, the character must be from {$cultures}.",
          {
            itemName: translation?.item,
            cultures: translation?.cultures ?? cultures,
          },
        ),
      ),
    )

const renderProfessionRestriction = (
  _restriction: RestrictedToProfessions,
): StdReader<string, "t" | "tm" | "lj" | "ibi", "Profession"> => Reader.of(UNHANDLED_VALUE)

const renderAnyShieldSize = (
  baseText: "Large Shield" | "Medium Shield" | "Small Shield",
  structurePoints?: StructurePoints,
  attackPenalty?: number,
) =>
  Reader.sequence<StdEnv<"t" | "fn">, string | undefined>([
    translateR(baseText),
    structurePoints === undefined
      ? Reader.of(undefined)
      : structurePoints.kind === "Unbreakable"
        ? translateR("unbreakable")
        : translateR("{$value} structure points", {
            value: structurePoints.Points.map(spc => spc.points).join("/"),
          }),
    attackPenalty === undefined
      ? Reader.of(undefined)
      : formatNumber(attackPenalty).thenW(value =>
          translateR("additional {$value} AT for main weapon", { value }),
        ),
  ]).map(list => ensureNonEmpty(list.filter(isNotNullish))?.join(", "))

const renderShieldSize = (size: ShieldSize, structurePoints: StructurePoints | undefined) => {
  switch (size.kind) {
    case "Large":
      return renderAnyShieldSize("Large Shield", structurePoints, size.Large.attack_penalty)
    case "Medium":
      return renderAnyShieldSize("Medium Shield", structurePoints)
    case "Small":
      return renderAnyShieldSize("Small Shield", structurePoints)
    default:
      return assertExhaustive(size)
  }
}

const renderHitZone = (hitZone: HitZone) => {
  switch (hitZone.kind) {
    case "Arms":
      return translateR("Arms")
    case "Head":
      return translateR("Head")
    case "Legs":
      return translateR("Legs")
    case "Torso":
      return translateR("Torso")
    default:
      return assertExhaustive(hitZone)
  }
}

const renderArmorVariant = (armor: {
  armorType: ArmorType
  hitZone?: HitZone
  hit_zone?: HitZone
}) => {
  const { armorType, hitZone = armor.hit_zone } = armor

  if (armorType.kind === "Standard") {
    return Reader.of(undefined)
  }

  const variantArmorType = fromUniformCase<
    "StandardVariant" | "Variant",
    { variantOf: Armor_ID; translations: LocaleMap<VariantArmorTypeTranslation> }
  >(armorType)

  return getInstanceByIdR("Armor", variantArmorType.variantOf).thenWOrElse(armorInstance =>
    translateMapR(variantArmorType.translations).thenW(variantTranslation =>
      hitZone === undefined
        ? attributedCustomNameFromInstanceR(
            (armorInstance.armorType as Case<"Standard", StandardArmorType>).Standard,
            "note",
            t => t.nameInNote,
            "Armor",
            variantArmorType.variantOf,
          ).thenW(baseTranslation =>
            translateR("{$variantArmor} is a type of {$baseArmor}.", {
              baseArmor: baseTranslation ?? MISSING_VALUE,
              variantArmor: variantTranslation?.nameInNote ?? MISSING_VALUE,
            }),
          )
        : attributedNameFromInstanceR(
            armorInstance,
            "note",
            "Armor",
            variantArmorType.variantOf,
          ).thenW(baseTranslation =>
            renderHitZone(hitZone).thenW(hitZoneName =>
              translateR("{$variantHitZoneArmor} counts as {$baseArmor} for hit zone {$hitZone}.", {
                baseArmor: baseTranslation ?? MISSING_VALUE,
                variantHitZoneArmor: variantTranslation?.nameInNote ?? MISSING_VALUE,
                hitZone: hitZoneName,
              }),
            ),
          ),
    ),
  )
}

const renderNote = (
  meleeUse: GenMeleeWeapon<unknown> | undefined,
  armor: { armorType: ArmorType; hitZone?: HitZone } | undefined,
  structurePoints: StructurePoints | undefined,
  restrictedTo: RestrictedTo | undefined,
  note: string | undefined,
): StdReader<
  string | undefined,
  "t" | "tm" | "lj" | "ibi" | "fn",
  "Race" | "Culture" | "Profession" | "BlessedTradition" | "MagicalTradition" | "Armor"
> => {
  const {
    blessedTraditions: restrictedToBlessedTraditions,
    cultures: restrictedToCultures,
    magicalTraditions: restrictedToMagicalTraditions,
    professions: restrictedToProfessions,
    races: restrictedToRaces,
  } = restrictedTo ?? {}

  return Reader.sequence<
    StdEnv<
      "t" | "tm" | "lj" | "ibi" | "fn",
      "Race" | "Culture" | "Profession" | "BlessedTradition" | "MagicalTradition" | "Armor"
    >,
    string | undefined
  >([
    Reader.sequence([
      meleeUse?.size === undefined
        ? Reader.of(undefined)
        : renderShieldSize(meleeUse.size, structurePoints),
      meleeUse?.is_parrying_weapon === true
        ? translateR("Parrying weapon (PA bonus +1 for the main weapon)")
        : Reader.of(undefined),
    ])
      .map(list => ensureNonEmpty(list.filter(isNotNullish)))
      .thenW(list =>
        list === undefined ? Reader.of(undefined) : localeJoinR(list, "disjunction"),
      ),
    armor === undefined ? Reader.of(undefined) : renderArmorVariant(armor),
    restrictedToBlessedTraditions === undefined
      ? Reader.of(undefined)
      : renderBlessedTraditionRestriction(restrictedToBlessedTraditions),
    restrictedToRaces === undefined
      ? Reader.of(undefined)
      : renderRaceRestriction(restrictedToRaces),
    restrictedToCultures === undefined
      ? Reader.of(undefined)
      : renderCultureRestriction(restrictedToCultures),
    restrictedToProfessions === undefined
      ? Reader.of(undefined)
      : renderProfessionRestriction(restrictedToProfessions),
    restrictedToMagicalTraditions === undefined
      ? Reader.of(undefined)
      : renderMagicalTraditionRestriction(restrictedToMagicalTraditions),
    Reader.of(note),
  ]).map(list =>
    ensureNonEmpty(list.filter(isNotNullish))?.reduce(
      (acc, elem) =>
        acc === ""
          ? elem
          : acc.endsWith(".")
            ? `${acc} ${elem}`
            : elem.endsWith(".")
              ? `${acc}. ${elem}`
              : `${acc}; ${elem}`,
      "",
    ),
  )
}

const renderAssociatedTradition = (
  tradition: AssociatedTradition,
): StdReader<string, "t" | "tm" | "ibi", "BlessedTradition"> => {
  switch (tradition.kind) {
    case "ManyShamans":
      return translateR("many shamans")
    case "Specific":
      return attributedCustomNameR(
        "equipment",
        t => t.nameOfGod ?? t.name,
        "BlessedTradition",
        tradition.Specific,
      ).map(restrictionName => restrictionName ?? MISSING_VALUE)
    default:
      return assertExhaustive(tradition)
  }
}

const renderAssociatedTraditions = (traditions: AssociatedTradition[] | undefined) =>
  traditions === undefined || traditions.length === 0
    ? Reader.of(undefined)
    : Reader.traverse(traditions, renderAssociatedTradition).map(list => list.join(", "))

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

/**
 * Render a cost range, e.g. "10–20 silverthalers" or "10+ silverthalers".
 */
export const renderCostRange = (range: CostRange): StdReader<string, "t" | "tm"> =>
  translateMapR(range.translations).thenW(translation => {
    const { from, to } = range
    return (
      to === undefined
        ? translateR("{$value} silverthalers", {
            value: `${from.toFixed()}+`,
          })
        : translateR(
            ".input {$from :number} .input {$to :number} {{{$from}–{$to} silverthalers}}",
            {
              from,
              to,
            },
          )
    ).map(main => translation?.wrap_in_text.replace("{0}", main) ?? main)
  })

export const renderFixedItemCost = (cost: FixedCost) =>
  translateMapR(cost.translations).thenW(translation =>
    formatSilverthalers(cost.value).map(
      main => translation?.wrap_in_text.replace("{0}", main) ?? main,
    ),
  )

const renderCost = (
  cost: Cost | BookCost | JewelryMaterialDifference<number> | AnimalFeedCost | undefined,
): StdReader<string, "f" | "fn" | "t" | "tm" | "rts"> => {
  if (cost === undefined) {
    return Reader.of("—")
  }

  const renderBookCostVariant = (
    bookCostVariant: BookCostVariant,
  ): StdReader<string, "f" | "fn" | "t" | "tm" | "rts"> => {
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
        return translateMapR(cost.Invaluable.translations).thenW(translation =>
          translateR("invaluable").map(
            main => translation?.wrap_in_text.replace("{0}", main) ?? main,
          ),
        )
      case "Fixed":
        return renderFixedItemCost(cost.Fixed)
      case "Range":
        return renderCostRange(cost.Range)
      case "Single":
        return renderBookCostVariant(cost.Single)
      case "Multiple":
        return Reader.traverse(cost.Multiple, renderBookCostVariant).map(list => list.join(", "))
      case "PerWeek":
        return formatTimeSpanR("Weeks", 1, true).thenW(interval =>
          renderFixedItemCost(cost.PerWeek).thenW(costPerWeek =>
            translateR("{$cost} per {$interval}", { cost: costPerWeek, interval }),
          ),
        )
      default:
        return assertExhaustive(cost)
    }
  }
}

type BaseItem = {
  cost?: Cost | BookCost | JewelryMaterialDifference<number> | AnimalFeedCost
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
  associatedTraditions?: AssociatedTradition[]
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
  armorType: ArmorType
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
    case "ItemComponent":
      return undefined
    case "Ammunition":
    case "Animal":
    case "AnimalCare":
    case "ArmorAccessory":
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
                attributedName(
                  translateMap,
                  getInstanceById,
                  "book-type",
                  "Skill",
                  type.Mundane.ProfessionalPublication,
                ) ?? MISSING_VALUE,
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

type RenderedBookRules =
  | string
  | (
      | RawPlainEntityDescriptionSection
      | RawNestedDefinitionListEntityDescriptionSection
      | undefined
    )[]

const renderDLItemIfNotUndefined = (
  labelKey: TranslationKeysWithoutParams,
  value: string | undefined,
): StdReader<RawDefinitionListEntityDescriptionSectionItem | undefined, "t"> =>
  value === undefined ? Reader.of(undefined) : translateR(labelKey).map(label => ({ label, value }))

const renderPlainBookRules = (
  translation: PlainBookRulesTranslation,
): StdReader<RenderedBookRules, "t" | "tm"> => {
  if (
    translation.reconstruction === undefined &&
    translation.references === undefined &&
    translation.textAfter === undefined
  ) {
    return Reader.of(translation.text)
  }

  return Reader.traverse(
    [
      ["Reconstruction" as const, translation.reconstruction],
      ["References" as const, translation.references],
    ] as const,
    ([labelKey, value]) => renderDLItemIfNotUndefined(labelKey, value),
  ).map(nestedItem => [
    {
      type: "plain",
      text: translation.text,
    },
    {
      type: "definitionList",
      style: "nested",
      items: nestedItem.filter(isNotNullish),
    },
    mapNullable(translation.textAfter, textAfter => ({
      type: "plain",
      text: textAfter,
    })),
  ])
}

const renderBookRules = (
  rules: BookRules,
): WrapInNestedReaders<StdEnv<"t" | "tm">, RenderedBookRules | undefined> => {
  switch (rules.kind) {
    case "Plain":
      return translateMapR(rules.Plain.translations).thenWOrElse(renderPlainBookRules)
    case "Entertainment":
      return translateR("Entertainment")
    case "ByEdition":
      return [
        {
          type: "definitionList",
          style: "nested",
          items: rules.ByEdition.editions.map(
            (
              edition,
            ): StdReader<
              | {
                  label: string
                  value: RenderedBookRules
                }
              | undefined,
              "t" | "tm"
            > =>
              translateMapR(edition.translations).thenWOrElse(translation =>
                renderPlainBookRules(translation).map(value => ({
                  label: translation.label,
                  value,
                })),
              ),
          ),
        },
        translateMapR(rules.ByEdition.translations).mapOrElse(translation =>
          mapNullable(translation.textAfter, textAfter => ({
            type: "plain",
            text: textAfter,
          })),
        ),
      ]
    default:
      return assertExhaustive(rules)
  }
}

const renderSimpleBookRules = (
  rules: BookRules,
): WrapInNestedReaders<StdEnv<"t" | "tm">, string | undefined> => {
  switch (rules.kind) {
    case "Plain":
      return translateMapR(rules.Plain.translations).mapOrElse(t => t.text)
    case "Entertainment":
      return translateR("Entertainment")
    case "ByEdition":
      return Reader.traverse(rules.ByEdition.editions, edition =>
        translateMapR(edition.translations).mapOrElse(translation => ({
          label: translation.label,
          value: translation.text,
        })),
      ).map(list =>
        list
          .filter(isNotNullish)
          .map(e => `${e.label}: ${e.value}`)
          .join("; "),
      )
    default:
      return assertExhaustive(rules)
  }
}

const renderStructurePoints = (structurePoints: StructurePoints | undefined) =>
  structurePoints !== undefined
    ? structurePoints.kind === "Unbreakable"
      ? translateR("unbreakable")
      : isNotEmpty(structurePoints.Points)
        ? structurePoints.Points.length === 1
          ? translateR(".input {$value :number} {{{$value} Structure Points}}", {
              value: structurePoints.Points[0].points,
            })
          : translateR("{$value} Structure Points", {
              value: structurePoints.Points.map(elem => elem.points).join("/"),
            })
        : Reader.of("—")
    : Reader.of("—")

type EquipmentCategoryEntity =
  | Exclude<EquipmentIdentifier["kind"], "Weapon" | "Armor">
  | "MeleeWeapon"
  | "RangedWeapon"
  | "StandardArmor"
  | "SpecialArmor"
  | "Helmets"
  | "ArmorPieces"

const orderOfEquipmentCategories: EquipmentCategoryEntity[] = [
  "MeleeWeapon",
  "RangedWeapon",
  "Ammunition",
  "StandardArmor",
  "SpecialArmor",
  "Helmets",
  "ArmorPieces",
  "WeaponAccessory",
  "Clothes",
  "ClothingPackage",
  "TravelGearOrTool",
  "IlluminationLightSource",
  "IlluminationRefillOrSupply",
  "BandageOrRemedy",
  "Container",
  "RopeOrChain",
  "ThievesTool",
  "ToolOfTheTrade",
  "OrienteeringAid",
  "Jewelry",
  "GemOrPreciousStone",
  "Stationery",
  "Book",
  "MagicalArtifact",
  "Elixir",
  "Poison",
  // "Plant",
  "MusicalInstrument",
  "LuxuryGood",
  "Animal",
  "AnimalCare",
  "Vehicle",
]

const prependOrderToLabel = (category: EquipmentCategoryEntity, label: string) =>
  orderOfEquipmentCategories.includes(category)
    ? `${(orderOfEquipmentCategories.indexOf(category) + 1).toFixed()}-${label}`
    : label

const categoryTranslationMap: Record<
  | EquipmentIdentifier["kind"]
  | "MeleeWeapon"
  | "RangedWeapon"
  | "StandardArmor"
  | "SpecialArmor"
  | "Helmets"
  | "ArmorPieces",
  StdReader<string, "t">
> = {
  Weapon: translateR("Weapons"),
  MeleeWeapon: translateR("Melee Weapons"),
  RangedWeapon: translateR("Ranged Weapons"),
  Ammunition: translateR("Ammunition"),
  Armor: translateR("Armor"),
  StandardArmor: translateR("Standard Armor"),
  SpecialArmor: translateR("Special Armor"),
  Helmets: translateR("Helmets"),
  ArmorPieces: translateR("Pieces of Armor"),
  WeaponAccessory: translateR("Weapon Accessories"),
  ArmorAccessory: translateR("Armor Accessories"),
  ItemComponent: translateR("Item Components"),
  Clothes: translateR("Clothes"),
  ClothingPackage: translateR("Clothing Packages for Social Status"),
  TravelGearOrTool: translateR("Travel Gear and Tools"),
  IlluminationLightSource: translateR("Illumination/Light Sources"),
  IlluminationRefillOrSupply: translateR("Illumination Refills and Supplies"),
  BandageOrRemedy: translateR("Bandages and Remedies"),
  Container: translateR("Containers"),
  RopeOrChain: translateR("Ropes and Chains"),
  ThievesTool: translateR("Thieves' Tools"),
  ToolOfTheTrade: translateR("Tools of the Trade"),
  Laboratory: translateR("Laboratories"),
  OrienteeringAid: translateR("Orienteering Aids"),
  Jewelry: translateR("Jewelry"),
  GemOrPreciousStone: translateR("Gems and Precious Stones"),
  Stationery: translateR("Stationery"),
  Book: translateR("Books"),
  MagicalArtifact: translateR("Magical Artifacts"),
  Elixir: translateR("Alchemicae"),
  Poison: translateR("Poisons"),
  MusicalInstrument: translateR("Musical Instruments"),
  LuxuryGood: translateR("Luxury Goods"),
  Animal: translateR("Animals"),
  AnimalCare: translateR("Animal Care"),
  Vehicle: translateR("Vehicles"),
  CeremonialItem: translateR("Ceremonial Items"),
  EquipmentOfBlessedOnes: translateR("Equipment of Blessed Ones"),
  Liebesspielzeug: translateR("Liebesspielzeug"),
  Newspaper: translateR("Newspapers"),
  WorkingSupernaturalCreature: translateR("Working Supernatural Creatures"),
}

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

/**
 * Name of columns in melee weapon table.
 */
export type MeleeWeaponColumns = keyof typeof meleeWeaponColumns

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

/**
 * Name of columns in ranged weapon table.
 */
export type RangedWeaponColumns = keyof typeof rangedWeaponColumns

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

type GenEquipmentTableEntry<Cols extends string, E> = WrapInNestedReaders<
  E,
  RawTabularEntityDescription<Cols>
>

type BaseProperties = {
  type: "tabular"
  title: string
  className: string
  errata?: Errata
  references: PublicationRefs
}

const renderMeleeWeaponTypesForName = (use: GenMeleeWeapon<unknown>) =>
  Reader.sequence([
    use.is_two_handed_weapon ? translateR("2H") : Reader.of(undefined),
    use.is_improvised_weapon ? translateR("i") : Reader.of(undefined),
  ]).map(types => ensureNonEmpty(types.filter(isNotNullish))?.join(", "))

const renderRangedWeaponTypesForName = (use: GenRangedWeapon<unknown>) =>
  Reader.sequence([use.is_improvised_weapon ? translateR("i") : Reader.of(undefined)]).map(types =>
    ensureNonEmpty(types.filter(isNotNullish))?.join(", "),
  )

/**
 * Renders a melee weapon table entry for the equipment table.
 */
export const createMeleeWeaponTableEntry = <D, E>(
  baseProperties: BaseProperties,
  name: string,
  entityName: EquipmentIdentifier["kind"],
  instance: {
    weight?: Weight | JewelryMaterialDifference<Weight>
    cost?: Cost | BookCost | JewelryMaterialDifference<number> | AnimalFeedCost
    restrictedTo?: RestrictedTo
    complexity?: ArmorComplexity | Complexity
    structure_points?: StructurePoints
    structurePoints?: StructurePoints
  },
  instanceTranslation: {
    secondary_name?: string
    note?: string
    rules?: string
    advantage?: string
    disadvantage?: string
  },
  combatTechniqueId: CloseCombatTechnique_ID,
  use: GenMeleeWeapon<D>,
  renderDamage: (damage: D) => Reader<E, string>,
): GenEquipmentTableEntry<
  MeleeWeaponColumns,
  StdEnv<
    "f" | "fn" | "t" | "tm" | "ibi" | "lj" | "ma" | "rts",
    | "Attribute"
    | "Reach"
    | "CloseCombatTechnique"
    | "Race"
    | "Culture"
    | "MagicalTradition"
    | "BlessedTradition"
    | "Profession"
    | "Armor"
  > &
    E
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
    ...baseProperties,
    category: {
      label: attributedCombatTechniqueName,
      sortingValue: combatTechniqueName.map(ctName =>
        prependOrderToLabel("MeleeWeapon", ctName ?? MISSING_VALUE),
      ),
      value: Reader.of("MeleeWeapon"),
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
      name: sequence`${name}${parensIf(instanceTranslation.secondary_name)}${parensIfR(renderMeleeWeaponTypesForName(use))}`,
      damagePoints: renderDamage(use.damage),
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
      {
        label: translateR("Note"),
        id: "note",
        value: renderNote(
          use,
          undefined,
          instance.structure_points ?? instance.structurePoints,
          instance.restrictedTo,
          instanceTranslation.note,
        ),
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

/**
 * Renders a ranged weapon table entry for the equipment table.
 */
export const createRangedWeaponTableEntry = <D, E>(
  baseProperties: BaseProperties,
  name: string,
  entityName: EquipmentIdentifier["kind"],
  instance: {
    weight?: Weight | JewelryMaterialDifference<Weight>
    cost?: Cost | BookCost | JewelryMaterialDifference<number> | AnimalFeedCost
    restrictedTo?: RestrictedTo
    complexity?: ArmorComplexity | Complexity
    structure_points?: StructurePoints
    structurePoints?: StructurePoints
  },
  instanceTranslation: {
    secondary_name?: string
    note?: string
    rules?: string
    advantage?: string
    disadvantage?: string
  },
  combatTechniqueId: RangedCombatTechnique_ID,
  use: GenRangedWeapon<D>,
  renderDamage: (damage: D) => Reader<E, string>,
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
    | "Armor"
  > &
    E
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
    ...baseProperties,
    category: {
      label: attributedCombatTechniqueName,
      sortingValue: combatTechniqueName.map(ctName =>
        prependOrderToLabel("RangedWeapon", ctName ?? MISSING_VALUE),
      ),
      value: Reader.of("RangedWeapon"),
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
      name: sequence`${name}${parensIf(instanceTranslation.secondary_name)}${parensIfR(renderRangedWeaponTypesForName(use))}`,
      damagePoints: renderDamage(use.damage),
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
        value: renderNote(
          undefined,
          undefined,
          instance.structure_points ?? instance.structurePoints,
          instance.restrictedTo,
          instanceTranslation.note,
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

const getArmorCategoryName = (
  values: NormalizedArmorValues,
): "StandardArmor" | "SpecialArmor" | "Helmets" | "ArmorPieces" => {
  switch (values.armorType.kind) {
    case "Standard":
      return "StandardArmor"
    case "StandardVariant":
    case "Variant":
      switch (values.hit_zone?.kind) {
        case "Head":
          return "Helmets"
        case "Torso":
        case "Arms":
        case "Legs":
          return "ArmorPieces"
        case undefined:
          return "SpecialArmor"
        default:
          return assertExhaustive(values.hit_zone)
      }
    default:
      return assertExhaustive(values.armorType)
  }
}

const createArmorTableEntry = (
  baseProperties: BaseProperties,
  name: string,
  entityName: EquipmentIdentifier["kind"],
  instance: {
    weight?: Weight | JewelryMaterialDifference<Weight>
    cost?: Cost | BookCost | JewelryMaterialDifference<number> | AnimalFeedCost
    restrictedTo?: RestrictedTo
    complexity?: ArmorComplexity | Complexity
    structure_points?: StructurePoints
  },
  instanceTranslation: {
    secondary_name?: string
    note?: string
    rules?: string
    advantage?: string
    disadvantage?: string
  },
  values: NormalizedArmorValues,
): GenEquipmentTableEntry<
  ArmorColumns,
  StdEnv<
    "f" | "fn" | "t" | "tm" | "ibi" | "lj" | "lc" | "ma" | "x" | "rts",
    | "Race"
    | "Culture"
    | "MagicalTradition"
    | "BlessedTradition"
    | "Profession"
    | "DerivedCharacteristic"
    | "Armor"
  >
> => {
  const categoryName = getArmorCategoryName(values)
  return {
    ...baseProperties,
    category: {
      label: categoryTranslationMap[categoryName],
      sortingValue: categoryTranslationMap[categoryName].map(label =>
        prependOrderToLabel(categoryName, label),
      ),
      value: Reader.of(categoryName),
    },
    labels: sortObjectKeysByIndex(
      { ...armorColumns, weight: renderWeightLabel(entityName), cost: renderCostLabel(entityName) },
      Object.keys(armorColumns) as (keyof typeof armorColumns)[],
    ),
    values: {
      name: Reader.of(name + parensIf(instanceTranslation.secondary_name)),
      protection: Reader.of(values.protection.toFixed()),
      encumbrance: Reader.of(values.encumbrance.toFixed()),
      additionalPenalties: values.has_additional_penalties
        ? Reader.asks((env: StdEnv<"x">) => env.settings.additionalArmorPenalties)
            .thenW(dcIds =>
              Reader.traverse(dcIds, id =>
                getDerivedCharacteristicPositionAndTranslation(id, "equipment-table")
                  .with((env: StdEnv<"tm" | "ibi", "DerivedCharacteristic">) => ({
                    ...env,
                    responsiveTextSize: ResponsiveTextSize.Compressed,
                  }))
                  .map(dcName => [dcName[0], `${sign(-1)} ${dcName[1]}`] as const),
              ),
            )
            .map(names =>
              names
                .toSorted(on(p => p[0], compareNumber))
                .map(p => p[1])
                .join(", "),
            )
        : Reader.of("—"),
      weight: renderWeightValue(instance.weight),
      cost: renderCost(instance.cost),
      complexity: renderComplexity(instance.complexity),
    },
    additionalInformation: [
      {
        label: translateR("Note"),
        id: "note",
        value: renderNote(
          undefined,
          values,
          instance.structure_points,
          instance.restrictedTo,
          instanceTranslation.note,
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
  }
}

const createGemOrPreciousStoneTableEntry = (
  baseProperties: BaseProperties,
  name: string,
  instance: GemOrPreciousStone,
  instanceTranslation: GemOrPreciousStoneTranslation | undefined,
): GenEquipmentTableEntry<
  "name" | "color" | "cost",
  StdEnv<
    "f" | "fn" | "t" | "tm" | "lj" | "ma" | "ibi" | "rts",
    "Race" | "Culture" | "Profession" | "BlessedTradition" | "MagicalTradition" | "Armor"
  >
> => ({
  ...baseProperties,
  category: {
    label: categoryTranslationMap.GemOrPreciousStone,
    sortingValue: categoryTranslationMap.GemOrPreciousStone.map(label =>
      prependOrderToLabel("GemOrPreciousStone", label),
    ),
    value: Reader.of("GemOrPreciousStone"),
  },
  labels: {
    name: translateR("Name"),
    color: translateR("Color"),
    cost: renderCostLabel("GemOrPreciousStone"),
  },
  values: {
    name: Reader.of(name + parensIf(instanceTranslation?.secondary_name)),
    color: Reader.of(instanceTranslation?.color ?? "—"),
    cost: renderCost(instance.cost),
  },
  additionalInformation: [
    {
      label: translateR("Note"),
      id: "note",
      value: renderNote(undefined, undefined, undefined, undefined, instanceTranslation?.note),
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
  "Race" | "Culture" | "Profession" | "BlessedTradition" | "MagicalTradition" | "Armor"
>

const createSimpleTableEntry = <R extends { [K in SimpleTableEntryColumns]?: null }>(
  baseProperties: BaseProperties,
  name: string,
  entityName: Exclude<EquipmentIdentifier["kind"], "Weapon" | "Armor">,
  useKeys: R,
  instance: {
    weight?: Weight | JewelryMaterialDifference<Weight>
    structure_points?: StructurePoints
    cost?: Cost | BookCost | JewelryMaterialDifference<number> | AnimalFeedCost
    restrictedTo?: RestrictedTo
    complexity?: ArmorComplexity | Complexity
    associatedTraditions?: AssociatedTradition[]
  },
  instanceTranslation: BaseItemTranslation | undefined,
): GenEquipmentTableEntry<Extract<keyof R, SimpleTableEntryColumns>, SimpleTableEnv> => ({
  ...baseProperties,
  category: {
    label: categoryTranslationMap[entityName],
    sortingValue: categoryTranslationMap[entityName].map(label =>
      prependOrderToLabel(entityName, label),
    ),
    value: Reader.of(entityName),
  },
  labels: omitKeys(
    {
      name: translateR("Name"),
      weight: renderWeightLabel(entityName),
      structurePoints: translateR("Structure Points"),
      cost: renderCostLabel(entityName),
      complexity: translateR("Complexity"),
    },
    ...allSimpleKeys.filter(key => !(key in useKeys)),
  ) as WrapInNestedReaders<
    SimpleTableEnv,
    Record<Extract<keyof R, SimpleTableEntryColumns>, string>
  >,
  values: omitKeys(
    {
      name: Reader.sequence([
        Reader.of(instanceTranslation?.secondary_name),
        entityName === "EquipmentOfBlessedOnes"
          ? renderAssociatedTraditions(instance.associatedTraditions)
          : Reader.of(undefined),
      ]).map(list => name + parensIf(ensureNonEmpty(list.filter(isNotNullish))?.join("; "))),
      structurePoints: renderStructurePoints(instance.structure_points),
      weight: renderWeightValue(instance.weight),
      cost: renderCost(instance.cost),
      complexity: renderComplexity(instance.complexity),
    },
    ...allSimpleKeys.filter(key => !(key in useKeys)),
  ) as WrapInNestedReaders<
    SimpleTableEnv,
    Record<Extract<keyof R, SimpleTableEntryColumns>, string>
  >,
  additionalInformation: [
    {
      label: translateR("Note"),
      id: "note",
      value: renderNote(
        undefined,
        undefined,
        instance.structure_points,
        instance.restrictedTo,
        instanceTranslation?.note,
      ),
    },
    {
      label: translateR("Rules"),
      id: "rules",
      value: Reader.of(instanceTranslation?.rules),
    },
  ],
})

const createSimpleTableEntryForCategory = <R extends { [K in SimpleTableEntryColumns]?: null }>(
  baseProperties: BaseProperties,
  name: string,
  categoryId: string,
  category: Omit<EquipmentCategory, "type"> & {
    type: Case<"Default", DefaultEquipmentCategoryTypeRules>
  },
  categoryTranslation: EquipmentCategoryTranslation,
  instance: Item,
  instanceTranslation: ItemTranslation,
): GenEquipmentTableEntry<Extract<keyof R, SimpleTableEntryColumns>, SimpleTableEnv> => ({
  ...baseProperties,
  category: {
    label: Reader.of(categoryTranslation.name),
    sortingValue: Reader.of(`${category.position.toFixed()}-${categoryTranslation.name}`),
    value: Reader.of(categoryId),
  },
  labels: omitKeys(
    {
      name: translateR("Name"),
      weight: translateR("Weight"),
      structurePoints: translateR("Structure Points"),
      cost: translateR("Cost"),
      complexity: translateR("Complexity"),
    },
    ...allSimpleKeys.filter(
      key => key !== "name" && key !== "cost" && category.type.Default[key].kind === "Prohibited",
    ),
  ) as WrapInNestedReaders<
    SimpleTableEnv,
    Record<Extract<keyof R, SimpleTableEntryColumns>, string>
  >,
  values: omitKeys(
    {
      name: Reader.of(name + parensIf(instanceTranslation.secondaryName)),
      structurePoints: renderStructurePoints(instance.structurePoints),
      weight: renderWeightValue(instance.weight),
      cost: renderCost(instance.cost),
      complexity: renderComplexity(instance.complexity),
    },
    ...allSimpleKeys.filter(
      key => key !== "name" && key !== "cost" && category.type.Default[key].kind === "Prohibited",
    ),
  ) as WrapInNestedReaders<
    SimpleTableEnv,
    Record<Extract<keyof R, SimpleTableEntryColumns>, string>
  >,
  additionalInformation: [
    {
      label: translateR("Note"),
      id: "note",
      value: renderNote(
        undefined,
        undefined,
        instance.structurePoints,
        instance.restrictedTo,
        instanceTranslation.note,
      ),
    },
    {
      label: translateR("Rules"),
      id: "rules",
      value: Reader.of(instanceTranslation.rules),
    },
  ],
})

type EquipmentEnv = StdEnv<
  "f" | "fn" | "t" | "tm" | "lj" | "lc" | "ma" | "x" | "ibi" | "rts",
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
  | "Armor"
>

/**
 * Get a JSON representation of the rules text for equipment.
 */
export const getEquipmentEntityDescription = createEntityDescriptionCreator<
  Exclude<EquipmentIdentifier["kind"], "Elixir" | "Poison" | "ItemComponent">,
  EquipmentEnv
>((env, locale, entry) => {
  const { translate, translateMap } = locale

  const name = getEquipmentName(translate, translateMap, env.getInstanceById, entry)

  if (entry.entity === "Book") {
    const translation = translateMap(entry.content.translations)

    if (translation === undefined) {
      return undefined
    }

    const [library, other] = partition(
      entry.content.src,
      ref => ref.id === env.settings.extendedBookDescriptionPublication,
    )

    return [
      mapNullable(
        ensureNonEmpty(other),
        (): WrapInNestedReaders<EquipmentEnv, RawTabularEntityDescription<string>> => ({
          type: "tabular",
          category: {
            label: categoryTranslationMap.Book,
            sortingValue: categoryTranslationMap.Book.map(label =>
              prependOrderToLabel("Book", label),
            ),
            value: Reader.of("Book"),
          },
          title: name,
          labels: {
            name: translate("Name"),
            weight: translate("Weight"),
            structurePoints: translate("Structure Points"),
            cost: translate("Cost"),
            complexity: translate("Complexity"),
          },
          values: {
            name: Reader.of(
              translation.secondary_name !== undefined
                ? `${name}, ${translation.secondary_name}`
                : name,
            ),
            weight: renderWeightValue(entry.content.weight),
            structurePoints: renderStructurePoints(entry.content.structure_points),
            cost: renderCost(entry.content.cost),
            complexity: renderComplexity(entry.content.complexity),
          },
          additionalInformation: [
            {
              label: translate("Language/Script"),
              id: "languageAndScript",
              value: Reader.of(translation.languageAndScript),
            },
            translation.note === undefined
              ? undefined
              : {
                  label: translate("Note"),
                  id: "note",
                  value: translation.note,
                },
            entry.content.rules === undefined
              ? undefined
              : {
                  label: translate("Rules"),
                  id: "rules",
                  value: renderSimpleBookRules(entry.content.rules),
                },
          ],
          errata: translation.errata,
          references: entry.content.src,
        }),
      ),
      mapNullable(
        ensureNonEmpty(library),
        (references): WrapInNestedReaders<EquipmentEnv, RawTextEntityDescription> => ({
          title: name,
          className: "equipment",
          body: [
            {
              type: "definitionList",
              items: [
                {
                  label: translate("Name"),
                  value:
                    translation.secondary_name !== undefined
                      ? `${name}, ${translation.secondary_name}`
                      : name,
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
                translation.languageAndScript !== undefined
                  ? {
                      label: translate("Language/Script"),
                      value: translation.languageAndScript,
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
                  label: translate("Value"),
                  value: renderCost(cost).run(env),
                })),
                translation.note === undefined
                  ? undefined
                  : {
                      label: translate("Note"),
                      value: translation.note,
                    },
                entry.content.rules === undefined
                  ? undefined
                  : {
                      label: translate("Rules"),
                      value: renderBookRules(entry.content.rules),
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
          references,
        }),
      ),
    ].filter(isNotNullish)
  }

  const translation =
    entry.entity === "ClothingPackage" ? undefined : translateMap(entry.content.translations)

  if (entry.entity !== "ClothingPackage" && translation === undefined) {
    return undefined
  }

  const baseItem: BaseItem =
    entry.entity === "AnimalCare"
      ? entry.content.type.kind === "General"
        ? { ...entry.content, ...entry.content.type.General }
        : { ...entry.content, ...entry.content.type.Feed }
      : entry.content
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
      ? Object.entries(combatValues.values.melee_uses ?? {}).map(([combatTechniqueId, use]) =>
          createMeleeWeaponTableEntry(
            baseProperties,
            name,
            entry.entity,
            baseItem,
            { ...combatTranslation, ...baseItemTranslation },
            combatTechniqueId,
            use,
            renderMeleeDamage,
          ),
        )
      : []),
    ...(baseItemTranslation !== undefined && combatValues?.type === "Weapon"
      ? Object.entries(combatValues.values.ranged_uses ?? {}).map(([combatTechniqueId, use]) =>
          createRangedWeaponTableEntry(
            baseProperties,
            name,
            entry.entity,
            baseItem,
            { ...combatTranslation, ...baseItemTranslation },
            combatTechniqueId,
            use,
            renderRangedDamage,
          ),
        )
      : []),
    ...(baseItemTranslation !== undefined && combatValues?.type === "Armor"
      ? [
          createArmorTableEntry(
            baseProperties,
            name,
            entry.entity,
            baseItem,
            { ...combatTranslation, ...baseItemTranslation },
            combatValues.values,
          ),
        ]
      : []),
    ...(entry.entity === "Weapon" || entry.entity === "Armor"
      ? []
      : entry.entity === "GemOrPreciousStone"
        ? [
            createGemOrPreciousStoneTableEntry(
              baseProperties,
              name,
              entry.content,
              translateMap(entry.content.translations),
            ),
          ]
        : entry.entity === "MusicalInstrument" ||
            entry.entity === "Animal" ||
            entry.entity === "AnimalCare" ||
            entry.entity === "Vehicle"
          ? [
              createSimpleTableEntry(
                baseProperties,
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
            ]
          : [
              createSimpleTableEntry(
                baseProperties,
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

/**
 * Get a JSON representation of the rules text for equipment.
 */
export const getItemEntityDescription = createEntityDescriptionCreator<
  "Item",
  StdEnv<
    "f" | "fn" | "t" | "tm" | "lj" | "lc" | "ma" | "x" | "ibi" | "rts",
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
    | "EquipmentCategory"
    | "Armor"
  >
>((env, locale, entry) => {
  const { translateMap } = locale

  const translation = translateMap(entry.content.translations)

  if (translation === undefined) {
    return undefined
  }

  const baseProperties = {
    type: "tabular" as const,
    title: translation.name,
    className: "equipment",
    errata: translation.errata,
    references: entry.content.src,
  }

  return entry.content.categories.flatMap(categoryId => {
    const category = env.getInstanceById("EquipmentCategory", categoryId)
    const categoryTranslation = translateMap(category?.translations)

    if (
      category === undefined ||
      categoryTranslation === undefined ||
      category.type.kind === "Special"
    ) {
      return []
    }

    return [
      ...(category.type.Default.combatValues.isWeaponAllowed
        ? [
            ...Object.entries(entry.content.meleeUses ?? {}).map(([combatTechniqueId, use]) =>
              createMeleeWeaponTableEntry(
                baseProperties,
                translation.name,
                "Weapon",
                entry.content,
                translation,
                combatTechniqueId,
                use,
                renderMeleeDamage,
              ),
            ),
            ...Object.entries(entry.content.rangedUses ?? {}).map(([combatTechniqueId, use]) =>
              createRangedWeaponTableEntry(
                baseProperties,
                translation.name,
                "Weapon",
                entry.content,
                translation,
                combatTechniqueId,
                use,
                renderRangedDamage,
              ),
            ),
          ]
        : []),
      ...(category.type.Default.combatValues.isArmorAllowed && entry.content.armorUse
        ? [
            createArmorTableEntry(
              baseProperties,
              translation.name,
              "Armor",
              entry.content,
              translation,
              entry.content.armorUse,
            ),
          ]
        : []),
      ...(!category.type.Default.combatValues.isWeaponAllowed &&
      !category.type.Default.combatValues.isArmorAllowed
        ? [
            createSimpleTableEntryForCategory(
              baseProperties,
              translation.name,
              categoryId,
              { ...category, type: category.type },
              categoryTranslation,
              entry.content,
              translation,
            ),
          ]
        : []),
    ]
  })
})
