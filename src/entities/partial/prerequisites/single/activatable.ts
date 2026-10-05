import { Reader } from "@elyukai/utils/reader"
import type {
  ResolvedSelectOption,
  ResolvedSelectOptionIdentifier,
} from "@optolith/database-schema/cache"
import type {
  ActivatableIdentifier,
  ActivatableNameBuilderRules,
  ActivatablePrerequisite,
  RequirableSelectOptionIdentifier,
} from "@optolith/database-schema/gen"
import type { StdEnv } from "../../../../env.js"
import type { LocaleMap } from "../../../../helpers/translate.js"
import { getNameComponents, type ActivatableNameComponents } from "../../activatableNameChunks.js"
import { getInstanceByIdR, translateR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import { printDisplayOption } from "../displayOption.js"
import type { PrerequisitePart } from "../part.js"

/**
 * Gets a resolved select option by its identifier.
 */
export type GetResolvedSelectOptionById = (
  id: ActivatableIdentifier,
  selectOptionId: ResolvedSelectOptionIdentifier,
) => ResolvedSelectOption | undefined

/**
 * Needed environment for printing the name of an activatable.
 */
export type ActivatableNameEnv = StdEnv<
  "t" | "rso" | "ibi" | "dip",
  | ActivatableIdentifier["kind"]
  | "Aspect"
  | Exclude<RequirableSelectOptionIdentifier["kind"], "General">
>

/**
 * Get the name components of an activatable.
 */
export const printActivatableName = (
  id: ActivatableIdentifier,
  options: RequirableSelectOptionIdentifier[] | undefined,
  level: number | undefined,
): Reader<ActivatableNameEnv, ActivatableNameComponents | undefined> =>
  getInstanceByIdR(id).thenW(
    (
      entry:
        | {
            nameBuilderRules?: ActivatableNameBuilderRules
            translations: LocaleMap<{ name: string }>
          }
        | undefined,
    ) =>
      entry === undefined
        ? Reader.of(undefined)
        : Reader.asks(
            (
              env: StdEnv<
                "t" | "rso" | "ibi" | "dip",
                | ActivatableIdentifier["kind"]
                | "Aspect"
                | Exclude<RequirableSelectOptionIdentifier["kind"], "General">
              >,
            ) =>
              getNameComponents(
                env.translate,
                id,
                options,
                level,
                entry.nameBuilderRules,
                entry.translations,
                t => t.name,
                env.getInstanceById,
                env.getResolvedSelectOptionById,
                env.displayedInProfession,
              ),
          ),
  )

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printActivatablePrerequisite = (
  prerequisite: ActivatablePrerequisite,
): Reader<ActivatableNameEnv & StdEnv<"tm">, PrerequisitePart | undefined> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : printActivatableName(prerequisite.id, prerequisite.options, prerequisite.level).then(
        nameComponents =>
          (prerequisite.id.kind === "Advantage"
            ? prerequisite.active
              ? translateR("advantage")
              : translateR("no advantage")
            : prerequisite.id.kind === "Disadvantage"
              ? prerequisite.active
                ? translateR("disadvantage")
                : translateR("no disadvantage")
              : prerequisite.active
                ? translateR("special ability")
                : translateR("no special ability")
          ).map((label): PrerequisitePart | undefined => ({
            label: `${label} `,
            value: nameComponents ?? MISSING_VALUE,
            sentenceType: undefined,
            isMeta: false,
          })),
      )
