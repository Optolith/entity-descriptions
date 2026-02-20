import { mapNullableDefault } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import type { ResponsiveTextOptional } from "optolith-database-schema/gen"
import type {
  LocaleMap,
  Translate,
  TranslateMap,
} from "../../helpers/translate.js"
import { type StdReader } from "./reader.js"
import { getResponsiveTextOptional } from "./responsiveText.js"
import { MISSING_VALUE } from "./unknown.js"

/**
 * Renders a map of options to a string.
 */
export const renderMap = <
  M extends { options: MO[]; translations?: LocaleMap<MT> },
  MOT = M extends { options: { translations?: LocaleMap<infer MOT_> }[] }
    ? MOT_
    : never,
  MT = M extends { translations?: LocaleMap<infer MT_> } ? MT_ : never,
  MO extends { translations?: LocaleMap<MOT> } = M extends {
    options: (infer MO_ & { translations?: LocaleMap<MOT> })[]
  }
    ? MO_
    : never,
>(
  translate: Translate,
  translateMap: TranslateMap,
  map: M,
  getValue: (option: MO) => string | number,
  surroundValues: (values: string) => string = values => values,
  getLabel: (optionTranslation: MOT) => string,
  getListPrefix: (translation: MT) => string | undefined,
  getListSuffix: (translation: MT) => string | undefined,
  getReplacement: (translation: MT) => string | undefined,
  ...moreToAppend: (
    | {
        surround: (values: string) => string
        getAdditionalValue: (
          option: MO,
          optionTranslation: MOT,
        ) => string | number
      }
    | undefined
  )[]
): string => {
  const translation = translateMap(map.translations)

  if (translation === undefined) {
    return MISSING_VALUE
  }

  const replacement = getReplacement(translation)

  if (replacement !== undefined) {
    return replacement
  }

  return `${surroundValues(map.options.map(option => getValue(option)).join("/"))} ${translate("for")} ${mapNullableDefault(getListPrefix(translation), listPrefix => `${listPrefix} `, "")}${map.options
    .map(option => {
      const optionTranslation = translateMap(option.translations)

      if (optionTranslation === undefined) {
        return MISSING_VALUE
      }

      return getLabel(optionTranslation)
    })
    .join(
      "/",
    )}${mapNullableDefault(getListSuffix(translation), listSuffix => ` ${listSuffix}`, "")}${moreToAppend
    .filter(isNotNullish)
    .map(({ surround, getAdditionalValue }) =>
      surround(
        map.options
          .map(option => {
            const optionTranslation = translateMap(option.translations)

            if (optionTranslation === undefined) {
              return MISSING_VALUE
            }

            return getAdditionalValue(option, optionTranslation)
          })
          .join("/"),
      ),
    )
    .join("")}`
}

/**
 * Renders a map of options to a string.
 */
export const renderResponsiveMap = <
  M extends {
    options: MO[]
    translations?: LocaleMap<{
      list_prepend?: ResponsiveTextOptional
      listPrefix?: ResponsiveTextOptional
      list_append?: ResponsiveTextOptional
      listSuffix?: ResponsiveTextOptional
      replacement?: ResponsiveTextOptional
    }>
  },
  MO extends { translations?: LocaleMap<{ label: ResponsiveTextOptional }> } =
    M extends {
      options: (infer MO_)[]
    }
      ? MO_
      : never,
>(
  map: M,
  getValue: (option: MO) => string | number,
  surroundValues: ((values: string) => string) | undefined,
  ...moreToAppend: (
    | {
        surround: (values: string) => string
        getAdditionalValue: (
          option: MO,
          optionTranslation: { label: ResponsiveTextOptional },
        ) => string | number
      }
    | undefined
  )[]
): StdReader<string, "t" | "tm" | "rts"> =>
  Reader.asks(({ translate, translateMap, responsiveTextSize }) =>
    renderMap<
      M,
      { label: ResponsiveTextOptional },
      {
        list_prepend?: ResponsiveTextOptional
        listPrefix?: ResponsiveTextOptional
        list_append?: ResponsiveTextOptional
        listSuffix?: ResponsiveTextOptional
        replacement?: ResponsiveTextOptional
      },
      MO
    >(
      translate,
      translateMap,
      map,
      getValue,
      surroundValues,
      translation =>
        getResponsiveTextOptional(translation.label, responsiveTextSize) ??
        translation.label.full,
      translation =>
        mapNullable(translation.listPrefix ?? translation.list_prepend, text =>
          getResponsiveTextOptional(text, responsiveTextSize),
        ),
      translation =>
        mapNullable(translation.listSuffix ?? translation.list_append, text =>
          getResponsiveTextOptional(text, responsiveTextSize),
        ),
      translation =>
        mapNullable(translation.replacement, text =>
          getResponsiveTextOptional(text, responsiveTextSize),
        ),
      ...moreToAppend,
    ),
  )
