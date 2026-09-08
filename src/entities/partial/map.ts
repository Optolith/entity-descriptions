import { mapNullableDefault } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import type { ParameterMapStyle, ResponsiveTextOptional } from "@optolith/database-schema/gen"
import { isNotNullish, mapNullable } from "@optolith/helpers/nullable"
import type { LocaleMap } from "../../helpers/translate.js"
import { type StdEnv, type StdReader } from "./reader.js"
import { getResponsiveTextOptional } from "./responsiveText.js"
import { MISSING_VALUE } from "./unknown.js"

/**
 * Renders a map of options to a string.
 */
export const renderMap = <V, T, OT, VEnv, SVEnv>(
  map: {
    options: { value: V; translations?: LocaleMap<OT> }[]
    style: ParameterMapStyle
    translations?: LocaleMap<T>
  },
  getValue: (option: V) => Reader<VEnv, string | number>,
  surroundValues: (values: string) => Reader<SVEnv, string> = values =>
    Reader.of<SVEnv, string>(values),
  getLabel: (optionTranslation: OT) => string,
  getListPrefix: (translation: T) => string | undefined,
  getListSuffix: (translation: T) => string | undefined,
  getReplacement: (translation: T) => string | undefined,
  ...moreToAppend: (
    | {
        surround: (values: string) => StdReader<string, "t">
        getAdditionalValue: (option: V, optionTranslation: OT) => string | number
      }
    | undefined
  )[]
): Reader<StdEnv<"t" | "tm"> & VEnv & SVEnv, string> =>
  Reader.asks(env => {
    const translation = env.translateMap(map.translations)

    const replacement = mapNullable(translation, t => getReplacement(t))

    if (isNotNullish(replacement)) {
      return replacement
    }

    if (map.style.kind === "Verbose") {
      return map.options
        .map(option => {
          const value = getValue(option.value).run(env)
          const optionTranslation = env.translateMap(option.translations)
          return `${surroundValues(typeof value === "number" ? value.toFixed() : value).run(env)} ${env.translate("for")} ${mapNullableDefault(mapNullable(translation, getListPrefix), listPrefix => `${listPrefix} `, "")}${optionTranslation === undefined ? MISSING_VALUE : getLabel(optionTranslation)}${mapNullableDefault(mapNullable(translation, getListSuffix), listSuffix => ` ${listSuffix}`, "")}${moreToAppend
            .filter(isNotNullish)
            .map(({ surround, getAdditionalValue }) => {
              const additionalValue =
                optionTranslation === undefined
                  ? MISSING_VALUE
                  : getAdditionalValue(option.value, optionTranslation)
              return surround(
                typeof additionalValue === "number" ? additionalValue.toFixed() : additionalValue,
              ).run(env)
            })
            .join("")}`
        })
        .join(", ")
    }

    return `${surroundValues(map.options.map(option => getValue(option.value).run(env)).join("/")).run(env)} ${env.translate("for")} ${mapNullableDefault(mapNullable(translation, getListPrefix), listPrefix => `${listPrefix} `, "")}${map.options
      .map(option => {
        const optionTranslation = env.translateMap(option.translations)

        if (optionTranslation === undefined) {
          return MISSING_VALUE
        }

        return getLabel(optionTranslation)
      })
      .join(
        "/",
      )}${mapNullableDefault(mapNullable(translation, getListSuffix), listSuffix => ` ${listSuffix}`, "")}${moreToAppend
      .filter(isNotNullish)
      .map(({ surround, getAdditionalValue }) =>
        surround(
          map.options
            .map(option => {
              const optionTranslation = env.translateMap(option.translations)

              if (optionTranslation === undefined) {
                return MISSING_VALUE
              }

              return getAdditionalValue(option.value, optionTranslation)
            })
            .join("/"),
        ).run(env),
      )
      .join("")}`
  })

/**
 * Renders a map of options to a string.
 */
export const renderResponsiveMap = <T, VEnv, SVEnv>(
  map: {
    options: { value: T; translations?: LocaleMap<{ label: ResponsiveTextOptional }> }[]
    style: ParameterMapStyle
    translations?: LocaleMap<{
      listPrefix?: ResponsiveTextOptional
      listSuffix?: ResponsiveTextOptional
      replacement?: ResponsiveTextOptional
    }>
  },
  getValue: (option: T) => Reader<VEnv, string | number>,
  surroundValues: ((values: string) => Reader<SVEnv, string>) | undefined,
  ...moreToAppend: (
    | {
        surround: (values: string) => StdReader<string, "t">
        getAdditionalValue: (
          option: T,
          optionTranslation: { label: ResponsiveTextOptional },
        ) => string | number
      }
    | undefined
  )[]
): Reader<StdEnv<"t" | "tm" | "rts"> & VEnv & SVEnv, string> =>
  Reader.asks(env =>
    renderMap<
      T,
      {
        listPrefix?: ResponsiveTextOptional
        listSuffix?: ResponsiveTextOptional
        replacement?: ResponsiveTextOptional
      },
      { label: ResponsiveTextOptional },
      VEnv,
      SVEnv
    >(
      map,
      getValue,
      surroundValues,
      translation =>
        getResponsiveTextOptional(translation.label, env.responsiveTextSize) ??
        translation.label.full,
      translation =>
        mapNullable(translation.listPrefix, text =>
          getResponsiveTextOptional(text, env.responsiveTextSize),
        ),
      translation =>
        mapNullable(translation.listSuffix, text =>
          getResponsiveTextOptional(text, env.responsiveTextSize),
        ),
      translation =>
        mapNullable(translation.replacement, text =>
          getResponsiveTextOptional(text, env.responsiveTextSize),
        ),
      ...moreToAppend,
    ).run(env),
  )
