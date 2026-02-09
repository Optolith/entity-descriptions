import { MessageFormat } from "messageformat"
import { findPackageJSON } from "node:module"
import { dirname, join } from "node:path"
import { argv } from "node:process"
import { schema } from "optolith-database-schema"
import { TSONDB } from "tsondb"
import type { LocaleEnvironment } from "../lib/helpers/locale.js"
import {
  getEntityDescription,
  isSupportedEntity,
  type IdMap,
} from "../lib/index.js"

const dataRootPath = join(
  dirname(findPackageJSON(import.meta.url) ?? import.meta.filename),
  "..",
  "optolith-client",
  "src",
  "database",
  "contents",
  "data",
)

const db = await TSONDB.create({
  schema,
  dataRootPath,
  locales: ["de-DE"],
})

const [entity, id] = argv.slice(2)

if (!entity || !db.schema.isEntityName(entity) || !isSupportedEntity(entity)) {
  throw new Error("Invalid entity name")
}

if (!id) {
  throw new Error("No ID provided")
}

const localeId = "de-DE"
const localeInstance = db.getInstanceOfEntityById("Locale", localeId)

if (localeInstance === undefined) {
  throw new Error("Locale not found")
}

const conjunctionListFormat = new Intl.ListFormat(localeId, {
  type: "conjunction",
})
const disjunctionListFormat = new Intl.ListFormat(localeId, {
  type: "disjunction",
})
const collator = new Intl.Collator(localeId, { usage: "sort" })

const localeEnv: LocaleEnvironment = {
  id: localeId,
  compare: collator.compare.bind(collator),
  translate: (key, ...rest) =>
    new MessageFormat(
      localeId,
      localeInstance.translations?.[key] ?? key,
    ).format(rest[0] as Record<string, unknown> | undefined),
  translateMap: translations =>
    translations?.[localeId] ?? translations?.[Object.keys(translations)[0]],
  joinConjunctionList: conjunctionListFormat.format.bind(conjunctionListFormat),
  joinDisjunctionList: disjunctionListFormat.format.bind(disjunctionListFormat),
}

const idMap: IdMap = {
  DerivedCharacteristic: {
    LifePoints: "190845e8-c2c8-40ff-8908-248f01b49f8b",
    Spirit: "b6f98337-77b4-4f8e-9b6d-fda3a49d5c75",
    Toughness: "1fa344af-3e53-4f25-b36a-7f53f51b90f5",
    Movement: "0c634904-d238-47ee-9b0f-2d6a9d5ff63a",
  },
}

const result = getEntityDescription(db, localeEnv, idMap, entity, id)

if (result === undefined) {
  throw new Error("No description found")
}

console.log(JSON.stringify(result, undefined, 2))
