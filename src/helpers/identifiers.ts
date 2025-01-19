// TODO: Update for new identifier mappings

/**
 * Used identifiers of optional rules.
 */
export enum OptionalRuleIdentifier {
  MaximumAttributeScores = 8,
  HigherDefenseStats = 17,
}

/**
 * Used identifiers of races.
 */
export enum RaceIdentifier {
  Humans = 1,
}

/**
 * Used identifiers of professions.
 */
export enum ProfessionIdentifier {
  OwnProfession = 0,
}

/**
 * Used identifiers of eye colors.
 */
export enum EyeColorIdentifier {
  Red = 19,
  Purple = 20,
}

/**
 * Used identifiers of hair colors.
 */
export enum HairColorIdentifier {
  White = 24,
  Green = 25,
}

/**
 * Used identifiers of attributes.
 */
export enum AttributeIdentifier {
  Courage = 1,
  Sagacity = 2,
  Intuition = 3,
  Charisma = 4,
  Dexterity = 5,
  Agility = 6,
  Constitution = 7,
  Strength = 8,
}

/**
 * Used identifiers of derived characteristics.
 */
export enum DerivedCharacteristicIdentifier {
  LifePoints = 1,
  ArcaneEnergy = 2,
  KarmaPoints = 3,
  Spirit = 4,
  Toughness = 5,
  Dodge = 6,
  Initiative = 7,
  Movement = 8,
  FatePoints = 9,
  WoundThreshold = 10,
}

/**
 * Used identifiers of energies.
 */
export type EnergyIdentifier =
  | DerivedCharacteristicIdentifier.LifePoints
  | DerivedCharacteristicIdentifier.ArcaneEnergy
  | DerivedCharacteristicIdentifier.KarmaPoints

/**
 * Used identifiers of skill.
 */
export enum SkillIdentifier {
  Flying = 1,
  Gaukelei = 2,
  Climbing = 3,
  BodyControl = 4,
  FeatOfStrength = 5,
  Riding = 6,
  Swimming = 7,
  SelfControl = 8,
  Singing = 9,
  Perception = 10,
  Dancing = 11,
  Pickpocket = 12,
  Stealth = 13,
  Carousing = 14,
  Persuasion = 15,
  Seduction = 16,
  Intimidation = 17,
  Etiquette = 18,
  Streetwise = 19,
  Empathy = 20,
  FastTalk = 21,
  Disguise = 22,
  Willpower = 23,
  Tracking = 24,
  Ropes = 25,
  Fishing = 26,
  Orienting = 27,
  PlantLore = 28,
  AnimalLore = 29,
  Survival = 30,
  Gambling = 31,
  Geography = 32,
  History = 33,
  Religions = 34,
  Warfare = 35,
  MagicalLore = 36,
  Mechanics = 37,
  Math = 38,
  Law = 39,
  MythsAndLegends = 40,
  SphereLore = 41,
  Astronomy = 42,
  Alchemy = 43,
  Sailing = 44,
  Driving = 45,
  Commerce = 46,
  TreatPoison = 47,
  TreatDisease = 48,
  TreatSoul = 49,
  TreatWounds = 50,
  Woodworking = 51,
  PrepareFood = 52,
  Leatherworking = 53,
  ArtisticAbility = 54,
  Metalworking = 55,
  Music = 56,
  PickLocks = 57,
  Earthencraft = 58,
  Clothworking = 59,
}

/**
 * Used identifiers of skill groups.
 */
export enum SkillGroupIdentifier {
  Physical = 1,
  Social = 2,
  Nature = 3,
  Knowledge = 4,
  Craft = 5,
}

/**
 * Used identifiers of advantages.
 */
export enum AdvantageIdentifier {
  CustomAdvantage = 0,
  Aptitude = 4, // Begabung
  Nimble = 9, // Flink
  Blessed = 12,
  Luck = 14,
  ExceptionalSkill = 16,
  ExceptionalCombatTechnique = 17,
  IncreasedAstralPower = 20,
  IncreasedKarmaPoints = 21,
  IncreasedLifePoints = 22,
  IncreasedSpirit = 23,
  IncreasedToughness = 24,
  ImmunityToPoison = 25,
  ImmunityToDisease = 26,
  MagicalAttunement = 29,
  Rich = 33,
  SociallyAdaptable = 37,
  InspireConfidence = 43,
  WeaponAptitude = 44,
  Spellcaster = 47,
  Unyielding = 51, // Eisern
  HatredOf = 55,
  LargeSpellSelection = 66,
  LeichterGang = 85,
  Preacher = 91,
  Visionary = 92,
  ManySermons = 93,
  ManyVisions = 94,
  Einkommen = 129,
}

/**
 * Used identifiers of disadvantages.
 */
export enum DisadvantageIdentifier {
  CustomDisadvantage = 0,
  AfraidOf = 1,
  Poor = 2,
  Slow = 4,
  NoFlyingBalm = 14,
  NoFamiliar = 15,
  MagicalRestriction = 21,
  DecreasedArcanePower = 23,
  DecreasedKarmaPoints = 24,
  DecreasedLifePoints = 25,
  DecreasedSpirit = 26,
  DecreasedToughness = 27,
  BadLuck = 28,
  PersonalityFlaw = 30,
  Principles = 31,
  BadHabit = 33,
  NegativeTrait = 34, // Schlechte Eigenschaft
  Stigma = 42,
  Deaf = 44, // Taub
  Incompetent = 45,
  Obligations = 47, // Verpflichtungen
  Maimed = 48, // Verstümmelt
  BrittleBones = 56, // Gläsern
  SmallSpellSelection = 64,
  FewerSermons = 70,
  FewerVisions = 71,
}

/**
 * Used identifiers of ranged combat techniques.
 */
export enum RangedCombatTechniqueIdentifier {
  SpittingFire = 4,
}

/**
 * Used identifiers of advanced skill special abilities.
 */
export enum AdvancedSkillSpecialAbilityIdentifier {
  Fachwissen = 2,
}

/**
 * Used identifiers of combat special abilities.
 */
export enum CombatSpecialAbilityIdentifier {
  CombatReflexes = 12,
}

/**
 * Used identifiers of general special abilities.
 */
export enum GeneralSpecialAbilityIdentifier {
  SkillSpecialization = 9,
  CraftInstruments = 17,
  Hunter = 18,
  Literacy = 27,
  Language = 29,
  LanguageSpecialization = 30,
  FireEater = 53,
}

/**
 * Used identifiers of magical special abilities.
 */
export enum MagicalSpecialAbilityIdentifier {
  PropertyKnowledge = 3,
  GrosseMeditation = 12,
  Adaptation = 18,
  Imitationszauberei = 51,
}

/**
 * Used identifiers of magical traditions.
 */
export enum MagicalTraditionIdentifier {
  GuildMages = 1,
  Witches = 2,
  Elves = 3,
  Unicorn = 4,
  Druids = 5,
  QabalyaMages = 6,
  IntuitiveMages = 7,
  Savants = 8,
  Illusionists = 9,
  ArcaneBards = 10,
  ArcaneDancers = 11,
  Schelme = 13,
  Zauberalchimisten = 14,
  TsatuariaAnhaengerinnen = 16,
  Necker = 17,
  Animisten = 18,
  Geoden = 19,
  Zibilijas = 20,
  BrobimGeoden = 21,
  Darna = 23,
  Runenschoepfer = 24,
}

/**
 * Used identifiers of magical special abilities.
 */
export enum MagicStyleSpecialAbilityIdentifier {
  ScholarDesMagierkollegsZuHoningen = 24,
  MadaschwesternStil = 55,
}

/**
 * Used identifiers of pact gifts.
 */
export enum PactGiftIdentifier {
  DunklesAbbildDerBuendnisgabe = 3,
}

/**
 * Used identifiers of aspects.
 */
export enum AspectIdentifier {
  General = 1,
  AllgemeinSchamanenritus = 44,
}

/**
 * Used identifiers of karma special abilities.
 */
export enum KarmaSpecialAbilityIdentifier {
  AspectKnowledge = 1,
  MasterOfAspect = 5,
  HigherOrdination = 14,
}

/**
 * Used identifiers of liturgical style special abilities.
 */
export enum LiturgicalStyleSpecialAbilityIdentifier {
  BirdsOfPassage = 38, // Zugvögel
  HuntressesOfTheWhiteMaiden = 40, // Jägerinnen der Weißen Maid
  FollowersOfTheGoldenOne = 47, // Anhänger des Güldenen
}

/**
 * Used identifiers of blessed traditions.
 */
export enum BlessedTraditionIdentifier {
  Praios = 1,
  Phex = 5,
  Firun = 9,
  Rahja = 12,
}
