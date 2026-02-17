import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { deepEqual } from "@optolith/helpers/compare"
import { MessageFormat } from "messageformat"
import { findPackageJSON } from "node:module"
import { dirname, join } from "node:path"
import { argv } from "node:process"
import { styleText } from "node:util"
import { schema } from "optolith-database-schema"
import {
  createCache,
  type IdMap as CacheIdMap,
} from "optolith-database-schema/cache"
import { TSONDB } from "tsondb"
import { fromUniformCase } from "tsondb/schema/gen"
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

const [localeId, entity, id] = argv.slice(2)

if (!entity || !db.schema.isEntityName(entity) || !isSupportedEntity(entity)) {
  throw new Error("Invalid entity name")
}

if (localeId === undefined) {
  throw new Error("No locale provided")
}

if (!id) {
  throw new Error("No ID provided")
}

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
const unitListFormat = new Intl.ListFormat(localeId, {
  type: "unit",
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
  translateMap: translations => translations?.[localeId],
  measurementAdjustments: {
    milesMultiplier: 1,
    stepsMultiplier: 1,
    halffingersMultiplier: 1,
    stonesMultiplier: 1,
  },
  join: (list, style) => {
    switch (style) {
      case "conjunction":
        return conjunctionListFormat.format(list)
      case "disjunction":
        return disjunctionListFormat.format(list)
      case "unit":
        return unitListFormat.format(list)
      default:
        return assertExhaustive(style)
    }
  },
}

const idMap: IdMap & CacheIdMap = {
  Advantage: {
    Blessed: "e5a9bb6d-9791-4d20-bf34-52a3aaf69726",
    Spellcaster: "9770a700-acb7-4b60-b6ea-a329a9acb26b",
  },
  KarmaSpecialAbility: {
    AspectKnowledge: "a1c2c1ef-9b1a-4c0b-9bc0-51e4b944269e",
  },
  MagicalSpecialAbility: {
    PropertyKnowledge: "5d9f3ba7-0fb8-48ca-aebb-baa01c67b4ab",
  },
  DerivedCharacteristic: {
    LifePoints: "190845e8-c2c8-40ff-8908-248f01b49f8b",
    Spirit: "b6f98337-77b4-4f8e-9b6d-fda3a49d5c75",
    Toughness: "1fa344af-3e53-4f25-b36a-7f53f51b90f5",
    Initiative: "0b97b4ce-75b0-4573-add9-86621dcf52a6",
    Movement: "0c634904-d238-47ee-9b0f-2d6a9d5ff63a",
  },
  ExperienceLevel: {
    Experienced: "2b0a18c5-40a8-4c86-98b3-a93c85e82497",
  },
}

const cache = createCache(db, idMap)

const result = getEntityDescription(
  db,
  localeEnv,
  idMap,
  (parentId, id) =>
    cache.activatableSelectOptions[parentId.kind][
      fromUniformCase(parentId)
    ]?.find(option => deepEqual(option.id, id)),
  parentId =>
    cache.activatableSelectOptions[parentId.kind][fromUniformCase(parentId)] ??
    [],
  skillId => cache.newApplicationsAndUses.newApplications[skillId] ?? [],
  skillId => cache.newApplicationsAndUses.uses[skillId] ?? [],
  entity,
  id,
)

if (result === undefined) {
  throw new Error("No description found")
}

console.log(styleText(["bold", "underline"], result.title))
if (result.subtitle) console.log(styleText("italic", result.subtitle))

console.log()
result.body.forEach(section => {
  if (section.type === "table") {
  } else {
    if (section.label) {
      if (Array.isArray(section.value)) {
        console.log(styleText("italic", section.label))
        section.value.forEach(subsection => {
          console.log("  " + styleText("bold", subsection.label + ":"))
          console.log("    " + subsection.value)
        })
      } else {
        console.log(styleText("bold", section.label + ":"))
        console.log("  " + section.value)
      }
    } else {
      console.log(section.value)
    }
  }
})

if (result.errata) {
  console.log()
  result.errata.forEach(erratum => {
    console.log(styleText(["bold", "yellow"], erratum.date))
    console.log("  " + styleText("yellow", erratum.description))
  })
}

if (result.references) {
  console.log()
  console.log(styleText("blue", result.references))
}
