import type { AnyNonNullish } from "@elyukai/utils/nullable"

/**
 * Creates an enum case object.
 */
export const Case = (<K extends string, T>(
  kind: K,
  value: T,
): T extends AnyNonNullish | null
  ? { kind: K } & { [Key in K]: Extract<T, AnyNonNullish | null> }
  : { kind: K } =>
  (value === undefined ? { kind } : { kind, [kind]: value }) as T extends AnyNonNullish | null
    ? { kind: K } & { [Key in K]: Extract<T, AnyNonNullish | null> }
    : { kind: K }) as {
  <K extends string>(kind: K): { kind: K }
  <K extends string, T extends AnyNonNullish | null>(
    kind: K,
    value: T,
  ): { kind: K } & { [Key in K]: T }
}
