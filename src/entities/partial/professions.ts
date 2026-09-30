import { reduceWhile } from "@elyukai/utils/array/reductions"
import { isNotNullish } from "@elyukai/utils/nullable"
import type { Profession_ID, ProfessionPackage, Settings } from "@optolith/database-schema/gen"
import type { GetAllChildInstancesForParent, GetAllInstances } from "../../helpers/getTypes.js"
import type { TranslateMap } from "../../helpers/translate.js"

/**
 * Finds the base profession package for a given curriculum.
 */
export const getBaseProfessionPackageForCurriculum = (
  getAllInstances: GetAllInstances<"Profession">,
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<
    "ProfessionVersion" | "ProfessionPackage"
  >,
  settings: Settings,
  curriculumId: string,
) => {
  const baseProfession = getAllInstances("Profession").find(
    profession =>
      profession.content.group.kind === "Magical" &&
      profession.content.group.Magical.curriculum === curriculumId,
  )

  if (baseProfession === undefined) {
    return undefined
  }

  return reduceWhile(
    getChildInstancesForInstanceId("ProfessionVersion", baseProfession.id),
    (_acc: { id: string; content: ProfessionPackage } | undefined, version) =>
      getChildInstancesForInstanceId("ProfessionPackage", version.id).find(
        professionPackage =>
          professionPackage.content.experience_level === settings.defaultExperienceLevel,
      ),
    isNotNullish,
    undefined,
  )
}

/**
 * Gets the name of a profession, regardless of the profession version.
 */
export const getProfessionName = (
  translateMap: TranslateMap,
  getChildInstancesForInstanceId: GetAllChildInstancesForParent<"ProfessionVersion">,
  professionId: Profession_ID,
): string | undefined =>
  translateMap(
    getChildInstancesForInstanceId("ProfessionVersion", professionId)[0]?.content.translations,
  )?.name.default
