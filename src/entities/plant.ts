import { isNotNullish } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  ElixirRecipe,
  HerbalAidRecipe,
  IndefiniteRecipe,
  PlantApplications,
  PlantDifficulty,
  PlantRecipe,
  PoisonRecipe,
} from "@optolith/database-schema/gen"
import type { Case } from "tsondb/schema/gen"
import { combatDLItem, createEntityDescriptionCreator } from "../creator.js"
import type { StdEnv, StdReader } from "../env.js"
import type { RawNestedDefinitionListEntityDescriptionSection } from "../rawEntityDescription.js"
import { renderAlternativeNames } from "./partial/herbary.js"
import { attributedNameR, formatNumber, translateMapR, translateR } from "./partial/reader.js"
import { MISSING_VALUE } from "./partial/unknown.js"

const renderDifficulty = (difficulty: PlantDifficulty): StdReader<string, "fn" | "tm"> => {
  switch (difficulty.kind) {
    case "Constant":
      return formatNumber(difficulty.Constant)
    case "Indefinite":
      return translateMapR(difficulty.Indefinite.translations).map(
        translation => translation?.description ?? MISSING_VALUE,
      )
    default:
      return assertExhaustive(difficulty)
  }
}

const renderApplications = (applications: PlantApplications): StdReader<string, "fn" | "tm"> => {
  switch (applications.kind) {
    case "Constant":
      return Reader.traverse(applications.Constant, formatNumber).map(values => values.join("/"))
    case "Indefinite":
      return translateMapR(applications.Indefinite.translations).map(
        translation => translation?.description ?? MISSING_VALUE,
      )
    default:
      return assertExhaustive(applications)
  }
}

const renderRecipes = (
  recipes: PlantRecipe[],
): StdReader<
  RawNestedDefinitionListEntityDescriptionSection[],
  "fn" | "t" | "tm" | "ibi",
  "Elixir" | "HerbalAid" | "Poison"
> => {
  const kinds = Object.groupBy(recipes, recipe => recipe.kind) as {
    Elixir?: Case<"Elixir", ElixirRecipe>[]
    HerbalAid?: Case<"HerbalAid", HerbalAidRecipe>[]
    Indefinite?: Case<"Indefinite", IndefiniteRecipe>[]
    Poison?: Case<"Poison", PoisonRecipe>[]
  }

  return Reader.traverse(
    [
      kinds.Elixir === undefined
        ? undefined
        : {
            label: translateR("Elixirs"),
            value: Reader.traverse(kinds.Elixir, recipe =>
              attributedNameR("plant", "Elixir", recipe.Elixir.elixir).map(
                name => name ?? MISSING_VALUE,
              ),
            ).map(values => values.join(", ")),
          },
      kinds.HerbalAid === undefined
        ? undefined
        : {
            label: translateR("Herbal Aids"),
            value: Reader.traverse(kinds.HerbalAid, recipe =>
              attributedNameR("plant", "HerbalAid", recipe.HerbalAid.herbal_aid).map(
                name => name ?? MISSING_VALUE,
              ),
            ).map(values => values.join(", ")),
          },
      kinds.Poison === undefined
        ? undefined
        : {
            label: translateR("Poisons"),
            value: Reader.traverse(kinds.Poison, recipe =>
              attributedNameR("plant", "Poison", recipe.Poison.poison).map(
                name => name ?? MISSING_VALUE,
              ),
            ).map(values => values.join(", ")),
          },
      kinds.Indefinite === undefined
        ? undefined
        : {
            label: translateR("Elixirs"),
            value: Reader.traverse(kinds.Indefinite, recipe =>
              translateMapR(recipe.Indefinite.translations).map(
                translation => translation?.description ?? MISSING_VALUE,
              ),
            ).map(values => values.join(", ")),
          },
    ],
    item =>
      item === undefined
        ? Reader.of(undefined)
        : Reader.asks((env: StdEnv<"fn" | "t" | "tm" | "ibi", "Elixir" | "HerbalAid" | "Poison">) =>
            combatDLItem(item, env),
          ),
  ).map((items): RawNestedDefinitionListEntityDescriptionSection[] => [
    {
      type: "definitionList",
      style: "nested",
      items: items.filter(isNotNullish),
    },
  ])
}

/**
 * Get a JSON representation of the rules text for a plant.
 */
export const getPlantEntityDescription = createEntityDescriptionCreator<
  "Plant",
  StdEnv<"fn" | "t" | "tm" | "ibi", "Elixir" | "HerbalAid" | "Poison">
>((_, { translateMap }, { content: entry }) => {
  const translation = translateMap(entry.translations)

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
          translation.alternative_names === undefined
            ? undefined
            : renderAlternativeNames(translation.alternative_names),
          {
            label: translateR("Search Difficulty"),
            value: renderDifficulty(entry.search_difficulty),
          },
          {
            label: translateR("Identification Difficulty"),
            value: renderDifficulty(entry.identification_difficulty),
          },
          {
            label: translateR("Plant Applications"),
            value: renderApplications(entry.applications),
          },
          entry.recipes === undefined
            ? undefined
            : {
                label: translateR("Recipes"),
                value: renderRecipes(entry.recipes),
              },
          {
            label: translateR("Remedies and Traditions"),
            value: Reader.of(translation.remedies_and_traditions),
          },
        ],
      },
    ],
    references: entry.src,
  }
})
