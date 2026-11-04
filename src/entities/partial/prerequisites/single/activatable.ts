import { mapObject } from "@elyukai/utils/object"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  ResolvedSelectOption,
  ResolvedSelectOptionIdentifier,
} from "@optolith/database-schema/cache"
import type {
  ActivatableIdentifier,
  ActivatableNameBuilderRules,
  ActivatablePrerequisite,
  CommonnessSelectOptionIdentifier,
  ProfessionActivatablePrerequisite,
  RequirableSelectOptionIdentifier,
} from "@optolith/database-schema/gen"
import { Case } from "tsondb/schema/gen"
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

export type RenderedDerivedSelectOptionIdentifier = Exclude<
  (ResolvedSelectOptionIdentifier | CommonnessSelectOptionIdentifier)["kind"],
  "General"
>

/**
 * Needed environment for printing the name of an activatable.
 */
export type ActivatableNameEnv = StdEnv<
  "t" | "rso" | "ibi" | "dip",
  ActivatableIdentifier["kind"] | "Aspect" | RenderedDerivedSelectOptionIdentifier
>

/**
 * Get the name components of an activatable.
 */
export const printActivatableName = (
  id: ActivatableIdentifier,
  options:
    | (
        | RequirableSelectOptionIdentifier
        | Case<"Text", LocaleMap<string> | string>
        | Case<"Select">
      )[]
    | undefined,
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
        : Reader.asks((env: ActivatableNameEnv) =>
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

/**
 * Get the translation of a blessed tradition prerequisite.
 */
export const printProfessionActivatablePrerequisite = (
  prerequisite: ProfessionActivatablePrerequisite,
): Reader<ActivatableNameEnv & StdEnv<"tm">, PrerequisitePart | undefined> =>
  prerequisite.display_option !== undefined
    ? printDisplayOption(prerequisite.display_option)
    : printActivatableName(
        prerequisite.id,
        prerequisite.options?.map(opt => {
          switch (opt.kind) {
            case "Identifier":
              return opt.Identifier
            case "Select":
              return opt
            case "Text":
              return Case(
                "Text",
                mapObject(opt.Text.translations, t => t.text),
              )
            default:
              return assertExhaustive(opt)
          }
        }),
        prerequisite.level,
      ).then(nameComponents =>
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
