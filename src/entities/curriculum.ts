import { partition } from "@elyukai/utils/array/groups"
import { ensureNonEmpty } from "@elyukai/utils/array/nonEmpty"
import { sumWith } from "@elyukai/utils/array/reductions"
import { Dictionary } from "@elyukai/utils/dictionary"
import { deepEqual } from "@elyukai/utils/equality"
import { on } from "@elyukai/utils/function"
import { sign } from "@elyukai/utils/string/number"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import {
  getAdventurePointsForActivation,
  getAdventurePointsForRatingRange,
} from "@optolith/adventure-points/improvement-cost"
import type {
  AbilityAdjustment,
  ElectiveSpellworks,
  ProfessionPackage,
  RestrictedProperty,
  RestrictedSpellwork,
  RestrictedSpellworks,
  SpellworkAdjustment,
  SpellworkChange,
  SpellworkIdentifier,
} from "@optolith/database-schema/gen"
import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import { createEntityDescriptionCreator } from "../creator.js"
import type {
  GetAllChildInstancesForParent,
  GetAllInstances,
  GetInstanceById,
} from "../helpers/getTypes.js"
import type { LocaleCompare, LocaleJoin } from "../helpers/locale.js"
import type { Translate, TranslateMap } from "../helpers/translate.js"
import type {
  IdMap,
  LabeledEntityDescriptionSection,
  RawEntityDescriptionSectionContent,
} from "../index.js"
import { attributedName } from "./partial/markdown.js"
import { getBaseProfessionPackageForCurriculum } from "./partial/professions.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import { MISSING_VALUE } from "./partial/unknown.js"

const renderElectiveSpellworks = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  getInstanceById: GetInstanceById<SpellworkIdentifier["kind"] | "Element">,
  electiveSpellworks: ElectiveSpellworks,
): string => {
  switch (electiveSpellworks.kind) {
    case "DefinedByGameMaster":
      return translate("All, at the GM’s discretion")
    case "Specific":
      return electiveSpellworks.Specific.list
        .map(item =>
          mapNullable(
            attributedName(translateMap, getInstanceById, "curriculum", item.id),
            name => {
              if (item.restriction === undefined) {
                return name
              }

              return (
                name +
                parensIf(
                  attributedName(
                    translateMap,
                    getInstanceById,
                    "curriculum",
                    "Element",
                    item.restriction.Element,
                  ),
                )
              )
            },
          ),
        )
        .filter(isNotNullish)
        .toSorted(localeCompare)
        .join(", ")
    default:
      return assertExhaustive(electiveSpellworks)
  }
}

const renderRestrictedSpellworks = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  localeJoin: LocaleJoin,
  getInstanceById: GetInstanceById<SpellworkIdentifier["kind"] | "Element" | "Property">,
  restrictedSpellworks: RestrictedSpellworks,
): string => {
  const restrictedGroups = Dictionary.groupBy(restrictedSpellworks, restriction =>
    restriction.kind === "Spellwork"
      ? "spellwork"
      : restriction.kind === "Property" && restriction.Property.maximum !== undefined
        ? "restrictedProperty"
        : restriction.kind === "Property" || restriction.kind === "DemonSummoning"
          ? "property"
          : "other",
  )

  const addExclusion = (excludedSpellworks: SpellworkIdentifier[] | undefined) => {
    if (excludedSpellworks === undefined) {
      return ""
    }

    const translatedSpellworks = excludedSpellworks
      .map(excludedSpellwork =>
        attributedName(translateMap, getInstanceById, "curriculum", excludedSpellwork),
      )
      .filter(isNotNullish)
      .toSorted(localeCompare)

    if (translatedSpellworks.length === 0) {
      return ""
    }

    return ` (${translate("except {$list}", {
      list: localeJoin(translatedSpellworks, "conjunction"),
    })})`
  }

  const restrictedProperties =
    (
      restrictedGroups.get("restrictedProperty") as
        | {
            kind: "Property"
            Property: RestrictedProperty & { maximum: number }
          }[]
        | undefined
    )?.map(
      restriction =>
        translate(
          ".input {$count :number} {{only {$count} additional spellworks with the Property {$property}}}",
          {
            count: restriction.Property.maximum,
            property:
              attributedName(
                translateMap,
                getInstanceById,
                "curriculum",
                "Property",
                restriction.Property.id,
              ) ?? MISSING_VALUE,
          },
        ) + addExclusion(restriction.Property.exclude),
    ) ?? []

  const propertyGroup = restrictedGroups.get("property") as
    | (
        | {
            kind: "Property"
            Property: RestrictedProperty & { maximum: undefined }
          }
        | {
            kind: "DemonSummoning"
          }
      )[]
    | undefined

  const translatedProperties =
    propertyGroup
      ?.map(restriction => {
        switch (restriction.kind) {
          case "Property":
            return (
              (attributedName(
                translateMap,
                getInstanceById,
                "curriculum",
                "Property",
                restriction.Property.id,
              ) ?? MISSING_VALUE) + addExclusion(restriction.Property.exclude)
            )
          case "DemonSummoning":
            return translate("Demon Summoning")
          default:
            return assertExhaustive(restriction)
        }
      })
      .filter(isNotNullish)
      .toSorted(localeCompare) ?? []

  const properties =
    translatedProperties.length > 0
      ? [
          translate("no spellworks with the Property {$property}", {
            property: localeJoin(translatedProperties, "disjunction"),
          }),
        ]
      : []

  const spellworkGroup = restrictedGroups.get("spellwork") as
    | {
        kind: "Spellwork"
        Spellwork: SpellworkIdentifier
      }[]
    | undefined

  const translatedSpellworks =
    spellworkGroup
      ?.map(restriction =>
        attributedName(translateMap, getInstanceById, "curriculum", restriction.Spellwork),
      )
      .filter(isNotNullish)
      .toSorted(localeCompare) ?? []

  const spellworks =
    translatedSpellworks.length > 0
      ? [
          translate("the following spells are not taught: {$spells}", {
            spells: translatedSpellworks.join(", "),
          }),
        ]
      : []

  const otherGroup = restrictedGroups.get("other") as
    | Exclude<
        RestrictedSpellwork,
        | {
            kind: "Property"
            Property: RestrictedProperty
          }
        | {
            kind: "Spellwork"
            Spellwork: SpellworkIdentifier
          }
        | {
            kind: "DemonSummoning"
          }
      >[]
    | undefined

  const others =
    otherGroup?.map(restriction => {
      switch (restriction.kind) {
        case "Borbaradian":
          return translate("no Borbaradian spellworks")
        case "DamageIntelligent":
          return translate("no spellworks that inflict DP or sDP on intelligent creatures")
        default:
          return assertExhaustive(restriction)
      }
    }) ?? []

  return [...restrictedProperties, ...properties, ...others, ...spellworks].join("; ")
}

const renderSpellworkAdjustment = (
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<SpellworkIdentifier["kind"] | "MagicalTradition">,
  adjustment: Omit<SpellworkAdjustment, "points"> & { points: string | number },
): string =>
  `${attributedName(translateMap, getInstanceById, "curriculum", adjustment.id) ?? MISSING_VALUE}${parensIf(
    adjustment.tradition === undefined
      ? undefined
      : attributedName(
          translateMap,
          getInstanceById,
          "curriculum",
          "MagicalTradition",
          adjustment.tradition,
        ),
  )} ${typeof adjustment.points === "number" ? adjustment.points.toFixed() : adjustment.points}`

const renderAbilityAdjustmentName = (
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<
    | "Skill"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "Spell"
    | "Ritual"
    | "MagicalTradition"
  >,
  abilityAdjustment: AbilityAdjustment,
) => {
  switch (abilityAdjustment.kind) {
    case "Skill":
      return (
        attributedName(
          translateMap,
          getInstanceById,
          "curriculum",
          "Skill",
          abilityAdjustment.Skill.id,
        ) ?? MISSING_VALUE
      )
    case "CombatTechnique":
      return (
        attributedName(
          translateMap,
          getInstanceById,
          "curriculum",
          abilityAdjustment.CombatTechnique.id,
        ) ?? MISSING_VALUE
      )
    case "Spellwork":
      return (
        (attributedName(
          translateMap,
          getInstanceById,
          "curriculum",
          abilityAdjustment.Spellwork.id,
        ) ?? MISSING_VALUE) +
        parensIf(
          abilityAdjustment.Spellwork.tradition === undefined
            ? undefined
            : attributedName(
                translateMap,
                getInstanceById,
                "curriculum",
                "MagicalTradition",
                abilityAdjustment.Spellwork.tradition,
              ),
        )
      )
    default:
      return assertExhaustive(abilityAdjustment)
  }
}

const renderAbilityAdjustmentBaseValue = (
  baseProfessionPackage: ProfessionPackage,
  abilityAdjustment: AbilityAdjustment,
) => {
  switch (abilityAdjustment.kind) {
    case "Skill":
      return baseProfessionPackage.skills?.find(skill => skill.id === abilityAdjustment.Skill.id)
        ?.rating_modifier
    case "CombatTechnique":
      return baseProfessionPackage.combat_techniques?.find(skill =>
        deepEqual(skill.id, abilityAdjustment.CombatTechnique.id),
      )?.rating_modifier
    case "Spellwork":
      return baseProfessionPackage.spells?.find(spell =>
        spell.id.some(
          someSpell =>
            someSpell.kind === "Spellwork" &&
            deepEqual(someSpell.Spellwork.id, abilityAdjustment.Spellwork.id),
        ),
      )?.rating_modifier
    default:
      return assertExhaustive(abilityAdjustment)
  }
}

const renderPrintedAbilityAdjustmentBaseValue = (abilityAdjustment: AbilityAdjustment) => {
  switch (abilityAdjustment.kind) {
    case "Skill":
      return abilityAdjustment.Skill.basePoints
    case "CombatTechnique":
      return abilityAdjustment.CombatTechnique.basePoints
    case "Spellwork":
      return abilityAdjustment.Spellwork.basePoints
    default:
      return assertExhaustive(abilityAdjustment)
  }
}

const renderAbilityAdjustmentModifierValue = (abilityAdjustment: AbilityAdjustment) => {
  switch (abilityAdjustment.kind) {
    case "Skill":
      return abilityAdjustment.Skill.points
    case "CombatTechnique":
      return abilityAdjustment.CombatTechnique.points
    case "Spellwork":
      return abilityAdjustment.Spellwork.points
    default:
      return assertExhaustive(abilityAdjustment)
  }
}

const renderAbilityAdjustmentDefaultValue = (abilityAdjustment: AbilityAdjustment) => {
  switch (abilityAdjustment.kind) {
    case "Skill":
      return 0
    case "CombatTechnique":
      return 6
    case "Spellwork":
      return 0
    default:
      return assertExhaustive(abilityAdjustment)
  }
}

const renderAbilityAdjustment = (
  translate: Translate,
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<
    | "Skill"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "Spell"
    | "Ritual"
    | "MagicalTradition"
  >,
  baseProfessionPackage: ProfessionPackage | undefined,
): ((abilityAdjustment: AbilityAdjustment) => string) =>
  baseProfessionPackage === undefined
    ? abilityAdjustment =>
        `${renderAbilityAdjustmentName(
          translateMap,
          getInstanceById,
          abilityAdjustment,
        )} ${sign(renderAbilityAdjustmentModifierValue(abilityAdjustment))}`
    : abilityAdjustment => {
        const defaultValue = renderAbilityAdjustmentDefaultValue(abilityAdjustment)

        const basePoints =
          (renderAbilityAdjustmentBaseValue(baseProfessionPackage, abilityAdjustment) ?? 0) +
          defaultValue

        const printedBaseValue = mapNullable(
          renderPrintedAbilityAdjustmentBaseValue(abilityAdjustment),
          value => value + defaultValue,
        )

        return translate("{$replacement} instead of {$base}", {
          base:
            printedBaseValue === basePoints
              ? basePoints
              : `<ins>${basePoints.toFixed()}</ins><del>${printedBaseValue?.toFixed() ?? "n/a"}</del>`,
          replacement: `${renderAbilityAdjustmentName(
            translateMap,
            getInstanceById,
            abilityAdjustment,
          )} ${(basePoints + renderAbilityAdjustmentModifierValue(abilityAdjustment)).toFixed()}`,
        })
      }

const renderAbilityAdjustments = (
  translate: Translate,
  translateMap: TranslateMap,
  localeCompare: LocaleCompare,
  getInstanceById: GetInstanceById<
    | "Skill"
    | "CloseCombatTechnique"
    | "RangedCombatTechnique"
    | "Spell"
    | "Ritual"
    | "MagicalTradition"
  >,
  baseProfessionPackage: ProfessionPackage | undefined,
  list: AbilityAdjustment[],
) =>
  ensureNonEmpty(
    list
      .map(renderAbilityAdjustment(translate, translateMap, getInstanceById, baseProfessionPackage))
      .toSorted(localeCompare),
  )?.join(", ") ?? "—"

const calculateApForSpellworkAdjustment = (
  getInstanceById: GetInstanceById<SpellworkIdentifier["kind"]>,
  adjustment: SpellworkAdjustment,
  includeActivation = false,
): number => {
  const instance = getInstanceById(adjustment.id)
  if (instance === undefined) {
    return 0
  }
  return (
    (getAdventurePointsForRatingRange(
      instance.improvement_cost.kind,
      0,
      Math.abs(adjustment.points),
    ) +
      (includeActivation ? getAdventurePointsForActivation(instance.improvement_cost.kind) : 0)) *
    (adjustment.points > 0 ? 1 : -1)
  )
}

const calculateApForSpellworkChanges = (
  getInstanceById: GetInstanceById<SpellworkIdentifier["kind"]>,
  spellworkChanges: SpellworkChange[] | undefined,
): number =>
  sumWith(
    spellworkChanges ?? [],
    change =>
      calculateApForSpellworkAdjustment(getInstanceById, change.replacement, true) -
      calculateApForSpellworkAdjustment(getInstanceById, change.base, true),
  )

const calculateApForAbilityAdjustments = (
  getInstanceById: GetInstanceById<
    "Skill" | "CloseCombatTechnique" | "RangedCombatTechnique" | "Spell" | "Ritual"
  >,
  baseProfessionPackage: ProfessionPackage | undefined,
  abilityAdjustments: AbilityAdjustment[],
): number =>
  sumWith(abilityAdjustments, adjustment => {
    switch (adjustment.kind) {
      case "CombatTechnique": {
        const instance = getInstanceById(adjustment.CombatTechnique.id)
        if (instance === undefined) {
          return 0
        }
        return (
          getAdventurePointsForRatingRange(
            instance.improvement_cost.kind,
            0,
            Math.abs(adjustment.CombatTechnique.points),
          ) * (adjustment.CombatTechnique.points > 0 ? 1 : -1)
        )
      }
      case "Skill": {
        const instance = getInstanceById("Skill", adjustment.Skill.id)
        if (instance === undefined) {
          return 0
        }
        return (
          getAdventurePointsForRatingRange(
            instance.improvement_cost.kind,
            0,
            Math.abs(adjustment.Skill.points),
          ) * (adjustment.Skill.points > 0 ? 1 : -1)
        )
      }
      case "Spellwork": {
        const baseValue =
          baseProfessionPackage &&
          renderAbilityAdjustmentBaseValue(baseProfessionPackage, adjustment)

        const includeActivation =
          baseValue === undefined ||
          baseValue + renderAbilityAdjustmentDefaultValue(adjustment) === 0

        return calculateApForSpellworkAdjustment(
          getInstanceById,
          adjustment.Spellwork,
          includeActivation,
        )
      }
      default:
        return assertExhaustive(adjustment)
    }
  })

/**
 * Get a JSON representation of the rules text for a curriculum.
 */
export const getCurriculumEntityDescription = createEntityDescriptionCreator<
  "Curriculum",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Skill"
      | "CloseCombatTechnique"
      | "RangedCombatTechnique"
      | "Guideline"
      | "Spell"
      | "Ritual"
      | "MagicalTradition"
      | "Property"
      | "Element"
    >
    getAllInstances: GetAllInstances<"Profession">
    getChildInstancesForInstanceId: GetAllChildInstancesForParent<
      "LessonPackage" | "ProfessionVersion" | "ProfessionPackage"
    >
    idMap: IdMap
  }
>(
  (
    { getInstanceById, getAllInstances, getChildInstancesForInstanceId, idMap },
    { translate, translateMap, compare: localeCompare, join: localeJoin },
    { content: entry, id },
  ) => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const baseProfessionPackage = getBaseProfessionPackageForCurriculum(
      getAllInstances,
      getChildInstancesForInstanceId,
      idMap,
      id,
    )?.content

    return {
      title: translation.name,
      className: "curriculum",
      body: [
        {
          type: "definitionList",
          items: [
            {
              label: translate("Guideline"),
              value:
                attributedName(
                  translateMap,
                  getInstanceById,
                  "curriculum",
                  "Guideline",
                  entry.guideline,
                ) ?? MISSING_VALUE,
            },
            {
              label: translate("Elective Spellworks Package"),
              value:
                entry.elective_spellworks === undefined
                  ? translate("none")
                  : renderElectiveSpellworks(
                      translate,
                      translateMap,
                      localeCompare,
                      getInstanceById,
                      entry.elective_spellworks,
                    ),
            },
            {
              label: translate("Restricted Spellworks"),
              value:
                entry.restricted_spellworks === undefined
                  ? translate("none")
                  : renderRestrictedSpellworks(
                      translate,
                      translateMap,
                      localeCompare,
                      localeJoin,
                      getInstanceById,
                      entry.restricted_spellworks,
                    ),
            },
          ],
        },
        ...getChildInstancesForInstanceId("LessonPackage", id)
          .map(lessonPackage =>
            mapNullable(
              translateMap(lessonPackage.content.translations),
              (
                lessonPackageTranslation,
              ): LabeledEntityDescriptionSection<RawEntityDescriptionSectionContent> => {
                const [boni, mali] = partition(lessonPackage.content.skills ?? [], adjustment => {
                  switch (adjustment.kind) {
                    case "Skill":
                      return adjustment.Skill.points > 0
                    case "CombatTechnique":
                      return adjustment.CombatTechnique.points > 0
                    case "Spellwork":
                      return adjustment.Spellwork.points > 0
                    default:
                      return assertExhaustive(adjustment)
                  }
                })

                const apValueBase = baseProfessionPackage?.ap_value
                const apValueForSpellworkChanges = calculateApForSpellworkChanges(
                  getInstanceById,
                  lessonPackage.content.spellwork_changes,
                )
                const apValueForBoni = calculateApForAbilityAdjustments(
                  getInstanceById,
                  baseProfessionPackage,
                  boni,
                )
                const apValueForMali = calculateApForAbilityAdjustments(
                  getInstanceById,
                  baseProfessionPackage,
                  mali,
                )
                const totalApValue =
                  (apValueBase ?? 0) + apValueForSpellworkChanges + apValueForBoni + apValueForMali

                const derivedApValueText = `^[${totalApValue.toFixed()}](base: ${baseProfessionPackage?.ap_value.toFixed() ?? '"n/a"'}, changes: ${calculateApForSpellworkChanges(
                  getInstanceById,
                  lessonPackage.content.spellwork_changes,
                ).toFixed()}, boni: ${calculateApForAbilityAdjustments(getInstanceById, baseProfessionPackage, boni).toFixed()}, mali: ${calculateApForAbilityAdjustments(getInstanceById, baseProfessionPackage, mali).toFixed()})`

                return {
                  type: "labeled",
                  label:
                    lessonPackageTranslation.name +
                    parensIf(
                      translate("{$value} AP", {
                        value:
                          lessonPackage.content.apValue === totalApValue
                            ? derivedApValueText
                            : `<ins>${derivedApValueText}</ins><del>${lessonPackage.content.apValue?.toFixed() ?? "n/a"}</del>`,
                      }),
                    ),
                  value: {
                    type: "definitionList",
                    items: [
                      {
                        label: translate("Spellwork Changes"),
                        value:
                          lessonPackageTranslation.spellwork_changes ??
                          ensureNonEmpty(
                            (
                              lessonPackage.content.spellwork_changes?.map(change => {
                                const baseValueFromProfession = baseProfessionPackage
                                  ? renderAbilityAdjustmentBaseValue(baseProfessionPackage, {
                                      kind: "Spellwork",
                                      Spellwork: change.base,
                                    })
                                  : undefined

                                return translate("{$replacement} instead of {$base}", {
                                  base: renderSpellworkAdjustment(translateMap, getInstanceById, {
                                    ...change.base,
                                    points:
                                      baseValueFromProfession === change.base.points
                                        ? change.base.points
                                        : `<ins>${baseValueFromProfession?.toFixed() ?? "n/a"}</ins><del>${change.base.points.toFixed()}</del>`,
                                  }),
                                  replacement: renderSpellworkAdjustment(
                                    translateMap,
                                    getInstanceById,
                                    change.replacement,
                                  ),
                                })
                              }) ?? []
                            ).concat(
                              lessonPackage.content.skills
                                ?.filter(
                                  abilityAdjustment => abilityAdjustment.kind === "Spellwork",
                                )
                                .map(
                                  renderAbilityAdjustment(
                                    translate,
                                    translateMap,
                                    getInstanceById,
                                    baseProfessionPackage,
                                  ),
                                )
                                .toSorted(localeCompare) ?? [],
                            ),
                          )?.join(", ") ??
                          translate("none"),
                      },
                      {
                        label: translate("Skills (+)"),
                        value: renderAbilityAdjustments(
                          translate,
                          translateMap,
                          localeCompare,
                          getInstanceById,
                          baseProfessionPackage,
                          boni.filter(abilityAdjustment => abilityAdjustment.kind !== "Spellwork"),
                        ),
                      },
                      {
                        label: translate("Skills (−)"),
                        value: renderAbilityAdjustments(
                          translate,
                          translateMap,
                          localeCompare,
                          getInstanceById,
                          baseProfessionPackage,
                          mali.filter(abilityAdjustment => abilityAdjustment.kind !== "Spellwork"),
                        ),
                      },
                    ],
                  },
                }
              },
            ),
          )
          .filter(isNotNullish)
          .toSorted(on(packageDescription => packageDescription.label, localeCompare)),
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
