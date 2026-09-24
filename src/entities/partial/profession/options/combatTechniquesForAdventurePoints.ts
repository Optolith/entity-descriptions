import type { NonEmptyArray } from "@elyukai/utils/array/nonEmpty"
import { deepEqual, equal } from "@elyukai/utils/equality"
import { Reader } from "@elyukai/utils/reader"
import type {
  CombatTechniqueIdentifier,
  CombatTechniquesForAdventurePointsOption,
  VariantOptionAction,
} from "@optolith/database-schema/gen"
import type { StdEnv } from "../../../../env.js"
import { attributedNameR, fixedNumberOrString, translateR } from "../../reader.js"
import { MISSING_VALUE } from "../../unknown.js"
import {
  renderParameterizedOptionForBaseAndVariant,
  renderParameterizedOptionForMultiplePackages,
  type OptionParameterConfigs,
  type OptionParameterTextRender,
  type PreparedProfessionPackage,
} from "../packages.js"

const renderCombatTechniquesForAdventurePointsOptionList = (options: CombatTechniqueIdentifier[]) =>
  Reader.traverse(options, id =>
    attributedNameR("profession", id).map(name => name ?? MISSING_VALUE),
  ).map(list => list.join(", "))

const renderCombatTechniquesForAdventurePointsOptionText = (
  apValue: number | string,
  list: string,
) =>
  translateR("{$apValue} AP to distribute among the following combat techniques: {$list}", {
    apValue: fixedNumberOrString(apValue),
    list,
  })

const renderStandaloneOption = (option: CombatTechniquesForAdventurePointsOption) =>
  renderCombatTechniquesForAdventurePointsOptionList(option.options).thenW(list =>
    renderCombatTechniquesForAdventurePointsOptionText(option.apValue.toFixed(), list),
  )

type Option = CombatTechniquesForAdventurePointsOption
type Parameters = [[number, number], [CombatTechniqueIdentifier[], string]]
type OptionEnv = StdEnv<"t" | "tm" | "ibi", "CloseCombatTechnique" | "RangedCombatTechnique">

const configs: OptionParameterConfigs<Option, Parameters, OptionEnv> = [
  {
    selector: option => option.apValue,
    equality: equal,
    render: apValue => Reader.of(apValue),
    renderAsString: apValue => Reader.of(apValue.toFixed()),
    emptyText: "—",
    joiner: "/",
  },
  {
    selector: option => option.options,
    equality: deepEqual,
    render: renderCombatTechniquesForAdventurePointsOptionList,
    renderAsString: renderCombatTechniquesForAdventurePointsOptionList,
    emptyText: "—",
    joiner: " / ",
  },
]

const render: OptionParameterTextRender<Parameters, OptionEnv> = (apValue, list) =>
  translateR("{$apValue} AP to distribute among the following combat techniques: {$list}", {
    apValue: fixedNumberOrString(apValue),
    list,
  })

/**
 * Renders the combat techniques for adventure points option for a list of profession packages.
 */
export const renderBaseCombatTechniquesForAdventurePointsOption = (
  professionPackages: NonEmptyArray<PreparedProfessionPackage>,
): Reader<OptionEnv, string | undefined> =>
  renderParameterizedOptionForMultiplePackages<Option, Parameters, OptionEnv>(
    professionPackages,
    pkg => pkg.content.options?.combatTechniquesForAdventurePoints,
    { type: "separate", emptyText: "—", joiner: " / " },
    render,
    ...configs,
  )

/**
 * Renders the combat techniques for adventure points option for a variant of a profession package.
 */
export const renderVariantCombatTechniquesForAdventurePointsOption = (
  baseOptions: Option | undefined,
  variantOptions: VariantOptionAction<Option>,
): Reader<OptionEnv, string> =>
  renderParameterizedOptionForBaseAndVariant<Option, Parameters, OptionEnv>(
    baseOptions,
    variantOptions,
    { type: "separate", emptyText: "—", joiner: " / " },
    base =>
      renderCombatTechniquesForAdventurePointsOptionList(base.options).thenW(list =>
        translateR("no AP to distribute among the following combat techniques: {$list}", {
          list,
        }),
      ),
    renderStandaloneOption,
    render,
    ...configs,
  )
