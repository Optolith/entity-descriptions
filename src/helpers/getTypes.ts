/* eslint-disable jsdoc/require-jsdoc */

import type * as Database from "@optolith/database-schema/gen"
import type { IdArgsVariant } from "tsondb/schema/gen"

export type GetInstanceById<in T extends Extract<keyof Database.EntityMap, string>> = <U extends T>(
  ...args: IdArgsVariant<Database.EntityMap, U>
) => Database.EntityMap[U] | undefined

// export type GetInstanceById<T extends Extract<keyof Database.EntityMap, string>> = {
//   <U extends T>(entity: U, id: string): Database.EntityMap[U] | undefined
//   <U extends T>(enumCase: Case<U, string>): Database.EntityMap[U] | undefined
// }

// const test = (() =>
//   null) as unknown as GetInstanceById<"AdvancedCombatSpecialAbility">

// const test2: GetInstanceById<"Advantage"> = test

export type GetAllInstances<T extends keyof Database.EntityMap> = <U extends T>(
  entity: U,
) => { id: string; content: Database.EntityMap[U] }[]

export type CountInstances<T extends keyof Database.EntityMap> = <U extends T>(entity: U) => number

export type GetAllChildInstancesForParent<T extends keyof Database.ChildEntityMap> = <U extends T>(
  entity: U,
  parentId: Database.ChildEntityMap[U][2],
) => { id: string; content: Database.ChildEntityMap[U][0] }[]
