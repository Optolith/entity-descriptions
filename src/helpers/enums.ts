/**
 * Creates an enum case object.
 */
export const Case = (<K extends string, T>(
  kind: K,
  value: T,
): T extends NonNullable<unknown> | null
  ? { kind: K } & { [Key in K]: Extract<T, NonNullable<unknown> | null> }
  : { kind: K } =>
  (value === undefined
    ? { kind }
    : { kind, [kind]: value }) as T extends NonNullable<unknown> | null
    ? { kind: K } & { [Key in K]: Extract<T, NonNullable<unknown> | null> }
    : { kind: K }) as {
  <K extends string>(kind: K): { kind: K }
  <K extends string, T extends NonNullable<unknown> | null>(
    kind: K,
    value: T,
  ): { kind: K } & { [Key in K]: T }
}
