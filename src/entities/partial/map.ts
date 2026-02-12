import { mapNullableDefault } from "@elyukai/utils/nullable"
import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import type { ResponsiveTextOptional } from "optolith-database-schema/gen"
import type {
  LocaleMap,
  Translate,
  TranslateMap,
} from "../../helpers/translate.js"
import {
  getResponsiveTextOptional,
  type ResponsiveTextSize,
} from "./responsiveText.js"
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
  responsiveTextSize: ResponsiveTextSize,
  map: M,
  getValue: (option: MO) => string | number,
  surroundValues: ((values: string) => string) | undefined,
  getLabel: (optionTranslation: MOT) => ResponsiveTextOptional,
  getListPrefix: (translation: MT) => ResponsiveTextOptional | undefined,
  getListSuffix: (translation: MT) => ResponsiveTextOptional | undefined,
  getReplacement: (translation: MT) => ResponsiveTextOptional | undefined,
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
): string =>
  renderMap<M, MOT, MT, MO>(
    translate,
    translateMap,
    map,
    getValue,
    surroundValues,
    translation => {
      const responsiveLabel = getLabel(translation)
      return (
        getResponsiveTextOptional(responsiveLabel, responsiveTextSize) ??
        responsiveLabel.full
      )
    },
    translation =>
      mapNullable(getListPrefix(translation), text =>
        getResponsiveTextOptional(text, responsiveTextSize),
      ),
    translation =>
      mapNullable(getListSuffix(translation), text =>
        getResponsiveTextOptional(text, responsiveTextSize),
      ),
    translation =>
      mapNullable(getReplacement(translation), text =>
        getResponsiveTextOptional(text, responsiveTextSize),
      ),
    ...moreToAppend,
  )
