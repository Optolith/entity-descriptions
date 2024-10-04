/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable @typescript-eslint/no-namespace */
import { config as advantageConfig } from "optolith-database-schema/types/Advantage"
import { config as animalDiseaseConfig } from "optolith-database-schema/types/AnimalDisease"
import { config as animalTypeConfig } from "optolith-database-schema/types/AnimalType"
import { config as arcaneBardTraditionConfig } from "optolith-database-schema/types/ArcaneBardTradition"
import { config as arcaneDancerTraditionConfig } from "optolith-database-schema/types/ArcaneDancerTradition"
import { config as aspectConfig } from "optolith-database-schema/types/Aspect"
import { config as attributeConfig } from "optolith-database-schema/types/Attribute"
import { config as blessingConfig } from "optolith-database-schema/types/Blessing"
import { config as cantripConfig } from "optolith-database-schema/types/Cantrip"
import { config as ceremonyConfig } from "optolith-database-schema/types/Ceremony"
import { config as closeCombatTechniqueConfig } from "optolith-database-schema/types/CombatTechnique_Close"
import { config as rangedCombatTechniqueConfig } from "optolith-database-schema/types/CombatTechnique_Ranged"
import { config as conditionConfig } from "optolith-database-schema/types/Condition"
import { config as continentConfig } from "optolith-database-schema/types/Continent"
import { config as cultureConfig } from "optolith-database-schema/types/Culture"
import { config as derivedCharacteristicConfig } from "optolith-database-schema/types/DerivedCharacteristic"
import { config as disadvantageConfig } from "optolith-database-schema/types/Disadvantage"
import { config as diseaseConfig } from "optolith-database-schema/types/Disease"
import { config as elementConfig } from "optolith-database-schema/types/Element"
import { config as experienceLevelConfig } from "optolith-database-schema/types/ExperienceLevel"
import { config as eyeColorConfig } from "optolith-database-schema/types/EyeColor"
import { config as familiarsTrickConfig } from "optolith-database-schema/types/FamiliarsTrick"
import { config as hairColorConfig } from "optolith-database-schema/types/HairColor"
import { config as kirchenpraegungConfig } from "optolith-database-schema/types/Kirchenpraegung"
import { config as curriculumConfig } from "optolith-database-schema/types/Lessons_Curriculum"
import { config as guidelineConfig } from "optolith-database-schema/types/Lessons_Guideline"
import { config as liturgicalChantConfig } from "optolith-database-schema/types/LiturgicalChant"
import { config as localeConfig } from "optolith-database-schema/types/Locale"
import { config as metaConditionConfig } from "optolith-database-schema/types/MetaCondition"
import { config as pactCategoryConfig } from "optolith-database-schema/types/PactCategory"
import { config as patronConfig } from "optolith-database-schema/types/Patron"
import { config as patronCategoryConfig } from "optolith-database-schema/types/PatronCategory"
import { config as personalityTraitConfig } from "optolith-database-schema/types/PersonalityTrait"
import { config as professionConfig } from "optolith-database-schema/types/Profession"
import { config as propertyConfig } from "optolith-database-schema/types/Property"
import { config as raceConfig } from "optolith-database-schema/types/Race"
import { config as regionConfig } from "optolith-database-schema/types/Region"
import { config as ritualConfig } from "optolith-database-schema/types/Ritual"
import { config as serviceConfig } from "optolith-database-schema/types/Service"
import { config as sexPracticeConfig } from "optolith-database-schema/types/SexPractice"
import { config as skillConfig } from "optolith-database-schema/types/Skill"
import { config as skillGroupConfig } from "optolith-database-schema/types/SkillGroup"
import { config as skillModificationLevelConfig } from "optolith-database-schema/types/SkillModificationLevel"
import { config as socialStatusConfig } from "optolith-database-schema/types/SocialStatus"
import { config as spellConfig } from "optolith-database-schema/types/Spell"
import { config as stateConfig } from "optolith-database-schema/types/State"
import { config as talismanConfig } from "optolith-database-schema/types/Talisman"
import { config as targetCategoryConfig } from "optolith-database-schema/types/TargetCategory"
import { config as uIConfig } from "optolith-database-schema/types/UI"
import { config as equipmentPackageConfig } from "optolith-database-schema/types/equipment/EquipmentPackage"
import { config as ammunitionConfig } from "optolith-database-schema/types/equipment/item/Ammunition"
import { config as animalConfig } from "optolith-database-schema/types/equipment/item/Animal"
import { config as animalCareConfig } from "optolith-database-schema/types/equipment/item/AnimalCare"
import { config as armorConfig } from "optolith-database-schema/types/equipment/item/Armor"
import { config as bandageOrRemedyConfig } from "optolith-database-schema/types/equipment/item/BandageOrRemedy"
import { config as bookConfig } from "optolith-database-schema/types/equipment/item/Book"
import { config as ceremonialItemConfig } from "optolith-database-schema/types/equipment/item/CeremonialItem"
import { config as clothesConfig } from "optolith-database-schema/types/equipment/item/Clothes"
import { config as containerConfig } from "optolith-database-schema/types/equipment/item/Container"
import { config as elixirConfig } from "optolith-database-schema/types/equipment/item/Elixir"
import { config as equipmentOfBlessedOnesConfig } from "optolith-database-schema/types/equipment/item/EquipmentOfBlessedOnes"
import { config as gemOrPreciousStoneConfig } from "optolith-database-schema/types/equipment/item/GemOrPreciousStone"
import { config as illuminationLightSourceConfig } from "optolith-database-schema/types/equipment/item/IlluminationLightSource"
import { config as illuminationRefillsOrSuppliesConfig } from "optolith-database-schema/types/equipment/item/IlluminationRefillsOrSupplies"
import { config as jewelryConfig } from "optolith-database-schema/types/equipment/item/Jewelry"
import { config as liebesspielzeugConfig } from "optolith-database-schema/types/equipment/item/Liebesspielzeug"
import { config as luxuryGoodConfig } from "optolith-database-schema/types/equipment/item/LuxuryGood"
import { config as magicalArtifactConfig } from "optolith-database-schema/types/equipment/item/MagicalArtifact"
import { config as musicalInstrumentConfig } from "optolith-database-schema/types/equipment/item/MusicalInstrument"
import { config as orienteeringAidConfig } from "optolith-database-schema/types/equipment/item/OrienteeringAid"
import { config as poisonConfig } from "optolith-database-schema/types/equipment/item/Poison"
import { config as ropeOrChainConfig } from "optolith-database-schema/types/equipment/item/RopeOrChain"
import { config as stationaryConfig } from "optolith-database-schema/types/equipment/item/Stationary"
import { config as thievesToolConfig } from "optolith-database-schema/types/equipment/item/ThievesTool"
import { config as toolOfTheTradeConfig } from "optolith-database-schema/types/equipment/item/ToolOfTheTrade"
import { config as travelGearOrToolConfig } from "optolith-database-schema/types/equipment/item/TravelGearOrTool"
import { config as vehicleConfig } from "optolith-database-schema/types/equipment/item/Vehicle"
import { config as weaponConfig } from "optolith-database-schema/types/equipment/item/Weapon"
import { config as weaponAccessoryConfig } from "optolith-database-schema/types/equipment/item/WeaponAccessory"
import { config as armorTypeConfig } from "optolith-database-schema/types/equipment/item/sub/ArmorType"
import { config as reachConfig } from "optolith-database-schema/types/equipment/item/sub/Reach"
import { config as animistPowerConfig } from "optolith-database-schema/types/magicalActions/AnimistPower"
import { config as tribeConfig } from "optolith-database-schema/types/magicalActions/AnimistPower_Tribe"
import { config as curseConfig } from "optolith-database-schema/types/magicalActions/Curse"
import { config as dominationRitualConfig } from "optolith-database-schema/types/magicalActions/DominationRitual"
import { config as elvenMagicalSongConfig } from "optolith-database-schema/types/magicalActions/ElvenMagicalSong"
import { config as geodeRitualConfig } from "optolith-database-schema/types/magicalActions/GeodeRitual"
import { config as jesterTrickConfig } from "optolith-database-schema/types/magicalActions/JesterTrick"
import { config as magicalDanceConfig } from "optolith-database-schema/types/magicalActions/MagicalDance"
import { config as magicalMelodyConfig } from "optolith-database-schema/types/magicalActions/MagicalMelody"
import { config as magicalRuneConfig } from "optolith-database-schema/types/magicalActions/MagicalRune"
import { config as zibiljaRitualConfig } from "optolith-database-schema/types/magicalActions/ZibiljaRitual"
import { config as coreRuleConfig } from "optolith-database-schema/types/rule/CoreRule"
import { config as focusRuleConfig } from "optolith-database-schema/types/rule/FocusRule"
import { config as subjectConfig } from "optolith-database-schema/types/rule/FocusRule_Subject"
import { config as optionalRuleConfig } from "optolith-database-schema/types/rule/OptionalRule"
import { config as publicationConfig } from "optolith-database-schema/types/source/Publication"
import { config as advancedCombatSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/AdvancedCombatSpecialAbility"
import { config as advancedKarmaSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/AdvancedKarmaSpecialAbility"
import { config as advancedMagicalSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/AdvancedMagicalSpecialAbility"
import { config as advancedSkillSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/AdvancedSkillSpecialAbility"
import { config as ancestorGlyphConfig } from "optolith-database-schema/types/specialAbility/AncestorGlyph"
import { config as blessedTraditionConfig } from "optolith-database-schema/types/specialAbility/BlessedTradition"
import { config as brawlingSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/BrawlingSpecialAbility"
import { config as ceremonialItemSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/CeremonialItemSpecialAbility"
import { config as combatSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/CombatSpecialAbility"
import { config as combatStyleSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/CombatStyleSpecialAbility"
import { config as commandSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/CommandSpecialAbility"
import { config as familiarSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/FamiliarSpecialAbility"
import { config as fatePointSexSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/FatePointSexSpecialAbility"
import { config as fatePointSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/FatePointSpecialAbility"
import { config as generalSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/GeneralSpecialAbility"
import { config as karmaSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/KarmaSpecialAbility"
import { config as liturgicalStyleSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/LiturgicalStyleSpecialAbility"
import { config as lycantropicGiftConfig } from "optolith-database-schema/types/specialAbility/LycantropicGift"
import { config as magicStyleSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/MagicStyleSpecialAbility"
import { config as magicalSignConfig } from "optolith-database-schema/types/specialAbility/MagicalSign"
import { config as magicalSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/MagicalSpecialAbility"
import { config as magicalTraditionConfig } from "optolith-database-schema/types/specialAbility/MagicalTradition"
import { config as pactGiftConfig } from "optolith-database-schema/types/specialAbility/PactGift"
import { config as protectiveWardingCircleSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/ProtectiveWardingCircleSpecialAbility"
import { config as sermonConfig } from "optolith-database-schema/types/specialAbility/Sermon"
import { config as sexSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/SexSpecialAbility"
import { config as sikaryanDrainSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/SikaryanDrainSpecialAbility"
import { config as skillStyleSpecialAbilityConfig } from "optolith-database-schema/types/specialAbility/SkillStyleSpecialAbility"
import { config as vampiricGiftConfig } from "optolith-database-schema/types/specialAbility/VampiricGift"
import { config as visionConfig } from "optolith-database-schema/types/specialAbility/Vision"
import { config as languageConfig } from "optolith-database-schema/types/specialAbility/sub/Language"
import { config as scriptConfig } from "optolith-database-schema/types/specialAbility/sub/Script"
import { config as tradeSecretConfig } from "optolith-database-schema/types/specialAbility/sub/TradeSecret"
import { config as arcaneOrbEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/ArcaneOrbEnchantment"
import { config as attireEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/AttireEnchantment"
import { config as bowlEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/BowlEnchantment"
import { config as cauldronEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/CauldronEnchantment"
import { config as chronicleEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/ChronicleEnchantment"
import { config as daggerRitualConfig } from "optolith-database-schema/types/traditionArtifacts/DaggerRitual"
import { config as foolsHatEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/FoolsHatEnchantment"
import { config as instrumentEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/InstrumentEnchantment"
import { config as krallenkettenzauberConfig } from "optolith-database-schema/types/traditionArtifacts/Krallenkettenzauber"
import { config as orbEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/OrbEnchantment"
import { config as ringEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/RingEnchantment"
import { config as sickleRitualConfig } from "optolith-database-schema/types/traditionArtifacts/SickleRitual"
import { config as spellSwordEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/SpellSwordEnchantment"
import { config as staffEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/StaffEnchantment"
import { config as toyEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/ToyEnchantment"
import { config as trinkhornzauberConfig } from "optolith-database-schema/types/traditionArtifacts/Trinkhornzauber"
import { config as wandEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/WandEnchantment"
import { config as weaponEnchantmentConfig } from "optolith-database-schema/types/traditionArtifacts/WeaponEnchantment"
import { config as animalShapeConfig } from "optolith-database-schema/types/traditionArtifacts/sub/AnimalShape"
import { config as animalShapePathConfig } from "optolith-database-schema/types/traditionArtifacts/sub/AnimalShapePath"
import { config as animalShapeSizeConfig } from "optolith-database-schema/types/traditionArtifacts/sub/AnimalShapeSize"
import { config as brewConfig } from "optolith-database-schema/types/traditionArtifacts/sub/Brew"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IdFromConfig<
  Config extends { id: (data: any, filePath: string) => string | number }
> = ReturnType<Config["id"]>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypeFromConfig<
  Config extends { id: (data: any, filePath: string) => string | number }
> = Parameters<Config["id"]>[0]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetByIdFromConfig<
  Config extends { id: (data: any, filePath: string) => string | number }
> = (id: IdFromConfig<Config>) => TypeFromConfig<Config> | undefined

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AllFromConfig<
  Config extends { id: (data: any, filePath: string) => string | number }
> = TypeFromConfig<Config>[]

// prettier-ignore
export namespace GetById {
  export namespace Static {
    export type AdvancedCombatSpecialAbility = GetByIdFromConfig<typeof advancedCombatSpecialAbilityConfig>
    export type AdvancedKarmaSpecialAbility = GetByIdFromConfig<typeof advancedKarmaSpecialAbilityConfig>
    export type AdvancedMagicalSpecialAbility = GetByIdFromConfig<typeof advancedMagicalSpecialAbilityConfig>
    export type AdvancedSkillSpecialAbility = GetByIdFromConfig<typeof advancedSkillSpecialAbilityConfig>
    export type Advantage = GetByIdFromConfig<typeof advantageConfig>
    export type Ammunition = GetByIdFromConfig<typeof ammunitionConfig>
    export type AncestorGlyph = GetByIdFromConfig<typeof ancestorGlyphConfig>
    export type AnimalCare = GetByIdFromConfig<typeof animalCareConfig>
    export type AnimalDisease = GetByIdFromConfig<typeof animalDiseaseConfig>
    export type Animal = GetByIdFromConfig<typeof animalConfig>
    export type AnimalShapePath = GetByIdFromConfig<typeof animalShapePathConfig>
    export type AnimalShape = GetByIdFromConfig<typeof animalShapeConfig>
    export type AnimalShapeSize = GetByIdFromConfig<typeof animalShapeSizeConfig>
    export type AnimalType = GetByIdFromConfig<typeof animalTypeConfig>
    export type AnimistPower = GetByIdFromConfig<typeof animistPowerConfig>
    export type Tribe = GetByIdFromConfig<typeof tribeConfig>
    export type ArcaneBardTradition = GetByIdFromConfig<typeof arcaneBardTraditionConfig>
    export type ArcaneDancerTradition = GetByIdFromConfig<typeof arcaneDancerTraditionConfig>
    export type ArcaneOrbEnchantment = GetByIdFromConfig<typeof arcaneOrbEnchantmentConfig>
    export type Armor = GetByIdFromConfig<typeof armorConfig>
    export type ArmorType = GetByIdFromConfig<typeof armorTypeConfig>
    export type Aspect = GetByIdFromConfig<typeof aspectConfig>
    export type AttireEnchantment = GetByIdFromConfig<typeof attireEnchantmentConfig>
    export type Attribute = GetByIdFromConfig<typeof attributeConfig>
    export type BandageOrRemedy = GetByIdFromConfig<typeof bandageOrRemedyConfig>
    export type BlessedTradition = GetByIdFromConfig<typeof blessedTraditionConfig>
    export type Blessing = GetByIdFromConfig<typeof blessingConfig>
    export type Book = GetByIdFromConfig<typeof bookConfig>
    export type BowlEnchantment = GetByIdFromConfig<typeof bowlEnchantmentConfig>
    export type BrawlingSpecialAbility = GetByIdFromConfig<typeof brawlingSpecialAbilityConfig>
    export type Brew = GetByIdFromConfig<typeof brewConfig>
    export type Cantrip = GetByIdFromConfig<typeof cantripConfig>
    export type CauldronEnchantment = GetByIdFromConfig<typeof cauldronEnchantmentConfig>
    export type CeremonialItem = GetByIdFromConfig<typeof ceremonialItemConfig>
    export type CeremonialItemSpecialAbility = GetByIdFromConfig<typeof ceremonialItemSpecialAbilityConfig>
    export type Ceremony = GetByIdFromConfig<typeof ceremonyConfig>
    export type ChronicleEnchantment = GetByIdFromConfig<typeof chronicleEnchantmentConfig>
    export type CloseCombatTechnique = GetByIdFromConfig<typeof closeCombatTechniqueConfig>
    export type Clothes = GetByIdFromConfig<typeof clothesConfig>
    export type CombatSpecialAbility = GetByIdFromConfig<typeof combatSpecialAbilityConfig>
    export type CombatStyleSpecialAbility = GetByIdFromConfig<typeof combatStyleSpecialAbilityConfig>
    export type CommandSpecialAbility = GetByIdFromConfig<typeof commandSpecialAbilityConfig>
    export type Condition = GetByIdFromConfig<typeof conditionConfig>
    export type Container = GetByIdFromConfig<typeof containerConfig>
    export type Continent = GetByIdFromConfig<typeof continentConfig>
    export type CoreRule = GetByIdFromConfig<typeof coreRuleConfig>
    export type Culture = GetByIdFromConfig<typeof cultureConfig>
    export type Curse = GetByIdFromConfig<typeof curseConfig>
    export type DaggerRitual = GetByIdFromConfig<typeof daggerRitualConfig>
    export type DerivedCharacteristic = GetByIdFromConfig<typeof derivedCharacteristicConfig>
    export type Disadvantage = GetByIdFromConfig<typeof disadvantageConfig>
    export type Disease = GetByIdFromConfig<typeof diseaseConfig>
    export type DominationRitual = GetByIdFromConfig<typeof dominationRitualConfig>
    export type Element = GetByIdFromConfig<typeof elementConfig>
    export type Elixir = GetByIdFromConfig<typeof elixirConfig>
    export type ElvenMagicalSong = GetByIdFromConfig<typeof elvenMagicalSongConfig>
    export type EquipmentOfBlessedOnes = GetByIdFromConfig<typeof equipmentOfBlessedOnesConfig>
    export type EquipmentPackage = GetByIdFromConfig<typeof equipmentPackageConfig>
    export type ExperienceLevel = GetByIdFromConfig<typeof experienceLevelConfig>
    export type EyeColor = GetByIdFromConfig<typeof eyeColorConfig>
    export type FamiliarSpecialAbility = GetByIdFromConfig<typeof familiarSpecialAbilityConfig>
    export type FamiliarsTrick = GetByIdFromConfig<typeof familiarsTrickConfig>
    export type FatePointSexSpecialAbility = GetByIdFromConfig<typeof fatePointSexSpecialAbilityConfig>
    export type FatePointSpecialAbility = GetByIdFromConfig<typeof fatePointSpecialAbilityConfig>
    export type FocusRule = GetByIdFromConfig<typeof focusRuleConfig>
    export type Subject = GetByIdFromConfig<typeof subjectConfig>
    export type FoolsHatEnchantment = GetByIdFromConfig<typeof foolsHatEnchantmentConfig>
    export type GemOrPreciousStone = GetByIdFromConfig<typeof gemOrPreciousStoneConfig>
    export type GeneralSpecialAbility = GetByIdFromConfig<typeof generalSpecialAbilityConfig>
    export type GeodeRitual = GetByIdFromConfig<typeof geodeRitualConfig>
    export type HairColor = GetByIdFromConfig<typeof hairColorConfig>
    export type IlluminationLightSource = GetByIdFromConfig<typeof illuminationLightSourceConfig>
    export type IlluminationRefillsOrSupplies = GetByIdFromConfig<typeof illuminationRefillsOrSuppliesConfig>
    export type InstrumentEnchantment = GetByIdFromConfig<typeof instrumentEnchantmentConfig>
    export type JesterTrick = GetByIdFromConfig<typeof jesterTrickConfig>
    export type Jewelry = GetByIdFromConfig<typeof jewelryConfig>
    export type KarmaSpecialAbility = GetByIdFromConfig<typeof karmaSpecialAbilityConfig>
    export type Kirchenpraegung = GetByIdFromConfig<typeof kirchenpraegungConfig>
    export type Krallenkettenzauber = GetByIdFromConfig<typeof krallenkettenzauberConfig>
    export type Language = GetByIdFromConfig<typeof languageConfig>
    export type Curriculum = GetByIdFromConfig<typeof curriculumConfig>
    export type Guideline = GetByIdFromConfig<typeof guidelineConfig>
    export type Liebesspielzeug = GetByIdFromConfig<typeof liebesspielzeugConfig>
    export type LiturgicalChant = GetByIdFromConfig<typeof liturgicalChantConfig>
    export type LiturgicalStyleSpecialAbility = GetByIdFromConfig<typeof liturgicalStyleSpecialAbilityConfig>
    export type Locale = GetByIdFromConfig<typeof localeConfig>
    export type LuxuryGood = GetByIdFromConfig<typeof luxuryGoodConfig>
    export type LycantropicGift = GetByIdFromConfig<typeof lycantropicGiftConfig>
    export type MagicalArtifact = GetByIdFromConfig<typeof magicalArtifactConfig>
    export type MagicalDance = GetByIdFromConfig<typeof magicalDanceConfig>
    export type MagicalMelody = GetByIdFromConfig<typeof magicalMelodyConfig>
    export type MagicalRune = GetByIdFromConfig<typeof magicalRuneConfig>
    export type MagicalSign = GetByIdFromConfig<typeof magicalSignConfig>
    export type MagicalSpecialAbility = GetByIdFromConfig<typeof magicalSpecialAbilityConfig>
    export type MagicalTradition = GetByIdFromConfig<typeof magicalTraditionConfig>
    export type MagicStyleSpecialAbility = GetByIdFromConfig<typeof magicStyleSpecialAbilityConfig>
    export type MetaCondition = GetByIdFromConfig<typeof metaConditionConfig>
    export type MusicalInstrument = GetByIdFromConfig<typeof musicalInstrumentConfig>
    export type OptionalRule = GetByIdFromConfig<typeof optionalRuleConfig>
    export type OrbEnchantment = GetByIdFromConfig<typeof orbEnchantmentConfig>
    export type OrienteeringAid = GetByIdFromConfig<typeof orienteeringAidConfig>
    export type PactCategory = GetByIdFromConfig<typeof pactCategoryConfig>
    export type PactGift = GetByIdFromConfig<typeof pactGiftConfig>
    export type PatronCategory = GetByIdFromConfig<typeof patronCategoryConfig>
    export type Patron = GetByIdFromConfig<typeof patronConfig>
    export type PersonalityTrait = GetByIdFromConfig<typeof personalityTraitConfig>
    export type Poison = GetByIdFromConfig<typeof poisonConfig>
    export type Profession = GetByIdFromConfig<typeof professionConfig>
    export type Property = GetByIdFromConfig<typeof propertyConfig>
    export type ProtectiveWardingCircleSpecialAbility = GetByIdFromConfig<typeof protectiveWardingCircleSpecialAbilityConfig>
    export type Publication = GetByIdFromConfig<typeof publicationConfig>
    export type Race = GetByIdFromConfig<typeof raceConfig>
    export type RangedCombatTechnique = GetByIdFromConfig<typeof rangedCombatTechniqueConfig>
    export type Reach = GetByIdFromConfig<typeof reachConfig>
    export type Region = GetByIdFromConfig<typeof regionConfig>
    export type RingEnchantment = GetByIdFromConfig<typeof ringEnchantmentConfig>
    export type Ritual = GetByIdFromConfig<typeof ritualConfig>
    export type RopeOrChain = GetByIdFromConfig<typeof ropeOrChainConfig>
    export type Script = GetByIdFromConfig<typeof scriptConfig>
    export type Sermon = GetByIdFromConfig<typeof sermonConfig>
    export type Service = GetByIdFromConfig<typeof serviceConfig>
    export type SexPractice = GetByIdFromConfig<typeof sexPracticeConfig>
    export type SexSpecialAbility = GetByIdFromConfig<typeof sexSpecialAbilityConfig>
    export type SickleRitual = GetByIdFromConfig<typeof sickleRitualConfig>
    export type SikaryanDrainSpecialAbility = GetByIdFromConfig<typeof sikaryanDrainSpecialAbilityConfig>
    export type SkillGroup = GetByIdFromConfig<typeof skillGroupConfig>
    export type SkillModificationLevel = GetByIdFromConfig<typeof skillModificationLevelConfig>
    export type Skill = GetByIdFromConfig<typeof skillConfig>
    export type SkillStyleSpecialAbility = GetByIdFromConfig<typeof skillStyleSpecialAbilityConfig>
    export type SocialStatus = GetByIdFromConfig<typeof socialStatusConfig>
    export type Spell = GetByIdFromConfig<typeof spellConfig>
    export type SpellSwordEnchantment = GetByIdFromConfig<typeof spellSwordEnchantmentConfig>
    export type StaffEnchantment = GetByIdFromConfig<typeof staffEnchantmentConfig>
    export type State = GetByIdFromConfig<typeof stateConfig>
    export type Stationary = GetByIdFromConfig<typeof stationaryConfig>
    export type Talisman = GetByIdFromConfig<typeof talismanConfig>
    export type TargetCategory = GetByIdFromConfig<typeof targetCategoryConfig>
    export type ThievesTool = GetByIdFromConfig<typeof thievesToolConfig>
    export type ToolOfTheTrade = GetByIdFromConfig<typeof toolOfTheTradeConfig>
    export type ToyEnchantment = GetByIdFromConfig<typeof toyEnchantmentConfig>
    export type TradeSecret = GetByIdFromConfig<typeof tradeSecretConfig>
    export type TravelGearOrTool = GetByIdFromConfig<typeof travelGearOrToolConfig>
    export type Trinkhornzauber = GetByIdFromConfig<typeof trinkhornzauberConfig>
    export type UI = GetByIdFromConfig<typeof uIConfig>
    export type VampiricGift = GetByIdFromConfig<typeof vampiricGiftConfig>
    export type Vehicle = GetByIdFromConfig<typeof vehicleConfig>
    export type Vision = GetByIdFromConfig<typeof visionConfig>
    export type WandEnchantment = GetByIdFromConfig<typeof wandEnchantmentConfig>
    export type WeaponAccessory = GetByIdFromConfig<typeof weaponAccessoryConfig>
    export type WeaponEnchantment = GetByIdFromConfig<typeof weaponEnchantmentConfig>
    export type Weapon = GetByIdFromConfig<typeof weaponConfig>
    export type ZibiljaRitual = GetByIdFromConfig<typeof zibiljaRitualConfig>
  }
}

// prettier-ignore
export namespace Singleton {
  export namespace Static {
    export type ExperienceLevel = TypeFromConfig<typeof experienceLevelConfig> | undefined
  }
}

// prettier-ignore
export namespace All {
  export namespace Static {
    export type AdvancedCombatSpecialAbilities = AllFromConfig<typeof advancedCombatSpecialAbilityConfig>
    export type AdvancedKarmaSpecialAbilities = AllFromConfig<typeof advancedKarmaSpecialAbilityConfig>
    export type AdvancedMagicalSpecialAbilities = AllFromConfig<typeof advancedMagicalSpecialAbilityConfig>
    export type AdvancedSkillSpecialAbilities = AllFromConfig<typeof advancedSkillSpecialAbilityConfig>
    export type Advantages = AllFromConfig<typeof advantageConfig>
    export type Ammunition = AllFromConfig<typeof ammunitionConfig>
    export type AncestorGlyphs = AllFromConfig<typeof ancestorGlyphConfig>
    export type AnimalCare = AllFromConfig<typeof animalCareConfig>
    export type AnimalDiseases = AllFromConfig<typeof animalDiseaseConfig>
    export type Animals = AllFromConfig<typeof animalConfig>
    export type AnimalShapePaths = AllFromConfig<typeof animalShapePathConfig>
    export type AnimalShapes = AllFromConfig<typeof animalShapeConfig>
    export type AnimalShapeSizes = AllFromConfig<typeof animalShapeSizeConfig>
    export type AnimalTypes = AllFromConfig<typeof animalTypeConfig>
    export type AnimistPowers = AllFromConfig<typeof animistPowerConfig>
    export type AnimistPowerTribes = AllFromConfig<typeof tribeConfig>
    export type ArcaneBardTraditions = AllFromConfig<typeof arcaneBardTraditionConfig>
    export type ArcaneDancerTraditions = AllFromConfig<typeof arcaneDancerTraditionConfig>
    export type ArcaneOrbEnchantments = AllFromConfig<typeof arcaneOrbEnchantmentConfig>
    export type Armors = AllFromConfig<typeof armorConfig>
    export type ArmorTypes = AllFromConfig<typeof armorTypeConfig>
    export type Aspects = AllFromConfig<typeof aspectConfig>
    export type AttireEnchantments = AllFromConfig<typeof attireEnchantmentConfig>
    export type Attributes = AllFromConfig<typeof attributeConfig>
    export type BandagesAndRemedies = AllFromConfig<typeof bandageOrRemedyConfig>
    export type BlessedTraditions = AllFromConfig<typeof blessedTraditionConfig>
    export type Blessings = AllFromConfig<typeof blessingConfig>
    export type Books = AllFromConfig<typeof bookConfig>
    export type BowlEnchantments = AllFromConfig<typeof bowlEnchantmentConfig>
    export type BrawlingSpecialAbilities = AllFromConfig<typeof brawlingSpecialAbilityConfig>
    export type Brews = AllFromConfig<typeof brewConfig>
    export type Cantrips = AllFromConfig<typeof cantripConfig>
    export type CauldronEnchantments = AllFromConfig<typeof cauldronEnchantmentConfig>
    export type CeremonialItems = AllFromConfig<typeof ceremonialItemConfig>
    export type CeremonialItemSpecialAbilities = AllFromConfig<typeof ceremonialItemSpecialAbilityConfig>
    export type Ceremonies = AllFromConfig<typeof ceremonyConfig>
    export type ChronicleEnchantments = AllFromConfig<typeof chronicleEnchantmentConfig>
    export type CloseCombatTechniques = AllFromConfig<typeof closeCombatTechniqueConfig>
    export type Clothes = AllFromConfig<typeof clothesConfig>
    export type CombatSpecialAbilities = AllFromConfig<typeof combatSpecialAbilityConfig>
    export type CombatStyleSpecialAbilities = AllFromConfig<typeof combatStyleSpecialAbilityConfig>
    export type CommandSpecialAbilities = AllFromConfig<typeof commandSpecialAbilityConfig>
    export type Conditions = AllFromConfig<typeof conditionConfig>
    export type Containers = AllFromConfig<typeof containerConfig>
    export type Continents = AllFromConfig<typeof continentConfig>
    export type CoreRules = AllFromConfig<typeof coreRuleConfig>
    export type Cultures = AllFromConfig<typeof cultureConfig>
    export type Curses = AllFromConfig<typeof curseConfig>
    export type DaggerRituals = AllFromConfig<typeof daggerRitualConfig>
    export type DerivedCharacteristics = AllFromConfig<typeof derivedCharacteristicConfig>
    export type Disadvantages = AllFromConfig<typeof disadvantageConfig>
    export type Diseases = AllFromConfig<typeof diseaseConfig>
    export type DominationRituals = AllFromConfig<typeof dominationRitualConfig>
    export type Elements = AllFromConfig<typeof elementConfig>
    export type Elixirs = AllFromConfig<typeof elixirConfig>
    export type ElvenMagicalSongs = AllFromConfig<typeof elvenMagicalSongConfig>
    export type EquipmentOfBlessedOnes = AllFromConfig<typeof equipmentOfBlessedOnesConfig>
    export type EquipmentPackages = AllFromConfig<typeof equipmentPackageConfig>
    export type ExperienceLevels = AllFromConfig<typeof experienceLevelConfig>
    export type EyeColors = AllFromConfig<typeof eyeColorConfig>
    export type FamiliarSpecialAbilities = AllFromConfig<typeof familiarSpecialAbilityConfig>
    export type FamiliarsTricks = AllFromConfig<typeof familiarsTrickConfig>
    export type FatePointSexSpecialAbilities = AllFromConfig<typeof fatePointSexSpecialAbilityConfig>
    export type FatePointSpecialAbilities = AllFromConfig<typeof fatePointSpecialAbilityConfig>
    export type FocusRules = AllFromConfig<typeof focusRuleConfig>
    export type FocusRuleSubjects = AllFromConfig<typeof subjectConfig>
    export type FoolsHatEnchantments = AllFromConfig<typeof foolsHatEnchantmentConfig>
    export type GemsAndPreciousStones = AllFromConfig<typeof gemOrPreciousStoneConfig>
    export type GeneralSpecialAbilities = AllFromConfig<typeof generalSpecialAbilityConfig>
    export type GeodeRituals = AllFromConfig<typeof geodeRitualConfig>
    export type HairColors = AllFromConfig<typeof hairColorConfig>
    export type IlluminationLightSources = AllFromConfig<typeof illuminationLightSourceConfig>
    export type IlluminationRefillsAndSupplies = AllFromConfig<typeof illuminationRefillsOrSuppliesConfig>
    export type InstrumentEnchantments = AllFromConfig<typeof instrumentEnchantmentConfig>
    export type JesterTricks = AllFromConfig<typeof jesterTrickConfig>
    export type Jewelry = AllFromConfig<typeof jewelryConfig>
    export type KarmaSpecialAbilities = AllFromConfig<typeof karmaSpecialAbilityConfig>
    export type Kirchenpraegungen = AllFromConfig<typeof kirchenpraegungConfig>
    export type Krallenkettenzauber = AllFromConfig<typeof krallenkettenzauberConfig>
    export type Languages = AllFromConfig<typeof languageConfig>
    export type LessonsCurricula = AllFromConfig<typeof curriculumConfig>
    export type LessonsGuidelines = AllFromConfig<typeof guidelineConfig>
    export type Liebesspielzeug = AllFromConfig<typeof liebesspielzeugConfig>
    export type LiturgicalChants = AllFromConfig<typeof liturgicalChantConfig>
    export type LiturgicalStyleSpecialAbilities = AllFromConfig<typeof liturgicalStyleSpecialAbilityConfig>
    export type Locales = AllFromConfig<typeof localeConfig>
    export type LuxuryGoods = AllFromConfig<typeof luxuryGoodConfig>
    export type LycantropicGifts = AllFromConfig<typeof lycantropicGiftConfig>
    export type MagicalArtifacts = AllFromConfig<typeof magicalArtifactConfig>
    export type MagicalDances = AllFromConfig<typeof magicalDanceConfig>
    export type MagicalMelodies = AllFromConfig<typeof magicalMelodyConfig>
    export type MagicalRunes = AllFromConfig<typeof magicalRuneConfig>
    export type MagicalSigns = AllFromConfig<typeof magicalSignConfig>
    export type MagicalSpecialAbilities = AllFromConfig<typeof magicalSpecialAbilityConfig>
    export type MagicalTraditions = AllFromConfig<typeof magicalTraditionConfig>
    export type MagicStyleSpecialAbilities = AllFromConfig<typeof magicStyleSpecialAbilityConfig>
    export type MetaConditions = AllFromConfig<typeof metaConditionConfig>
    export type MusicalInstruments = AllFromConfig<typeof musicalInstrumentConfig>
    export type OptionalRules = AllFromConfig<typeof optionalRuleConfig>
    export type OrbEnchantments = AllFromConfig<typeof orbEnchantmentConfig>
    export type OrienteeringAids = AllFromConfig<typeof orienteeringAidConfig>
    export type PactCategories = AllFromConfig<typeof pactCategoryConfig>
    export type PactGifts = AllFromConfig<typeof pactGiftConfig>
    export type PatronCategories = AllFromConfig<typeof patronCategoryConfig>
    export type Patrons = AllFromConfig<typeof patronConfig>
    export type PersonalityTraits = AllFromConfig<typeof personalityTraitConfig>
    export type Poisons = AllFromConfig<typeof poisonConfig>
    export type Professions = AllFromConfig<typeof professionConfig>
    export type Properties = AllFromConfig<typeof propertyConfig>
    export type ProtectiveWardingCircleSpecialAbilities = AllFromConfig<typeof protectiveWardingCircleSpecialAbilityConfig>
    export type Publications = AllFromConfig<typeof publicationConfig>
    export type Races = AllFromConfig<typeof raceConfig>
    export type RangedCombatTechniques = AllFromConfig<typeof rangedCombatTechniqueConfig>
    export type Reaches = AllFromConfig<typeof reachConfig>
    export type Regions = AllFromConfig<typeof regionConfig>
    export type RingEnchantments = AllFromConfig<typeof ringEnchantmentConfig>
    export type Rituals = AllFromConfig<typeof ritualConfig>
    export type RopesAndChains = AllFromConfig<typeof ropeOrChainConfig>
    export type Scripts = AllFromConfig<typeof scriptConfig>
    export type Sermons = AllFromConfig<typeof sermonConfig>
    export type Services = AllFromConfig<typeof serviceConfig>
    export type SexPractices = AllFromConfig<typeof sexPracticeConfig>
    export type SexSpecialAbilities = AllFromConfig<typeof sexSpecialAbilityConfig>
    export type SickleRituals = AllFromConfig<typeof sickleRitualConfig>
    export type SikaryanDrainSpecialAbilities = AllFromConfig<typeof sikaryanDrainSpecialAbilityConfig>
    export type SkillGroups = AllFromConfig<typeof skillGroupConfig>
    export type SkillModificationLevels = AllFromConfig<typeof skillModificationLevelConfig>
    export type Skills = AllFromConfig<typeof skillConfig>
    export type SkillStyleSpecialAbilities = AllFromConfig<typeof skillStyleSpecialAbilityConfig>
    export type SocialStatuses = AllFromConfig<typeof socialStatusConfig>
    export type Spells = AllFromConfig<typeof spellConfig>
    export type SpellSwordEnchantments = AllFromConfig<typeof spellSwordEnchantmentConfig>
    export type StaffEnchantments = AllFromConfig<typeof staffEnchantmentConfig>
    export type States = AllFromConfig<typeof stateConfig>
    export type Stationary = AllFromConfig<typeof stationaryConfig>
    export type Talismans = AllFromConfig<typeof talismanConfig>
    export type TargetCategories = AllFromConfig<typeof targetCategoryConfig>
    export type ThievesTools = AllFromConfig<typeof thievesToolConfig>
    export type ToolsOfTheTrade = AllFromConfig<typeof toolOfTheTradeConfig>
    export type ToyEnchantments = AllFromConfig<typeof toyEnchantmentConfig>
    export type TradeSecrets = AllFromConfig<typeof tradeSecretConfig>
    export type TravelGearAndTools = AllFromConfig<typeof travelGearOrToolConfig>
    export type Trinkhornzauber = AllFromConfig<typeof trinkhornzauberConfig>
    export type UI = AllFromConfig<typeof uIConfig>
    export type VampiricGifts = AllFromConfig<typeof vampiricGiftConfig>
    export type Vehicles = AllFromConfig<typeof vehicleConfig>
    export type Visions = AllFromConfig<typeof visionConfig>
    export type WandEnchantments = AllFromConfig<typeof wandEnchantmentConfig>
    export type WeaponAccessories = AllFromConfig<typeof weaponAccessoryConfig>
    export type WeaponEnchantments = AllFromConfig<typeof weaponEnchantmentConfig>
    export type Weapons = AllFromConfig<typeof weaponConfig>
    export type ZibiljaRituals = AllFromConfig<typeof zibiljaRitualConfig>
  }
}
