import {
  type BlessedTradition,
  type Blessing_ID,
  type LiturgyTradition,
  type RatedIdentifier,
} from "@optolith/database-schema/gen"
import type { Compare } from "@optolith/helpers/compare"
import { isNotNullish } from "@optolith/helpers/nullable"
import { assertExhaustive } from "@optolith/helpers/typeSafety"
import { Case } from "tsondb/schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type {
  GetAllChildInstancesForParent,
  GetAllInstances,
  GetInstanceById,
} from "../helpers/getTypes.js"
import type { LocaleJoin } from "../helpers/locale.js"
import type { Translate, TranslateMap, TranslationKeysWithoutParams } from "../helpers/translate.js"
import type { IdMap, RawDefinitionListEntityDescriptionSectionItem } from "../index.js"
import { renderEnhancements } from "./partial/enhancements.js"
import { attributedInstance, attributedName } from "./partial/markdown.js"
import { renderOneTimeDuration } from "./partial/rated/activatable/duration.js"
import { renderEffect } from "./partial/rated/activatable/effect.js"
import {
  combineGeneratedTextWithStaticTranslation,
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

const getTextForBlessingTraditions = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    localeCompare: Compare<string>
    getAllInstances: GetAllInstances<"BlessedTradition">
  },
  id: Blessing_ID,
): RawDefinitionListEntityDescriptionSectionItem => {
  const blessedTraditions = deps.getAllInstances("BlessedTradition")

  const primaryTradition = blessedTraditions.find(trad => trad.content.primaryBlessing === id)

  const secondaryTraditions = blessedTraditions.filter(trad => {
    switch (trad.content.restricted_blessings?.kind) {
      case "Six":
        return !trad.content.restricted_blessings.Six.includes(id)
      case "Three":
        return !trad.content.restricted_blessings.Three.includes(id)
      case undefined:
        return false
      default:
        return assertExhaustive(trad.content.restricted_blessings)
    }
  })

  const translateTradition = (trad: { id: string; content: BlessedTradition }) => {
    const traditionTranslation = deps.translateMap(trad.content.translations)
    const name = traditionTranslation?.name_compressed ?? traditionTranslation?.name

    if (name === undefined) {
      return undefined
    }

    return attributedInstance(name, "BlessedTradition", trad.id, {
      context: '"traditions"',
    })
  }

  const secondaryTraditionTexts = secondaryTraditions
    .map(translateTradition)
    .filter(isNotNullish)
    .sort(deps.localeCompare)

  const text = [
    deps.translate("General"),
    primaryTradition ? translateTradition(primaryTradition) : undefined,
    ...secondaryTraditionTexts,
  ]
    .filter(isNotNullish)
    .join(", ")

  return {
    label: deps.translate("Traditions"),
    value: text,
  }
}

const getTextForTraditions = (
  deps: {
    translate: Translate
    translateMap: TranslateMap
    localeCompare: Compare<string>
    localeJoin: LocaleJoin
    getInstanceById: GetInstanceById<"BlessedTradition" | "Aspect">
  },
  values: LiturgyTradition[],
): RawDefinitionListEntityDescriptionSectionItem => {
  const getAspectName = (aspectId: string) =>
    attributedName(deps.translateMap, deps.getInstanceById, "traditions", "Aspect", aspectId)

  const text = values
    .map(trad => {
      switch (trad.kind) {
        case "GeneralAspect":
          return getAspectName(trad.GeneralAspect)
        case "Tradition": {
          const traditionTranslation = deps.translateMap(
            deps.getInstanceById("BlessedTradition", trad.Tradition.tradition)?.translations,
          )
          const name = traditionTranslation?.name_compressed ?? traditionTranslation?.name

          if (name === undefined) {
            return undefined
          }

          const attributedStringName = attributedInstance(
            name,
            "BlessedTradition",
            trad.Tradition.tradition,
            {
              context: '"traditions"',
            },
          )

          const aspects =
            trad.Tradition.aspects
              ?.map(getAspectName)
              .filter(isNotNullish)
              .sort(deps.localeCompare) ?? []

          if (aspects.length === 0) {
            return attributedStringName
          }

          return `${attributedStringName} (${deps.localeJoin(aspects, "conjunction")})`
        }
        default:
          return assertExhaustive(trad)
      }
    })
    .filter(isNotNullish)
    .sort(deps.localeCompare)
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
    getAllInstances: GetAllInstances<"BlessedTradition">
  }
>(({ getInstanceById, getAllInstances }, locale, { id, content: entry }) => {
  const { translate, translateMap, format } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  const env = {
    translate,
    translateMap,
    format,
    localeCompare: locale.compare,
    getInstanceById,
    getAllInstances,
    responsiveTextSize: ResponsiveTextSize.Full,
  } satisfies Partial<EnvMap>

  const range = renderNonModifiableRange(entry.parameters.range, false).run(env)
  const duration = renderOneTimeDuration(entry.parameters.duration).run(env)

  return {
    title: translation.name,
    className: "blessing",
    body: [
      {
        type: "definitionList",
        items: [
          {
            label: translate("Effect"),
            value: translation.effect,
          },
          combineGeneratedTextWithStaticTranslation(translate("Range"), range, translation.range),
          combineGeneratedTextWithStaticTranslation(
            translate("Duration"),
            duration,
            translation.duration,
          ),
          renderTargetCategory(entry.target).run(env),
          getTextForBlessingTraditions(env, id),
        ],
      },
    ],
    errata: translation.errata,
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a liturgical chant.
 */
export const getLiturgicalChantEntityDescription = createEntityDescriptionCreator<
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
      | RatedIdentifier["kind"]
      | "Enhancement"
    >
    getChildInstancesForInstanceId: GetAllChildInstancesForParent<"Enhancement">
    idMap: IdMap
  }
>(
  (
    { getInstanceById, getChildInstancesForInstanceId, idMap },
    locale,
    { content: entry, entity, id },
    options,
  ) => {
    const { translate, translateMap, format, compare: localeCompare, join: localeJoin } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const env = {
      translate,
      translateMap,
      format,
      getInstanceById,
      getChildInstancesForInstanceId,
      localeJoin: locale.join,
      localeCompare: locale.compare,
      energyUnit: "KarmaPoints",
      responsiveTextSize: ResponsiveTextSize.Full,
      nonModifiableSuffix: (param: ModifiableParameter): TranslationKeysWithoutParams => {
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
      publicationOptions: options.publications,
    } satisfies Partial<EnvMap>

    const { castingTime, cost, range, duration } = renderFastPerformanceParameters(
      entry.parameters,
    ).run(env)

    return {
      title: translation.name,
      className: "liturgical-chant",
      body: [
        {
          type: "definitionList",
          items: [
            renderSkillCheckWithPenalty(entry.check, entry.check_penalty, idMap).run(env),
            renderEffect(translation.effect).run(env),
            combineGeneratedTextWithStaticTranslation(
              translate("Liturgical Time"),
              castingTime,
              translation.casting_time,
            ),
            combineGeneratedTextWithStaticTranslation(translate("KP Cost"), cost, translation.cost),
            combineGeneratedTextWithStaticTranslation(translate("Range"), range, translation.range),
            combineGeneratedTextWithStaticTranslation(
              translate("Duration"),
              duration,
              translation.duration,
            ),
            renderTargetCategory(entry.target).run(env),
            getTextForTraditions(
              {
                translate,
                translateMap,
                localeCompare,
                localeJoin,
                getInstanceById,
              },
              entry.traditions,
            ),
            renderImprovementCost(entry.improvement_cost).run(env),
          ],
        },
        renderEnhancements(Case(entity, id), entry.improvement_cost).run(env),
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)

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
      | RatedIdentifier["kind"]
      | "Enhancement"
    >
    getChildInstancesForInstanceId: GetAllChildInstancesForParent<"Enhancement">
    idMap: IdMap
  }
>(
  (
    { getInstanceById, getChildInstancesForInstanceId, idMap },
    locale,
    { content: entry, entity, id },
    options,
  ) => {
    const { translate, translateMap, format, compare: localeCompare, join: localeJoin } = locale
    const translation = translateMap(entry.translations)

    if (translation === undefined) {
      return undefined
    }

    const env = {
      translate,
      translateMap,
      format,
      getInstanceById,
      getChildInstancesForInstanceId,
      localeJoin: locale.join,
      localeCompare: locale.compare,
      energyUnit: "KarmaPoints",
      responsiveTextSize: ResponsiveTextSize.Full,
      nonModifiableSuffix: (param: ModifiableParameter): TranslationKeysWithoutParams => {
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
      publicationOptions: options.publications,
    } satisfies Partial<EnvMap>

    const { castingTime, cost, range, duration } = renderSlowPerformanceParameters(
      entry.parameters,
    ).run(env)

    return {
      title: translation.name,
      className: "ceremony",
      body: [
        {
          type: "definitionList",
          items: [
            renderSkillCheckWithPenalty(entry.check, entry.check_penalty, idMap).run(env),
            renderEffect(translation.effect).run(env),
            combineGeneratedTextWithStaticTranslation(
              translate("Ceremonial Time"),
              castingTime,
              translation.casting_time,
            ),
            combineGeneratedTextWithStaticTranslation(translate("KP Cost"), cost, translation.cost),
            combineGeneratedTextWithStaticTranslation(translate("Range"), range, translation.range),
            combineGeneratedTextWithStaticTranslation(
              translate("Duration"),
              duration,
              translation.duration,
            ),
            renderTargetCategory(entry.target).run(env),
            getTextForTraditions(
              {
                translate,
                translateMap,
                localeCompare,
                localeJoin,
                getInstanceById,
              },
              entry.traditions,
            ),
            renderImprovementCost(entry.improvement_cost).run(env),
          ],
        },
        renderEnhancements(Case(entity, id), entry.improvement_cost).run(env),
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
