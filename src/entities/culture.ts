import { allSame } from "@elyukai/utils/array/filters"
import { ensureNonEmpty, isNotEmpty } from "@elyukai/utils/array/nonEmpty"
import { sumWith } from "@elyukai/utils/array/reductions"
import { equal } from "@elyukai/utils/equality"
import { identity, on } from "@elyukai/utils/function"
import { isNotNullish, mapNullable } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { sign } from "@elyukai/utils/string/number"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { getAdventurePointsForRatingRange } from "@optolith/adventure-points/improvement-cost"
import type {
  BlessedTraditionConstraint,
  CommonNames,
  CommonProfessionConstraints,
  CommonProfessionConstraintsOperation,
  CommonProfessions,
  CulturalPackageItem,
  MagicalTraditionConstraint,
  ProfessionConstraint,
  Rarity,
  Skill_ID,
  Weighted,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetAllChildInstancesForParent, GetInstanceById } from "../helpers/getTypes.js"
import type { TranslationKeysWithoutParams } from "../helpers/translate.js"
import type {
  RawDefinitionListEntityDescriptionSectionItem,
  RawEntityDescription,
  RawEntityDescriptionSectionContent,
  RawNestedDefinitionListEntityDescriptionSection,
} from "../index.js"
import {
  renderCommonnessRatedAdvantagesOrDisadvantages,
  renderValueWithPossibleTranslation,
} from "./partial/commonnessRatedAdvantagesAndDisadvantages.js"
import { getProfessionName } from "./partial/professions.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import { translateR, type EnvMap, type StdEnv, type StdReader } from "./partial/reader.js"
import { MISSING_VALUE } from "./partial/unknown.js"

const renderListOperation = (
  operation: CommonProfessionConstraintsOperation,
  list: string[],
): StdReader<string, "t"> => {
  switch (operation.kind) {
    case "Intersection":
      return Reader.of(list.join(", "))
    case "Difference":
      return translateR("all but {$excludedProfessions :list type=conjunction}", {
        excludedProfessions: list,
      })
    default:
      return assertExhaustive(operation)
  }
}

const renderCommonProfessionConstraints = <T>(
  constraints: CommonProfessionConstraints<T>,
  renderConstraint: (
    constraint: T,
  ) => StdReader<
    string | undefined,
    "t" | "tm" | "lc" | "ibi",
    "ProfessionVariant" | "BlessedTradition" | "MagicalTradition"
  >,
): StdReader<
  string,
  "t" | "tm" | "lc" | "ibi",
  "ProfessionVariant" | "BlessedTradition" | "MagicalTradition"
> =>
  Reader.asks(({ localeCompare }: StdEnv<"lc">) =>
    Reader.sequence(constraints.constraints.map(renderConstraint)).thenW(constraintValues =>
      renderListOperation(
        constraints.operation,
        constraintValues.filter(isNotNullish).toSorted(localeCompare),
      ),
    ),
  ).thenW(identity)

const renderCommonProfessionGroup = <T>(
  label: TranslationKeysWithoutParams,
  constraints: CommonProfessionConstraints<T> | undefined,
  renderConstraint: (
    constraint: T,
  ) => StdReader<
    string | undefined,
    "t" | "tm" | "lc" | "ibi",
    "ProfessionVariant" | "BlessedTradition" | "MagicalTradition"
  >,
) =>
  translateR(label).thenW(translatedLabel =>
    (constraints === undefined
      ? Reader.of("—")
      : renderCommonProfessionConstraints(constraints, renderConstraint)
    ).map(translatedValue => ({
      label: translatedLabel,
      value: translatedValue,
    })),
  )

const renderRarity = (rarity: Rarity | undefined): StdReader<string | undefined, "t"> => {
  if (rarity === undefined) {
    return Reader.of(undefined)
  }

  switch (rarity.kind) {
    case "Rare":
      return translateR("rare")
    case "VeryRare":
      return translateR("very rare")
    default:
      return assertExhaustive(rarity)
  }
}

const renderWeighted = <ID extends string>(
  weightedVariants: Weighted<ID> | undefined,
  getName: (id: ID) => string | undefined,
): StdReader<string | undefined, "t" | "lc" | "ibi"> => {
  if (weightedVariants === undefined) {
    return Reader.of(undefined)
  }

  return Reader.asks(({ translate, localeCompare }) => {
    const variants = ensureNonEmpty(
      weightedVariants.elements.map(getName).filter(isNotNullish).toSorted(localeCompare),
    )

    if (variants === undefined) {
      return undefined
    }

    switch (weightedVariants.weight.kind) {
      case "Mostly":
        return translate("mostly {$variants :list type=conjunction}", {
          variants,
        })
      case "Only":
        return translate("only {$variants :list type=conjunction}", {
          variants,
        })
      default:
        return assertExhaustive(weightedVariants.weight)
    }
  })
}

const renderProfessionConstraint = (
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<"ProfessionVersion">,
  constraint: ProfessionConstraint,
) =>
  Reader.asks(({ translateMap }: StdEnv<"tm">) =>
    getProfessionName(translateMap, getChildInstancesForInstanceId, constraint.id),
  ).thenW(baseName =>
    baseName === undefined
      ? Reader.of(undefined)
      : Reader.sequence<StdEnv<"t" | "tm" | "lc" | "ibi", "ProfessionVariant">, string | undefined>(
          [
            renderRarity(constraint.rarity),
            Reader.asks(
              ({ translateMap, getInstanceById }: StdEnv<"tm" | "ibi", "ProfessionVariant">) =>
                renderWeighted(
                  constraint.weighted_variants,
                  variantId =>
                    translateMap(getInstanceById("ProfessionVariant", variantId)?.translations)
                      ?.name.default,
                ),
            ).thenW(identity),
          ],
        ).map(notes => baseName + parensIf(ensureNonEmpty(notes.filter(isNotNullish))?.join("; "))),
  )

const renderTraditionConstraint = <E extends "MagicalTradition" | "BlessedTradition">(
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<"ProfessionVersion">,
  entity: E,
  constraint: MagicalTraditionConstraint | BlessedTraditionConstraint,
): StdReader<string | undefined, "t" | "tm" | "lc" | "ibi", E> =>
  Reader.asks(({ translateMap, getInstanceById }: StdEnv<"tm" | "ibi", E>) => {
    const translation = translateMap<{
      name: string
      nameOfBlessedOnes?: string
    }>(getInstanceById(entity, constraint.id)?.translations)

    return translation?.nameOfBlessedOnes ?? translation?.name
  }).thenW(baseName =>
    baseName === undefined
      ? Reader.of(undefined)
      : Reader.sequence([
          renderRarity(constraint.rarity),
          Reader.asks(({ translateMap }: StdEnv<"tm">) =>
            renderWeighted(constraint.weighted_professions, profId =>
              getProfessionName(translateMap, getChildInstancesForInstanceId, profId),
            ),
          ).thenW(identity),
        ]).map(
          notes => baseName + parensIf(ensureNonEmpty(notes.filter(isNotNullish))?.join("; ")),
        ),
  )

const renderCommonProfessions = (
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<"ProfessionVersion">,
  commonProfessions: CommonProfessions,
): StdReader<
  string | [RawEntityDescriptionSectionContent<RawNestedDefinitionListEntityDescriptionSection>],
  "t" | "tm" | "lc" | "ibi",
  "ProfessionVariant" | "BlessedTradition" | "MagicalTradition"
> => {
  switch (commonProfessions.kind) {
    case "Plain":
      return renderCommonProfessionConstraints(commonProfessions.Plain, profId =>
        Reader.asks(({ translateMap }) =>
          getProfessionName(translateMap, getChildInstancesForInstanceId, profId),
        ),
      )
    case "Grouped":
      return renderCommonProfessionGroup(
        "Mundane Professions",
        commonProfessions.Grouped.mundane,
        constraint =>
          // switch (constraint.kind) {
          //   case "Profession":
          renderProfessionConstraint(getChildInstancesForInstanceId, constraint.Profession),
        //   case "ProfessionSubgroup":
        //     switch (constraint.ProfessionSubgroup.kind) {
        //       case "Profane":
        //       case "Fighter":
        //       case "Religious":
        //         return Reader.of(UNHANDLED_VALUE)
        //       default:
        //         return assertExhaustive(constraint.ProfessionSubgroup)
        //     }
        //   default:
        //     return assertExhaustive(constraint)
        // }
      ).then(mundane =>
        renderCommonProfessionGroup(
          "Magic Professions",
          commonProfessions.Grouped.magic,
          constraint => {
            switch (constraint.kind) {
              case "Profession":
                return renderProfessionConstraint(
                  getChildInstancesForInstanceId,
                  constraint.Profession,
                )
              case "Tradition":
                return renderTraditionConstraint(
                  getChildInstancesForInstanceId,
                  "MagicalTradition",
                  constraint.Tradition,
                )
              case "MagicDilettante":
                return translateR("Magic Dilettante")
              default:
                return assertExhaustive(constraint)
            }
          },
        ).then(magic =>
          renderCommonProfessionGroup(
            "Blessed Professions",
            commonProfessions.Grouped.blessed,
            constraint =>
              renderTraditionConstraint(
                getChildInstancesForInstanceId,
                "BlessedTradition",
                constraint.Tradition,
              ),
          ).map(blessed => [
            {
              type: "definitionList",
              style: "nested",
              items: [mundane, magic, blessed],
            },
          ]),
        ),
      )
    default:
      return assertExhaustive(commonProfessions)
  }
}

const renderCommonSkills = (
  items: Skill_ID[] | undefined,
): StdReader<string, "t" | "tm" | "lc" | "ibi", "Skill"> =>
  Reader.asks(({ translate, translateMap, getInstanceById, localeCompare }) =>
    items === undefined || !isNotEmpty(items)
      ? translate("none")
      : items
          .map(itemId => translateMap(getInstanceById("Skill", itemId)?.translations)?.name)
          .filter(isNotNullish)
          .toSorted(localeCompare)
          .join(", "),
  )

const renderCommonNames = (
  commonNames: CommonNames,
): StdReader<
  (
    | RawEntityDescriptionSectionContent<RawNestedDefinitionListEntityDescriptionSection>
    | undefined
  )[],
  "lc"
> =>
  Reader.asks(({ localeCompare }) => {
    const groups = [
      ...(commonNames.first_name_groups ?? []),
      ...(commonNames.last_name_groups ?? []),
    ].map(
      (group): RawDefinitionListEntityDescriptionSectionItem => ({
        label: group.label,
        value: group.names
          .map(name => name.name + parensIf(name.note))
          .toSorted(localeCompare)
          .join(", "),
      }),
    )

    const specialRules = commonNames.naming_rules

    return [
      mapNullable(ensureNonEmpty(groups), renderedGroups => ({
        type: "definitionList",
        style: "nested",
        items: renderedGroups,
      })),
      mapNullable(specialRules, rules => ({
        type: "plain",
        text: rules,
      })),
    ]
  })

const renderCulturalPackage = (
  items: CulturalPackageItem[],
): StdReader<{ text: string; apValue: number }, "t" | "tm" | "lc" | "ibi", "Skill"> =>
  Reader.asks(({ translate, translateMap, getInstanceById, localeCompare }) => {
    if (!isNotEmpty(items)) {
      return { text: translate("none"), apValue: 0 }
    }

    const processedItems = items.map((item): [text: string, apValue: number] => {
      const instance = getInstanceById("Skill", item.id)
      const instanceTranslation = translateMap(instance?.translations)

      if (instance === undefined || instanceTranslation === undefined) {
        return [MISSING_VALUE, 0]
      }

      return [
        `${instanceTranslation.name} ${sign(item.points)}`,
        getAdventurePointsForRatingRange(instance.improvement_cost.kind, 0, item.points),
      ]
    })

    return {
      text: processedItems
        .map(([text]) => text)
        .toSorted(localeCompare)
        .join(", "),
      apValue: sumWith(processedItems, ([, apValue]) => apValue),
    }
  })

/**
 * Get a JSON representation of the rules text for a culture.
 */
export const getCultureEntityDescription = createEntityDescriptionCreator<
  "Culture",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Advantage"
      | "Disadvantage"
      | "Skill"
      | "Language"
      | "LanguageSpecialization"
      | "Script"
      | "SocialStatus"
      | "ProfessionVariant"
      | "MagicalTradition"
      | "BlessedTradition"
    >
    getChildInstancesForInstanceId: GetAllChildInstancesForParent<"ProfessionVersion">
  }
>(
  (
    { getInstanceById, getChildInstancesForInstanceId },
    { translate, translateMap, compare: localeCompare, join: localeJoin },
    { content: entry },
  ): RawEntityDescription | undefined => {
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const env = {
      translate,
      translateMap,
      localeCompare,
      getInstanceById,
    } satisfies Partial<EnvMap>

    const { text: culturePackageText, apValue: culturalPackageApValue } = renderCulturalPackage(
      entry.cultural_package,
    ).run(env)

    return {
      title: translation.name,
      className: "culture",
      body: [
        {
          type: "definitionList",
          items: [
            {
              label: translate("Language"),
              value: localeJoin(
                entry.language
                  .map(lang => {
                    const language = getInstanceById("Language", lang.id)
                    const languageTranslation = translateMap(language?.translations)

                    if (language === undefined || languageTranslation === undefined) {
                      return MISSING_VALUE
                    }

                    return (
                      languageTranslation.name +
                      parensIf(
                        [
                          translateMap(language.customSpecializations?.translations)?.description,
                          ...(lang.specializations?.map(
                            specId =>
                              translateMap(
                                getInstanceById("LanguageSpecialization", specId)?.translations,
                              )?.name,
                          ) ?? []),
                        ]
                          .filter(isNotNullish)
                          .toSorted(localeCompare)
                          .join(", "),
                      )
                    )
                  })
                  .toSorted(localeCompare),
                "disjunction",
              ),
            },
            {
              label: translate("Script"),
              value:
                entry.script === undefined
                  ? translate("none")
                  : (() => {
                      const processedScripts = entry.script.map((scriptId): [string, number] => {
                        const script = getInstanceById("Script", scriptId)
                        const scriptTranslation = translateMap(script?.translations)

                        if (script === undefined || scriptTranslation === undefined) {
                          return [MISSING_VALUE, 0]
                        }

                        return [scriptTranslation.name, script.ap_value ?? 0]
                      })

                      if (!isNotEmpty(processedScripts)) {
                        return translate("none")
                      }

                      if (
                        allSame(
                          processedScripts,
                          on(([, apValue]) => apValue, equal),
                        )
                      ) {
                        return (
                          localeJoin(
                            processedScripts.map(([name]) => name).toSorted(localeCompare),
                            "disjunction",
                          ) +
                          parensIf(
                            translate("{$value} AP", {
                              value: processedScripts[0][1],
                            }),
                          )
                        )
                      } else {
                        return localeJoin(
                          processedScripts
                            .map(
                              ([name, apValue]) =>
                                name +
                                parensIf(
                                  translate("{$value} AP", {
                                    value: apValue,
                                  }),
                                ),
                            )
                            .toSorted(localeCompare),
                          "disjunction",
                        )
                      }
                    })(),
            },
            {
              label: translate("Area Knowledge"),
              value:
                translation.area_knowledge.description +
                (translation.area_knowledge.examples === undefined
                  ? ""
                  : parensIf(
                      translate("for example, {$examples}", {
                        examples: translation.area_knowledge.examples
                          .map(example => example.area)
                          .join(", "),
                      }),
                    )),
            },
            {
              label: translate("Social Status"),
              value: entry.social_status
                .map(
                  status =>
                    translateMap(getInstanceById("SocialStatus", status)?.translations)?.name ??
                    MISSING_VALUE,
                )
                .toSorted(localeCompare)
                .join(", "),
            },
            {
              label: translate("Common Professions"),
              value: renderCommonProfessions(
                getChildInstancesForInstanceId,
                entry.common_professions,
              ).run(env),
            },
            renderValueWithPossibleTranslation(
              "Common Advantages",
              entry.common_advantages,
              values =>
                renderCommonnessRatedAdvantagesOrDisadvantages("Advantage", values).run(env),
              translation.common_advantages,
            ).run(env),
            renderValueWithPossibleTranslation(
              "Common Disadvantages",
              entry.common_disadvantages,
              values =>
                renderCommonnessRatedAdvantagesOrDisadvantages("Disadvantage", values).run(env),
              translation.common_disadvantages,
            ).run(env),
            renderValueWithPossibleTranslation(
              "Uncommon Advantages",
              entry.uncommon_advantages,
              values =>
                renderCommonnessRatedAdvantagesOrDisadvantages("Advantage", values).run(env),
              translation.uncommon_advantages,
            ).run(env),
            renderValueWithPossibleTranslation(
              "Uncommon Disadvantages",
              entry.uncommon_disadvantages,
              values =>
                renderCommonnessRatedAdvantagesOrDisadvantages("Disadvantage", values).run(env),
              translation.uncommon_disadvantages,
            ).run(env),
            {
              label: translate("Common Skills"),
              value: renderCommonSkills(entry.common_skills).run(env),
            },
            {
              label: translate("Uncommon Skills"),
              value: renderCommonSkills(entry.uncommon_skills).run(env),
            },
            {
              label: translate("Common Names"),
              value: renderCommonNames(translation.common_names).run(env),
            },
          ],
        },
        {
          type: "labeled",
          label:
            translate("Cultural Package {$cultureName}", {
              cultureName: translation.name,
            }) + parensIf(translate("{$value} AP", { value: culturalPackageApValue })),
          value: {
            type: "plain",
            text: culturePackageText,
          },
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
