import { on } from "@elyukai/utils/function"
import { isNotNullish } from "@elyukai/utils/nullable"
import { compareNumber } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { getAdventurePointsForActivation } from "@optolith/adventure-points/improvement-cost"
import type {
  ImprovementCost,
  RatedIdentifier,
  SkillWithEnhancementsIdentifier,
} from "optolith-database-schema/gen"
import type { RawEntityDescriptionSection } from "../../index.js"
import { printEnhancementPrerequisites } from "./prerequisites/index.js"
import {
  getChildInstancesForInstanceIdR,
  translateMapR,
  translateR,
  type StdEnv,
  type StdReader,
} from "./reader.js"

/**
 * Render the enhancements section for an entity description, if applicable.
 */
export const renderEnhancements = (
  parentId: SkillWithEnhancementsIdentifier,
  parentImprovementCost: ImprovementCost,
): StdReader<
  RawEntityDescriptionSection | undefined,
  "t" | "tm" | "lc" | "lj" | "ibi" | "acibp",
  RatedIdentifier["kind"] | "Enhancement",
  "Enhancement"
> =>
  getChildInstancesForInstanceIdR("Enhancement", parentId).thenW(enhancements =>
    Reader.traverse(
      enhancements.toSorted(on(e => e.content.skill_rating, compareNumber)),
      enhancement =>
        translateMapR(enhancement.content.translations).thenW(translation =>
          Reader.ask<
            StdEnv<"t" | "tm" | "lc" | "lj" | "ibi", RatedIdentifier["kind"] | "Enhancement">
          >().map(env =>
            translation === undefined
              ? undefined
              : `- ^[${translation.name}](entity: "Enhancement") (${env.translate("SR {$value}", { value: enhancement.content.skill_rating })}, ${env.translate("{$value} AP", { value: enhancement.content.adventure_points_modifier * getAdventurePointsForActivation(parentImprovementCost.kind) })}): ${translation.effect}${enhancement.content.prerequisites === undefined ? "" : ` ${env.translate(".input {$hiddenCount :number} {{Prerequisites}}", { hiddenCount: enhancement.content.prerequisites.length })}: ${printEnhancementPrerequisites(env.getInstanceById, { translate: env.translate, translateMap: env.translateMap, compare: env.localeCompare, join: env.localeJoin }, enhancement.content.prerequisites)}`}`,
          ),
        ),
    ).thenW(enhancementDescriptions => {
      const nonNullishDescriptions = enhancementDescriptions.filter(isNotNullish)

      if (nonNullishDescriptions.length === 0) {
        return Reader.of(undefined)
      }

      return translateR("Enhancements").map(
        (label): RawEntityDescriptionSection => ({
          type: "labeled",
          label,
          value: {
            type: "plain",
            text: nonNullishDescriptions.join("\n"),
          },
        }),
      )
    }),
  )
