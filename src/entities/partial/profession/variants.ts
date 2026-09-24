import { nullableToArray, type AnyNonNullish } from "@elyukai/utils/nullable"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  ProfessionPackage,
  ProfessionPackageOptions,
  ProfessionVariant,
  ProfessionVariantPackageOptions,
  VariantOptionAction,
} from "@optolith/database-schema/gen"
import { fixedNumberOrString, translateR } from "../reader.js"
import { MISSING_VALUE } from "../unknown.js"

/**
 * Renders an option for a profession variant, using the base profession package and the variant's options.
 */
export const renderVariantOption = <Env, K extends keyof ProfessionVariantPackageOptions>(
  base: ProfessionPackage,
  variant: ProfessionVariant,
  key: K,
  render: (
    base: ProfessionPackageOptions[K] | undefined,
    variant: NonNullable<ProfessionVariantPackageOptions[K]>,
  ) => Reader<Env, string>,
): Reader<Env, string[]> =>
  (variant.options?.[key] === undefined
    ? Reader.of(undefined)
    : render(base.options?.[key], variant.options[key])
  ).map(text => nullableToArray(text))

/**
 * Render a variant option based on whether it is a removal, addition, or override of the base option.
 */
export const renderVariantOptionPaths = <T extends AnyNonNullish, Env1, Env2, Env3>(
  base: T | undefined,
  variant: VariantOptionAction<T>,
  paths: {
    remove: (base: T) => Reader<Env1, string>
    add: (variant: T) => Reader<Env2, string>
    update: (base: T, variant: T) => Reader<Env3, string>
  },
): Reader<Env1 & Env2 & Env3, string> => {
  switch (variant.kind) {
    case "Remove":
      return base === undefined ? Reader.of(MISSING_VALUE) : paths.remove(base)
    case "Override":
      return base === undefined ? paths.add(variant.Override) : paths.update(base, variant.Override)
    default:
      return assertExhaustive(variant)
  }
}

/**
 * Helper for "X instead of Y" text.
 */
export const insteadOfR = (replacement: string | number, base: string | number) =>
  translateR("{$replacement} instead of {$base}", {
    replacement: fixedNumberOrString(replacement),
    base: fixedNumberOrString(base),
  })
