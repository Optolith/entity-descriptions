import { Reader } from "@elyukai/utils/reader"
import type { ProfessionPrerequisite } from "@optolith/database-schema/gen"
import type { StdEnv, StdReader } from "../../../../env.js"
import { attributedInstance } from "../../markdown.js"
import { getProfessionName } from "../../professions.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a profession prerequisite.
 */
export const printProfessionPrerequisite = (
  prerequisite: ProfessionPrerequisite,
): StdReader<PrerequisitePart | undefined, "tm" | "acibp", never, never, "ProfessionVersion"> =>
  prerequisite.displayOption !== undefined
    ? printDisplayOption(prerequisite.displayOption)
    : Reader.asks((env: StdEnv<"tm" | "acibp", never, never, "ProfessionVersion">) =>
        getProfessionName(env.translateMap, env.getChildInstancesForInstanceId, prerequisite.id),
      ).map(name => ({
        value:
          name === undefined
            ? MISSING_VALUE
            : attributedInstance(name, "Profession", prerequisite.id, {
                context: '"prerequisite"',
              }),
        sentenceType: undefined,
        isMeta: false,
      }))
