import { Compare } from "@optolith/helpers/compare"
import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { type LiturgyTradition } from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { GetInstanceById } from "../helpers/getTypes.js"
import {
  Translate,
  TranslateMap,
  type TranslationKeysWithoutParams,
} from "../helpers/translate.js"
import { EntityDescriptionSection, type IdMap } from "../index.js"
import { renderOneTimeDuration } from "./partial/rated/activatable/duration.js"
import { renderEffect } from "./partial/rated/activatable/effect.js"
import {
  renderFastPerformanceParameters,
  renderSlowPerformanceParameters,
} from "./partial/rated/activatable/index.js"
import { ModifiableParameter } from "./partial/rated/activatable/nonModifiableSuffix.js"
import { renderNonModifiableRange } from "./partial/rated/activatable/range.js"
import { renderTargetCategory } from "./partial/rated/activatable/targetCategory.js"
import { renderImprovementCost } from "./partial/rated/improvementCost.js"
import { renderSkillCheckWithPenalty } from "./partial/rated/skillCheck.js"
import type { EnvMap } from "./partial/reader.js"
import { ResponsiveTextSize } from "./partial/responsiveText.js"

const getTextForTraditions = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    localeCompare: Compare<string>
    getInstanceById: GetInstanceById<"BlessedTradition" | "Aspect">
  },
  values: LiturgyTradition[],
): EntityDescriptionSection => {
  const getAspectName = (aspectId: string) =>
    deps.translateMap(deps.getInstanceById("Aspect", aspectId)?.translations)
      ?.name

  const text = values
    .map(trad => {
      switch (trad.kind) {
        case "GeneralAspect":
          return getAspectName(trad.GeneralAspect)
        case "Tradition": {
          const traditionTranslation = deps.translateMap(
            deps.getInstanceById("BlessedTradition", trad.Tradition.tradition)
              ?.translations,
          )
          const name =
            traditionTranslation?.name_compressed ?? traditionTranslation?.name

          if (name === undefined) {
            return undefined
          }

          const aspects =
            trad.Tradition.aspects
              ?.map(getAspectName)
              .filter(isNotNullish)
              .sort(deps.localeCompare) ?? []

          if (aspects.length === 0) {
            return name
          }

          return `${name} (${aspects.join(" and ")})`
        }
        default:
          return assertExhaustive(trad)
      }
    })
    .filter(isNotNullish)
    .join(", ")

  return {
    label: deps.translate("Traditions"),
    value: text,
  }
}

/**
 * Get a JSON representation of the rules text for a blessing.
 */
export const getBlessingEntityDescription = createEntityDescriptionCreator<
  "Blessing",
  {
    getInstanceById: GetInstanceById<"Publication" | "TargetCategory">
  }
>(({ getInstanceById }, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const range = renderNonModifiableRange(entry.parameters.range, false).run(env)
  const duration = renderOneTimeDuration(entry.parameters.duration).run(env)

  return {
    title: translation.name,
    className: "blessing",
    body: [
      {
        label: translate("Effect"),
        value: translation.effect,
      },
      {
        label: translate("Range"),
        value:
          range !== translation.range
            ? `***${range}*** (${translation.range})`
            : range,
      },
      {
        label: translate("Duration"),
        value:
          duration !== translation.duration
            ? `***${duration}*** (${translation.duration})`
            : duration,
      },
      renderTargetCategory(entry.target).run(env),
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a liturgical chant.
 */
export const getLiturgicalChantEntityDescription =
  createEntityDescriptionCreator<
    "LiturgicalChant",
    {
      getInstanceById: GetInstanceById<
        | "Publication"
        | "Attribute"
        | "SkillModificationLevel"
        | "TargetCategory"
        | "Aspect"
        | "BlessedTradition"
        | "DerivedCharacteristic"
      >
      idMap: IdMap
    }
  >(({ getInstanceById, idMap }, locale, { content: entry }) => {
    const { translate, translateMap, compare: localeCompare } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const env = {
      translate,
      translateMap,
      getInstanceById,
      localeJoin: locale.join,
      energyUnit: "KarmaPoints",
      responsiveTextSize: ResponsiveTextSize.Full,
      nonModifiableSuffix: (
        param: ModifiableParameter,
      ): TranslationKeysWithoutParams => {
        switch (param) {
          case ModifiableParameter.CastingTime:
            return " (you cannot use a modification on this chant’s liturgical time)"
          case ModifiableParameter.Cost:
            return " (you cannot use a modification on this chant’s cost)"
          case ModifiableParameter.Range:
            return " (you cannot use a modification on this chant’s range)"
          default:
            return assertExhaustive(param)
        }
      },
    } satisfies Partial<EnvMap>

    const { castingTime, cost, range, duration } =
      renderFastPerformanceParameters(entry.parameters).run(env)

    return {
      title: translation.name,
      className: "liturgical-chant",
      body: [
        renderSkillCheckWithPenalty(
          entry.check,
          entry.check_penalty,
          idMap,
        ).run(env),
        ...renderEffect(translation.effect).run(env),
        {
          label: translate("Liturgical Time"),
          value:
            translation.casting_time &&
            castingTime !== translation.casting_time.full
              ? `***${castingTime}*** (${translation.casting_time.full})`
              : castingTime,
        },
        {
          label: translate("KP Cost"),
          value:
            translation.cost && cost !== translation.cost.full
              ? `***${cost}*** (${translation.cost.full})`
              : cost,
        },
        {
          label: translate("Range"),
          value:
            translation.range && range !== translation.range.full
              ? `***${range}*** (${translation.range.full})`
              : range,
        },
        {
          label: translate("Duration"),
          value:
            translation.duration && duration !== translation.duration.full
              ? `***${duration}*** (${translation.duration.full})`
              : duration,
        },
        renderTargetCategory(entry.target).run(env),
        getTextForTraditions(
          {
            translate,
            translateMap,
            localeCompare,
            getInstanceById,
          },
          entry.traditions,
        ),
        renderImprovementCost(entry.improvement_cost).run(env),
      ],
      errata: translation.errata,
      references: entry.src,
    }
  })

/**
 * Get a JSON representation of the rules text for a ceremony.
 */
export const getCeremonyEntityDescription = createEntityDescriptionCreator<
  "Ceremony",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "Attribute"
      | "SkillModificationLevel"
      | "TargetCategory"
      | "Aspect"
      | "BlessedTradition"
      | "DerivedCharacteristic"
    >
    idMap: IdMap
  }
>(({ getInstanceById, idMap }, locale, { content: entry }) => {
  const { translate, translateMap, compare: localeCompare } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    getInstanceById,
    localeJoin: locale.join,
    energyUnit: "KarmaPoints",
    responsiveTextSize: ResponsiveTextSize.Full,
    nonModifiableSuffix: (
      param: ModifiableParameter,
    ): TranslationKeysWithoutParams => {
      switch (param) {
        case ModifiableParameter.CastingTime:
          return " (you cannot use a modification on this ceremony’s ceremonial time)"
        case ModifiableParameter.Cost:
          return " (you cannot use a modification on this ceremony’s cost)"
        case ModifiableParameter.Range:
          return " (you cannot use a modification on this ceremony’s range)"
        default:
          return assertExhaustive(param)
      }
    },
  } satisfies Partial<EnvMap>

  const { castingTime, cost, range, duration } =
    renderSlowPerformanceParameters(entry.parameters).run(env)

  return {
    title: translation.name,
    className: "ceremony",
    body: [
      renderSkillCheckWithPenalty(entry.check, entry.check_penalty, idMap).run(
        env,
      ),
      ...renderEffect(translation.effect).run(env),
      {
        label: translate("Ceremonial Time"),
        value:
          translation.casting_time &&
          castingTime !== translation.casting_time.full
            ? `***${castingTime}*** (${translation.casting_time.full})`
            : castingTime,
      },
      {
        label: translate("KP Cost"),
        value:
          translation.cost && cost !== translation.cost.full
            ? `***${cost}*** (${translation.cost.full})`
            : cost,
      },
      {
        label: translate("Range"),
        value:
          translation.range && range !== translation.range.full
            ? `***${range}*** (${translation.range.full})`
            : range,
      },
      {
        label: translate("Duration"),
        value:
          translation.duration && duration !== translation.duration.full
            ? `***${duration}*** (${translation.duration.full})`
            : duration,
      },
      renderTargetCategory(entry.target).run(env),
      getTextForTraditions(
        {
          translate,
          translateMap,
          localeCompare,
          getInstanceById,
        },
        entry.traditions,
      ),
      renderImprovementCost(entry.improvement_cost).run(env),
    ],
    errata: translation.errata,
    references: entry.src,
  }
})
