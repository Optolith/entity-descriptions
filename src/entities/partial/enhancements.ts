import { on } from "@elyukai/utils/function"
import { isNotNullish } from "@elyukai/utils/nullable"
import { compareNumber } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { getAdventurePointsForActivation } from "@optolith/adventure-points/improvement-cost"
import type {
  Enhancement,
  EnhancementAdventurePoints,
  ImprovementCost,
  RatedIdentifier,
  SkillWithEnhancementsIdentifier,
} from "@optolith/database-schema/gen"
import type { RawEntityDescriptionSection } from "../../index.js"
import { filterIncludedPublicationEntriesMapR } from "../../references/publicationOptions.js"
import { printEnhancementPrerequisites } from "./prerequisites/index.js"
import {
  getChildInstancesForInstanceIdR,
  translateMapR,
  translateR,
  type StdEnv,
  type StdReader,
} from "./reader.js"

const getEnhancementAPValue = (
  adventurePoints: EnhancementAdventurePoints,
  parentImprovementCost: ImprovementCost,
): number => {
  switch (adventurePoints.kind) {
    case "DerivedFromImprovementCost":
      return (
        adventurePoints.DerivedFromImprovementCost.multiplier *
        getAdventurePointsForActivation(parentImprovementCost.kind)
      )
    case "Constant":
      return adventurePoints.Constant
    default:
      return assertExhaustive(adventurePoints)
  }
}

const renderEnhancement = (
  enhancement: { id: string; content: Enhancement },
  parentImprovementCost: ImprovementCost,
) =>
  translateMapR(enhancement.content.translations).thenW(translation =>
    Reader.ask<
      StdEnv<"t" | "tm" | "lc" | "lj" | "ibi", RatedIdentifier["kind"] | "Enhancement">
    >().map(env =>
      translation === undefined
        ? undefined
        : `- ^[${translation.name}](entity: "Enhancement") (${env.translate("SR {$value}", { value: enhancement.content.skill_rating })}, ${env.translate("{$value} AP", { value: getEnhancementAPValue(enhancement.content.adventurePoints, parentImprovementCost) })}): ${translation.effect.split("\n").join("\n  ")}${enhancement.content.prerequisites === undefined ? "" : ` ${env.translate(".input {$hiddenCount :number} {{Prerequisites}}", { hiddenCount: enhancement.content.prerequisites.length })}: ${printEnhancementPrerequisites(env.getInstanceById, { translate: env.translate, translateMap: env.translateMap, compare: env.localeCompare, join: env.localeJoin }, enhancement.content.prerequisites)}`}`,
    ),
  )

/**
 * Render the enhancements section for an entity description, if applicable.
 */
export const renderEnhancements = (
  parentId: SkillWithEnhancementsIdentifier,
  parentImprovementCost: ImprovementCost,
): StdReader<
  RawEntityDescriptionSection | undefined,
  "t" | "tm" | "lc" | "lj" | "ibi" | "acibp" | "po",
  RatedIdentifier["kind"] | "Enhancement" | "Publication",
  "Enhancement"
> =>
  getChildInstancesForInstanceIdR("Enhancement", parentId).thenW(enhancements =>
    filterIncludedPublicationEntriesMapR(enhancements, e => e.content)
      .thenW(filteredEnhancements =>
        Reader.traverse(
          filteredEnhancements.toSorted(on(e => e.content.skill_rating, compareNumber)),
          enhancement => renderEnhancement(enhancement, parentImprovementCost),
        ),
      )
      .thenW(enhancementDescriptions => {
        const nonNullishDescriptions = enhancementDescriptions.filter(isNotNullish)

        if (nonNullishDescriptions.length === 0) {
          return Reader.of(undefined)
        }

        return translateR("Enhancements").map(
          (label): RawEntityDescriptionSection => ({
            type: "labeled",
            label: `${label}:`,
            value: {
              type: "plain",
              text: nonNullishDescriptions.join("\n"),
            },
          }),
        )
      }),
  )
