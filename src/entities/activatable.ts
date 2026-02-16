import { on } from "@elyukai/utils/function"
import { isNotNullish } from "@elyukai/utils/nullable"
import { numAsc } from "@optolith/helpers/compare"
import { sign } from "@optolith/helpers/math"
import { mapNullable, mapNullableDefault } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import type { ResolvedSelectOption } from "optolith-database-schema/cache"
import type {
  ActivatableIdentifier,
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
  CloseCombatTechnique,
  CombatRelatedSpecialAbilityIdentifier,
  CombatSpecialAbilityUsageType,
  CombatTechniqueIdentifier,
  DaggerRitualCost,
  EnchantmentCost,
  Errata,
  GeneralPrerequisites,
  LifePointsCost,
  MagicalSignCost,
  Penalty,
  PenaltyByAttackReplacement,
  PropertyDeclaration,
  PublicationRefs,
  RangedCombatTechnique,
  SelectOptions,
  SpecialRule,
  Volume,
} from "optolith-database-schema/gen"
import { Case, fromUniformCase } from "tsondb/schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetAllInstances, GetInstanceById } from "../helpers/getTypes.js"
import type {
  LocaleCompare,
  LocaleEnvironment,
  LocaleJoin,
} from "../helpers/locale.js"
import type { Translate, TranslateMap } from "../helpers/translate.js"
import type {
  EntityDescriptionSection,
  GetAllResolvedNewSkillApplications,
  GetAllResolvedSelectOptions,
  GetAllResolvedSkillUses,
} from "../index.js"
import { renderAdventurePointsValue } from "./partial/adventurePointsValue.js"
import { renderResponsiveMap } from "./partial/map.js"
import {
  printAdvantageDisadvantagePrerequisites,
  printGeneralPrerequisites,
} from "./partial/prerequisites/index.js"
import type { GetResolvedSelectOptionById } from "./partial/prerequisites/single/activatable.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import {
  getResponsiveText,
  getResponsiveTextOptional,
  ResponsiveTextSize,
} from "./partial/responsiveText.js"
import { formatTimeSpan } from "./partial/units/timeSpan.js"
import { MISSING_VALUE } from "./partial/unknown.js"

// type SpecialAbility = TSONDBTypes["entityMap"][SpecialAbilityIdentifier["kind"]]

/**
 * The base fields for a special ability entity in the database.
 */
export type BaseActivatable = {
  levels?: number
  maximum?: number
  select_options?: SelectOptions
  usage_type?: CombatSpecialAbilityUsageType
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
        translateMap(
          getInstanceById("Property", propertyDecl.Fixed)?.translations,
        )?.name ?? MISSING_VALUE
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
  getInstanceById: GetInstanceById<
    CombatRelatedSpecialAbilityIdentifier["kind"]
  >,
  translate: Translate,
  translateMap: TranslateMap,
  name: string,
  penalty: Penalty,
): string => {
  switch (penalty.kind) {
    case "Single":
      return (
        sign(penalty.Single.value) +
        (penalty.Single.applies_to_parry === true
          ? ` (${translate("for parry")})`
          : "")
      )
    case "ByHandedness": {
      const appendParry =
        penalty.ByHandedness.applies_to_parry === true
          ? `; ${translate("for parry")}`
          : ""

      return `${sign(penalty.ByHandedness.one_handed)} (${
        translate("one-handed weapon") + appendParry
      }); ${sign(penalty.ByHandedness.two_handed)} (${
        translate("two-handed weapon") + appendParry
      })`
    }
    case "ByActivation": {
      return `${sign(penalty.ByActivation.active)}/${sign(penalty.ByActivation.inactive)} (${[
        penalty.ByActivation.applies_to_parry === true
          ? translate("for parry")
          : undefined,
        translate(
          "for secondary fighters with/without special ability {$name}",
          { name },
        ),
      ]
        .filter(isNotNullish)
        .join("; ")})`
    }
    case "Selection":
      switch (penalty.Selection.options.kind) {
        case "Specific":
          return penalty.Selection.options.Specific.list
            .map(option => sign(option.value))
            .join("/")
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
        translateMap(
          getInstanceById(external.kind, fromUniformCase(external))
            ?.translations,
        )?.name ?? MISSING_VALUE

      return `${main} (${translate(
        "depending on the level of the special ability {$name}",
        {
          name: externalName,
        },
      )})`
    }
    case "ByAttack": {
      const offset = penalty.ByAttack.initial_order ?? 1
      return penalty.ByAttack.list
        .map(
          (penaltyByAttack, index) =>
            `${penaltyByAttack.value} (${renderPenaltyByAttackLabel(
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

const addSpaceIfNoCommaAtStart = (str: string): string =>
  str.startsWith(",") ? str : ` ${str}`

const renderApplicableCombatTechniquesRestriction = <
  T extends
    | ApplicableAllCombatTechniquesRestriction
    | ApplicableCloseCombatTechniquesRestriction
    | ApplicableRangedCombatTechniquesRestriction
    | ApplicableSpecificCombatTechniquesRestriction,
>(
  getInstanceById: GetInstanceById<
    "CloseCombatTechnique" | "RangedCombatTechnique" | "Race"
  >,
  locale: LocaleEnvironment,
  main: string,
  restriction: T,
  translation: BaseActivatableTranslation,
  weapons: string | undefined,
  getExcludedInstance: T extends { kind: "ExcludeCombatTechniques" }
    ? (
        id: T["ExcludeCombatTechniques"]["list"][number],
      ) => CloseCombatTechnique | RangedCombatTechnique | undefined
    : undefined,
): string => {
  switch (restriction.kind) {
    case "Improvised":
      return (
        main +
        wrapInParens([locale.translate("only improvised weapons"), weapons])
      )
    case "PointedBlade":
      return (
        main +
        wrapInParens([
          locale.translate("weapon must have a pointed blade"),
          weapons,
        ])
      )
    case "Mount":
      if (weapons === undefined) {
        return `${main} ${locale.translate("while mounted")}`
      } else {
        return main + wrapInParens([weapons], locale.translate("while mounted"))
      }
    case "Race": {
      const race = getInstanceById("Race", restriction.Race)
      const raceName =
        locale.translateMap(race?.translations)?.name ?? MISSING_VALUE

      return (
        main +
        wrapInParens([
          // originally "while {$racial} weapon", but different to parameterize without inflection support
          locale.translate("while weapon of race {$race}", {
            race: raceName,
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
                .map(
                  id =>
                    locale.translateMap(
                      getExcludedInstance?.(
                        id as (CombatTechniqueIdentifier & string) & string,
                      )?.translations,
                    )?.name ?? MISSING_VALUE,
                )
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
      return (
        locale.translate("All Two-Handed Weapons") + wrapInParens([weapons])
      )
    case "ParryingWeapon":
      return locale.translate("All Parrying Weapons") + wrapInParens([weapons])
    case "Level": {
      const nameWithLevel = `${translation} ${romanize(restriction.Level.level)}`
      return (
        main +
        wrapInParens([
          locale.translate("only {$nameWithLevel}", { nameWithLevel }),
          weapons,
        ])
      )
    }
    case "OneBluntSide":
      return (
        main +
        wrapInParens([
          locale.translate("only those with at least one blunt side"),
          weapons,
        ])
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
              id => getInstanceById(id.kind, fromUniformCase(id)),
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
              id => getInstanceById("CloseCombatTechnique", id),
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
              id => getInstanceById("RangedCombatTechnique", id),
            )
      return mainWithRestriction
    }
    case "Specific": {
      return applicableCombatTechniques.Specific.list
        .map(specific => {
          const entry = getInstanceById(
            specific.id.kind,
            fromUniformCase(specific.id),
          )
          const main =
            locale.translateMap(entry?.translations)?.name ?? MISSING_VALUE
          const mainWithRestriction =
            specific.restriction === undefined
              ? main
              : renderApplicableCombatTechniquesRestriction(
                  getInstanceById,
                  locale,
                  main,
                  specific.restriction,
                  translation,
                  specific.weapons === undefined
                    ? undefined
                    : locale.translate("only {$weapons}", {
                        weapons: locale.join(
                          specific.weapons
                            .map(
                              weapon =>
                                locale.translateMap(
                                  getInstanceById("Weapon", weapon)
                                    ?.translations,
                                )?.name ?? MISSING_VALUE,
                            )
                            .toSorted(locale.compare),
                          "conjunction",
                        ),
                      }),
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
        levels: volume.ByLevel.list
          .map((_, index) => romanize(index + 1))
          .join("/"),
      })
    case "Map":
      return renderResponsiveMap(
        translate,
        translateMap,
        responsiveTextSize,
        volume.Map,
        option => option.points,
        values => translate("{$points} points", { points: values }),
        optionTranslation => optionTranslation.label,
        translation => translation.list_prepend,
        translation => translation.list_append,
        translation => translation.replacement,
      )
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
            .map(
              groupItem =>
                translateMap(groupItem.content.translations)?.name ??
                MISSING_VALUE,
            )
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
                  responsiveTextSize,
                  interval.unit,
                  interval.value,
                ),
              })

      const wrapInPerLevel: (prev: (value: number) => string) => string =
        (() => {
          if (cost.Fixed.per_level === undefined) {
            return prev => prev(cost.Fixed.value)
          }

          switch (cost.Fixed.per_level?.kind) {
            case "Compressed":
              return prev =>
                translate("{$cost} per level", { cost: prev(cost.Fixed.value) })
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

      return (
        wrapInPerLevel(value => wrapInInterval(translationWrapper(value))) +
        noteInParens
      )
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
          responsiveTextSize,
          cost.Interval.interval.unit,
          cost.Interval.interval.value,
        ),
      })
    case "ActivationAndHalfInterval":
      return translate("{$cost} (activation) + {$halvedCost} per {$interval}", {
        cost: translate("{$value} AE", {
          value: cost.ActivationAndHalfInterval.value,
        }),
        halvedCost: translate("{$value} AE", {
          value: Math.round(cost.ActivationAndHalfInterval.value / 2),
        }),
        interval: formatTimeSpan(
          translate,
          responsiveTextSize,
          cost.ActivationAndHalfInterval.interval.unit,
          cost.ActivationAndHalfInterval.interval.value,
        ),
      })
    case "Indefinite":
      return (
        mapNullable(
          translateMap(cost.Indefinite.translations)?.description,
          description => getResponsiveText(description, responsiveTextSize),
        ) +
        mapNullableDefault(
          cost.Indefinite.modifier,
          modifier =>
            ` + ${translate("{$value} AE", { value: modifier.value })}`,
          "",
        )
      )
    case "Disjunction":
      return translate("{$value} AE", {
        value: localeJoin(
          cost.Disjunction.options.map(
            option =>
              option.value +
              mapNullableDefault(
                translateMap(option.translations)?.note,
                note =>
                  parensIf(getResponsiveTextOptional(note, responsiveTextSize)),
                "",
              ),
          ),
          "disjunction",
        ),
      })
    case "Map":
      return renderResponsiveMap(
        translate,
        translateMap,
        responsiveTextSize,
        cost.Map,
        option => option.value,
        values => translate("{$value} AE", { value: values }),
        optionTranslation => optionTranslation.label,
        translation => translation.list_prepend,
        translation => translation.list_append,
        translation => translation.replacement,
        cost.Map.options.every(option => option.permanent_value !== undefined)
          ? {
              surround: values =>
                translate(", {$value} of which are permanent", {
                  value: values,
                }),
              getAdditionalValue: option => option.permanent_value!,
            }
          : undefined,
      )
    case "Variable":
      return translate("Variable")
    case "ByLevel":
      switch (cost.ByLevel.style.kind) {
        case "Compressed":
          return translate("{$cost} for level {$level}", {
            cost: translate("{$value} AE", {
              value: cost.ByLevel.levels.map(level => level.value).join("/"),
            }),
            level: Array.from(
              { length: cost.ByLevel.levels.length },
              (_, index) => romanize(index + 1),
            ),
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
        translate,
        translateMap,
        responsiveTextSize,
        cost.Map,
        option => option.permanent_value,
        values => translate("{$value} permanent AE", { value: values }),
        optionTranslation => optionTranslation.label,
        translation => translation.list_prepend,
        translation => translation.list_append,
        translation => translation.replacement,
      )
    case "DerivedFromSelection": {
      const groups = Map.groupBy(
        getAllResolvedSelectOptions(),
        option =>
          option.content.binding_cost ?? cost.DerivedFromSelection.fallback,
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
            .map(
              groupItem =>
                translateMap(groupItem.content.translations)?.name ??
                MISSING_VALUE,
            )
            .toSorted(localeCompare)
            .join(", "),
        )
        .join(separator)}`
    }
    default:
      return assertExhaustive(cost)
  }
}

const renderLifePointsCost = (
  translate: Translate,
  cost: LifePointsCost | undefined,
): string =>
  cost === undefined
    ? ""
    : // eslint-disable-next-line no-irregular-whitespace
      ` (+ ${translate("{$value} LP", { value: cost.Fixed.value })})`

const renderCost = (
  translate: Translate,
  translateMap: TranslateMap,
  localeJoin: LocaleJoin,
  localeCompare: LocaleCompare,
  getAllResolvedSelectOptions: () => ResolvedSelectOption[],
  responsiveTextSize: ResponsiveTextSize,
  levels: number | undefined,
  cost: EnchantmentCost | DaggerRitualCost | MagicalSignCost | number,
): EntityDescriptionSection => {
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
                  localeJoin,
                  responsiveTextSize,
                  levels,
                  cost.ArcaneEnergyCost.ae_cost,
                ) +
                renderLifePointsCost(translate, cost.ArcaneEnergyCost.lp_cost)
              : renderArcaneEnergyCost(
                  translate,
                  translateMap,
                  localeJoin,
                  responsiveTextSize,
                  levels,
                  cost.ArcaneEnergyCost,
                )
            : renderArcaneEnergyCost(
                translate,
                translateMap,
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

/**
 * Get a JSON representation of the rules text for a special ability.
 */
export const getActivatableEntityDescription = createEntityDescriptionCreator<
  ActivatableIdentifier["kind"],
  {
    getInstanceById: GetInstanceById<
      | "Subject"
      | ActivatableIdentifier["kind"]
      | "TradeSecret"
      | "Aspect"
      | "Property"
    >
    getAllInstances: GetAllInstances<"Script">
    getResolvedSelectOptionById: GetResolvedSelectOptionById
    getAllResolvedSelectOptions: GetAllResolvedSelectOptions
    getAllResolvedNewSkillApplications: GetAllResolvedNewSkillApplications
    getAllResolvedSkillUses: GetAllResolvedSkillUses
  }
>(
  (
    {
      getInstanceById,
      getAllInstances,
      getResolvedSelectOptionById,
      getAllResolvedSelectOptions,
    },
    locale,
    { entity: entityName, content: entry, id },
  ) => {
    const { translate, translateMap } = locale
    const translation = translateMap<BaseActivatableTranslation>(
      entry.translations,
    )
    const responsiveTextSize: ResponsiveTextSize = ResponsiveTextSize.Full

    if (translation === undefined) {
      return undefined
    }

    const baseEntry: BaseActivatable = entry

    const wrappedId = Case(entityName, id)

    return {
      title:
        translation.name_in_library ??
        translation.name +
          (baseEntry.levels !== undefined
            ? ` I–${romanize(baseEntry.levels)}`
            : ""),
      subtitle: mapNullable(baseEntry.usage_type, usageType => {
        switch (usageType.kind) {
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
      className: "special-ability",
      body: [
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
        mapNullable(translation.special_rules, specialRules => ({
          value: specialRules
            .map(specialRule =>
              specialRule.label === undefined
                ? `- ${specialRule.text}`
                : `- *${specialRule.label}*: ${specialRule.text}`,
            )
            .join("\n"),
        })),
        mapNullable(baseEntry.aspect, aspect => ({
          label: translate("Aspect"),
          value:
            translateMap(getInstanceById("Aspect", aspect)?.translations)
              ?.name ?? MISSING_VALUE,
        })),
        mapNullable(translation.range, range => ({
          label: translate("Range"),
          value: range,
        })),
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
        mapNullable(entry.prerequisites, prerequisites => ({
          label: translate("Prerequisites"),
          value:
            wrappedId.kind === "Advantage" || wrappedId.kind === "Disadvantage"
              ? printAdvantageDisadvantagePrerequisites(
                  getInstanceById,
                  getResolvedSelectOptionById,
                  locale,
                  prerequisites as AdvantageDisadvantagePrerequisites,
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
                ),
        })),
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
          value: renderPropertyValue(
            getInstanceById,
            translate,
            translateMap,
            property,
          ),
        })),
        mapNullable(entry.ap_value, apValue => {
          const append =
            translation.ap_value_append !== undefined
              ? ` ${translation.ap_value_append}`
              : ""
          return {
            label: translate("AP Value"),
            value:
              renderAdventurePointsValue(
                locale,
                activatableId =>
                  locale.translateMap<BaseActivatableTranslation>(
                    getInstanceById(
                      activatableId.kind,
                      fromUniformCase(activatableId),
                    )?.translations,
                  )?.name,
                selectOptionId => {
                  const selectOption = getResolvedSelectOptionById(
                    wrappedId,
                    selectOptionId,
                  )
                  if (selectOption === undefined) {
                    return undefined
                  }
                  const name = locale.translateMap(
                    selectOption.content.translations,
                  )?.name
                  if (name !== undefined) {
                    return name
                  }
                  const { parent: parentId } = selectOption.content
                  return locale.translateMap<BaseActivatableTranslation>(
                    getInstanceById(parentId.kind, fromUniformCase(parentId))
                      ?.translations,
                  )?.name
                },
                () => getAllResolvedSelectOptions(wrappedId),
                getAllInstances,
                apValue,
                entry,
                translation,
              ) + append,
          }
        }),
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
