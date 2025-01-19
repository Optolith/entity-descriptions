import { isNotNullish } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import { PactPrerequisite } from "optolith-database-schema/types/prerequisites/single/PactPrerequisite"
import { GetById } from "../../../../helpers/getTypes.js"
import { LocaleEnvironment } from "../../../../helpers/locale.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printPactPrerequisite = (
  getPactCategoryById: GetById.Static.PactCategory,
  locale: LocaleEnvironment,
  prerequisite: PactPrerequisite,
): PrerequisitePart | undefined => {
  if (prerequisite.display_option !== undefined) {
    return printDisplayOption(locale, prerequisite.display_option)
  }

  const pactCategory = getPactCategoryById(
    prerequisite.category.id.pact_category,
  )

  const parts = [
    prerequisite.domain_id === undefined
      ? undefined
      : locale.translate(
          "domain {0}",
          locale.joinDisjunctionList(
            prerequisite.domain_id.map(
              ref =>
                locale.translateMap(
                  pactCategory?.domains.find(
                    domain => domain.id === ref.id.pact_domain,
                  )?.translations,
                )?.name ?? MISSING_VALUE,
            ),
          ),
        ),
    locale.translate(
      "{0} level {1}",
      locale.translateMap(pactCategory?.translations)?.name ?? MISSING_VALUE,
      romanize(prerequisite.level ?? 1),
    ),
  ].filter(isNotNullish)

  return {
    value: parts.join(", "),
    sentenceType: undefined,
    isMeta: false,
  }
}
