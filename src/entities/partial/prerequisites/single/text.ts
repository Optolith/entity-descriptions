import { Reader } from "@elyukai/utils/reader"
import type { TextPrerequisite } from "@optolith/database-schema/gen"
import type { StdReader } from "../../../../env.js"
import { MISSING_VALUE } from "../../unknown.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a text prerequisite.
 */
export const printTextPrerequisite = (
  prerequisite: TextPrerequisite,
): StdReader<PrerequisitePart | undefined, "tm"> =>
  Reader.asks(env => ({
    value: env.translateMap(prerequisite.translations)?.text ?? MISSING_VALUE,
    sentenceType: prerequisite.sentence_type,
    isMeta: prerequisite.is_meta ?? false,
  }))
