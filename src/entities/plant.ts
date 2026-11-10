import { Reader } from "@elyukai/utils/reader"
import { sign } from "@elyukai/utils/string/number"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  AlternativeName,
  HerbalPreservationLongevity,
  HerbalPreservationLongevityValue,
  PlantDifficulty,
  PlantEffect,
  PlantLongevity,
  PlantOccurrence,
  PlantOccurences,
  PlantApplications,
  PlantPrice,
  PlantRecipe,
  PlantRecipeGroup,
  ResponsiveTextOptional,
  ResponsiveTextReplace,
} from "@optolith/database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type { StdEnv, StdReader } from "../env.js"
import type { LocaleMap } from "../helpers/translate.js"
import type {
  RawEntityDescriptionSectionContent,
  RawNestedDefinitionListEntityDescriptionSection,
} from "../rawEntityDescription.js"
import { renderDiceR } from "./partial/dice.js"
import { attributedInstance } from "./partial/markdown.js"
import { renderMathOperationR } from "./partial/mathOperation.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import {
  formatNumber,
  responsiveTextR,
  translateFnR,
  translateMapR,
  translateR,
} from "./partial/reader.js"
import { appendNoteIfNeeded, replaceTextIfNeeded } from "./partial/responsiveText.js"
import { formatArbitrarySilverthalers } from "./partial/units/simple.js"
import { formatTimeSpanR } from "./partial/units/timeSpan.js"
import { MISSING_VALUE } from "./partial/unknown.js"

type PlantProductTranslation = {
  note?: ResponsiveTextOptional
  replacement?: ResponsiveTextReplace
}

const renderPlantAlternativeNames = (
  alternativeNames: AlternativeName[],
): StdReader<string, "tm" | "ibi", "Language"> =>
  Reader.asks(({ translateMap, getInstanceById }) =>
    alternativeNames
      .map(alternativeName => {
        const language =
          alternativeName.language === undefined
            ? undefined
            : (translateMap(getInstanceById("Language", alternativeName.language)?.translations)
                ?.name ?? MISSING_VALUE)

        return (
          alternativeName.name +
          parensIf(
            [language, alternativeName.region].filter(value => value !== undefined).join(", "),
          )
        )
      })
      .join(", "),
  )

const renderPlantDifficulty = (difficulty: PlantDifficulty): StdReader<string, "tm" | "fn"> => {
  switch (difficulty.kind) {
    case "Constant":
      return formatNumber(difficulty.Constant)
    case "Indefinite":
      return translateMapR(difficulty.Indefinite.translations).map(
        translation => translation?.description ?? MISSING_VALUE,
      )
  }
}

const renderPlantApplications = (
  applications: PlantApplications,
): StdReader<string, "tm" | "fn"> => {
  switch (applications.kind) {
    case "Constant":
      return Reader.traverse(applications.Constant, formatNumber).map(values => values.join("/"))
    case "Indefinite":
      return translateMapR(applications.Indefinite.translations).map(
        translation => translation?.description ?? MISSING_VALUE,
      )
  }
}

const renderPlantPrice = (price: PlantPrice): StdReader<string, "t" | "tm" | "rts" | "fn"> => {
  switch (price.kind) {
    case "Constant":
      return translateMapR(price.Constant.translations).thenW(translation =>
        Reader.traverse([price.Constant.value, price.Constant.cost], formatNumber)
          .map(values => values.join(" / "))
          .thenW(value => formatArbitrarySilverthalers(value))
          .map(formattedPrice => formattedPrice + parensIf(translation?.note)),
      )
    case "Indefinite":
      return translateMapR(price.Indefinite.translations).map(
        translation => translation?.description ?? MISSING_VALUE,
      )
  }
}

const getPlantRecipeGroupLabel = (
  group: PlantRecipeGroup,
  translate: StdEnv<"t">["translate"],
): string => {
  switch (group.kind) {
    case "HerbalAid":
      return translate("Herbal Aids")
    case "Elixir":
      return translate("Elixirs")
    case "AlchemicalPoison":
      return translate("Alchemical Poisons")
    case "AlchemicalIntoxicant":
      return translate("Alchemical Intoxicants")
    case "PlantPoison":
      return translate("Plant Poisons")
    case "PlantIntoxicant":
      return translate("Plant Intoxicants")
    default:
      return assertExhaustive(group)
  }
}

const renderPlantRecipes = (
  recipes: PlantRecipe[] | undefined,
): StdReader<
  string | RawEntityDescriptionSectionContent<RawNestedDefinitionListEntityDescriptionSection>[],
  "t" | "tm" | "ibi" | "rts",
  "HerbalAid" | "Elixir" | "Poison"
> =>
  Reader.asks(({ translate, translateMap, getInstanceById, responsiveTextSize }) => {
    if (recipes === undefined || recipes.length === 0) {
      return translate("No recipes known")
    }

    const groups = new Map<string, { label: string; recipes: string[] }>()
    const sections: { label?: string; recipes: string[] }[] = []

    const addToGroup = (label: string, recipeName: string) => {
      const group = groups.get(label)
      if (group === undefined) {
        const newGroup = { label, recipes: [recipeName] }
        groups.set(label, newGroup)
        sections.push(newGroup)
      } else {
        group.recipes.push(recipeName)
      }
    }

    const renderProduct = (
      entity: "HerbalAid" | "Elixir" | "Poison",
      id: string,
      translations: LocaleMap<PlantProductTranslation> | undefined,
    ) => {
      const productTranslation = (() => {
        switch (entity) {
          case "HerbalAid":
            return translateMap(getInstanceById("HerbalAid", id)?.translations)
          case "Elixir":
            return translateMap(getInstanceById("Elixir", id)?.translations)
          case "Poison":
            return translateMap(getInstanceById("Poison", id)?.translations)
        }
      })()
      if (productTranslation === undefined) {
        return MISSING_VALUE
      }

      const name = replaceTextIfNeeded(translations, productTranslation.name).run({
        translateMap,
        responsiveTextSize,
      })
      const linkedName = attributedInstance(name, entity, id, { context: '"plant-recipe"' })
      return appendNoteIfNeeded(translations, linkedName).run({
        translateMap,
        responsiveTextSize,
      })
    }

    for (const recipe of recipes) {
      switch (recipe.kind) {
        case "HerbalAid":
          addToGroup(
            getPlantRecipeGroupLabel({ kind: "HerbalAid" }, translate),
            renderProduct("HerbalAid", recipe.HerbalAid.herbal_aid, recipe.HerbalAid.translation),
          )
          break
        case "Elixir":
          addToGroup(
            getPlantRecipeGroupLabel({ kind: "Elixir" }, translate),
            renderProduct("Elixir", recipe.Elixir.elixir, recipe.Elixir.translation),
          )
          break
        case "Poison": {
          const poison = getInstanceById("Poison", recipe.Poison.poison)
          let category: string
          if (
            poison?.source_type.kind === "AlchemicalPoison" &&
            poison.source_type.AlchemicalPoison.intoxicant !== undefined
          ) {
            category = getPlantRecipeGroupLabel({ kind: "AlchemicalIntoxicant" }, translate)
          } else if (
            poison?.source_type.kind === "PlantPoison" &&
            poison.source_type.PlantPoison.intoxicant !== undefined
          ) {
            category = getPlantRecipeGroupLabel({ kind: "PlantIntoxicant" }, translate)
          } else {
            switch (poison?.source_type.kind) {
              case "AlchemicalPoison":
              case "AlchemicalPactGiftPoison":
                category = getPlantRecipeGroupLabel({ kind: "AlchemicalPoison" }, translate)
                break
              case "PlantPoison":
                category = getPlantRecipeGroupLabel({ kind: "PlantPoison" }, translate)
                break
              default:
                category = MISSING_VALUE
            }
          }
          addToGroup(
            category,
            renderProduct("Poison", recipe.Poison.poison, recipe.Poison.translation),
          )
          break
        }
        case "Indefinite": {
          const description =
            translateMap(recipe.Indefinite.translations)?.description ?? MISSING_VALUE
          if (recipe.Indefinite.group === undefined) {
            sections.push({ recipes: [description] })
          } else {
            addToGroup(getPlantRecipeGroupLabel(recipe.Indefinite.group, translate), description)
          }
          break
        }
      }
    }

    let hasRenderedGroups = false
    const renderedSections: RawEntityDescriptionSectionContent<RawNestedDefinitionListEntityDescriptionSection>[] =
      []
    for (const group of sections) {
      if (group.label === undefined) {
        renderedSections.push({ type: "plain", text: group.recipes.join(", ") })
        continue
      }

      if (hasRenderedGroups) {
        continue
      }

      hasRenderedGroups = true
      renderedSections.push({
        type: "definitionList",
        style: "nested",
        items: sections
          .filter(
            (section): section is { label: string; recipes: string[] } =>
              section.label !== undefined,
          )
          .map(section => ({ label: section.label, value: section.recipes.join(", ") })),
      })
    }

    return renderedSections
  })

const getPlantRarityLabel = (
  rarity: PlantOccurrence["rarity"],
  translate: StdEnv<"t">["translate"],
): string => {
  switch (rarity.kind) {
    case "Common":
      return translate("occurence common")
    case "Occasional":
      return translate("occurence occasional")
    case "RatherRare":
      return translate("occurence rather rare")
    case "Rare":
      return translate("occurence rare")
    case "VeryRare":
      return translate("occurence very rare")
    default:
      return assertExhaustive(rarity)
  }
}

const getPlantOccurrenceNames = (
  occurrence: PlantOccurrence,
  getInstanceById: StdEnv<"ibi", "Biome" | "SubBiome" | "BotanicRegion">["getInstanceById"],
  translateMap: StdEnv<"tm">["translateMap"],
  localeJoin: StdEnv<"lj">["localeJoin"],
  translate: StdEnv<"t">["translate"],
): string => {
  const { regions } = occurrence
  let names: string[]
  switch (regions.kind) {
    case "AllBiomes":
      names = [translate("all")]
      break
    case "Biomes":
      names = regions.Biomes.map(
        id => translateMap(getInstanceById("Biome", id)?.translations)?.name ?? MISSING_VALUE,
      )
      break
    case "SubBiomes":
      names = regions.SubBiomes.map(
        id => translateMap(getInstanceById("SubBiome", id)?.translations)?.name ?? MISSING_VALUE,
      )
      break
    case "BotanicRegions":
      names = regions.BotanicRegions.map(
        id =>
          translateMap(getInstanceById("BotanicRegion", id)?.translations)?.name ?? MISSING_VALUE,
      )
      break
    default:
      return assertExhaustive(regions)
  }

  return localeJoin(names, "conjunction")
}

const renderPlantDistribution = (
  occurences: PlantOccurences,
): StdReader<
  RawNestedDefinitionListEntityDescriptionSection[],
  "t" | "tm" | "ibi" | "lj",
  "Biome" | "SubBiome" | "BotanicRegion"
> =>
  Reader.asks(({ translate, translateMap, getInstanceById, localeJoin }) => {
    const occurrences = occurences.items ?? []
    const biomeIds = new Set<string>()
    let hasAllBiomes = false
    let hasSpecificBiome = false

    for (const occurrence of occurrences) {
      switch (occurrence.regions.kind) {
        case "AllBiomes":
          hasAllBiomes = true
          break
        case "Biomes":
          hasSpecificBiome = true
          for (const biomeId of occurrence.regions.Biomes) {
            biomeIds.add(biomeId)
          }
          break
        case "SubBiomes":
          hasSpecificBiome = true
          for (const subBiomeId of occurrence.regions.SubBiomes) {
            const subBiome = getInstanceById("SubBiome", subBiomeId)
            if (subBiome !== undefined) {
              biomeIds.add(subBiome.parent)
            }
          }
          break
        case "BotanicRegions":
          hasSpecificBiome = true
          for (const regionId of occurrence.regions.BotanicRegions) {
            const region = getInstanceById("BotanicRegion", regionId)
            const subBiome =
              region === undefined ? undefined : getInstanceById("SubBiome", region.parent)
            if (subBiome !== undefined) {
              biomeIds.add(subBiome.parent)
            }
          }
          break
        default:
          assertExhaustive(occurrence.regions)
      }
    }

    const landscapeTypes =
      biomeIds.size > 0
        ? Array.from(
            biomeIds,
            id => translateMap(getInstanceById("Biome", id)?.translations)?.name ?? MISSING_VALUE,
          ).join(", ")
        : hasSpecificBiome
          ? MISSING_VALUE
          : hasAllBiomes
            ? translate("all")
            : translate("none")

    const rarityOrder = ["Common", "Occasional", "RatherRare", "Rare", "VeryRare"]
    const regions = occurrences
      .toSorted(
        (left, right) =>
          rarityOrder.indexOf(left.rarity.kind) - rarityOrder.indexOf(right.rarity.kind),
      )
      .map(occurrence => {
        const name = getPlantOccurrenceNames(
          occurrence,
          getInstanceById,
          translateMap,
          localeJoin,
          translate,
        )
        const rarity = getPlantRarityLabel(occurrence.rarity, translate)
        const note = translateMap(occurrence.translation)?.note
        return `${name} (${rarity}${note === undefined ? "" : `; ${note}`})`
      })
    const generalNote = translateMap(occurences.translation)?.note
    const regionText =
      generalNote ?? (regions.length === 0 ? translate("none") : regions.join(", "))

    return [
      {
        type: "definitionList",
        style: "nested",
        items: [
          { label: translate("Landscape Type"), value: landscapeTypes },
          { label: translate("Regions"), value: regionText },
        ],
      },
    ]
  })

const renderPlantEffect = (effect: PlantEffect | undefined): StdReader<string, "t" | "tm"> =>
  translateMapR(effect?.translations).thenW(translation =>
    translation === undefined ? translateR("none") : Reader.of(translation.description),
  )

const renderPlantEffects = (
  touch: PlantEffect | undefined,
  inhalation: PlantEffect | undefined,
  ingestion: PlantEffect | undefined,
  recipes: PlantRecipe[] | undefined,
): StdReader<RawNestedDefinitionListEntityDescriptionSection[], "t" | "tm"> =>
  translateFnR.thenW(translate =>
    Reader.traverse(
      [renderPlantEffect(touch), renderPlantEffect(inhalation), renderPlantEffect(ingestion)],
      effect => effect,
    ).map(([touchEffect, inhalationEffect, ingestionEffect]) => {
      const processed =
        recipes === undefined || recipes.length === 0
          ? translate("No plant recipes known")
          : translate("See plant recipes")

      return [
        {
          type: "definitionList",
          style: "nested",
          items: [
            {
              label: translate("Raw"),
              value: [
                {
                  type: "definitionList",
                  style: "hidden",
                  items: [
                    { label: translate("Plant Touch"), value: touchEffect },
                    { label: translate("Plant Inhalation"), value: inhalationEffect },
                    { label: translate("Plant Ingestion"), value: ingestionEffect },
                  ],
                },
              ],
            },
            { label: translate("Processed"), value: processed },
          ],
        },
      ]
    }),
  )

const renderHerbalPreservationLongevity = (
  longevity: HerbalPreservationLongevity,
): StdReader<string, "t" | "tm" | "fn" | "f" | "rts"> => {
  switch (longevity.kind) {
    case "Expression":
      return renderMathOperationR<HerbalPreservationLongevityValue, number | string, StdEnv<"t">>(
        longevity.Expression.value,
        value => {
          switch (value.kind) {
            case "Constant":
              return Reader.asks((_: StdEnv<"t">) => value.Constant)
            case "Dice":
              return renderDiceR(value.Dice)
            default:
              return assertExhaustive(value)
          }
        },
      )
        .thenW(value => formatTimeSpanR(longevity.Expression.unit, value))
        .then(text => replaceTextIfNeeded(longevity.Expression.translations, text))
    case "Indefinite":
      return translateMapR(longevity.Indefinite.translations).thenW(translation =>
        translation === undefined ? Reader.of(MISSING_VALUE) : responsiveTextR(translation.text),
      )
    default:
      return assertExhaustive(longevity)
  }
}

const renderPlantPreservation = (
  preservationId: string,
): StdReader<string, "t" | "tm" | "fn" | "f" | "ibi" | "rts", "HerbalPreservation"> => {
  const preservationR: StdReader<
    { name: string; longevity: HerbalPreservationLongevity } | undefined,
    "tm" | "ibi",
    "HerbalPreservation"
  > = Reader.asks(({ getInstanceById, translateMap }) => {
    const preservation = getInstanceById("HerbalPreservation", preservationId)
    if (preservation === undefined) {
      return undefined
    }

    return {
      name: translateMap(preservation.translations)?.name ?? MISSING_VALUE,
      longevity: preservation.longevity,
    }
  })

  return preservationR.thenW(preservation => {
    if (preservation === undefined) {
      return Reader.of(MISSING_VALUE)
    }

    const linkedName = attributedInstance(preservation.name, "HerbalPreservation", preservationId, {
      context: '"plant-preservation"',
    })
    return renderHerbalPreservationLongevity(preservation.longevity).map(
      longevity => `${linkedName} ${longevity}`,
    )
  })
}

const renderPlantLongevity = (
  longevity: PlantLongevity | undefined,
): StdReader<
  RawNestedDefinitionListEntityDescriptionSection[],
  "t" | "tm" | "fn" | "ibi" | "f" | "rts",
  "HerbalPreservation"
> =>
  translateMapR(longevity?.translations).thenW(translation =>
    translateFnR.thenW(translate =>
      Reader.traverse(longevity?.preservations ?? [], renderPlantPreservation).map(
        preservations => {
          const raw = translation?.raw ?? translate("Raw plant longevity fallback")
          const processed = [...preservations, translation?.preserved].filter(
            (value): value is string => value !== undefined,
          )

          return [
            {
              type: "definitionList",
              style: "nested",
              items: [
                { label: translate("Raw"), value: raw },
                processed.length === 0
                  ? undefined
                  : { label: translate("Processed"), value: processed.join(", ") },
              ],
            },
          ]
        },
      ),
    ),
  )

const renderPlantRemediesAndTraditions = (text: string) => Reader.of(text)

/**
 * Get a JSON representation of the rules text for a plant.
 */
export const getPlantEntityDescription = createEntityDescriptionCreator<
  "Plant",
  StdEnv<
    "f" | "fn" | "t" | "tm" | "ibi" | "lj" | "rts",
    | "Language"
    | "HerbalAid"
    | "Elixir"
    | "Poison"
    | "HerbalPreservation"
    | "Biome"
    | "SubBiome"
    | "BotanicRegion"
  >
>((_env, locale, entry) => {
  const { translate, translateMap } = locale

  const translation = translateMap(entry.content.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: translation.name,
    className: "plant",
    body: [
      {
        type: "definitionList",
        items: [
          translation.alternative_names === undefined || translation.alternative_names.length === 0
            ? undefined
            : {
                label: translate("Plant Alternative Names"),
                value: renderPlantAlternativeNames(translation.alternative_names),
              },
          {
            label: translate("Distribution"),
            value: renderPlantDistribution(entry.content.occurences),
          },
          {
            label: translate("Search Difficulty"),
            value: renderPlantDifficulty(entry.content.search_difficulty),
          },
          {
            label: translate("Identification Difficulty"),
            value: renderPlantDifficulty(entry.content.identification_difficulty),
          },
          {
            label: translate("Plant Applications"),
            value: renderPlantApplications(entry.content.applications),
          },
          {
            label: translate("Effect"),
            value: renderPlantEffects(
              entry.content.touch,
              entry.content.inhalation,
              entry.content.ingestion,
              entry.content.recipes,
            ),
          },
          {
            label: translate("Price"),
            value: renderPlantPrice(entry.content.price),
          },
          {
            label: translate("Recipes"),
            value: renderPlantRecipes(entry.content.recipes),
          },
          {
            label: translate("Remedies and Traditions"),
            value: renderPlantRemediesAndTraditions(translation.remedies_and_traditions),
          },
          {
            label: translate("Longevity"),
            value: renderPlantLongevity(entry.content.longevity),
          },
        ],
      },
    ],
    badges: entry.content.types.map(type => ({ type: "effectType", raw: type.kind })),
    references: entry.content.src,
  }
})

const renderHerbalAidLongevity = (
  longevity: HerbalPreservationLongevity,
): StdReader<string, "f" | "t" | "tm" | "rts"> => {
  switch (longevity.kind) {
    case "Expression":
      return renderMathOperationR<HerbalPreservationLongevityValue, number | string, StdEnv<"t">>(
        longevity.Expression.value,
        value => {
          switch (value.kind) {
            case "Constant":
              return Reader.asks((_: StdEnv<"t">) => value.Constant)
            case "Dice":
              return renderDiceR(value.Dice)
            default:
              return assertExhaustive(value)
          }
        },
      )
        .thenW(value => formatTimeSpanR(longevity.Expression.unit, value))
        .then(text => replaceTextIfNeeded(longevity.Expression.translations, text))
    case "Indefinite":
      return translateMapR(longevity.Indefinite.translations).thenW(translation =>
        translation === undefined ? Reader.of(MISSING_VALUE) : responsiveTextR(translation.text),
      )
    default:
      return assertExhaustive(longevity)
  }
}

/**
 * Get a JSON representation of the rules text for a herbal aid.
 */
export const getHerbalAidEntityDescription = createEntityDescriptionCreator<
  "HerbalAid",
  StdEnv<"f" | "fn" | "t" | "tm" | "ibi" | "lj" | "rts", "HerbalPreservation" | "Weapon" | "Armor">
>((_env, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: translation.name,
    className: "herbal-aid",
    body: [
      translation.description === undefined
        ? undefined
        : { type: "plain", text: translation.description },
      {
        type: "definitionList",
        items: [
          {
            label: translate("Ingredients"),
            value: translation.ingredients.join(", "),
          },
          translation.typical_tools === undefined
            ? undefined
            : {
                label: translate("Typical Tools"),
                value: translation.typical_tools.join(", "),
              },
          entry.crafting_difficulty === undefined
            ? undefined
            : {
                label: translate("Crafting Difficulty"),
                value: sign(entry.crafting_difficulty),
              },
          entry.longevity === undefined
            ? undefined
            : {
                label: translate("Longevity"),
                value: renderHerbalAidLongevity(entry.longevity),
              },
        ],
      },
    ],
    badges: entry.types.map(effectType => ({ type: "effectType", raw: effectType.kind })),
    references: entry.src,
  }
})

/**
 * Get a JSON representation of the rules text for a herbal preservation.
 */
export const getHerbalPreservationEntityDescription = createEntityDescriptionCreator<
  "HerbalPreservation",
  StdEnv<"f" | "fn" | "t" | "tm" | "ibi" | "lj" | "rts", "HerbalPreservation">
>((_env, locale, { content: entry }) => {
  const { translate, translateMap } = locale
  const translation = translateMap(entry.translations)

  if (translation === undefined) {
    return undefined
  }

  return {
    title: translation.name,
    className: "herbal-preservation",
    body: [
      {
        type: "definitionList",
        items: [
          {
            label: translate("Preparation"),
            value: translation.preparation,
          },
          {
            label: translate("Longevity"),
            value: renderHerbalPreservationLongevity(entry.longevity),
          },
          {
            label: translate("Alternative Effect"),
            value: translation.alternative_effect,
          },
        ],
      },
    ],
    badges: entry.types.map(effectType => ({ type: "effectType", raw: effectType.kind })),
    references: entry.src,
  }
})
