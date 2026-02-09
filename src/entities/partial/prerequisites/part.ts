import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { SentenceType } from "optolith-database-schema/gen"
import { LocaleEnvironment } from "../../../helpers/locale.js"

/**
 * A part of the total list of prerequisites.
 */
export type PrerequisitePart = {
  label?: string
  value: string
  sentenceType: SentenceType | undefined
  isMeta: boolean
}

/**
 * Join prerequisite parts using their configuration.
 */
export const joinPrerequisiteParts = (
  locale: LocaleEnvironment,
  parts: PrerequisitePart[],
): string =>
  parts.reduce(
    (acc, part, i, arr) => {
      const text =
        part.label === undefined ? part.value : part.label + part.value

      if (acc === "") {
        return text
      }

      switch (part.sentenceType?.kind) {
        case "Standalone":
          return `${
            /[.;]$/u.test(acc) ? `${acc.slice(0, -1)}. ` : `${acc}. `
          }${text}${text.endsWith(".") ? "" : "."}`
        case "Connected":
          return `${/[.;]$/u.test(acc) ? `${acc} ` : `${acc}; `}${text}${
            i < arr.length - 1 ? ";" : ""
          }`
        case undefined:
          return `${acc}${/[.;]$/u.test(acc) ? " " : ", "}${text}`
        default:
          return assertExhaustive(part.sentenceType)
      }
    },
    parts.every(part => part.isMeta) ? locale.translate("none") : "",
  )
