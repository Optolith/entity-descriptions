import type { AnyNonNullish } from "@elyukai/utils/nullable"
import type { Reader } from "@elyukai/utils/reader"
import type {
  ChildEntityMap,
  EntityMap,
  LocaleMeasurementAdjustments,
} from "@optolith/database-schema/gen"
import type { GetResolvedSelectOptionById } from "./entities/partial/prerequisites/single/activatable.js"
import type { ModifiableParameter } from "./entities/partial/rated/activatable/nonModifiableSuffix.js"
import type { Speed } from "./entities/partial/rated/activatable/speed.js"
import type { ResponsiveTextSize } from "./entities/partial/responsiveText.js"
import { type EnergyUnit } from "./entities/partial/units/energy.js"
import type {
  GetAllChildInstancesForParent,
  GetAllInstances,
  GetInstanceById,
} from "./helpers/getTypes.js"
import type { FormatDate, FormatNumber, LocaleCompare, LocaleJoin } from "./helpers/locale.js"
import type {
  Format,
  Translate,
  TranslateMap,
  TranslationKeysWithoutParams,
} from "./helpers/translate.js"
import type { IdMap } from "./index.js"
import type { PublicationOptions } from "./references/publicationOptions.js"

/**
 * The standard set of environment properties for readers in this project.
 */
export type EnvMap<
  E extends keyof EntityMap = never,
  AE extends keyof EntityMap = never,
  CE extends keyof ChildEntityMap = never,
> = {
  format: Format
  formatNumber: FormatNumber
  formatDate: FormatDate
  translate: Translate
  translateMap: TranslateMap
  localeJoin: LocaleJoin
  localeCompare: LocaleCompare
  responsiveTextSize: ResponsiveTextSize
  speed: Speed
  energyUnit: EnergyUnit
  nonModifiableSuffix?: (param: ModifiableParameter) => TranslationKeysWithoutParams
  getInstanceById: GetInstanceById<E>
  getAllInstances: GetAllInstances<AE>
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<CE>
  getResolvedSelectOptionById: GetResolvedSelectOptionById
  publicationOptions: PublicationOptions
  displayedInProfession: boolean
  measurementAdjustments: Required<LocaleMeasurementAdjustments>
  idMap: IdMap
}

/**
 * Shortcuts for selecting keys of the shared environment map type.
 */
export type EnvMapAbbr = {
  f: "format"
  fn: "formatNumber"
  fd: "formatDate"
  t: "translate"
  tm: "translateMap"
  lj: "localeJoin"
  lc: "localeCompare"
  rts: "responsiveTextSize"
  s: "speed"
  eu: "energyUnit"
  nms: "nonModifiableSuffix"
  ibi: "getInstanceById"
  ai: "getAllInstances"
  acibp: "getChildInstancesForInstanceId"
  rso: "getResolvedSelectOptionById"
  po: "publicationOptions"
  dip: "displayedInProfession"
  ma: "measurementAdjustments"
  idm: "idMap"
}

/**
 * The standard set of environment properties for readers in this project.
 *
 * The keys are abbreviated to keep type annotations short.
 */
export type StdEnv<
  K extends keyof EnvMapAbbr = keyof EnvMapAbbr,
  E extends keyof EntityMap = never,
  AE extends keyof EntityMap = never,
  CE extends keyof ChildEntityMap = never,
> = Pick<EnvMap<E, AE, CE>, EnvMapAbbr[K]>

/**
 * Shortcut for a reader with common environment properties.
 *
 * The keys are abbreviated to keep return type annotations short.
 */
export type StdReader<
  T,
  K extends keyof EnvMapAbbr,
  E extends keyof EntityMap = never,
  AE extends keyof EntityMap = never,
  CE extends keyof ChildEntityMap = never,
  EX = AnyNonNullish,
> = Reader<StdEnv<K, E, AE, CE> & EX, T>
