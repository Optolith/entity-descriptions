import { stripInlineMarkdown } from "@elyukai/markdown/render/strip"
import { isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { count } from "@elyukai/utils/array/reductions"
import { deepEqual } from "@elyukai/utils/equality"
import { constant, on } from "@elyukai/utils/function"
import { isNotNullish } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import type { ResolvedSelectOption } from "@optolith/database-schema/cache"
import type {
  ActivatableIdentifier,
  AdvancedSpecialAbility,
  AdvancedSpecialAbilityRestrictedOptionIdentifier,
  AdvantageDisadvantagePrerequisites,
  AdventurePointsValue,
  ApplicableAllCombatTechniquesRestriction,
  ApplicableCloseCombatTechniquesRestriction,
  ApplicableCombatTechniques,
  ApplicableRangedCombatTechniquesRestriction,
  ApplicableSpecificCombatTechniquesRestriction,
  ArcaneEnergyCost,
  Aspect_ID,
  BindingCost,
  BlessedTraditionTranslation,
  CombatRelatedSpecialAbilityIdentifier,
  CombatTechniqueIdentifier,
  DaggerRitualCost,
  EnchantmentCost,
  Errata,
  FavoredCombatTechniques,
  FavoredSkillsSelection,
  GeneralPrerequisites,
  LifePointsCost,
  MagicalSignCost,
  MagicalTraditionTranslation,
  Penalty,
  PenaltyByAttackReplacement,
  PrimaryAttribute,
  PropertyDeclaration,
  PublicationRefs,
  RatedIdentifier,
  RestrictedBlessings,
  SelectOptions,
  Skill_ID,
  SpecialRule,
  Volume,
} from "@optolith/database-schema/gen"
import { numAsc } from "@optolith/helpers/compare"
import { sign } from "@optolith/helpers/math"
import { mapNullable, mapNullableDefault } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Case, fromUniformCase } from "tsondb/schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetAllInstances, GetInstanceById } from "../helpers/getTypes.js"
import type { LocaleCompare, LocaleEnvironment, LocaleJoin } from "../helpers/locale.js"
import type { Format, Translate, TranslateMap } from "../helpers/translate.js"
import type {
  GetAllResolvedNewSkillApplications,
  GetAllResolvedSelectOptions,
  GetAllResolvedSkillUses,
  RawDefinitionListEntityDescriptionSectionItem,
  TableEntityDescriptionSection,
} from "../index.js"
import { renderActivatableNameComponents } from "./partial/activatableNameChunks.js"
import { renderAdventurePointsValue } from "./partial/adventurePointsValue.js"
import { renderResponsiveMap } from "./partial/map.js"
import { attributedName } from "./partial/markdown.js"
import { additionFormatter } from "./partial/mathOperation.js"
import {
  printAdvantageDisadvantagePrerequisites,
  printGeneralPrerequisites,
} from "./partial/prerequisites/index.js"
import {
  printActivatableName,
  type GetResolvedSelectOptionById,
} from "./partial/prerequisites/single/activatable.js"
import { renderStandaloneCostMap } from "./partial/rated/activatable/cost.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import {
  attributedNameR,
  localeSortR,
  translateR,
  type EnvMap,
  type StdEnv,
  type StdReader,
} from "./partial/reader.js"
import {
  getResponsiveText,
  getResponsiveTextOptional,
  ResponsiveTextSize,
} from "./partial/responsiveText.js"
import { formatTimeSpan } from "./partial/units/timeSpan.js"
import { MISSING_VALUE } from "./partial/unknown.js"

type StyleSpecialAbilityKind =
  | "SkillStyleSpecialAbility"
  | "CombatStyleSpecialAbility"
  | "MagicStyleSpecialAbility"
  | "LiturgicalStyleSpecialAbility"

const isStyleSpecialAbilityKind = (
  value: ActivatableIdentifier["kind"],
): value is StyleSpecialAbilityKind =>
  value === "SkillStyleSpecialAbility" ||
  value === "CombatStyleSpecialAbility" ||
  value === "MagicStyleSpecialAbility" ||
  value === "LiturgicalStyleSpecialAbility"

type AdvancedSpecialAbilityKind =
  | "AdvancedSkillSpecialAbility"
  | "AdvancedCombatSpecialAbility"
  | "AdvancedMagicalSpecialAbility"
  | "AdvancedKarmaSpecialAbility"

const isAdvancedSpecialAbilityKind = (value: string): value is AdvancedSpecialAbilityKind =>
  value === "AdvancedSkillSpecialAbility" ||
  value === "AdvancedCombatSpecialAbility" ||
  value === "AdvancedMagicalSpecialAbility" ||
  value === "AdvancedKarmaSpecialAbility"

type AdvancedIdentifierSpecialAbility = string | Case<AdvancedSpecialAbilityKind, string>

/**
 * The base fields for a special ability entity in the database.
 */
export type BaseActivatable = {
  levels?: number
  maximum?: number
  select_options?: SelectOptions
  usage_type?: Case<"Passive" | "Active" | "BasicManeuver" | "SpecialManeuver">
  advanced?: AdvancedSpecialAbility<AdvancedIdentifierSpecialAbility>[]
  penalty?: Penalty
  combat_techniques?: ApplicableCombatTechniques
  volume?: Volume
  cost?: EnchantmentCost | DaggerRitualCost | MagicalSignCost | number
  property?: PropertyDeclaration
  aspect?: Aspect_ID
  prerequisites?: AdvantageDisadvantagePrerequisites | GeneralPrerequisites
  ap_value: AdventurePointsValue | number
  translations: {
    [locale: string]: BaseActivatableTranslation
  }
  src: PublicationRefs
}

/**
 * The base translation fields for a special ability.
 */
export type BaseActivatableTranslation = {
  name: string
  name_in_library?: string
  rules?: string
  range?: string
  effect?: string
  special_rules?: SpecialRule[]
  protective_circle?: string
  warding_circle?: string
  ap_value?: string
  ap_value_append?: string
  errata?: Errata
}

const renderPropertyValue = (
  getInstanceById: GetInstanceById<"Property">,
  translate: Translate,
  translateMap: TranslateMap,
  propertyDecl: PropertyDeclaration,
): string => {
  switch (propertyDecl.kind) {
    case "DependingOnSelection":
      return translate("As chosen")
    case "Fixed":
      return (
        translateMap(getInstanceById("Property", propertyDecl.Fixed)?.translations)?.name ??
        MISSING_VALUE
      )
    default:
      return assertExhaustive(propertyDecl)
  }
}

const renderPenaltyByAttackLabel = (
  translate: Translate,
  penaltyByAttackReplacement: PenaltyByAttackReplacement | undefined,
  ord: number,
) => {
  if (penaltyByAttackReplacement === undefined) {
    return translate(".input {$ord :number} {{{$ord}. attack}}", { ord })
  }

  // switch (penaltyByAttackReplacement.kind) {
  //   case "Throw":
  return translate(".input {$ord :number} {{{$ord}. throw}}", { ord })
  //   default:
  //     return assertExhaustive(penaltyByAttackReplacement)
  // }
}

const renderPenaltyValue = (
  getInstanceById: GetInstanceById<CombatRelatedSpecialAbilityIdentifier["kind"]>,
  translate: Translate,
  translateMap: TranslateMap,
  name: string,
  penalty: Penalty,
): string => {
  switch (penalty.kind) {
    case "Single":
      return (
        sign(penalty.Single.value) +
        (penalty.Single.applies_to_parry === true ? ` (${translate("for parry")})` : "")
      )
    case "ByHandedness": {
      const appendParry =
        penalty.ByHandedness.applies_to_parry === true ? `; ${translate("for parry")}` : ""

      return `${sign(penalty.ByHandedness.one_handed)} (${
        translate("one-handed weapon") + appendParry
      }); ${sign(penalty.ByHandedness.two_handed)} (${
        translate("two-handed weapon") + appendParry
      })`
    }
    case "ByActivation": {
      return `${sign(penalty.ByActivation.active)}/${sign(penalty.ByActivation.inactive)} (${[
        penalty.ByActivation.applies_to_parry === true ? translate("for parry") : undefined,
        translate("for secondary fighters with/without special ability {$name}", { name }),
      ]
        .filter(isNotNullish)
        .join("; ")})`
    }
    case "Selection":
      switch (penalty.Selection.options.kind) {
        case "Specific":
          return penalty.Selection.options.Specific.list.map(option => sign(option.value)).join("/")
        case "Range":
          return translate("{$start} to {$end}", {
            start: sign(penalty.Selection.options.Range.minimum),
            end: sign(penalty.Selection.options.Range.maximum),
          })
        default:
          return assertExhaustive(penalty.Selection.options)
      }
    case "ByLevel": {
      const external = penalty.ByLevel.external?.id

      const main = penalty.ByLevel.levels
        .map(penaltyByLevel => sign(penaltyByLevel.value))
        .join("/")

      if (external === undefined) {
        return main
      }

      const externalName =
        translateMap(getInstanceById(external.kind, fromUniformCase(external))?.translations)
          ?.name ?? MISSING_VALUE

      return `${main} (${translate("depending on the level of the special ability {$name}", {
        name: externalName,
      })})`
    }
    case "ByAttack": {
      const offset = penalty.ByAttack.initial_order ?? 1
      return penalty.ByAttack.list
        .map(
          (penaltyByAttack, index) =>
            `${sign(penaltyByAttack.value)} (${renderPenaltyByAttackLabel(
              translate,
              penalty.ByAttack.attack_replacement,
              index + offset,
            )})`,
        )
        .join("; ")
    }
    case "DependsOnHitZone":
      return translate("Depends on zone")
    default:
      return assertExhaustive(penalty)
  }
}

// type RestrictionStyle = "Enclosed" | "Phrase" | "Subclause"

// const renderApplicableCombatTechniquesRestrictions = (
//   items: [string, style: RestrictionStyle][],
// ): string => {
//   const dict = Dictionary.groupBy(items, item => item[1])
//   return ` ${[
//     dict
//       .get("Phrase")
//       ?.map(([phrase]) => phrase)
//       .join(" "),
//     dict
//       .get("Subclause")
//       ?.map(
//         ([subclause], index, arr) =>
//           subclause.trim() +
//           (subclause.startsWith(",") && index < arr.length - 1 ? ", " : " "),
//       )
//       .join(""),
//     mapNullable(
//       dict
//         .get("Enclosed")
//         ?.map(([enclosed]) => enclosed)
//         .join(", "),
//       enclosed => `(${enclosed})`,
//     ),
//   ]
//     .filter(isNotNullish)
//     .join(" ")}`
// }

const wrapInParens = (args: (string | undefined)[], append = ""): string => {
  const filteredArgs = args.filter(isNotNullish)
  if (filteredArgs.length === 0) {
    return ""
  }
  return ` (${filteredArgs.join(", ") + append})`
}

const addSpaceIfNoCommaAtStart = (str: string): string => (str.startsWith(",") ? str : ` ${str}`)

const renderApplicableCombatTechniquesRestriction = <
  T extends
    | ApplicableAllCombatTechniquesRestriction
    | ApplicableCloseCombatTechniquesRestriction
    | ApplicableRangedCombatTechniquesRestriction
    | ApplicableSpecificCombatTechniquesRestriction,
>(
  getInstanceById: GetInstanceById<"CloseCombatTechnique" | "RangedCombatTechnique" | "Race">,
  locale: LocaleEnvironment,
  main: string,
  restriction: T,
  translation: BaseActivatableTranslation,
  weapons: string | undefined,
  normalizeExcludedId: T extends { kind: "ExcludeCombatTechniques" }
    ? (id: T["ExcludeCombatTechniques"]["list"][number]) => CombatTechniqueIdentifier
    : undefined,
): string => {
  switch (restriction.kind) {
    case "Improvised":
      return main + wrapInParens([locale.translate("only improvised weapons"), weapons])
    case "PointedBlade":
      return main + wrapInParens([locale.translate("weapon must have a pointed blade"), weapons])
    case "Mount":
      if (weapons === undefined) {
        return `${main} ${locale.translate("while mounted")}`
      } else {
        return main + wrapInParens([weapons, locale.translate("while mounted")])
      }
    case "Race": {
      const raceName = attributedName(
        locale.translateMap,
        getInstanceById,
        "applicable-combat-technique",
        "Race",
        restriction.Race,
      )

      return (
        main +
        wrapInParens([
          // originally "while {$racial} weapon", but different to parameterize without inflection support
          locale.translate("while weapon of race {$race}", {
            race: raceName ?? MISSING_VALUE,
          }),
          weapons,
        ])
      )
    }
    case "ExcludeCombatTechniques":
      return (
        main +
        wrapInParens([
          locale.translate("except {$list}", {
            list: locale.join(
              restriction.ExcludeCombatTechniques.list
                .map(id => {
                  const normalizedId = normalizeExcludedId?.(
                    id as CombatTechniqueIdentifier & string,
                  )
                  return normalizedId !== undefined
                    ? (attributedName(
                        locale.translateMap,
                        getInstanceById,
                        "applicable-combat-technique",
                        normalizedId,
                      ) ?? MISSING_VALUE)
                    : MISSING_VALUE
                })
                .toSorted(locale.compare),
              "conjunction",
            ),
          }),
          weapons,
        ])
      )
    case "HasParry":
      return `${main} ${locale.translate("with parry") + wrapInParens([weapons])}`
    case "OneHanded":
      return (
        main +
        addSpaceIfNoCommaAtStart(
          locale.translate("that may be performed with one-handed weapons"),
        ) +
        wrapInParens([weapons])
      )
    case "TwoHanded":
      return locale.translate("All Two-Handed Weapons") + wrapInParens([weapons])
    case "ParryingWeapon":
      return locale.translate("All Parrying Weapons") + wrapInParens([weapons])
    case "Level": {
      const nameWithLevel = `${translation.name_in_library ?? translation.name} ${romanize(restriction.Level.level)}`
      return (
        main + wrapInParens([locale.translate("only {$nameWithLevel}", { nameWithLevel }), weapons])
      )
    }
    case "OneBluntSide":
      return (
        main + wrapInParens([locale.translate("only those with at least one blunt side"), weapons])
      )
    default:
      return assertExhaustive(restriction)
  }
}

const renderApplicableCombatTechniquesValue = (
  getInstanceById: GetInstanceById<
    "CloseCombatTechnique" | "RangedCombatTechnique" | "Race" | "Weapon"
  >,
  locale: LocaleEnvironment,
  translation: BaseActivatableTranslation,
  applicableCombatTechniques: ApplicableCombatTechniques,
): string => {
  switch (applicableCombatTechniques.kind) {
    case "None":
      return "—"
    case "DependingOnCombatStyle":
      return locale.translate(
        "Depends on combat style; both combat styles can be used only for their corresponding combat techniques",
      )
    case "All": {
      const main = locale.translate("All")
      const mainWithRestriction =
        applicableCombatTechniques.All.restriction === undefined
          ? main
          : renderApplicableCombatTechniquesRestriction(
              getInstanceById,
              locale,
              main,
              applicableCombatTechniques.All.restriction,
              translation,
              undefined,
              id => id,
            )
      return mainWithRestriction
    }
    case "AllClose": {
      const main = locale.translate("All Close Combat Techniques")
      const mainWithRestriction =
        applicableCombatTechniques.AllClose.restriction === undefined
          ? main
          : renderApplicableCombatTechniquesRestriction(
              getInstanceById,
              locale,
              main,
              applicableCombatTechniques.AllClose.restriction,
              translation,
              undefined,
              id => Case("CloseCombatTechnique", id),
            )
      return mainWithRestriction
    }
    case "AllRanged": {
      const main = locale.translate("All Ranged Combat Techniques")
      const mainWithRestriction =
        applicableCombatTechniques.AllRanged.restriction === undefined
          ? main
          : renderApplicableCombatTechniquesRestriction(
              getInstanceById,
              locale,
              main,
              applicableCombatTechniques.AllRanged.restriction,
              translation,
              undefined,
              id => Case("RangedCombatTechnique", id),
            )
      return mainWithRestriction
    }
    case "Specific": {
      return applicableCombatTechniques.Specific.list
        .map(specific => {
          const main =
            attributedName(
              locale.translateMap,
              getInstanceById,
              "applicable-combat-technique",
              specific.id,
            ) ?? MISSING_VALUE

          if (specific.translation !== undefined) {
            const specificTranslation = locale.translateMap(specific.translation)
            if (specificTranslation) {
              return main + wrapInParens([specificTranslation.restriction])
            }
          }

          const weapons =
            specific.weapons === undefined
              ? undefined
              : locale.translate("only {$weapons}", {
                  weapons: locale.join(
                    specific.weapons
                      .map(
                        weapon =>
                          attributedName(
                            locale.translateMap,
                            getInstanceById,
                            "applicable-combat-technique",
                            "Weapon",
                            weapon,
                          ) ?? MISSING_VALUE,
                      )
                      .toSorted(locale.compare),
                    "conjunction",
                  ),
                })

          const mainWithRestriction =
            specific.restriction === undefined
              ? main + wrapInParens([weapons])
              : renderApplicableCombatTechniquesRestriction(
                  getInstanceById,
                  locale,
                  main,
                  specific.restriction,
                  translation,
                  weapons,
                  undefined,
                )

          return mainWithRestriction
        })
        .toSorted(locale.compare)
        .join(", ")
    }
    default:
      return assertExhaustive(applicableCombatTechniques)
  }
}

const renderVolumeValue = (
  translate: Translate,
  translateMap: TranslateMap,
  getAllResolvedSelectOptions: () => ResolvedSelectOption[],
  responsiveTextSize: ResponsiveTextSize,
  volume: Volume,
): string => {
  switch (volume.kind) {
    case "Fixed":
      return translate(".input {$points :number} {{{$points} points}}", {
        points: volume.Fixed.points,
      })
    case "PerLevel":
      return volume.PerLevel.points === 0
        ? translate(".input {$points :number} {{{$points} points}}", {
            points: 0,
          })
        : translate(".input {$points :number} {{{$points} points per level}}", {
            points: volume.PerLevel.points,
          })
    case "ByLevel":
      return translate("{$points} points for levels {$levels}", {
        points: volume.ByLevel.list.map(item => item.points).join("/"),
        levels: volume.ByLevel.list.map((_, index) => romanize(index + 1)).join("/"),
      })
    case "Map":
      return renderResponsiveMap(
        volume.Map,
        option => Reader.of(option.points),
        values => translateR("{$points} points", { points: values }),
      ).run({
        translate,
        translateMap,
        responsiveTextSize,
      })
    case "DerivedFromSelection": {
      const groups = Map.groupBy(
        getAllResolvedSelectOptions(),
        option => option.content.volume ?? volume.DerivedFromSelection.fallback,
      )
        .entries()
        .toArray()
        .toSorted(on(group => group[0], numAsc))

      const separator = groups.some(group => group[1].length > 1) ? " / " : "/"

      return `${translate("{$points} points", {
        points: groups.map(group => group[0]).join("/"),
      })} ${translate("for")} ${groups
        .map(group =>
          group[1]
            .map(groupItem => translateMap(groupItem.content.translations)?.name ?? MISSING_VALUE)
            .join(", "),
        )
        .join(separator)}`
    }
    default:
      return assertExhaustive(volume)
  }
}

const renderArcaneEnergyCost = (
  translate: Translate,
  translateMap: TranslateMap,
  format: Format,
  localeJoin: LocaleJoin,
  responsiveTextSize: ResponsiveTextSize,
  levels: number | undefined,
  cost: ArcaneEnergyCost | MagicalSignCost,
): string => {
  switch (cost.kind) {
    case "Fixed": {
      const translationWrapper: (value: number) => string =
        cost.Fixed.is_permanent === true
          ? value =>
              translate(".input {$value :number} {{{$value} permanent AE}}", {
                value,
              })
          : value => translate("{$value} AE", { value })

      const { interval } = cost.Fixed

      const wrapInInterval: (value: string) => string =
        interval === undefined
          ? str => str
          : str =>
              translate("{$cost} per {$interval}", {
                cost: str,
                interval: formatTimeSpan(
                  translate,
                  translateMap,
                  format,
                  responsiveTextSize,
                  interval.unit,
                  interval.value,
                  true,
                ),
              })

      const wrapInPerLevel: (prev: (value: number) => string) => string = (() => {
        if (cost.Fixed.per_level === undefined) {
          return prev => prev(cost.Fixed.value)
        }

        switch (cost.Fixed.per_level.kind) {
          case "Compressed":
            return prev => translate("{$cost} per level", { cost: prev(cost.Fixed.value) })
          case "Verbose":
            return prev =>
              Array.from({ length: levels ?? 1 }, (_, index) =>
                translate("{$cost} for level {$level}", {
                  cost: prev(cost.Fixed.value),
                  level: romanize(index + 1),
                }),
              ).join("; ")
          default:
            return assertExhaustive(cost.Fixed.per_level)
        }
      })()

      const noteInParens = parensIf(
        mapNullable(translateMap(cost.Fixed.translations)?.note, note =>
          getResponsiveTextOptional(note, responsiveTextSize),
        ),
      )

      return wrapInPerLevel(value => wrapInInterval(translationWrapper(value))) + noteInParens
    }
    case "Constant":
      return (
        translate("{$value} AE", { value: cost.Constant.value }) +
        (cost.Constant.permanent_value === undefined
          ? ""
          : translate(", {$value} of which are permanent", {
              value: cost.Constant.permanent_value,
            }))
      )
    case "PerCountable": {
      const translation = translateMap(cost.PerCountable.translations)

      return (
        (cost.PerCountable.base_value === undefined
          ? ""
          : `${translate("{$value} AE", { value: cost.PerCountable.base_value })} + `) +
        translate("{$cost} per {$countable}", {
          cost: translate("{$value} AE", { value: cost.PerCountable.value }),
          countable: getResponsiveText(translation?.per, responsiveTextSize),
        }) +
        parensIf(
          mapNullable(translation?.note, note =>
            getResponsiveTextOptional(note, responsiveTextSize),
          ),
        )
      )
    }
    case "Interval":
      return translate("{$cost} per {$interval}", {
        cost: translate("{$value} AE", { value: cost.Interval.value }),
        interval: formatTimeSpan(
          translate,
          translateMap,
          format,
          responsiveTextSize,
          cost.Interval.interval.unit,
          cost.Interval.interval.value,
          true,
        ),
      })
    case "ActivationAndHalfInterval":
      return additionFormatter(
        translate("{$value} AE", {
          value: cost.ActivationAndHalfInterval.value,
        }) + parensIf(translate("activation")),
        translate("{$cost} per {$interval}", {
          cost: translate("{$value} AE", {
            value: Math.round(cost.ActivationAndHalfInterval.value / 2),
          }),
          interval: formatTimeSpan(
            translate,
            translateMap,
            format,
            responsiveTextSize,
            cost.ActivationAndHalfInterval.interval.unit,
            cost.ActivationAndHalfInterval.interval.value,
            true,
          ),
        }),
      )
    case "Indefinite":
      return (
        (mapNullable(translateMap(cost.Indefinite.translations)?.description, description =>
          getResponsiveText(description, responsiveTextSize),
        ) ?? MISSING_VALUE) +
        mapNullableDefault(
          cost.Indefinite.modifier,
          modifier => ` + ${translate("{$value} AE", { value: modifier.value })}`,
          "",
        )
      )
    case "Disjunction":
      return translate("{$value} AE", {
        value: localeJoin(
          cost.Disjunction.options.map(
            option =>
              option.value.toFixed() +
              mapNullableDefault(
                translateMap(option.translations)?.note,
                note => parensIf(getResponsiveTextOptional(note, responsiveTextSize)),
                "",
              ),
          ),
          "disjunction",
        ),
      })
    case "Map":
      return renderStandaloneCostMap(cost.Map).run({
        translate,
        translateMap,
        responsiveTextSize,
        energyUnit: "ArcaneEnergy",
      })
    case "Variable":
      return translate("Variable")
    case "ByLevel":
      switch (cost.ByLevel.style.kind) {
        case "Compressed":
          return translate("{$cost} for level {$level}", {
            cost: translate("{$value} AE", {
              value: cost.ByLevel.levels.map(level => level.value).join("/"),
            }),
            level: Array.from({ length: cost.ByLevel.levels.length }, (_, index) =>
              romanize(index + 1),
            ).join("/"),
          })
        case "Verbose":
          return cost.ByLevel.levels
            .map((level, index) =>
              translate("{$cost} for level {$level}", {
                cost: translate("{$value} AE", { value: level.value }),
                level: romanize(index + 1),
              }),
            )
            .join("; ")
        default:
          return assertExhaustive(cost.ByLevel.style)
      }

    default:
      return assertExhaustive(cost)
  }
}

const renderBindingCost = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  getAllResolvedSelectOptions: () => ResolvedSelectOption[],
  responsiveTextSize: ResponsiveTextSize,
  cost: BindingCost,
): string => {
  switch (cost.kind) {
    case "Fixed":
      return translate(".input {$value :number} {{{$value} permanent AE}}", {
        value: cost.Fixed.permanent_value,
      })
    case "PerLevel":
      return translate("{$cost} per level", {
        cost: translate(".input {$value :number} {{{$value} permanent AE}}", {
          value: cost.PerLevel.permanent_value,
        }),
      })
    case "Map":
      return renderResponsiveMap(
        cost.Map,
        option => Reader.of(option.permanentValue),
        values => translateR("{$value} permanent AE", { value: values }),
      ).run({
        translate,
        translateMap,
        responsiveTextSize,
      })
    case "DerivedFromSelection": {
      const groups = Map.groupBy(
        getAllResolvedSelectOptions(),
        option => option.content.binding_cost ?? cost.DerivedFromSelection.fallback,
      )
        .entries()
        .toArray()
        .toSorted(on(group => group[0], numAsc))

      const separator = groups.some(group => group[1].length > 1) ? " / " : "/"

      return `${translate("{$value} permanent AE", {
        value: groups.map(group => group[0]).join("/"),
      })} ${translate("for")} ${groups
        .map(group =>
          group[1]
            .map(groupItem => translateMap(groupItem.content.translations)?.name ?? MISSING_VALUE)
            .toSorted(localeCompare)
            .join(", "),
        )
        .join(separator)}`
    }
    default:
      return assertExhaustive(cost)
  }
}

const renderLifePointsCost = (translate: Translate, cost: LifePointsCost | undefined): string =>
  cost === undefined
    ? ""
    : // eslint-disable-next-line no-irregular-whitespace
      ` (+ ${translate("{$value} LP", { value: cost.Fixed.value })})`

const renderCost = (
  translate: Translate,
  translateMap: TranslateMap,
  format: Format,
  localeJoin: LocaleJoin,
  localeCompare: LocaleCompare,
  getAllResolvedSelectOptions: () => ResolvedSelectOption[],
  responsiveTextSize: ResponsiveTextSize,
  levels: number | undefined,
  cost: EnchantmentCost | DaggerRitualCost | MagicalSignCost | number,
): RawDefinitionListEntityDescriptionSectionItem => {
  if (typeof cost === "number") {
    return {
      label: translate("AE Cost"),
      value: translate("{$value} AE", { value: cost }),
    }
  }

  switch (cost.kind) {
    case "ArcaneEnergyCost":
    case "Constant":
    case "Map":
      return {
        label: translate("AE Cost"),
        value:
          cost.kind === "ArcaneEnergyCost"
            ? "ae_cost" in cost.ArcaneEnergyCost
              ? renderArcaneEnergyCost(
                  translate,
                  translateMap,
                  format,
                  localeJoin,
                  responsiveTextSize,
                  levels,
                  cost.ArcaneEnergyCost.ae_cost,
                ) + renderLifePointsCost(translate, cost.ArcaneEnergyCost.lp_cost)
              : renderArcaneEnergyCost(
                  translate,
                  translateMap,
                  format,
                  localeJoin,
                  responsiveTextSize,
                  levels,
                  cost.ArcaneEnergyCost,
                )
            : renderArcaneEnergyCost(
                translate,
                translateMap,
                format,
                localeJoin,
                responsiveTextSize,
                levels,
                cost,
              ),
      }
    case "BindingCost":
      return {
        label: translate("Binding Cost"),
        value: renderBindingCost(
          translate,
          translateMap,
          localeCompare,
          getAllResolvedSelectOptions,
          responsiveTextSize,
          cost.BindingCost,
        ),
      }
    default:
      return assertExhaustive(cost)
  }
}

const renderAdvancedLabel = (
  translate: Translate,
  entityName:
    | "SkillStyleSpecialAbility"
    | "CombatStyleSpecialAbility"
    | "MagicStyleSpecialAbility"
    | "LiturgicalStyleSpecialAbility",
): string => {
  switch (entityName) {
    case "SkillStyleSpecialAbility":
      return translate("Advanced Skill Special Abilities")
    case "CombatStyleSpecialAbility":
      return translate("Advanced Combat Special Abilities")
    case "MagicStyleSpecialAbility":
      return translate("Advanced Magical Special Abilities")
    case "LiturgicalStyleSpecialAbility":
      return translate("Advanced Karma Special Abilities")
    default:
      return assertExhaustive(entityName)
  }
}

const normalizeId = (
  entityName: StyleSpecialAbilityKind,
  id: AdvancedIdentifierSpecialAbility,
): Case<AdvancedSpecialAbilityKind, string> => {
  if (typeof id === "string") {
    switch (entityName) {
      case "SkillStyleSpecialAbility":
        return Case("AdvancedSkillSpecialAbility", id)
      case "CombatStyleSpecialAbility":
        return Case("AdvancedCombatSpecialAbility", id)
      case "MagicStyleSpecialAbility":
        return Case("AdvancedMagicalSpecialAbility", id)
      case "LiturgicalStyleSpecialAbility":
        return Case("AdvancedKarmaSpecialAbility", id)
      default:
        return assertExhaustive(entityName)
    }
  } else {
    return id
  }
}

const renderAdvancedSpecialAbilityName = (
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  entityName: StyleSpecialAbilityKind,
  id: AdvancedIdentifierSpecialAbility,
  option?: AdvancedSpecialAbilityRestrictedOptionIdentifier[],
) => {
  const normalizedId = normalizeId(entityName, id)

  return `^[${
    mapNullable(
      printActivatableName(
        getInstanceById,
        translate,
        normalizedId,
        option,
        undefined,
        getResolvedSelectOptionById,
        false,
      ),
      name => renderActivatableNameComponents(translateMap, name, false),
    ) ?? MISSING_VALUE
  }](entity: "${normalizedId.kind}", instance: "${fromUniformCase(normalizedId)}", style: "normal")`
}

const renderAdvancedValue = (
  translate: Translate,
  translateMap: TranslateMap,
  localeJoin: LocaleJoin,
  getInstanceById: GetInstanceById<ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  entityName: StyleSpecialAbilityKind,
  advanced: AdvancedSpecialAbility<AdvancedIdentifierSpecialAbility>[],
) => {
  if (
    advanced.every(entry => entry.kind === "OneOf") &&
    isNotEmpty(advanced) &&
    advanced.every(entry => entry.OneOf.options.length === 3)
  ) {
    const optionsInAllEntries = advanced[0].OneOf.options.filter(option =>
      advanced.every(otherEntry =>
        otherEntry.OneOf.options.some(otherOption => deepEqual(option, otherOption)),
      ),
    )

    if (optionsInAllEntries.length === 2) {
      const uniqueOptions = advanced
        .map(entry =>
          entry.OneOf.options.find(option =>
            optionsInAllEntries.every(commonOption => !deepEqual(option, commonOption)),
          ),
        )
        .filter(isNotNullish) // should not do anything, just for type narrowing

      if (uniqueOptions.length === advanced.length) {
        const [first, second] = optionsInAllEntries.map(option =>
          renderAdvancedSpecialAbilityName(
            translate,
            translateMap,
            getInstanceById,
            getResolvedSelectOptionById,
            entityName,
            option,
          ),
        ) as [string, string]

        return [
          ...uniqueOptions.map(option =>
            renderAdvancedSpecialAbilityName(
              translate,
              translateMap,
              getInstanceById,
              getResolvedSelectOptionById,
              entityName,
              option,
            ),
          ),
          translate(
            "one or two of these special abilities can alternatively be replaced by advanced special abilities {$first} and/or {$second}",
            { first, second },
          ),
        ].join(", ")
      }
    }
  }

  const derivedFromExternalOptionEntriesToGenerate = count(
    advanced,
    entry =>
      entry.kind === "DeriveFromExternalOption" &&
      entry.DeriveFromExternalOption.display_option === undefined,
  )

  const anyEntriesToGenerate = count(advanced, entry => entry.kind === "Any")

  const arr = [
    ...advanced.map((entry): string | undefined => {
      switch (entry.kind) {
        case "General":
          return renderAdvancedSpecialAbilityName(
            translate,
            translateMap,
            getInstanceById,
            getResolvedSelectOptionById,
            entityName,
            entry.General,
          )
        case "RestrictOptions":
          return renderAdvancedSpecialAbilityName(
            translate,
            translateMap,
            getInstanceById,
            getResolvedSelectOptionById,
            entityName,
            entry.RestrictOptions.id,
            entry.RestrictOptions.option,
          )
        case "OneOf": {
          if (entry.OneOf.display_option !== undefined) {
            switch (entry.OneOf.display_option.kind) {
              case "Hide":
                return undefined
              case "ReplaceWith":
                return (
                  translateMap(entry.OneOf.display_option.ReplaceWith.translations)?.replacement ??
                  MISSING_VALUE
                )
              default:
                return assertExhaustive(entry.OneOf.display_option)
            }
          }

          return localeJoin(
            entry.OneOf.options.map(option =>
              renderAdvancedSpecialAbilityName(
                translate,
                translateMap,
                getInstanceById,
                getResolvedSelectOptionById,
                entityName,
                option,
              ),
            ),
            "disjunction",
          )
        }
        case "DeriveFromExternalOption":
          if (entry.DeriveFromExternalOption.display_option !== undefined) {
            switch (entry.DeriveFromExternalOption.display_option.kind) {
              case "Hide":
                return undefined
              case "ReplaceWith":
                return (
                  translateMap(
                    entry.DeriveFromExternalOption.display_option.ReplaceWith.translations,
                  )?.replacement ?? MISSING_VALUE
                )
              default:
                return assertExhaustive(entry.DeriveFromExternalOption.display_option)
            }
          }

          return undefined
        case "Any":
          return undefined
        default:
          return assertExhaustive(entry)
      }
    }),
    derivedFromExternalOptionEntriesToGenerate === 0
      ? undefined
      : translate(".input {$count :number} {{{$count} more by primary patron}}", {
          count: derivedFromExternalOptionEntriesToGenerate,
        }),
    anyEntriesToGenerate === 0
      ? undefined
      : translate(
          ".input {$count :number} {{Here you can select {$count} fitting special abilities.}}",
          {
            count: anyEntriesToGenerate,
          },
        ),
  ].filter(isNotNullish)

  return arr.some(item => stripInlineMarkdown(item).includes(",")) ? arr.join("; ") : arr.join(", ")
}

const renderDeriveFromExternalOptionTable = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  getInstanceById: GetInstanceById<"Patron" | ActivatableIdentifier["kind"] | "Aspect">,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  entityName: ActivatableIdentifier["kind"],
  advanced: AdvancedSpecialAbility<AdvancedIdentifierSpecialAbility>[],
): TableEntityDescriptionSection | undefined => {
  if (!isStyleSpecialAbilityKind(entityName)) {
    return undefined
  }

  const derivedFromExternalOptionEntriesToGenerate = advanced.filter(
    (
      entry,
    ): entry is Extract<
      AdvancedSpecialAbility<AdvancedIdentifierSpecialAbility>,
      { kind: "DeriveFromExternalOption" }
    > =>
      entry.kind === "DeriveFromExternalOption" &&
      entry.DeriveFromExternalOption.display_option === undefined,
  )

  if (derivedFromExternalOptionEntriesToGenerate.length === 0) {
    return undefined
  }

  const rows = Map.groupBy(
    derivedFromExternalOptionEntriesToGenerate.flatMap(entry =>
      entry.DeriveFromExternalOption.map.map(
        (option): [string, AdvancedIdentifierSpecialAbility] => [
          option.from_option,
          option.to_advanced,
        ],
      ),
    ),
    row => row[0],
  )
    .entries()
    .map(([option, list]): [string, string] => [
      translateMap(getInstanceById("Patron", option)?.translations)?.name ?? MISSING_VALUE,
      list
        .map(([, toAdvanced]) =>
          renderAdvancedSpecialAbilityName(
            translate,
            translateMap,
            getInstanceById,
            getResolvedSelectOptionById,
            entityName,
            toAdvanced,
          ),
        )
        .toSorted(localeCompare)
        .join(", "),
    ])
    .toArray()
    .toSorted(on(row => row[0], localeCompare))

  return {
    type: "table",
    header: [translate("Patron"), renderAdvancedLabel(translate, entityName)],
    rows,
  }
}

const renderTrailingAdvancedPrerequisitesNote = (
  translate: Translate,
  entityName: string,
): string | undefined => {
  if (isAdvancedSpecialAbilityKind(entityName)) {
    switch (entityName) {
      case "AdvancedCombatSpecialAbility":
        return translate("corresponding combat style special ability")
      case "AdvancedKarmaSpecialAbility":
        return translate("corresponding liturgical style special ability")
      case "AdvancedMagicalSpecialAbility":
        return translate("corresponding magic style special ability")
      case "AdvancedSkillSpecialAbility":
        return translate("corresponding skill style special ability")
      default:
        return assertExhaustive(entityName)
    }
  }

  return undefined
}

const renderFavoredCombatTechniques = (
  favoredCombatTechniques: FavoredCombatTechniques | undefined,
): StdReader<
  string[],
  "t" | "tm" | "ibi" | "lc",
  "CloseCombatTechnique" | "RangedCombatTechnique"
> => {
  if (favoredCombatTechniques === undefined) {
    return Reader.of([])
  }

  switch (favoredCombatTechniques.kind) {
    case "All":
      return translateR("All Combat Techniques").map(text => [text])
    case "AllClose":
      return translateR("All Close Combat Techniques").map(text => [text])
    case "AllUsedInHunting":
      return translateR("All Combat Techniques used in hunting").map(text => [text])
    case "Specific":
      return Reader.traverse(favoredCombatTechniques.Specific.list, id =>
        attributedNameR("favored-skills", id)
          .map(name => name ?? MISSING_VALUE)
          .thenW(name => translateR("Combat Technique {$name}", { name })),
      ).thenW(localeSortR)
    default:
      return assertExhaustive(favoredCombatTechniques)
  }
}

const renderFavoredSkillsBaseList = (combatTechniques: string[], favoredSkills: Skill_ID[]) =>
  Reader.traverse(favoredSkills, id =>
    attributedNameR("favored-skills", "Skill", id).map(name => name ?? MISSING_VALUE),
  )
    .thenW(localeSortR)
    .map(favoredSkillNames => combatTechniques.concat(favoredSkillNames).join(", "))

const renderFavoredSkillsSelection = (
  baseList: string,
  favoredSkillsSelection: FavoredSkillsSelection | undefined,
) =>
  favoredSkillsSelection === undefined
    ? Reader.of(baseList)
    : Reader.traverse(favoredSkillsSelection.options, id =>
        attributedNameR("favored-skills", "Skill", id),
      ).thenW(names =>
        translateR(
          ".input {$count :number} {{{$baseList}, and {$count} of your choice from the following list: {$selection}}}",
          {
            count: favoredSkillsSelection.number,
            baseList,
            selection: names.join(", "),
          },
        ),
      )

const getRestrictedBlessingsSpecialRuleLabelKey = (
  restrictedBlessings: "All" | RestrictedBlessings,
) => {
  if (restrictedBlessings === "All") {
    return "No Blessings"
  }

  switch (restrictedBlessings.kind) {
    case "Three":
      return "Restricted Blessings"
    case "Six":
      return "Strongly Restricted Blessings"
    default:
      return assertExhaustive(restrictedBlessings)
  }
}

const renderRestrictedBlessingsSpecialRule = (
  restrictedBlessings: "All" | RestrictedBlessings,
  nameOfPeopleWithThisTradition: string,
): StdReader<SpecialRule, "t" | "tm" | "ibi" | "lc" | "lj", "Blessing"> =>
  translateR(getRestrictedBlessingsSpecialRuleLabelKey(restrictedBlessings)).thenW(label =>
    restrictedBlessings === "All"
      ? translateR("{$nameOfBlessedOnes} cannot use blessings.", {
          nameOfBlessedOnes: nameOfPeopleWithThisTradition,
        }).map(text => ({
          label,
          text,
        }))
      : Reader.traverse(
          restrictedBlessings.kind === "Three"
            ? restrictedBlessings.Three
            : restrictedBlessings.Six,
          id =>
            attributedNameR("restricted-blessings", "Blessing", id).map(
              name => name ?? MISSING_VALUE,
            ),
        )
          .thenW(localeSortR)
          .thenW(list =>
            translateR("{$nameOfBlessedOnes} cannot use {$blessings :list type=disjunction}.", {
              nameOfBlessedOnes: nameOfPeopleWithThisTradition,
              blessings: list,
            }).map(text => ({
              label,
              text,
            })),
          ),
  )

const renderFavoredSkillsSpecialRule = (
  favoredCombatTechniques: FavoredCombatTechniques | undefined,
  favoredSkills: Skill_ID[],
  favoredSkillsSelection: FavoredSkillsSelection | undefined,
): StdReader<
  SpecialRule,
  "t" | "tm" | "ibi" | "lc",
  "Skill" | "CloseCombatTechnique" | "RangedCombatTechnique"
> =>
  translateR("Favored Skills").thenW(label =>
    renderFavoredCombatTechniques(favoredCombatTechniques)
      .thenW(favoredCombatTechniquesText =>
        renderFavoredSkillsBaseList(favoredCombatTechniquesText, favoredSkills),
      )
      .thenW(list => renderFavoredSkillsSelection(list, favoredSkillsSelection))
      .map(text => ({
        label,
        text,
      })),
  )

const renderPrimaryAttributeSpecialRule = (
  traditionName: string,
  nameOfPeopleWithThisTradition: string,
  primaryAttribute: PrimaryAttribute | string | undefined,
): StdReader<SpecialRule, "t" | "tm" | "ibi", "Attribute"> =>
  (primaryAttribute === undefined
    ? translateR(
        "Tradition ({$name}) has no associated primary attribute, meaning {$casters} receive no bonus to the AE pool and cannot purchase additional AE.",
        { name: traditionName, casters: nameOfPeopleWithThisTradition },
      )
    : attributedNameR(
        "rules",
        "Attribute",
        typeof primaryAttribute === "string" ? primaryAttribute : primaryAttribute.id,
      ).thenW(attr =>
        typeof primaryAttribute !== "string" && primaryAttribute.use_half_for_arcane_energy
          ? translateR(
              "This primary attribute of this Tradition is {$attr}; however, {$casters} use only half of this stat (rounded up) to calculate their base AE pool or purchase AE.",
              {
                casters: nameOfPeopleWithThisTradition,
                attr: attr ?? MISSING_VALUE,
              },
            )
          : translateR("The primary attribute of this Tradition is {$attr}.", {
              attr: attr ?? MISSING_VALUE,
            }),
      )
  ).map(description => ({
    text: description,
  }))

const renderAdditionalSpecialRules = (
  fixedSpecialRules: SpecialRule[],
  traditionName: string,
  nameOfPeopleWithThisTradition: string,
  restrictedBlessings: "All" | RestrictedBlessings | undefined,
  favoredCombatTechniques: FavoredCombatTechniques | undefined,
  favoredSkills: Skill_ID[] | undefined,
  favoredSkillsSelection: FavoredSkillsSelection | undefined,
  primaryAttribute: PrimaryAttribute | string | undefined,
) =>
  Reader.sequence<
    StdEnv<
      "t" | "tm" | "ibi" | "lc" | "lj",
      "Attribute" | "Skill" | "CloseCombatTechnique" | "RangedCombatTechnique" | "Blessing"
    >,
    SpecialRule | undefined
  >([
    restrictedBlessings === undefined
      ? Reader.of(undefined)
      : renderRestrictedBlessingsSpecialRule(restrictedBlessings, nameOfPeopleWithThisTradition),
    ...fixedSpecialRules.map(rule => Reader.of(rule)),
    favoredSkills === undefined
      ? Reader.of(undefined)
      : renderFavoredSkillsSpecialRule(
          favoredCombatTechniques,
          favoredSkills,
          favoredSkillsSelection,
        ),
    renderPrimaryAttributeSpecialRule(
      traditionName,
      nameOfPeopleWithThisTradition,
      primaryAttribute,
    ),
  ]).map(specialRules => specialRules.filter(isNotNullish))

/**
 * Get a JSON representation of the rules text for a special ability.
 */
export const getActivatableEntityDescription = createEntityDescriptionCreator<
  ActivatableIdentifier["kind"],
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Subject"
      | ActivatableIdentifier["kind"]
      | RatedIdentifier["kind"]
      | "TradeSecret"
      | "Aspect"
      | "Property"
      | "Race"
      | "Culture"
      | "State"
      | "Enhancement"
      | "PactCategory"
      | "PactDomain"
      | "SocialStatus"
      | "Weapon"
      | "Patron"
      | "PersonalityTrait"
      | "Blessing"
    >
    getAllInstances: GetAllInstances<"Script">
    getResolvedSelectOptionById: GetResolvedSelectOptionById
    getAllResolvedSelectOptions: GetAllResolvedSelectOptions
    getAllResolvedNewSkillApplications: GetAllResolvedNewSkillApplications
    getAllResolvedSkillUses: GetAllResolvedSkillUses
  }
>(
  (
    { getInstanceById, getAllInstances, getResolvedSelectOptionById, getAllResolvedSelectOptions },
    locale,
    { entity: entityName, content: entry, id },
  ) => {
    const { translate, translateMap, format } = locale
    const translation = translateMap<BaseActivatableTranslation>(entry.translations)
    const responsiveTextSize: ResponsiveTextSize = ResponsiveTextSize.Full

    if (translation === undefined) {
      return undefined
    }

    const env = {
      translate,
      translateMap,
      getInstanceById,
      localeCompare: locale.compare,
      localeJoin: locale.join,
    } satisfies Partial<EnvMap>

    const baseEntry: BaseActivatable = entry

    const wrappedId = Case(entityName, id)

    const addAdditionalSpecialRules =
      entityName === "BlessedTradition"
        ? (baseList: SpecialRule[]) =>
            renderAdditionalSpecialRules(
              baseList,
              translation.name,
              (translation as BlessedTraditionTranslation).nameOfBlessedOnes,
              entry.type.kind === "Church" ? entry.type.Church.restrictedBlessings : "All",
              entry.favored_combat_techniques,
              entry.favored_skills,
              entry.favored_skills_selection,
              entry.primary,
            ).run(env)
        : entityName === "MagicalTradition"
          ? (baseList: SpecialRule[]) =>
              renderAdditionalSpecialRules(
                baseList,
                translation.name,
                (translation as MagicalTraditionTranslation).nameOfSpellcasters,
                undefined,
                undefined,
                undefined,
                undefined,
                entry.primary,
              ).run(env)
          : constant([])

    const makeTraditionName: (name: string) => string =
      entityName === "BlessedTradition" || entityName === "MagicalTradition"
        ? name => translate("Tradition ({$tradition})", { tradition: name })
        : name => name

    return {
      title:
        makeTraditionName(translation.name_in_library ?? translation.name) +
        (baseEntry.levels !== undefined ? ` I–${romanize(baseEntry.levels)}` : ""),
      subtitle: mapNullable(baseEntry.usage_type, usageType => {
        switch (usageType.kind) {
          case "Active":
            return translate("Active")
          case "Passive":
            return translate("Passive")
          case "BasicManeuver":
            return translate("Basic Maneuver")
          case "SpecialManeuver":
            return translate("Special Maneuver")
          default:
            return assertExhaustive(usageType)
        }
      }),
      badge: mapNullable(
        entityName === "CombatStyleSpecialAbility" || entityName === "AdvancedCombatSpecialAbility"
          ? entry.type
          : undefined,
        combatType => {
          switch (combatType.kind) {
            case "Armed":
              return { type: "armedCombat", value: translate("AC") }
            case "Unarmed":
              return { type: "unarmedCombat", value: translate("UC") }
            default:
              return assertExhaustive(combatType)
          }
        },
      ),
      className: "special-ability",
      body: [
        mapNullable(translation.special_rules, specialRules => ({
          type: "plain",
          text: addAdditionalSpecialRules(specialRules)
            .map(specialRule =>
              specialRule.label === undefined
                ? `- ${specialRule.text}`
                : `- *${specialRule.label}*: ${specialRule.text}`,
            )
            .join("\n"),
        })),
        {
          type: "definitionList",
          items: [
            mapNullable(translation.rules, rules => ({
              label: translate("Rules"),
              value: rules,
            })),
            mapNullable(translation.effect, effect => ({
              label: translate("Effect"),
              value: effect,
            })),
            mapNullable(translation.protective_circle, protectiveCircle => ({
              label: translate("Protective Circle"),
              value: protectiveCircle,
            })),
            mapNullable(translation.warding_circle, wardingCircle => ({
              label: translate("Warding Circle"),
              value: wardingCircle,
            })),
            mapNullable(baseEntry.aspect, aspect => ({
              label: translate("Aspect"),
              value:
                translateMap(getInstanceById("Aspect", aspect)?.translations)?.name ??
                MISSING_VALUE,
            })),
            mapNullable(translation.range, range => ({
              label: translate("Range"),
              value: range,
            })),
            mapNullable(baseEntry.advanced, advanced =>
              isStyleSpecialAbilityKind(entityName)
                ? {
                    label: renderAdvancedLabel(translate, entityName),
                    value: renderAdvancedValue(
                      translate,
                      translateMap,
                      locale.join,
                      getInstanceById,
                      getResolvedSelectOptionById,
                      entityName,
                      advanced,
                    ),
                  }
                : undefined,
            ),
            mapNullable(baseEntry.penalty, penalty => ({
              label: translate("Penalty"),
              value: renderPenaltyValue(
                getInstanceById,
                translate,
                translateMap,
                translation.name,
                penalty,
              ),
            })),
            mapNullable(
              entry.prerequisites ?? (isAdvancedSpecialAbilityKind(entityName) ? [] : undefined),
              prerequisites => ({
                label: translate("Prerequisites"),
                value:
                  wrappedId.kind === "Advantage" || wrappedId.kind === "Disadvantage"
                    ? printAdvantageDisadvantagePrerequisites(
                        getInstanceById,
                        getResolvedSelectOptionById,
                        locale,
                        prerequisites,
                        translation.name,
                        wrappedId.kind,
                      )
                    : printGeneralPrerequisites(
                        getInstanceById,
                        getResolvedSelectOptionById,
                        locale,
                        prerequisites as GeneralPrerequisites,
                        mapNullable(baseEntry.levels, levels => ({
                          id: wrappedId,
                          levels,
                        })),
                        renderTrailingAdvancedPrerequisitesNote(translate, entityName),
                      ),
              }),
            ),
            mapNullable(baseEntry.combat_techniques, combatTechniques => ({
              label: translate("Combat Techniques"),
              value: renderApplicableCombatTechniquesValue(
                getInstanceById,
                locale,
                translation,
                combatTechniques,
              ),
            })),
            mapNullable(baseEntry.volume, volume => ({
              label: translate("Volume"),
              value: renderVolumeValue(
                translate,
                translateMap,
                () => getAllResolvedSelectOptions(wrappedId),
                responsiveTextSize,
                volume,
              ),
            })),
            mapNullable(baseEntry.cost, cost =>
              renderCost(
                translate,
                translateMap,
                format,
                locale.join,
                locale.compare,
                () => getAllResolvedSelectOptions(wrappedId),
                responsiveTextSize,
                baseEntry.levels,
                cost,
              ),
            ),
            mapNullable(baseEntry.property, property => ({
              label: translate("Property"),
              value: renderPropertyValue(getInstanceById, translate, translateMap, property),
            })),
            mapNullable(entry.ap_value, apValue => {
              const append =
                translation.ap_value_append !== undefined ? ` ${translation.ap_value_append}` : ""
              return {
                label: translate("AP Value"),
                value:
                  renderAdventurePointsValue(
                    locale,
                    activatableId =>
                      locale.translateMap<BaseActivatableTranslation>(
                        getInstanceById(activatableId.kind, fromUniformCase(activatableId))
                          ?.translations,
                      )?.name,
                    selectOptionId => {
                      const selectOption = getResolvedSelectOptionById(wrappedId, selectOptionId)
                      if (selectOption === undefined) {
                        return undefined
                      }
                      const name = locale.translateMap(selectOption.content.translations)?.name
                      if (name !== undefined) {
                        return name
                      }
                      const { parent: parentId } = selectOption.content
                      return locale.translateMap<BaseActivatableTranslation>(
                        getInstanceById(parentId.kind, fromUniformCase(parentId))?.translations,
                      )?.name
                    },
                    () => getAllResolvedSelectOptions(wrappedId),
                    getAllInstances,
                    apValue,
                    entry,
                    translation,
                    entityName === "Disadvantage",
                  ) + append,
              }
            }),
          ],
        },
        renderDeriveFromExternalOptionTable(
          translate,
          translateMap,
          locale.compare,
          getInstanceById,
          getResolvedSelectOptionById,
          entityName,
          baseEntry.advanced ?? [],
        ),
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
