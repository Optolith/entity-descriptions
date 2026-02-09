/* eslint-disable jsdoc/require-jsdoc */

import * as Database from "optolith-database-schema/gen"

export type GetInstanceById<T extends keyof Database.EntityMap> = <U extends T>(
  entity: U,
  id: string,
) => Database.EntityMap[U] | undefined

export type GetAllInstances<T extends keyof Database.EntityMap> = <U extends T>(
  entity: U,
) => Database.EntityMap[U][]

export type GetAllChildInstancesForParent<
  T extends keyof Database.ChildEntityMap,
> = <U extends T>(
  entity: U,
  parentId: Database.ChildEntityMap[U][2],
) => Database.ChildEntityMap[U][0][]
