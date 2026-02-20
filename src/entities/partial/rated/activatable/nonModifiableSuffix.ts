import { Reader } from "@elyukai/utils/reader"
import {
  responsiveTranslateR,
  type StdEnv,
  type StdReader,
} from "../../reader.js"

/**
 * A parameter that is designed to be modifiable.
 */
export enum ModifiableParameter {
  CastingTime,
  Cost,
  Range,
}

/**
 * Returns the suffix for the text of a non-modifiable parameter that indicates
 * that the parameter cannot be modified.
 */
export const appendNonModifiableSuffix = (
  param: ModifiableParameter,
  base: string,
): StdReader<string, "t" | "rts" | "nms"> =>
  Reader.asks((ctx: StdEnv<"nms">) => ctx.nonModifiableSuffix)
    .thenW(suffix =>
      suffix === undefined
        ? Reader.of("")
        : responsiveTranslateR(suffix(param), " (cannot modify)"),
    )
    .map(suffix => base + suffix)
