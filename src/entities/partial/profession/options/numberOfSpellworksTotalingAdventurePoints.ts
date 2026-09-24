import type { NonEmptyArray } from "@elyukai/utils/array/nonEmpty"
import { equal } from "@elyukai/utils/equality"
import { Reader } from "@elyukai/utils/reader"
import type { SpellworksOptions, VariantOptionAction } from "@optolith/database-schema/gen"
import type { StdEnv } from "../../../../env.js"
import { fixedNumberOrString, translateR } from "../../reader.js"
import {
  renderParameterizedOptionForBaseAndVariant,
  renderParameterizedOptionForMultiplePackages,
  type OptionParameterConfigs,
  type OptionParameterTextRender,
  type PreparedProfessionPackage,
} from "../packages.js"

type Option = SpellworksOptions
type Parameters = [count: [number, number], apValue: [number, number]]
type OptionEnv = StdEnv<"t">

const configs: OptionParameterConfigs<Option, Parameters, OptionEnv> = [
  {
    selector: option => option.number,
    equality: equal,
    render: apValue => Reader.of(apValue),
    renderAsString: apValue => Reader.of(apValue.toFixed()),
    emptyText: "—",
    joiner: "/",
  },
  {
    selector: option => option.apValue,
    equality: equal,
    render: apValue => Reader.of(apValue),
    renderAsString: apValue => Reader.of(apValue.toFixed()),
    emptyText: "—",
    joiner: "/",
  },
]

const render: OptionParameterTextRender<Parameters, OptionEnv> = (count, apValue) =>
  typeof count === "number"
    ? translateR(".input {$count :number} {{{$count} more spellworks totaling {$apValue} AP}}", {
        count,
        apValue: fixedNumberOrString(apValue),
      })
    : translateR("{$count} more spellworks totaling {$apValue} AP", {
        count,
        apValue: fixedNumberOrString(apValue),
      })

/**
 * Renders the combat techniques for adventure points option for a list of profession packages.
 */
export const renderBaseNumberOfSpellworksTotalingAdventurePoints = (
  professionPackages: NonEmptyArray<PreparedProfessionPackage>,
): Reader<OptionEnv, string | undefined> =>
  renderParameterizedOptionForMultiplePackages<Option, Parameters, OptionEnv>(
    professionPackages,
    pkg => pkg.content.options?.spellworks,
    { type: "separate", emptyText: "—", joiner: " / " },
    render,
    ...configs,
  )

/**
 * Renders the combat techniques for adventure points option for a variant of a profession package.
 */
export const renderVariantNumberOfSpellworksTotalingAdventurePoints = (
  baseOptions: Option | undefined,
  variantOptions: VariantOptionAction<Option>,
): Reader<OptionEnv, string> =>
  renderParameterizedOptionForBaseAndVariant<Option, Parameters, OptionEnv>(
    baseOptions,
    variantOptions,
    { type: "separate", emptyText: "—", joiner: " / " },
    base => render(0, base.apValue),
    base => render(base.number, base.apValue),
    render,
    ...configs,
  )
