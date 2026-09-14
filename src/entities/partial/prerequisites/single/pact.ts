import { Reader } from "@elyukai/utils/reader"
import type { PactPrerequisite } from "@optolith/database-schema/gen"
import { isNotNullish } from "@optolith/helpers/nullable"
import { romanize } from "@optolith/helpers/roman"
import type { StdEnv, StdReader } from "../../../../env.js"
import { attributedNameR, localeJoinR, localeSortR, translateR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Get the translation of a culture prerequisite.
 */
export const printPactPrerequisite = (
  prerequisite: PactPrerequisite,
): StdReader<
  PrerequisitePart | undefined,
  "t" | "tm" | "lc" | "lj" | "ibi",
  "PactCategory" | "PactDomain"
> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : attributedNameR("prerequisite", "PactCategory", prerequisite.category)
        .thenW(name =>
          Reader.sequence<
            StdEnv<"t" | "tm" | "lj" | "lc" | "ibi", "PactDomain">,
            string | undefined
          >([
            prerequisite.domain === undefined
              ? Reader.of(undefined)
              : Reader.traverse(prerequisite.domain, id =>
                  attributedNameR("prerequisite", "PactDomain", id).map(
                    domainName => domainName ?? MISSING_VALUE,
                  ),
                )
                  .thenW(localeSortR)
                  .thenW(domains => localeJoinR(domains, "disjunction"))
                  .thenW(domains => translateR("domain {$domain}", { domain: domains })),
            translateR("{$pact} level {$pactLevel}", {
              pact: name ?? MISSING_VALUE,
              pactLevel: romanize(prerequisite.level ?? 1),
            }),
          ]),
        )
        .map(parts => ({
          value: parts.filter(isNotNullish).join(", "),
          sentenceType: undefined,
          isMeta: false,
        }))
