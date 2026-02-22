import { partition } from "@elyukai/utils/array/groups"
import { reduceWhile } from "@elyukai/utils/array/reductions"
import { Dictionary } from "@elyukai/utils/dictionary"
import { deepEqual } from "@elyukai/utils/equality"
import { sign } from "@elyukai/utils/string/number"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import type {
  AbilityAdjustment,
  ElectiveSpellworks,
  ProfessionPackage,
  RestrictedProperty,
  RestrictedSpellwork,
  RestrictedSpellworks,
  SpellworkAdjustment,
  SpellworkIdentifier,
} from "optolith-database-schema/gen"
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
            translateMap(getInstanceById(item.id)?.translations)?.name,
            name => {
              if (item.restriction === undefined) {
                return name
              }

              return (
                name +
                parensIf(
                  translateMap(
                    getInstanceById("Element", item.restriction.Element)
                      ?.translations,
                  )?.name ?? MISSING_VALUE,
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
  getInstanceById: GetInstanceById<
    SpellworkIdentifier["kind"] | "Element" | "Property"
  >,
  restrictedSpellworks: RestrictedSpellworks,
): string => {
  const restrictedGroups = Dictionary.groupBy(
    restrictedSpellworks,
    restriction =>
      restriction.kind === "Spellwork"
        ? "spellwork"
        : restriction.kind === "Property" &&
            restriction.Property.maximum !== undefined
          ? "restrictedProperty"
          : restriction.kind === "Property" ||
              restriction.kind === "DemonSummoning"
            ? "property"
            : "other",
  )

  const addExclusion = (
    excludedSpellworks: SpellworkIdentifier[] | undefined,
  ) => {
    if (excludedSpellworks === undefined) {
      return ""
    }

    const translatedSpellworks = excludedSpellworks
      .map(
        excludedSpellwork =>
          translateMap(getInstanceById(excludedSpellwork)?.translations)?.name,
      )
      .filter(isNotNullish)

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
              translateMap(
                getInstanceById("Property", restriction.Property.id)
                  ?.translations,
              )?.name ?? MISSING_VALUE,
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
            return translateMap(
              getInstanceById("Property", restriction.Property.id)
                ?.translations,
            )?.name
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
      ?.map(
        restriction =>
          translateMap(getInstanceById(restriction.Spellwork)?.translations)
            ?.name,
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
          return translate(
            "no spellworks that inflict DP or sDP on intelligent creatures",
          )
        default:
          return assertExhaustive(restriction)
      }
    }) ?? []

  return [
    ...restrictedProperties,
    ...properties,
    ...others,
    ...spellworks,
  ].join("; ")
}

const renderSpellworkAdjustment = (
  translateMap: TranslateMap,
  getInstanceById: GetInstanceById<
    SpellworkIdentifier["kind"] | "MagicalTradition"
  >,
  adjustment: SpellworkAdjustment,
): string =>
  `${
    translateMap(getInstanceById(adjustment.id)?.translations)?.name ??
    MISSING_VALUE
  } ${adjustment.points}${parensIf(
    adjustment.tradition === undefined
      ? undefined
      : translateMap(
          getInstanceById("MagicalTradition", adjustment.tradition)
            ?.translations,
        )?.name,
  )}`

const getBaseProfessionPackage = (
  getAllInstances: GetAllInstances<"Profession">,
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<
    "ProfessionVersion" | "ProfessionPackage"
  >,
  idMap: IdMap,
  curriculumId: string,
) => {
  const baseProfession = getAllInstances("Profession").find(
    profession =>
      profession.content.group.kind === "Magical" &&
      profession.content.group.Magical.curriculum === curriculumId,
  )

  if (baseProfession === undefined) {
    return undefined
  }

  return reduceWhile(
    getChildInstancesForInstanceId("ProfessionVersion", baseProfession.id),
    (_acc: { id: string; content: ProfessionPackage } | undefined, version) =>
      getChildInstancesForInstanceId("ProfessionPackage", version.id).find(
        professionPackage =>
          professionPackage.content.experience_level === undefined ||
          professionPackage.content.experience_level ===
            idMap.ExperienceLevel.Experienced,
      ),
    isNotNullish,
    undefined,
  )
}

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
        translateMap(
          getInstanceById("Skill", abilityAdjustment.Skill.id)?.translations,
        )?.name ?? MISSING_VALUE
      )
    case "CombatTechnique":
      return (
        translateMap(
          getInstanceById(abilityAdjustment.CombatTechnique.id)?.translations,
        )?.name ?? MISSING_VALUE
      )
    case "Spellwork":
      return (
        (translateMap(
          getInstanceById(abilityAdjustment.Spellwork.id)?.translations,
        )?.name ?? MISSING_VALUE) +
        parensIf(
          abilityAdjustment.Spellwork.tradition === undefined
            ? undefined
            : translateMap(
                getInstanceById(
                  "MagicalTradition",
                  abilityAdjustment.Spellwork.tradition,
                )?.translations,
              )?.name,
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
      return baseProfessionPackage.skills?.find(
        skill => skill.id === abilityAdjustment.Skill.id,
      )?.rating_modifier
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

const renderAbilityAdjustmentModifierValue = (
  abilityAdjustment: AbilityAdjustment,
) => {
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

const renderAbilityAdjustmentDefaultValue = (
  abilityAdjustment: AbilityAdjustment,
) => {
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
        const basePoints =
          (renderAbilityAdjustmentBaseValue(
            baseProfessionPackage,
            abilityAdjustment,
          ) ?? 0) + renderAbilityAdjustmentDefaultValue(abilityAdjustment)
        return translate("{$replacement} instead of {$base}", {
          base: basePoints,
          replacement: `${renderAbilityAdjustmentName(
            translateMap,
            getInstanceById,
            abilityAdjustment,
          )} ${basePoints + renderAbilityAdjustmentModifierValue(abilityAdjustment)}`,
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
  list
    ?.map(
      renderAbilityAdjustment(
        translate,
        translateMap,
        getInstanceById,
        baseProfessionPackage,
      ),
    )
    .toSorted(localeCompare)
    .join(", ") ?? translate("none")

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

    const baseProfessionPackage = getBaseProfessionPackage(
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
                translateMap(
                  getInstanceById("Guideline", entry.guideline)?.translations,
                )?.name ?? MISSING_VALUE,
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
                const [boni, mali] = partition(
                  lessonPackage.content.skills ?? [],
                  adjustment => {
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
                  },
                )

                return {
                  type: "labeled",
                  label: lessonPackageTranslation.name,
                  value: {
                    type: "definitionList",
                    items: [
                      {
                        label: translate("Spellwork Changes"),
                        value:
                          lessonPackageTranslation?.spellwork_changes ??
                          lessonPackage.content.spellwork_changes
                            ?.map(change =>
                              translate("{$replacement} instead of {$base}", {
                                base: renderSpellworkAdjustment(
                                  translateMap,
                                  getInstanceById,
                                  change.base,
                                ),
                                replacement: renderSpellworkAdjustment(
                                  translateMap,
                                  getInstanceById,
                                  change.replacement,
                                ),
                              }),
                            )
                            .join(", ") ??
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
                          boni,
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
                          mali,
                        ),
                      },
                    ],
                  },
                }
              },
            ),
          )
          .filter(isNotNullish),
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
