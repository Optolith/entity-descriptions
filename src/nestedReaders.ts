import { Reader } from "@elyukai/utils/reader"

/**
 * A type that recursively wraps all values in a nested object in a Reader, unless they are already wrapped in a Reader. This allows a Reader to be used at any level of a nested object.
 */
export type WrapInNestedReaders<E, T> =
  | Reader<E, T>
  | (T extends object ? { [K in keyof T]: WrapInNestedReaders<E, T[K]> } : T)

/**
 * A type that recursively unwraps all values in a nested object from a Reader, unless they are already unwrapped. Opposite of `WrapInNestedReaders`.
 */
export type UnwrapNestedReaders<E, T> =
  T extends Reader<E, infer U>
    ? U
    : T extends object
      ? { [K in keyof T]: UnwrapNestedReaders<E, T[K]> }
      : T

/**
 * Unwraps all values in a nested object from a Reader, unless they are already unwrapped.
 */
export const unwrapNestedReaders = <E, T>(obj: WrapInNestedReaders<E, T>, env: E): T => {
  if (obj instanceof Reader) {
    return obj.run(env)
  }

  if (Array.isArray(obj)) {
    return (obj as unknown[]).map(item => unwrapNestedReaders(item, env)) as T
  }

  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, unwrapNestedReaders(value, env)]),
    ) as T
  }

  return obj as T
}
