import { allSame } from "@elyukai/utils/array/filters"
import {
  ensureNonEmpty,
  isEmpty,
  isNotEmpty,
  type NonEmptyArray,
} from "@elyukai/utils/array/nonEmpty"
import { deepEqual, equal, type Equality } from "@elyukai/utils/equality"
import { on } from "@elyukai/utils/function"
import {
  isNotNullish,
  isNullish,
  mapNullable,
  nullableToArray,
  type AnyNonNullish,
} from "@elyukai/utils/nullable"
import { omitKeys } from "@elyukai/utils/object"
import { compareNumber } from "@elyukai/utils/ordering"
import { Reader } from "@elyukai/utils/reader"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import type {
  ActivatableIdentifier,
  ActivatableNameBuilderRules,
  BlessedTradition_ID,
  Blessing_ID,
  Cantrip_ID,
  CantripsOptions,
  CombatTechniqueIdentifier,
  CombatTechniquesOptions,
  ConstantProfessionSpecialAbility,
  CursesOptions,
  ExperienceLevel,
  LanguagesScriptsOptions,
  LiturgiesOptions,
  LiturgyIdentifier,
  MagicalActionIdentifier,
  Profession_ID,
  ProfessionMagicalSkillIdentifier,
  ProfessionPackage,
  ProfessionPackageOptions,
  ProfessionPrerequisiteGroup,
  ProfessionPrerequisites,
  ProfessionSpecialAbility,
  ProfessionVariant,
  ProfessionVariantPackageOptions,
  ProfessionVariantTranslation,
  RatedIdentifier,
  RestrictedBlessings,
  SkillsOptions,
  SkillSpecializationOptions,
  SpecialAbilityIdentifier,
  VariantOptionAction,
} from "optolith-database-schema/gen"
import { createEntityDescriptionCreator } from "../creator.js"
import type {
  GetAllChildInstancesForParent,
  GetAllInstances,
  GetInstanceById,
} from "../helpers/getTypes.js"
import type { LocaleMap, Translate, TranslateMap } from "../helpers/translate.js"
import type {
  RawDefinitionListEntityDescriptionSectionItem,
  RawEntityDescription,
  RawNestedDefinitionListEntityDescriptionSection,
} from "../index.js"
import {
  combineNameComponents,
  getNameComponents,
  renderActivatableNameComponents,
  renderCombinedActivatableNameComponents,
} from "./partial/activatableNameChunks.js"
import {
  renderCommonnessRatedAdvantagesOrDisadvantages,
  renderValueWithPossibleTranslation,
} from "./partial/commonnessRatedAdvantagesAndDisadvantages.js"
import { printProfessionPrerequisites } from "./partial/prerequisites/index.js"
import { type GetResolvedSelectOptionById } from "./partial/prerequisites/single/activatable.js"
import { parensIf } from "./partial/rated/activatable/parensIf.js"
import {
  formatR,
  getChildInstancesForInstanceIdR,
  getInstanceByIdR,
  localeCompareR,
  localeJoinR,
  localeSortR,
  nameR,
  strictNameR,
  translateMapFnR,
  translateR,
  translationR,
  type EnvMap,
  type StdEnv,
  type StdReader,
} from "./partial/reader.js"
import { MISSING_VALUE, UNHANDLED_VALUE } from "./partial/unknown.js"

type PreparedProfessionPackage = {
  id: string
  content: ProfessionPackage
  experienceLevel: ExperienceLevel
}

const prepareProfessionPackages = (
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

const renderNumericListAcrossPackages = <T, SelectorEnv, RenderEnv>(
  packages: PreparedProfessionPackage[],
  selector: (pkg: PreparedProfessionPackage) => Reader<SelectorEnv, [T, number][]>,
  equalityFn: Equality<T>,
  renderText: (value: T) => Reader<RenderEnv, string>,
  defaultValue: number,
): Reader<StdEnv<"lc"> & SelectorEnv & RenderEnv, string | undefined> =>
  packages
    .reduce<Reader<SelectorEnv, [T, number[]][]>>(
      (accR, pkg, pkgIndex): Reader<SelectorEnv, [T, number[]][]> =>
        accR.map2(selector(pkg), (acc, selected) =>
          selected.reduce<[T, number[]][]>(
            (filledAcc, [values, number]) => {
              const existing = filledAcc.findIndex(([value]) => equalityFn(value, values))
              if (existing >= 0) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- existing is checked to be >= 0
                filledAcc[existing]![1][pkgIndex] = number + defaultValue
                return filledAcc
              } else {
                return [
                  ...filledAcc,
                  [
                    values,
                    Array.from({ length: pkgIndex }, () => defaultValue).concat(
                      number + defaultValue,
                    ),
                  ],
                ]
              }
            },
            acc.map(([value, numbers]): [T, number[]] => [value, [...numbers, defaultValue]]),
          ),
        ),
      Reader.of([]),
    )
    .thenW(list =>
      Reader.traverse(list, ([value, numbers]) =>
        renderText(value).map(text => `${text} ${numbers.join("/")}`),
      ),
    )
    .thenW(list => localeSortR(list))
    .map(list => ensureNonEmpty(list)?.join(", "))

const renderSinglePackageValue = <
  T,
  SelectorEnv,
  RenderEnv,
  R extends string | string[] | undefined,
>(
  professionPackages: NonEmptyArray<PreparedProfessionPackage>,
  selector: (pkg: PreparedProfessionPackage) => Reader<SelectorEnv, T>,
  equalityFn: Equality<T>,
  renderText: (value: NonEmptyArray<T>) => Reader<RenderEnv, R>,
): Reader<SelectorEnv & RenderEnv, R> =>
  (Reader.traverse(professionPackages, selector) as Reader<SelectorEnv, NonEmptyArray<T>>).thenW(
    selected => (allSame(selected, equalityFn) ? renderText([selected[0]]) : renderText(selected)),
  )

type SpecialAbilities = {
  languagesScripts: LanguagesScriptsOptions | undefined
  skillSpecialization: SkillSpecializationOptions | undefined
  curses: CursesOptions | undefined
  list: ProfessionSpecialAbility[] | undefined
}

const insteadOfR = (replacement: string | number, base: string | number) =>
  translateR("{$replacement} instead of {$base}", { replacement, base })

/**
 * If the selected values of the base and the variant are equal, only renders the value once. Otherwise, renders both values as the variant value replacing the base value.
 */
const plainOrInsteadOfR = <T, U, E>(
  base: T,
  variant: T,
  selector: (value: T) => U,
  equality: Equality<U>,
  render: (value: U) => Reader<E, string | number>,
) => {
  const baseValue = selector(base)
  const variantValue = selector(variant)
  return equality(baseValue, variantValue)
    ? render(baseValue)
    : render(variantValue).thenW(replacement =>
        render(baseValue).thenW(baseRendered => insteadOfR(replacement, baseRendered)),
      )
}

const renderVariantOptionPaths = <T extends AnyNonNullish, Env1, Env2, Env3>(
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

const renderVariantLanguagesScriptsOption = (
  baseOptions: LanguagesScriptsOptions | undefined,
  variantOptions: VariantOptionAction<LanguagesScriptsOptions>,
) =>
  renderVariantOptionPaths(baseOptions, variantOptions, {
    remove: base =>
      translateR("no Languages and Literacy totaling {$apValue} AP", { apValue: base.ap_value }),
    add: override =>
      translateR("Languages and Literacy totaling {$apValue} AP", { apValue: override.ap_value }),
    update: (base, override) =>
      translateR("{$replacement} instead of {$base}", {
        replacement: override.ap_value,
        base: base.ap_value,
      }).then(apValue =>
        translateR("Languages and Literacy totaling {$apValue} AP", {
          apValue,
        }),
      ),
  })

const renderLanguagesScriptsOption = (
  option: LanguagesScriptsOptions,
): Reader<StdEnv<"t">, string> =>
  renderVariantLanguagesScriptsOption(undefined, { kind: "Override", Override: option })

const renderSkillSpecializationOption = (
  option: SkillSpecializationOptions,
): Reader<StdEnv<"f" | "t" | "tm" | "lj" | "ibi", "Skill" | "SkillGroup">, string> =>
  Reader.asks(({ format, translate, translateMap, localeJoin, getInstanceById }) => {
    switch (option.kind) {
      case "Specific":
        return translate("Skill Specialization {$possibleSkills}", {
          possibleSkills: localeJoin(
            option.Specific.options.map(
              id => translateMap(getInstanceById("Skill", id)?.translations)?.name ?? MISSING_VALUE,
            ),
            "disjunction",
          ),
        })
      case "Group":
        return translate("Skill Specialization for a {$skillOfGroup}", {
          skillOfGroup: format(
            translateMap(getInstanceById("SkillGroup", option.Group)?.translations)?.longName ??
              MISSING_VALUE,
            { hiddenCount: 1 },
          ),
        })
      default:
        return assertExhaustive(option)
    }
  })

const renderCombatTechniquesOption = (option: CombatTechniquesOptions) =>
  isNotEmpty(option.fixed)
    ? (() => {
        const [first, ...others] = option.fixed

        const firstTextR = translateR(
          ".input {$count :number} {{{$count} of the following combat techniques {$rating}}}",
          { count: first.number, rating: first.rating_modifier + 6 },
        )

        const fixedTextR = others.reduce(
          (accTextR, other) =>
            accTextR.then(accText =>
              translateR(".input {$count :number} {{{$previous}, {$count} others {$rating}}}", {
                count: other.number,
                previous: accText,
                rating: other.rating_modifier + 6,
              }),
            ),
          firstTextR,
        )

        const completeTextR = fixedTextR.then(fixedText =>
          option.rest_rating_modifier === undefined
            ? Reader.of(fixedText)
            : translateR("{$previous}, all others {$rating}", {
                previous: fixedText,
                rating: option.rest_rating_modifier + 6,
              }),
        )

        const listR = Reader.traverse(option.options, strictNameR)
          .thenW(list => localeSortR(list))
          .map(list => list.join(", "))

        return completeTextR.thenW(completeText => listR.map(list => `${completeText}: ${list}`))
      })()
    : Reader.of(MISSING_VALUE)

const getTotalingAPValues = (
  professionPackages: NonEmptyArray<PreparedProfessionPackage>,
  selector: (professionPackage: PreparedProfessionPackage) => { ap_value: number } | undefined,
): string | number | undefined => {
  const options = professionPackages.map(selector)

  if (!isNotEmpty(options) || options.every(isNullish)) {
    return undefined
  }

  return allSame(options, deepEqual)
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- not all are nullish and because all are the same, none is nullish
      options[0]!.ap_value
    : options.map(option => option?.ap_value ?? 0).join("/")
}

const renderSkillsOption = (
  professionPackages: NonEmptyArray<PreparedProfessionPackage>,
  skillGroup: { id: string; nameOfSkillsOfGroup: string },
): StdReader<string | undefined, "t"> =>
  mapNullable(
    getTotalingAPValues(professionPackages, pkg =>
      pkg.content.options?.skills?.group === skillGroup.id ? pkg.content.options.skills : undefined,
    ),
    apValue =>
      translateR("{$apValue} AP to improve other {$skillsOfGroup}", {
        apValue,
        skillsOfGroup: skillGroup.nameOfSkillsOfGroup,
      }),
  ) ?? Reader.of(undefined)

const renderCantripList = (
  cantripIds: Cantrip_ID[],
): StdReader<string, "tm" | "lc" | "lj" | "ibi", "Cantrip"> =>
  Reader.traverse(cantripIds, id => strictNameR("Cantrip", id))
    .thenW(localeSortR)
    .map(list => list.join(", "))

const renderVariantCantripsOption = (
  baseOptions: CantripsOptions | undefined,
  variantOptions: VariantOptionAction<CantripsOptions>,
): StdReader<string, "t" | "tm" | "lc" | "lj" | "ibi", "Cantrip"> =>
  renderVariantOptionPaths(baseOptions, variantOptions, {
    remove: base =>
      renderCantripList(base.options).thenW(list =>
        translateR(".input {$count :number} {{{$count} cantrips}}", { count: 0 })
          .then(count => translateR("{$count} from the following list", { count }))
          .map(text => `${text}: ${list}`),
      ),
    add: override =>
      renderCantripList(override.options).thenW(list =>
        translateR(".input {$count :number} {{{$count} cantrips}}", { count: override.number })
          .then(count => translateR("{$count} from the following list", { count }))
          .map(text => `${text}: ${list}`),
      ),
    update: (base, override) =>
      deepEqual(base.options, override.options)
        ? renderCantripList(override.options).thenW(list =>
            translateR(".input {$count :number} {{{$count} cantrips}}", {
              count: override.number,
            }).then(baseCount =>
              translateR(".input {$count :number} {{{$count} cantrips}}", {
                count: override.number,
              })
                .then(replacementCount =>
                  translateR("{$replacement} instead of {$base}", {
                    replacement: replacementCount,
                    base: baseCount,
                  }).then(count => translateR("{$count} from the following list", { count })),
                )
                .map(text => `${text}: ${list}`),
            ),
          )
        : renderCantripList(override.options)
            .thenW(list =>
              translateR(".input {$count :number} {{{$count} cantrips}}", {
                count: override.number,
              })
                .then(count => translateR("{$count} from the following list", { count }))
                .map(text => `${text}: ${list}`),
            )
            .then(replacementText =>
              renderCantripList(base.options)
                .thenW(list =>
                  translateR(".input {$count :number} {{{$count} cantrips}}", {
                    count: base.number,
                  })
                    .then(count => translateR("{$count} from the following list", { count }))
                    .map(text => `${text}: ${list}`),
                )
                .then(baseText =>
                  translateR("{$replacement} instead of {$base}", {
                    replacement: replacementText,
                    base: baseText,
                  }),
                ),
            ),
  })

const renderSingleCantripsOption = (
  option: CantripsOptions,
): StdReader<string, "t" | "tm" | "lc" | "lj" | "ibi", "Cantrip"> =>
  renderVariantCantripsOption(undefined, { kind: "Override", Override: option })

const renderCantripsOption = (
  professionPackages: NonEmptyArray<PreparedProfessionPackage>,
): StdReader<string | undefined, "t" | "tm" | "lc" | "lj" | "ibi", "Cantrip"> => {
  const cantripsOptions = professionPackages.map(pkg => pkg.content.options?.cantrips)

  if (!isNotEmpty(cantripsOptions) || cantripsOptions.every(isNullish)) {
    return Reader.of(undefined)
  }

  if (allSame(cantripsOptions, deepEqual)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- not all are nullish and because all are the same, none is nullish
    return renderSingleCantripsOption(cantripsOptions[0]!)
  } else {
    return Reader.traverse(cantripsOptions, option =>
      option === undefined ? Reader.of("—") : renderSingleCantripsOption(option),
    ).map(list => list.join(" / "))
  }
}

const renderLiturgiesOption = (
  professionPackages: NonEmptyArray<PreparedProfessionPackage>,
): StdReader<string | undefined, "t"> =>
  mapNullable(
    getTotalingAPValues(professionPackages, pkg => pkg.content.options?.liturgies),
    apValue =>
      translateR("Liturgies totaling {$apValue} AP", {
        apValue,
      }),
  ) ?? Reader.of(undefined)

const renderVariantSkillSpecializationOption = (
  baseOptions: SkillSpecializationOptions | undefined,
  variantOptions: VariantOptionAction<SkillSpecializationOptions>,
): StdReader<string, "f" | "t" | "tm" | "lc" | "lj" | "ibi", "Skill" | "SkillGroup"> =>
  renderVariantOptionPaths(baseOptions, variantOptions, {
    remove: (
      base,
    ): StdReader<string, "f" | "t" | "tm" | "lc" | "lj" | "ibi", "Skill" | "SkillGroup"> => {
      switch (base.kind) {
        case "Specific":
          return Reader.traverse(base.Specific.options, id => strictNameR("Skill", id))
            .thenW(localeSortR)
            .thenW(list => localeJoinR(list, "disjunction"))
            .thenW(skillsText =>
              translateR("no Skill Specialization {$possibleSkills}", {
                possibleSkills: skillsText,
              }),
            )
        case "Group":
          return getInstanceByIdR("SkillGroup", base.Group)
            .thenW(translationR)
            .map(t => t?.longName ?? MISSING_VALUE)
            .thenW(longName => formatR(longName, { hiddenCount: 1 }))
            .thenW(skillOfGroup =>
              translateR("no Skill Specialization for a {$skillOfGroup}", {
                skillOfGroup,
              }),
            )
        default:
          return assertExhaustive(base)
      }
    },
    add: override => renderSkillSpecializationOption(override),
    update: (base, override) => {
      if (base.kind === "Specific" && override.kind === "Specific") {
        const overrideSkills = Reader.traverse(override.Specific.options, id =>
          strictNameR("Skill", id),
        ).thenW(list => localeJoinR(list, "disjunction"))

        const baseSkills = Reader.traverse(base.Specific.options, id =>
          strictNameR("Skill", id),
        ).thenW(list => localeJoinR(list, "disjunction"))

        return overrideSkills
          .thenW(overrideSkillsText =>
            baseSkills.thenW(baseSkillsText => insteadOfR(overrideSkillsText, baseSkillsText)),
          )
          .then(skillsText =>
            translateR("Skill Specialization {$possibleSkills}", {
              possibleSkills: skillsText,
            }),
          )
      } else {
        return renderSkillSpecializationOption(override).then(overrideText =>
          renderSkillSpecializationOption(base).then(baseText =>
            insteadOfR(overrideText, baseText),
          ),
        )
      }
    },
  })

const renderVariantCombatTechniquesOption = (
  baseOptions: CombatTechniquesOptions | undefined,
  variantOptions: VariantOptionAction<CombatTechniquesOptions>,
): StdReader<
  string,
  "t" | "tm" | "lc" | "lj" | "ibi",
  "CloseCombatTechnique" | "RangedCombatTechnique"
> =>
  renderVariantOptionPaths(baseOptions, variantOptions, {
    remove: base =>
      renderCombatTechniquesOption({
        ...base,
        fixed: base.fixed.map(option => ({ ...option, number: 0 })),
      }),
    add: override => renderCombatTechniquesOption(override),
    update: (base, override) =>
      renderCombatTechniquesOption(override).then(overrideText =>
        renderCombatTechniquesOption(base).then(baseText => insteadOfR(overrideText, baseText)),
      ),
  })

const renderVariantCursesOption = (
  baseOptions: CursesOptions | undefined,
  variantOptions: VariantOptionAction<CursesOptions>,
): StdReader<string, "t"> =>
  renderVariantOptionPaths(baseOptions, variantOptions, {
    remove: base => translateR("no Curses totaling {$apValue} AP", { apValue: base.ap_value }),
    add: override => translateR("Curses totaling {$apValue} AP", { apValue: override.ap_value }),
    update: (base, override) =>
      insteadOfR(override.ap_value, base.ap_value).then(apValue =>
        translateR("Curses totaling {$apValue} AP", {
          apValue,
        }),
      ),
  })

const renderCursesOption = (option: CursesOptions) =>
  renderVariantCursesOption(undefined, { kind: "Override", Override: option })

const nameOfSkillsOfGroupR = (skillGroupId: string) =>
  getInstanceByIdR("SkillGroup", skillGroupId)
    .thenW(translationR)
    .map(t => t?.longName ?? MISSING_VALUE)

const renderVariantSkillsOption = (
  baseOptions: SkillsOptions | undefined,
  variantOptions: VariantOptionAction<SkillsOptions>,
): StdReader<string, "t" | "tm" | "ibi", "SkillGroup"> =>
  renderVariantOptionPaths(baseOptions, variantOptions, {
    remove: base =>
      nameOfSkillsOfGroupR(base.group).thenW(nameOfSkillsOfGroup =>
        translateR("no AP to improve other {$skillsOfGroup}", {
          skillsOfGroup: nameOfSkillsOfGroup,
        }),
      ),
    add: override =>
      nameOfSkillsOfGroupR(override.group).thenW(nameOfSkillsOfGroup =>
        translateR("{$apValue} AP to improve other {$skillsOfGroup}", {
          apValue: override.ap_value,
          skillsOfGroup: nameOfSkillsOfGroup,
        }),
      ),
    update: (base, override) =>
      plainOrInsteadOfR(
        base,
        override,
        b => b.ap_value,
        equal,
        b => Reader.of(b),
      ).thenW(apValue =>
        plainOrInsteadOfR(base, override, b => b.group, equal, nameOfSkillsOfGroupR).thenW(
          nameOfSkillsOfGroup =>
            translateR("{$apValue} AP to improve other {$skillsOfGroup}", {
              apValue,
              skillsOfGroup: nameOfSkillsOfGroup,
            }),
        ),
      ),
  })

const renderVariantLiturgiesOption = (
  baseOptions: LiturgiesOptions | undefined,
  variantOptions: VariantOptionAction<LiturgiesOptions>,
): StdReader<string, "t"> =>
  renderVariantOptionPaths(baseOptions, variantOptions, {
    remove: base => translateR("no Liturgies totaling {$apValue} AP", { apValue: base.ap_value }),
    add: override => translateR("Liturgies totaling {$apValue} AP", { apValue: override.ap_value }),
    update: (base, override) =>
      insteadOfR(override.ap_value, base.ap_value).then(apValue =>
        translateR("Liturgies totaling {$apValue} AP", {
          apValue,
        }),
      ),
  })

const getSpecialAbilityNameComponents = (
  getInstanceById: GetInstanceById<SpecialAbilityIdentifier["kind"]>,
  getResolvedSelectOptionById: GetResolvedSelectOptionById,
  translate: Translate,
  option: ConstantProfessionSpecialAbility,
) => {
  const instance:
    | {
        nameBuilderRules?: ActivatableNameBuilderRules
        translations: LocaleMap<{ name: string }>
      }
    | undefined = getInstanceById(option.id)

  if (instance === undefined) {
    return undefined
  }

  return getNameComponents(
    translate,
    option.id,
    option.options,
    option.level,
    "nameBuilderRules" in instance ? instance.nameBuilderRules : undefined,
    instance.translations,
    t => t.name,
    getResolvedSelectOptionById,
    true,
  )
}

const renderSpecialAbilityName = (specialAbility: ProfessionSpecialAbility) =>
  Reader.asks(
    ({
      translate,
      translateMap,
      localeJoin,
      getInstanceById,
      getResolvedSelectOptionById,
    }: StdEnv<"t" | "tm" | "lc" | "lj" | "ibi" | "rso", SpecialAbilityIdentifier["kind"]>) => {
      switch (specialAbility.kind) {
        case "Constant": {
          const chunk = getSpecialAbilityNameComponents(
            getInstanceById,
            getResolvedSelectOptionById,
            translate,
            specialAbility.Constant,
          )

          return chunk === undefined
            ? MISSING_VALUE
            : renderActivatableNameComponents(translateMap, chunk, false)
        }
        case "Selection": {
          const chunks = specialAbility.Selection.options.map(option =>
            getSpecialAbilityNameComponents(
              getInstanceById,
              getResolvedSelectOptionById,
              translate,
              option,
            ),
          )

          const possiblyCombined =
            isNotEmpty(specialAbility.Selection.options) && chunks.every(isNotNullish)
              ? combineNameComponents(chunks)
              : undefined

          if (possiblyCombined === undefined) {
            return localeJoin(
              chunks.map(chunk =>
                chunk === undefined
                  ? MISSING_VALUE
                  : renderActivatableNameComponents(translateMap, chunk, false),
              ),
              "disjunction",
            )
          } else {
            return renderCombinedActivatableNameComponents(
              translateMap,
              possiblyCombined,
              false,
              list => localeJoin(list, "disjunction"),
            )
          }
        }
        default:
          return assertExhaustive(specialAbility)
      }
    },
  )

const renderSpecialAbilities = (specialAbilities: SpecialAbilities) =>
  Reader.sequence<
    StdEnv<
      "f" | "t" | "tm" | "lj" | "lc" | "ibi" | "rso",
      "Skill" | "SkillGroup" | SpecialAbilityIdentifier["kind"]
    >,
    string | NonEmptyArray<string> | undefined
  >([
    specialAbilities.languagesScripts === undefined
      ? Reader.of(undefined)
      : renderLanguagesScriptsOption(specialAbilities.languagesScripts),
    specialAbilities.curses === undefined
      ? Reader.of(undefined)
      : renderCursesOption(specialAbilities.curses),
    specialAbilities.skillSpecialization === undefined
      ? Reader.of(undefined)
      : renderSkillSpecializationOption(specialAbilities.skillSpecialization),
    specialAbilities.list === undefined
      ? Reader.of(undefined)
      : Reader.traverse(specialAbilities.list, renderSpecialAbilityName)
          .thenW(localeSortR)
          .map(ensureNonEmpty),
  ]).then(rendered => {
    const result = ensureNonEmpty(rendered.filter(isNotNullish).flat())?.join(", ")
    return result === undefined ? translateR("none") : Reader.of(result)
  })

const renderCombatTechniques = (professionPackages: NonEmptyArray<PreparedProfessionPackage>) =>
  Reader.sequence<
    StdEnv<
      "f" | "t" | "tm" | "lj" | "lc" | "ibi",
      "CloseCombatTechnique" | "RangedCombatTechnique"
    >,
    string | undefined
  >([
    renderNumericListAcrossPackages(
      professionPackages,
      pkg => Reader.of(pkg.content.combat_techniques?.map(ct => [ct.id, ct.rating_modifier]) ?? []),
      deepEqual,
      (ctId: CombatTechniqueIdentifier) => strictNameR(ctId),
      6,
    ),
    professionPackages.some(pkg => pkg.content.options?.combat_techniques !== undefined)
      ? renderSinglePackageValue(
          professionPackages,
          pkg => Reader.of(pkg.content.options?.combat_techniques),
          deepEqual,
          options =>
            Reader.traverse(options, option =>
              option === undefined ? Reader.of("—") : renderCombatTechniquesOption(option),
            ).map(renderedOptions => renderedOptions.join(" / ")),
        )
      : Reader.of(undefined),
  ]).map(list => ensureNonEmpty(list.filter(isNotNullish))?.join(", ") ?? "—")

const renderSkills = (
  professionPackages: NonEmptyArray<PreparedProfessionPackage>,
): StdReader<
  RawDefinitionListEntityDescriptionSectionItem[],
  "t" | "tm" | "lc" | "ibi" | "ai" | "acibp",
  "Skill",
  "SkillGroup"
> =>
  Reader.asks(({ getAllInstances }: StdEnv<"ai", never, "SkillGroup">) =>
    getAllInstances("SkillGroup"),
  ).thenW(skillGroups =>
    Reader.traverse(
      skillGroups.toSorted(on(group => group.content.position, compareNumber)),
      ({ id: groupId, content: group }) =>
        translationR(group).thenW(groupTranslation =>
          Reader.sequence<StdEnv<"t" | "tm" | "lc" | "ibi", "Skill">, string | undefined>([
            renderNumericListAcrossPackages(
              professionPackages,
              pkg =>
                Reader.asks(
                  ({ getInstanceById }: StdEnv<"ibi", "Skill">) =>
                    pkg.content.skills
                      ?.filter(skill => getInstanceById("Skill", skill.id)?.group === groupId)
                      .map(skill => [skill.id, skill.rating_modifier]) ?? [],
                ),
              equal,
              skillId => strictNameR("Skill", skillId),
              0,
            ),
            renderSkillsOption(professionPackages, {
              id: groupId,
              nameOfSkillsOfGroup: groupTranslation?.longName ?? MISSING_VALUE,
            }),
          ]).map(value => ({
            label: groupTranslation?.name ?? MISSING_VALUE,
            value: ensureNonEmpty(value.filter(isNotNullish))?.join(", ") ?? "—",
          })),
        ),
    ),
  )

const renderSpellworkName = (spellworkIds: ProfessionMagicalSkillIdentifier[]) =>
  Reader.traverse(spellworkIds, spellworkId => {
    switch (spellworkId.kind) {
      case "Spellwork":
        return strictNameR(spellworkId.Spellwork.id).thenW(baseName =>
          (spellworkId.Spellwork.tradition === undefined
            ? Reader.of(undefined)
            : nameR("MagicalTradition", spellworkId.Spellwork.tradition)
          ).map(traditionName => baseName + parensIf(traditionName)),
        )
      case "MagicalAction":
        return strictNameR(spellworkId.MagicalAction.id)
      default:
        return spellworkId
    }
  }).thenW(list => localeJoinR(list, "disjunction"))

const renderSpellworks = (professionPackages: NonEmptyArray<PreparedProfessionPackage>) =>
  Reader.sequence<
    StdEnv<"t" | "tm" | "lc" | "lj" | "ibi", "Cantrip" | "Spell" | "Ritual" | "MagicalTradition">,
    string | undefined
  >([
    renderCantripsOption(professionPackages),
    renderNumericListAcrossPackages(
      professionPackages,
      (pkg: PreparedProfessionPackage) =>
        Reader.of(pkg.content.spells?.map(ct => [ct.id, ct.rating_modifier]) ?? []),
      deepEqual,
      renderSpellworkName,
      0,
    ),
  ]).map(list => ensureNonEmpty(list.filter(isNotNullish))?.join("; "))

const retrieveBlessedTraditionIdentifierFromPrerequisiteGroup = (
  prerequisite: ProfessionPrerequisiteGroup,
) =>
  prerequisite.kind === "Activatable" && prerequisite.Activatable.id.kind === "BlessedTradition"
    ? [prerequisite.Activatable.id.BlessedTradition]
    : []

const retrieveBlessedTraditionIdentifierFromPrerequisites = (
  prerequisites: ProfessionPrerequisites | undefined,
) =>
  prerequisites?.flatMap(part => {
    switch (part.kind) {
      case "Single":
        return retrieveBlessedTraditionIdentifierFromPrerequisiteGroup(part.Single)
      case "Disjunction":
        return part.Disjunction.list.flatMap(
          retrieveBlessedTraditionIdentifierFromPrerequisiteGroup,
        )
      case "Group":
        return part.Group.list.flatMap(retrieveBlessedTraditionIdentifierFromPrerequisiteGroup)
      default:
        return assertExhaustive(part)
    }
  }) ?? []

const renderBlessingList = (blessings: Blessing_ID[]) =>
  Reader.traverse(blessings, id => strictNameR("Blessing", id)).thenW(localeSortR)

const renderRestrictedBlessings = (restrictedBlessings: RestrictedBlessings) => {
  switch (restrictedBlessings.kind) {
    case "Three":
      return renderBlessingList(restrictedBlessings.Three)
    case "Six":
      return renderBlessingList(restrictedBlessings.Six)
    default:
      return assertExhaustive(restrictedBlessings)
  }
}

const renderSingleBlessings = (traditions: BlessedTradition_ID[]) =>
  Reader.traverse(traditions, traditionId =>
    getInstanceByIdR("BlessedTradition", traditionId).map(tradition =>
      tradition
        ? { restrictedBlessings: tradition.restricted_blessings, type: tradition.type }
        : undefined,
    ),
  ).thenW(restrictedBlessingsList =>
    !isNotEmpty(restrictedBlessingsList)
      ? Reader.of(undefined)
      : restrictedBlessingsList.length === 1
        ? (() => {
            const [first] = restrictedBlessingsList
            const { restrictedBlessings, type } = first ?? {}
            return type?.kind === "Shamanistic"
              ? Reader.of(undefined)
              : restrictedBlessings === undefined
                ? translateR("The Twelve Blessings")
                : translateR("The Twelve Blessings").thenW(base =>
                    renderRestrictedBlessings(restrictedBlessings).thenW(list =>
                      translateR("except for {$list :list type=conjunction}", {
                        list,
                      }).map(note => base + parensIf(note)),
                    ),
                  )
          })()
        : restrictedBlessingsList.every(trad => trad?.type.kind === "Shamanistic")
          ? Reader.of(undefined)
          : restrictedBlessingsList.some(
                trad =>
                  trad?.restrictedBlessings !== undefined || trad?.type.kind === "Shamanistic",
              )
            ? translateR("The Twelve Blessings").map2(
                translateR("depends on selected tradition"),
                (base, note) => base + parensIf(note),
              )
            : translateR("The Twelve Blessings"),
  )

const renderBlessings = (traditions: string[][]) => {
  if (traditions.every(isEmpty)) {
    return Reader.of(undefined)
  } else if (allSame(traditions, deepEqual)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- not all are empty and because all are the same, none is empty
    return renderSingleBlessings(traditions[0]!)
  } else {
    return Reader.traverse(traditions, option =>
      option.length === 0 ? Reader.of("—") : renderSingleBlessings(option),
    ).map(list => list.join(" / "))
  }
}

const renderBlessingsForPackages = (professionPackages: NonEmptyArray<PreparedProfessionPackage>) =>
  renderBlessings(
    professionPackages.map(pkg =>
      retrieveBlessedTraditionIdentifierFromPrerequisites(pkg.content.prerequisites),
    ),
  )

const renderBlessingsForVariant = (professionVariant: ProfessionVariant) =>
  renderBlessings([
    retrieveBlessedTraditionIdentifierFromPrerequisites(professionVariant.prerequisites),
  ]).map(blessingsText => (blessingsText !== undefined ? [blessingsText] : []))

const renderLiturgicalChantName = (liturgyIds: LiturgyIdentifier[]) =>
  Reader.traverse(liturgyIds, strictNameR).thenW(list => localeJoinR(list, "disjunction"))

const renderLiturgicalChants = (professionPackages: NonEmptyArray<PreparedProfessionPackage>) =>
  Reader.sequence<
    StdEnv<
      "t" | "tm" | "lc" | "lj" | "ibi",
      "BlessedTradition" | "Blessing" | "LiturgicalChant" | "Ceremony"
    >,
    string | undefined
  >([
    renderBlessingsForPackages(professionPackages),
    renderNumericListAcrossPackages(
      professionPackages,
      (pkg: PreparedProfessionPackage) =>
        Reader.of(pkg.content.liturgical_chants?.map(ct => [ct.id, ct.rating_modifier]) ?? []),
      deepEqual,
      renderLiturgicalChantName,
      0,
    ),
    renderLiturgiesOption(professionPackages),
  ]).map(list => ensureNonEmpty(list.filter(isNotNullish))?.join(", "))

const baseHasNoTradition = (base: ProfessionPackage): boolean =>
  isEmpty(retrieveBlessedTraditionIdentifierFromPrerequisites(base.prerequisites))

const renderRatedVariantChanges = <ID, Env>(
  baseList: "ignore" | { id: ID; rating_modifier: number }[] | undefined,
  variantList: { id: ID; rating_modifier: number }[] | undefined,
  renderInstance: (id: ID) => Reader<Env, string>,
) =>
  Reader.traverse(variantList ?? [], ({ id, rating_modifier }) => {
    if (baseList === "ignore") {
      return renderInstance(id).map(name => `${name} ${rating_modifier.toFixed()}`)
    }

    const baseValue = baseList?.find(item => deepEqual(item.id, id))?.rating_modifier ?? 0
    return renderInstance(id).thenW(name =>
      translateR("{$replacement} instead of {$base}", {
        replacement: `${name} ${(baseValue + rating_modifier).toFixed()}`,
        base: baseValue,
      }),
    )
  }).thenW(localeSortR)

const renderVariantOption = <Env, K extends keyof ProfessionVariantPackageOptions>(
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

const renderProfessionVariantLabel = (
  base: ProfessionPackage,
  variant: ProfessionVariant,
  translations: NonEmptyArray<{ id: string; content: ProfessionVariantTranslation }>,
) =>
  translateR("{$value} AP", {
    value: base.ap_value + (variant.ap_value ?? 0),
  }).thenW(apValueText =>
    localeSortR(
      translations.map(
        ({ id, content }) =>
          `^[${content.name.default}](entity: "ProfessionVariant", instance: "${id}")`,
      ),
    )
      .thenW(list => localeJoinR(list, "conjunction"))
      .map(names => names + parensIf(apValueText)),
  )

const renderProfessionVariantText = (
  base: ProfessionPackage,
  variant: ProfessionVariant,
  translation: ProfessionVariantTranslation,
) =>
  translation.full_text !== undefined
    ? Reader.of(translation.full_text)
    : Reader.sequence<
        StdEnv<
          "f" | "t" | "tm" | "lc" | "lj" | "ibi" | "rso",
          | RatedIdentifier["kind"]
          | MagicalActionIdentifier["kind"]
          | ActivatableIdentifier["kind"]
          | "Aspect"
          | "Race"
          | "Culture"
          | "Cantrip"
          | "SkillGroup"
          | "Blessing"
        >,
        string[]
      >([
        Reader.asks(env =>
          variant.prerequisites === undefined
            ? []
            : [
                `${env.translate("Additional Prerequisites")}: ${printProfessionPrerequisites(
                  env.getInstanceById,
                  env.getResolvedSelectOptionById,
                  {
                    ...env,
                    join: env.localeJoin,
                    compare: env.localeCompare,
                  },
                  variant.prerequisites,
                )}`,
              ],
        ),
        renderVariantOption(
          base,
          variant,
          "skill_specialization",
          renderVariantSkillSpecializationOption,
        ),
        renderVariantOption(
          base,
          variant,
          "languages_scripts",
          renderVariantLanguagesScriptsOption,
        ),
        renderVariantOption(
          base,
          variant,
          "combat_techniques",
          renderVariantCombatTechniquesOption,
        ),
        renderVariantOption(base, variant, "cantrips", renderVariantCantripsOption),
        renderVariantOption(base, variant, "curses", renderVariantCursesOption),
        renderVariantOption(base, variant, "skills", renderVariantSkillsOption),
        renderVariantOption(base, variant, "liturgies", renderVariantLiturgiesOption),
        variant.special_abilities === undefined
          ? Reader.of([])
          : Reader.traverse(variant.special_abilities, specialAbility => {
              switch (specialAbility.action.kind) {
                case "Remove":
                  return translateR("no special ability").thenW(prefix =>
                    renderSpecialAbilityName(specialAbility.value).map(name => `${prefix} ${name}`),
                  )
                case "Override":
                  return renderSpecialAbilityName(specialAbility.value)
                default:
                  return assertExhaustive(specialAbility.action)
              }
            }),
        renderRatedVariantChanges(base.combat_techniques, variant.combat_techniques, id =>
          strictNameR(id),
        ),
        renderRatedVariantChanges(base.skills, variant.skills, id => strictNameR("Skill", id)),
        renderRatedVariantChanges(base.spells, variant.spells, renderSpellworkName),
        renderBlessingsForVariant(variant),
        renderRatedVariantChanges(
          baseHasNoTradition(base) ? "ignore" : base.liturgical_chants,
          variant.liturgical_chants,
          renderLiturgicalChantName,
        ),
      ]).map(
        lists =>
          lists
            .filter(isNotEmpty)
            .map(list => list.join(", "))
            .join("; ") + (translation.concluding_text ?? ""),
      )

const renderProfessionVariant = (
  base: ProfessionPackage,
  variants: NonEmptyArray<{ id: string; content: ProfessionVariant }>,
) =>
  translateMapFnR.thenW(translateMap => {
    const translations = variants
      .map(variant =>
        mapNullable(translateMap(variant.content.translations), t => ({
          id: variant.id,
          content: t,
        })),
      )
      .filter(isNotNullish)

    return !isNotEmpty(translations)
      ? Reader.of(undefined)
      : renderProfessionVariantLabel(base, variants[0].content, translations).thenW(label =>
          renderProfessionVariantText(base, variants[0].content, translations[0].content).map(
            (value): RawDefinitionListEntityDescriptionSectionItem => ({
              label,
              value,
            }),
          ),
        )
  })

const equalProfessionVariantValues = (translateMap: TranslateMap): Equality<ProfessionVariant> =>
  on(variant => {
    const translation = translateMap(variant.translations)
    return {
      ...variant,
      translations: translation === undefined ? undefined : omitKeys(translation, "name"),
    }
  }, deepEqual)

const groupProfessionVariantsThatContainTheSameChanges = (
  variants: {
    id: string
    content: ProfessionVariant
  }[],
): StdReader<NonEmptyArray<{ id: string; content: ProfessionVariant }>[], "tm"> =>
  Reader.asks(({ translateMap }) =>
    variants.reduce<
      NonEmptyArray<{
        id: string
        content: ProfessionVariant
      }>[]
    >((acc, variant) => {
      const indexWithSameValuesGranted = acc.findIndex(group =>
        equalProfessionVariantValues(translateMap)(group[0].content, variant.content),
      )

      if (indexWithSameValuesGranted > -1) {
        acc[indexWithSameValuesGranted]?.push(variant)
      } else {
        acc.push([variant])
      }

      return acc
    }, []),
  )

const renderProfessionVariants = (professionPackages: NonEmptyArray<PreparedProfessionPackage>) =>
  professionPackages.length > 1
    ? Reader.of(UNHANDLED_VALUE)
    : getChildInstancesForInstanceIdR("ProfessionVariant", professionPackages[0].id).thenW(
        variants =>
          groupProfessionVariantsThatContainTheSameChanges(variants).thenW(groupedVariants =>
            Reader.traverse(groupedVariants, variant =>
              renderProfessionVariant(professionPackages[0].content, variant),
            )
              .map(list => list.filter(isNotNullish))
              .thenW(list =>
                list.length === 0
                  ? Reader.of(undefined)
                  : localeCompareR.map(
                      (localeCompare): RawNestedDefinitionListEntityDescriptionSection[] => [
                        {
                          type: "definitionList",
                          style: "nested",
                          items: list.toSorted(on(item => item.label, localeCompare)),
                        },
                      ],
                    ),
              ),
          ),
      )

/**
 * Get a JSON representation of the rules text for a profession version.
 */
export const getProfessionVersionEntityDescription = createEntityDescriptionCreator<
  "ProfessionVersion",
  {
    getInstanceById: GetInstanceById<
      | "Publication"
      | "ExperienceLevel"
      | "Advantage"
      | "Disadvantage"
      | SpecialAbilityIdentifier["kind"]
      | "Aspect"
      | RatedIdentifier["kind"]
      | "Race"
      | "Culture"
      | MagicalActionIdentifier["kind"]
      | "SkillGroup"
      | "Cantrip"
      | "Blessing"
    >
    getAllInstances: GetAllInstances<"SkillGroup">
    getChildInstancesForInstanceId: GetAllChildInstancesForParent<
      "ProfessionPackage" | "ProfessionVariant"
    >
    getResolvedSelectOptionById: GetResolvedSelectOptionById
  }
>(
  (
    {
      getInstanceById,
      getAllInstances,
      getChildInstancesForInstanceId,
      getResolvedSelectOptionById,
    },
    locale,
    { id, content: entry },
  ): RawEntityDescription | undefined => {
    const { format, translate, translateMap, compare: localeCompare, join: localeJoin } = locale

    const translation = translateMap(entry.translations)

    const env = {
      format,
      translate,
      translateMap,
      localeCompare,
      localeJoin,
      getInstanceById,
      getAllInstances,
      getChildInstancesForInstanceId,
      getResolvedSelectOptionById,
    } satisfies Partial<EnvMap>

    const professionPackages = prepareProfessionPackages(id).run(env)

    if (translation === undefined || !isNotEmpty(professionPackages)) {
      return undefined
    }

    return {
      title:
        translation.name.default +
        parensIf(
          ensureNonEmpty(
            [
              translation.specification?.default,
              professionPackages.length > 1
                ? professionPackages
                    .map(pkg => translateMap(pkg.experienceLevel.translations)?.name)
                    .join("/")
                : undefined,
            ].filter(isNotNullish),
          )?.join(", "),
        ),
      className: "profession",
      body: [
        {
          type: "definitionList",
          items: [
            {
              label: translate("AP Value"),
              value: renderSinglePackageValue(
                professionPackages,
                pkg => Reader.of(pkg.content.ap_value),
                equal,
                apValues =>
                  apValues.length === 1
                    ? translateR(".input {$value :number} {{{$value} Adventure Points}}", {
                        value: apValues[0],
                      })
                    : translateR("{$value} Adventure Points", {
                        value: apValues.join("/"),
                      }),
              ).run(env),
            },
            {
              label: translate("Prerequisites"),
              value: renderSinglePackageValue(
                professionPackages,
                pkg => Reader.of(pkg.content.prerequisites),
                deepEqual,
                prerequisitesLists =>
                  Reader.of(
                    prerequisitesLists
                      .map(prerequisites =>
                        prerequisites === undefined
                          ? translate("none")
                          : printProfessionPrerequisites(
                              getInstanceById,
                              getResolvedSelectOptionById,
                              locale,
                              prerequisites,
                            ),
                      )
                      .join(" / "),
                  ),
              ).run(env),
            },
            {
              label: translate("Special Abilities"),
              value: renderSinglePackageValue(
                professionPackages,
                pkg =>
                  Reader.of({
                    skillSpecialization: pkg.content.options?.skill_specialization,
                    languagesScripts: pkg.content.options?.languages_scripts,
                    curses: pkg.content.options?.curses,
                    list: pkg.content.special_abilities,
                  }),
                deepEqual,
                specialAbilityLists =>
                  Reader.of(
                    specialAbilityLists
                      .map(specialAbilities =>
                        Object.values(specialAbilities).every(list => list === undefined)
                          ? translate("none")
                          : renderSpecialAbilities(specialAbilities).run(env),
                      )
                      .join(" / "),
                  ),
              ).run(env),
            },
            {
              label: translate("Combat Techniques"),
              value: renderCombatTechniques(professionPackages).run(env),
            },
            {
              label: translate("Skills"),
              value: [
                {
                  type: "definitionList",
                  style: "nested",
                  items: renderSkills(professionPackages).run(env),
                },
              ],
            },
            renderSpellworks(professionPackages)
              .map(value =>
                value === undefined
                  ? undefined
                  : {
                      label: translate("Spellworks"),
                      value,
                    },
              )
              .run(env),
            renderLiturgicalChants(professionPackages)
              .map(value =>
                value === undefined
                  ? undefined
                  : {
                      label: translate("Liturgical Chants"),
                      value,
                    },
              )
              .run(env),
            renderValueWithPossibleTranslation(
              "Suggested Advantages",
              entry.suggested_advantages,
              values =>
                renderCommonnessRatedAdvantagesOrDisadvantages("Advantage", values).run(env),
              translation.suggested_advantages,
            ).run(env),
            renderValueWithPossibleTranslation(
              "Suggested Disadvantages",
              entry.suggested_disadvantages,
              values =>
                renderCommonnessRatedAdvantagesOrDisadvantages("Disadvantage", values).run(env),
              translation.suggested_disadvantages,
            ).run(env),
            renderValueWithPossibleTranslation(
              "Unsuitable Advantages",
              entry.unsuitable_advantages,
              values =>
                renderCommonnessRatedAdvantagesOrDisadvantages("Advantage", values).run(env),
              translation.unsuitable_advantages,
            ).run(env),
            renderValueWithPossibleTranslation(
              "Unsuitable Disadvantages",
              entry.unsuitable_disadvantages,
              values =>
                renderCommonnessRatedAdvantagesOrDisadvantages("Disadvantage", values).run(env),
              translation.unsuitable_disadvantages,
            ).run(env),
            renderProfessionVariants(professionPackages)
              .map(value =>
                value === undefined
                  ? undefined
                  : {
                      label: translate("Variants"),
                      value,
                    },
              )
              .run(env),
          ],
        },
      ],
      errata: translation.errata,
      references: entry.src,
    }
  },
)
