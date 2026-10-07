/* eslint-disable jsdoc/require-jsdoc */

import type * as Database from "@optolith/database-schema/gen"
import type { IdArgsVariant } from "tsondb/schema/gen"

export type GetInstanceById<in T extends Extract<keyof Database.EntityMap, string>> = <U extends T>(
  ...args: IdArgsVariant<Database.EntityMap, U>
) => Database.EntityMap[U] | undefined

export type GetAllInstances<in T extends keyof Database.EntityMap> = <U extends T>(
  entity: U,
) => { id: string; content: Database.EntityMap[U] }[]

export type CountInstances<in T extends keyof Database.EntityMap> = <U extends T>(
  entity: U,
) => number

export type GetAllChildInstancesForParent<in T extends keyof Database.ChildEntityMap> = <
  U extends T,
>(
  entity: U,
  parentId: Database.ChildEntityMap[U][2],
) => { id: string; content: Database.ChildEntityMap[U][0] }[]
