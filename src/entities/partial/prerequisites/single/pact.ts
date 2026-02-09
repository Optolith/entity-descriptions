import { isNotNullish } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import type { PactPrerequisite } from "optolith-database-schema/gen"
import { type GetInstanceById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printPactPrerequisite = (
  getInstanceById: GetInstanceById<"PactCategory" | "PactDomain">,
  locale: LocaleEnvironment,
  prerequisite: PactPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const pactCategory = getInstanceById("PactCategory", prerequisite.category)

  const parts = [
    prerequisite.domain === undefined
      ? undefined
      : locale.translate("domain {$domain}", {
          domain: locale.joinDisjunctionList(
            prerequisite.domain.map(
              id =>
                locale.translateMap(
                  getInstanceById("PactDomain", id)?.translations,
                )?.name ?? MISSING_VALUE,
            ),
          ),
        }),
    locale.translate("{$pact} level {$pactLevel}", {
      pact:
        locale.translateMap(pactCategory?.translations)?.name ?? MISSING_VALUE,
      pactLevel: romanize(prerequisite.level ?? 1),
    }),
  ].filter(isNotNullish)

  return {
    value: parts.join(", "),
    sentenceType: undefined,
    isMeta: false,
  }
}
