import { isNotNullish } from "@elyukai/utils/nullable"
import { assertExhaustive } from "@elyukai/utils/typeSafety"
import { deepEqual } from "@optolith/helpers/compare"
import { MessageFormat } from "messageformat"
import type { MessageValue } from "messageformat/functions"
import { findPackageJSON } from "node:module"
import { dirname, join } from "node:path"
import { argv } from "node:process"
import { parseArgs, styleText, type InspectColor, type ParseArgsOptionsConfig } from "node:util"
import { schema } from "optolith-database-schema"
import { createCache, type IdMap as CacheIdMap } from "optolith-database-schema/cache"
import { TSONDB } from "tsondb"
import { fromUniformCase } from "tsondb/schema/gen"
import type { LocaleEnvironment } from "../lib/helpers/locale.js"
import {
  getEntityDescription,
  isSupportedEntity,
  type EntityDescriptionSection,
  type IdMap,
  type TableEntityDescriptionSection,
} from "../lib/index.js"

const options = {
  data: {
    type: "string",
    short: "d",
    default: join(
      dirname(findPackageJSON(import.meta.url) ?? import.meta.filename),
      "..",
      "client",
      "src",
      "database",
      "contents",
      "data",
    ),
  },
} satisfies ParseArgsOptionsConfig

const {
  values: { data: dataRootPath },
  positionals: [localeId, entity, id],
} = parseArgs({ args: argv.slice(2), options, allowPositionals: true })

if (localeId === undefined) {
  throw new Error("No locale provided")
}

if (!id) {
  throw new Error("No ID provided")
}

const db = await TSONDB.create({
  schema,
  dataRootPath,
  locales: [localeId],
})

if (!entity || !db.schema.isEntityName(entity) || !isSupportedEntity(entity)) {
  throw new Error("Invalid entity name")
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
const dateFormatter = new Intl.DateTimeFormat(localeId)
const numberFormatter = new Intl.NumberFormat(localeId)

const localeEnv: LocaleEnvironment = {
  id: localeId,
  format: (text, args) => new MessageFormat(localeId, text, { bidiIsolation: "none" }).format(args),
  compare: collator.compare.bind(collator),
  formatNumber: numberFormatter.format.bind(numberFormatter),
  formatDate: date => dateFormatter.format(new Date(date)),
  translate: (key, ...rest) =>
    new MessageFormat(localeId, localeInstance.translations?.[key] ?? key, {
      bidiIsolation: "none",
      functions: {
        list: (ctx, options, input): MessageValue<"list"> => {
          if (!Array.isArray(input)) {
            ctx.onError(new RangeError("Input for list function must be an array"))
            return {
              type: "list",
              options,
            }
          } else {
            switch (options.type) {
              case "conjunction": {
                const value = conjunctionListFormat.format(input)
                return {
                  type: "list",
                  options,
                  toString() {
                    return value
                  },
                  valueOf() {
                    return value
                  },
                }
              }
              case "disjunction": {
                const value = disjunctionListFormat.format(input)
                return {
                  type: "list",
                  options,
                  toString() {
                    return value
                  },
                  valueOf() {
                    return value
                  },
                }
              }
              case "unit": {
                const value = unitListFormat.format(input)
                return {
                  type: "list",
                  options,
                  toString() {
                    return value
                  },
                  valueOf() {
                    return value
                  },
                }
              }
              default:
                ctx.onError(new RangeError("Unsupported list type: ${options.type}"))
                return {
                  type: "list",
                  options,
                }
            }
          }
        },
      },
    }).format(rest[0] as Record<string, unknown> | undefined),
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
    cache.activatableSelectOptions[parentId.kind][fromUniformCase(parentId)]?.find(option =>
      deepEqual(option.id, id),
    ),
  parentId => cache.activatableSelectOptions[parentId.kind][fromUniformCase(parentId)] ?? [],
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

const getColumnWidthForIndex = (table: TableEntityDescriptionSection, index: number): number =>
  Math.max(
    0,
    ...[table.header[index], ...table.rows.map(row => row[index]), table.footer?.[index]]
      .filter(isNotNullish)
      .map(cell => cell.length),
  )

const getColumnWiths = (table: TableEntityDescriptionSection): number[] =>
  table.header.map((_, index) => getColumnWidthForIndex(table, index))

const logTableRow = (
  row: string[],
  columnWidths: number[],
  indent: string,
  format?: InspectColor | InspectColor[],
): void => {
  const formatter =
    format === undefined ? (text: string) => text : (text: string) => styleText(format, text)

  console.log(
    indent +
      row
        .map(
          (cell, index) => formatter(cell) + " ".repeat((columnWidths[index] ?? 0) - cell.length),
        )
        .join("  "),
  )
}

const logSection = (section: EntityDescriptionSection, level: number, indent = ""): void => {
  switch (section.type) {
    case "labeled":
      console.log(indent + styleText("bold", section.label))
      logSection(section.value, level, indent)
      break
    case "plain":
      console.log(indent + section.text)
      break
    case "definitionList": {
      const listIndent =
        "style" in section && section.style === "hidden" ? indent.slice(0, -2) : indent

      const actualLevel = "style" in section && section.style === "hidden" ? level - 1 : level

      section.items.forEach(item => {
        console.log(listIndent + styleText(actualLevel > 1 ? "italic" : "bold", item.label + ":"))
        if (Array.isArray(item.value)) {
          item.value.forEach((subsection, subsectionIndex) => {
            if (subsectionIndex > 0) {
              console.log()
            }
            logSection(subsection, actualLevel + 1, listIndent + "  ")
          })
        } else {
          console.log(listIndent + "  " + item.value)
        }
      })
      break
    }
    case "table": {
      const columnWidths = getColumnWiths(section)
      logTableRow(section.header, columnWidths, indent, "bold")
      section.rows.forEach(row => logTableRow(row, columnWidths, indent))
      if (section.footer) {
        logTableRow(section.footer, columnWidths, indent, ["italic", "underline"])
      }
      break
    }
  }
}

result.body.forEach(section => {
  console.log()
  logSection(section, 1)
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
