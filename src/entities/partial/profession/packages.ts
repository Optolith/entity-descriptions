import { allSame } from "@elyukai/utils/array/filters"
import type { NonEmptyArray } from "@elyukai/utils/array/nonEmpty"
import type { Equality } from "@elyukai/utils/equality"
import { on } from "@elyukai/utils/function"
import type { AnyNonNullish } from "@elyukai/utils/nullable"
import { compareNumber } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  ExperienceLevel,
  Profession_ID,
  ProfessionPackage,
  VariantOptionAction,
} from "@optolith/database-schema/gen"
import type { StdEnv, StdReader } from "../../../env.js"
import { LOGIC_ERROR } from "../unknown.js"
import { insteadOfR, renderVariantOptionPaths } from "./variants.js"

/**
 * Profession Package with its associated experience level.
 */
export type PreparedProfessionPackage = {
  id: string
  content: ProfessionPackage
  experienceLevel: ExperienceLevel
}

/**
 * Collects all profession packages for a given profession and returns them sorted by their associated experience level.
 */
export const prepareProfessionPackages = (
  professionId: Profession_ID,
): StdReader<
  PreparedProfessionPackage[],
  "ibi" | "acibp",
  "ExperienceLevel",
  never,
  "ProfessionPackage"
> =>
  Reader.asks(({ getInstanceById, getChildInstancesForInstanceId }) =>
    getChildInstancesForInstanceId("ProfessionPackage", professionId)
      .map(
        (
          professionPackage,
        ): {
          id: string
          content: ProfessionPackage
          experienceLevel?: ExperienceLevel
        } => ({
          ...professionPackage,
          experienceLevel: getInstanceById(
            "ExperienceLevel",
            professionPackage.content.experience_level,
          ),
        }),
      )
      .filter(
        (professionPackage): professionPackage is Required<typeof professionPackage> =>
          professionPackage.experienceLevel !== undefined,
      )
      .toSorted(on(item => item.experienceLevel.adventure_points, compareNumber)),
  )

const renderSeparatedOptionList = <T, E>(
  options: (T | undefined)[],
  render: (option: T) => Reader<E, string>,
  emptyText: string,
  joiner: string,
) =>
  Reader.traverse(options, option =>
    option === undefined ? Reader.of(emptyText) : render(option),
  ).map(list => list.join(joiner))

/**
 * Configuration for retrieving, rendering and combining an option parameter.
 */
export type OptionParameterConfig<T, P, R, E> = {
  selector: (option: T) => P
  equality: Equality<P | undefined>
  render: (option: P) => Reader<E, R>
  renderAsString: (option: P) => Reader<E, string>
  emptyText: string
  joiner: string
}

type OptionParameterValueMap = [value: unknown, result: unknown][]

/**
 * Option parameter configurations for multiple parameters.
 */
export type OptionParameterConfigs<T, P extends OptionParameterValueMap, E> = {
  [K in keyof P]: OptionParameterConfig<T, P[K][0], P[K][1], E>
}

/**
 * Extract parameters for final text render.
 */
type OptionParameterTextRenderParameters<P extends OptionParameterValueMap> = {
  [K in keyof P]: P[K][1] | string
}

/**
 * Renders the text for multiple parameters.
 */
export type OptionParameterTextRender<P extends OptionParameterValueMap, E> = (
  ...args: OptionParameterTextRenderParameters<P>
) => Reader<E, string>

/**
 * Renders a two-parameter option for a list of profession packages.
 */
export const renderParameterizedOptionForMultiplePackages = <
  T,
  P extends OptionParameterValueMap,
  E,
>(
  professionPackages: NonEmptyArray<PreparedProfessionPackage>,
  optionSelector: (pkg: PreparedProfessionPackage) => T | undefined,
  allDifferent: { type: "separate"; emptyText: string; joiner: string } | { type: "combined" },
  renderText: OptionParameterTextRender<P, E>,
  ...configs: OptionParameterConfigs<T, P, E>
): Reader<E, string | undefined> => {
  const options = professionPackages.map(optionSelector)
  const [firstOption] = options

  const sames = configs.map(config =>
    allSame(
      options,
      on(option => (option === undefined ? undefined : config.selector(option)), config.equality),
    ),
  )

  if (sames.some(same => same)) {
    if (firstOption === undefined) {
      return Reader.of(undefined)
    }

    return Reader.traverse(configs, (config, configIndex) =>
      sames[configIndex] === true
        ? config.render(config.selector(firstOption))
        : renderSeparatedOptionList(
            options,
            option => config.renderAsString(config.selector(option)),
            config.emptyText,
            config.joiner,
          ),
    ).thenW(parameterValues =>
      renderText(...(parameterValues as OptionParameterTextRenderParameters<P>)),
    )
  } else {
    switch (allDifferent.type) {
      case "combined":
        return Reader.traverse(configs, config =>
          renderSeparatedOptionList(
            options,
            option => config.renderAsString(config.selector(option)),
            config.emptyText,
            config.joiner,
          ),
        ).thenW(parameterValues =>
          renderText(...(parameterValues as OptionParameterTextRenderParameters<P>)),
        )
      case "separate":
        return renderSeparatedOptionList(
          options,
          option =>
            Reader.traverse(configs, config => config.render(config.selector(option))).thenW(
              parameterValues =>
                renderText(...(parameterValues as OptionParameterTextRenderParameters<P>)),
            ),
          allDifferent.emptyText,
          allDifferent.joiner,
        )
      default:
        return assertExhaustive(allDifferent)
    }
  }
}

/**
 * Renders a two-parameter option for a list of profession packages.
 */
export const renderParameterizedOptionForBaseAndVariant = <
  T extends AnyNonNullish,
  P extends OptionParameterValueMap,
  E,
>(
  baseOptions: T | undefined,
  variantOptions: VariantOptionAction<T>,
  allDifferent: { type: "separate"; emptyText: string; joiner: string } | { type: "combined" },
  renderRemove: (base: T) => Reader<E, string>,
  renderAdd: (override: T) => Reader<E, string>,
  renderText: OptionParameterTextRender<P, E>,
  ...configs: OptionParameterConfigs<T, P, E>
): Reader<E & StdEnv<"t">, string> =>
  renderVariantOptionPaths(baseOptions, variantOptions, {
    remove: renderRemove,
    add: renderAdd,
    update: (base, override) => {
      const sames = configs.map(config =>
        config.equality(config.selector(base), config.selector(override)),
      )

      if (sames.every(same => same)) {
        return Reader.of(LOGIC_ERROR) // Base and variant would be equal then, so the variant option should be removed or changed
      }

      if (sames.some(same => same)) {
        return Reader.traverse(configs, (config, configIndex) =>
          sames[configIndex] === true
            ? config.render(config.selector(base))
            : config
                .renderAsString(config.selector(base))
                .thenW(baseValue =>
                  config
                    .renderAsString(config.selector(override))
                    .thenW(overrideValue => insteadOfR(overrideValue, baseValue)),
                ),
        ).thenW(parameterValues =>
          renderText(...(parameterValues as OptionParameterTextRenderParameters<P>)),
        )
      } else {
        switch (allDifferent.type) {
          case "combined":
            return Reader.traverse(configs, config =>
              config
                .renderAsString(config.selector(base))
                .thenW(baseValue =>
                  config
                    .renderAsString(config.selector(override))
                    .thenW(overrideValue => insteadOfR(overrideValue, baseValue)),
                ),
            ).thenW(parameterValues =>
              renderText(...(parameterValues as OptionParameterTextRenderParameters<P>)),
            )
          case "separate":
            return Reader.traverse(configs, config => config.render(config.selector(base)))
              .thenW(parameterValues =>
                renderText(...(parameterValues as OptionParameterTextRenderParameters<P>)),
              )
              .thenW(baseValue =>
                Reader.traverse(configs, config => config.render(config.selector(override)))
                  .thenW(parameterValues =>
                    renderText(...(parameterValues as OptionParameterTextRenderParameters<P>)),
                  )
                  .thenW(overrideValue => insteadOfR(overrideValue, baseValue)),
              )
          default:
            return assertExhaustive(allDifferent)
        }
      }
    },
  })
