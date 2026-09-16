import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  ParameterMap,
  ParameterMapOption,
  ResponsiveTextOptional,
  ValueMap,
  ValueMapTranslation,
} from "@optolith/database-schema/gen"
import { isNotNullish } from "@optolith/helpers/nullable"
import type { StdEnv, StdReader } from "../../env.js"
import type { LocaleMap } from "../../helpers/translate.js"
import { responsiveTextOptionalR, sequence, translateMapR, translateR } from "./reader.js"
import { MISSING_VALUE } from "./unknown.js"

const renderReplacement = <TE>(
  translation: ValueMapTranslation | undefined,
  alt: () => Reader<TE, string>,
): Reader<TE & StdEnv<"rts">, string> =>
  translation?.replacement !== undefined
    ? responsiveTextOptionalR(translation.replacement).thenW(replacement =>
        replacement === undefined ? alt() : Reader.of(replacement),
      )
    : alt()

const renderListJoiner = (
  joiner: ResponsiveTextOptional | undefined,
  spacePosition: "before" | "after",
) =>
  joiner === undefined
    ? ""
    : responsiveTextOptionalR(joiner).map(text =>
        text === undefined ? "" : spacePosition === "before" ? ` ${text}` : `${text} `,
      )

/**
 * Renders a map of options to a string.
 */
export const renderValueMap = <T, TE1, TE2, TE3, TE4, TE5, V extends string | number>(
  map: ValueMap<T>,
  renderValueMapOptionValue: (option: T, index: number) => Reader<TE1, V>,
  renderValueMapOptionLabel: (option: T, index: number) => Reader<TE2, string>,
  formatValue: (value: V | string) => Reader<TE3, string>,
  ...moreToAppend: (
    | {
        render: (option: T, index: number) => Reader<TE4, V>
        format: (value: V | string) => Reader<TE5, string>
      }
    | undefined
  )[]
): Reader<TE1 & TE2 & TE3 & TE4 & TE5 & StdEnv<"t" | "tm" | "rts">, string> =>
  translateMapR(map.translations).thenW(translation =>
    renderReplacement(translation, () => {
      const { listPrefix, listSuffix } = translation ?? {}
      const listPrefixR = renderListJoiner(listPrefix, "after")
      const listSuffixR = renderListJoiner(listSuffix, "before")

      const moreToAppendFns = moreToAppend.filter(isNotNullish)

      switch (map.style.kind) {
        case "Compressed": {
          return Reader.traverse(map.options, (option, index) =>
            renderValueMapOptionValue(option, index).thenW(value =>
              renderValueMapOptionLabel(option, index).map(label => ({ value, label })),
            ),
          ).thenW(
            renderedOptions =>
              sequence<
                TE3 & TE4 & TE5 & StdEnv<"t" | "rts">
              >`${formatValue(renderedOptions.map(option => (typeof option.value === "number" ? option.value.toFixed() : option.value)).join("/"))} ${translateR("for")} ${listPrefixR}${renderedOptions
                .map(option => option.label)
                .join("/")}${listSuffixR}${Reader.traverse(moreToAppendFns, more =>
                Reader.traverse(map.options, more.render).thenW(values =>
                  more.format(values.join("/")),
                ),
              ).map(values => values.join(""))}`,
          )
        }

        case "Verbose": {
          return Reader.traverse(map.options, (option, index) =>
            renderValueMapOptionValue(option, index)
              .thenW(value =>
                renderValueMapOptionLabel(option, index).map(label => ({ value, label })),
              )
              .thenW(
                ({ value, label }) =>
                  sequence<
                    TE3 & TE4 & TE5 & StdEnv<"t" | "rts">
                  >`${formatValue(value)} ${translateR("for")} ${listPrefixR}${label}${listSuffixR}${Reader.traverse(
                    moreToAppendFns,
                    more => more.render(option, index).thenW(more.format),
                  ).map(values => values.join(""))}`,
              ),
          ).map(values => values.join(", "))
        }

        default:
          return assertExhaustive(map.style)
      }
    }),
  )

/**
 * Render the label of a value map option.
 */
export const renderDefaultValueMapLabel = (option: {
  translations: LocaleMap<{ label: ResponsiveTextOptional }>
}): StdReader<string, "tm" | "rts"> =>
  translateMapR(option.translations).thenW(translation =>
    translation?.label === undefined
      ? Reader.of(MISSING_VALUE)
      : responsiveTextOptionalR(translation.label).map(text => text ?? translation.label.full),
  )

/**
 * Renders a map of parameter options to a string.
 */
export const renderParameterMap = <T, TE1, TE2, TE3, TE4, V extends string | number>(
  map: ParameterMap<T>,
  renderParameterMapValue: (value: T, index: number) => Reader<TE1, V>,
  formatValue: (value: V | string) => Reader<TE2, string>,
  ...moreToAppend: (
    | {
        render: (option: ParameterMapOption<T>, index: number) => Reader<TE3, V>
        format: (value: V | string) => Reader<TE4, string>
      }
    | undefined
  )[]
) =>
  renderValueMap<ParameterMapOption<T>, TE1, StdEnv<"tm" | "rts">, TE2, TE3, TE4, V>(
    map,
    (option, index) => renderParameterMapValue(option.value, index),
    renderDefaultValueMapLabel,
    formatValue,
    ...moreToAppend,
  )
