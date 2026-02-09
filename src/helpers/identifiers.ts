/**
 * Used identifiers of optional rules.
 */
export enum OptionalRuleIdentifier {
  MaximumAttributeScores = "9df3e0d5-6aed-4b90-924b-c11603c9bb73",
  HigherDefenseStats = "836787b2-eaec-41c3-8fdb-51591415311b",
}

/**
 * Used identifiers of races.
 */
export enum RaceIdentifier {
  Humans = "252841cf-f2d4-4fb9-af56-30de48531db5",
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
  Red = "f4990602-5605-4642-9902-5dcca7fe9bb2",
  Purple = "84bfd76d-fa4c-4d21-ad27-f6a62343dc9c",
}

/**
 * Used identifiers of hair colors.
 */
export enum HairColorIdentifier {
  White = "af44ab84-6bec-4aa8-a97d-72bb40a5eb2a",
  Green = "b4140abd-cdb4-43c8-83b1-83e6d1060fef",
}

/**
 * Used identifiers of attributes.
 */
export enum AttributeIdentifier {
  Courage = "88133847-a3ed-413a-bb67-e7b11d1e51ad",
  Sagacity = "476dac00-49c1-486e-84bc-0ff669e4a003",
  Intuition = "70ce45aa-66b6-4b56-bede-2a7ff6d82448",
  Charisma = "f9e8d52f-985a-49c2-af75-9ae9624ad4cb",
  Dexterity = "67159a5f-df4a-441f-ad2c-508e69689efb",
  Agility = "b4140abd-cdb4-43c8-83b1-83e6d1060fef",
  Constitution = "bc55f1aa-4204-42c9-b599-7cca65d9e463",
  Strength = "6b7a5e6b-f130-4eae-a45d-a59ece45e50b",
}

/**
 * Used identifiers of derived characteristics.
 */
export enum DerivedCharacteristicIdentifier {
  LifePoints = "190845e8-c2c8-40ff-8908-248f01b49f8b",
  ArcaneEnergy = "f9e8d52f-985a-49c2-af75-9ae9624ad4cb",
  KarmaPoints = "42dca192-1cca-4c2e-97d1-8c3599ef022d",
  Spirit = "b6f98337-77b4-4f8e-9b6d-fda3a49d5c75",
  Toughness = "1fa344af-3e53-4f25-b36a-7f53f51b90f5",
  Dodge = "5fc7d5d3-fdf6-4073-afba-3fd511d53c78",
  Initiative = "0b97b4ce-75b0-4573-add9-86621dcf52a6",
  Movement = "0c634904-d238-47ee-9b0f-2d6a9d5ff63a",
  FatePoints = "21beccd1-bcfb-4cfb-b544-9b5066ed242a",
  WoundThreshold = "6f1eb396-051b-44c7-a69d-12aba4552891",
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
  Flying = "71b25c38-80bc-4218-b020-6b1406c170a5",
  Gaukelei = "7a9cddc3-c8ca-4d68-b520-ffd773e44646",
  Climbing = "7d10acd5-579f-430a-a07c-5f2c9030c758",
  BodyControl = "83c5d33b-145c-4c29-8977-0fbaa4d32666",
  FeatOfStrength = "845e9434-24d4-436d-8494-349f6fc00e7a",
  Riding = "aa383b7c-aa8c-4ee2-b9da-dd7cd24b8941",
  Swimming = "7fc87a4d-3a3a-498b-a12a-2ea5e0c68b19",
  SelfControl = "811b1cb3-befa-4c41-b78d-12d55f32dbe9",
  Singing = "4d4fbc6b-eb1e-430e-b8af-6af66b5128c2",
  Perception = "347ef258-5a4b-4cf1-978a-f36b12196ac3",
  Dancing = "c0990597-2334-4fa4-87c5-e3df6166fa9c",
  Pickpocket = "87f8f170-9aaf-4ffa-a5e0-bf4473b51458",
  Stealth = "344d2656-1541-4ba0-aa5b-238dc6626287",
  Carousing = "ae3ff6b5-fc27-4e8b-ac1b-483f071b805e",
  Persuasion = "e72ea51a-f411-453d-8920-8aa6f4daab60",
  Seduction = "e5934263-9536-4025-ad53-fac54ec9f09b",
  Intimidation = "10fd08ac-8e77-4d36-b507-720d4c633222",
  Etiquette = "158636a0-8bb7-42d1-8436-2872ef43b75b",
  Streetwise = "091e8792-2814-4fac-8c47-82ddb55a1b94",
  Empathy = "d2b46106-41ec-4195-80e3-5e19f238084a",
  FastTalk = "4a2876be-9146-45d3-b2d5-6fb33cd489aa",
  Disguise = "a8ed8b4f-2391-4365-8273-d367617aa800",
  Willpower = "d5a8c759-9379-4250-a27f-334a1411068d",
  Tracking = "50270926-e802-4f61-92cb-fdd5cb24ddf0",
  Ropes = "5cbdc561-368b-4e4e-8f7f-b97e32776815",
  Fishing = "a872228e-fd8c-44b4-94e0-cfbdf137633f",
  Orienting = "133ea1cb-2ebb-4cfd-a594-a9948f8fb2b6",
  PlantLore = "cc6f188c-e271-41fc-9d64-6910c0c6fdc5",
  AnimalLore = "a4eecb40-4d3d-4088-be28-366c003911df",
  Survival = "2bb0fee1-a2c2-48ba-91a0-e4c362d36335",
  Gambling = "c3763aa8-be38-4e73-b738-78bd2d3ae73f",
  Geography = "019cc09e-85d7-4ab4-bdb5-6c13af4bf213",
  History = "bbee9852-2160-4ff1-b7b9-42bcaa89a19f",
  Religions = "8993613b-3f64-4bd9-b51f-8cd0141cfaef",
  Warfare = "515f24b0-e580-45f8-94e9-f3a97601d323",
  MagicalLore = "322ae078-e674-44cb-a050-360a9428841c",
  Mechanics = "73a5c800-8384-4704-9dfa-a242eacd3270",
  Math = "89d50281-6869-4758-95d1-66fba5109feb",
  Law = "cd8aa58b-6803-49bd-9c86-6a800f21f46a",
  MythsAndLegends = "c301fe38-2aca-4c89-9947-c220d8407f2c",
  SphereLore = "82a1a676-2230-416b-8ced-24880161d6f6",
  Astronomy = "320227fe-7923-41ed-ac62-b175808a9f5e",
  Alchemy = "17511b2f-4f83-4018-befc-76bb68f02c4b",
  Sailing = "41bd7d7e-576d-47d7-a614-aaa30286ea7d",
  Driving = "f53e3d41-4b61-4f0d-80bf-8d67d62fe180",
  Commerce = "60469391-2701-4cb2-bc18-914c61cb3fe4",
  TreatPoison = "a4edde4c-8784-45e6-92cf-4dd71067eff6",
  TreatDisease = "4e2ec767-68ab-49db-9f82-6042c0d04eba",
  TreatSoul = "d68dc494-ab63-444f-ae97-c254ae01eca9",
  TreatWounds = "b3e86df6-a7d3-4887-9d19-7e899cd146cb",
  Woodworking = "4df39524-ec13-45d8-aabe-7288cfe7ab81",
  PrepareFood = "763d869b-969f-41d4-b8ba-c2f7aa29ae50",
  Leatherworking = "25ab080a-24e4-4f45-ab16-f6bd793d8398",
  ArtisticAbility = "140d0c24-e49b-43a2-95c9-77743f35c752",
  Metalworking = "c2922325-224a-4941-958f-a3acb553ae0e",
  Music = "284bc585-8b9c-4cc1-96f5-442a1d1c4091",
  PickLocks = "248fc7cd-e65f-49d5-995f-2d87ff3ff7d6",
  Earthencraft = "1e7367c0-0256-4874-a92e-a0e4197c3487",
  Clothworking = "bf50f5c9-b42f-4637-8685-b2e233dd48f7",
}

/**
 * Used identifiers of skill groups.
 */
export enum SkillGroupIdentifier {
  Physical = "5b3b6139-bc02-4332-b092-de043c00793f",
  Social = "f0a10163-221a-4a54-ae40-0bb71582262e",
  Nature = "6ebc92b3-2c48-4f75-9d84-489788284835",
  Knowledge = "ca6dd6da-f9ab-4120-9cb9-47f73254a6e2",
  Craft = "15d0e623-6f85-4508-8921-1aa6edfd90c7",
}

/**
 * Used identifiers of advantages.
 */
export enum AdvantageIdentifier {
  CustomAdvantage = "e70b85db-d437-4f0e-991e-1d95684935e2",
  Aptitude = "77795e79-7db3-4e19-8ecf-e622820bae9e", // Begabung
  Nimble = "03367aac-81ff-4bfc-947c-20a2e4446364", // Flink
  Blessed = "e5a9bb6d-9791-4d20-bf34-52a3aaf69726",
  Luck = "b677661a-8881-456c-932f-c41369a5c21f",
  ExceptionalSkill = "87c50831-9f8c-455d-a6d8-5610b232e932",
  ExceptionalCombatTechnique = "046adc73-d4d1-4172-886a-544fca95a31b",
  IncreasedAstralPower = "cf11a805-3012-4d57-94a8-0efb33803509",
  IncreasedKarmaPoints = "cf31f067-ee38-4426-a6a5-3fb6e8b31a74",
  IncreasedLifePoints = "dae3e503-a253-42f7-a75c-10b74dd57116",
  IncreasedSpirit = "47deca36-35de-4a0b-9894-6c24cf242db8",
  IncreasedToughness = "6d9b4c7c-35bf-435c-bccf-4fcee5ba3832",
  ImmunityToPoison = "7b1e3cd6-34a6-4711-9535-8cd8ed66f1cd",
  ImmunityToDisease = "1f019851-2b4d-4d01-ba69-a386d91ec499",
  MagicalAttunement = "0a08218c-9b38-4c3a-84cf-86a50cd2b982",
  Rich = "45dd8e80-dd2b-4573-99d5-fbf0810af9ce",
  SociallyAdaptable = "d9aa63c1-9ad0-467b-a0cb-51e3450e48b0",
  InspireConfidence = "13bfcc91-620e-44e9-aa45-10ed3b0849a7",
  WeaponAptitude = "37ff9041-234d-4570-a845-f09ab5883bc3",
  Spellcaster = "9770a700-acb7-4b60-b6ea-a329a9acb26b",
  Unyielding = "693237d9-d64c-4f06-b725-cc5795babae4", // Eisern
  HatredOf = "93255da0-50f2-4c7f-b4f3-66586c3a7c17",
  LargeSpellSelection = "a7583667-850b-4d86-be2d-28ab2216c1e9",
  LeichterGang = "7ad8cc78-6037-43e3-b717-d5a1592f5d55",
  Preacher = "cb371b91-564a-4ca6-8778-e45c953f3bb0",
  Visionary = "c499d999-e027-478c-9580-e00c0bf89a4c",
  ManySermons = "838ec345-9f88-422e-ae20-5526836b72eb",
  ManyVisions = "6f0d0843-2875-4377-b3c9-db57c6eff1bc",
  Einkommen = "9284815b-7c40-44db-b37e-1f966b3097cd",
}

/**
 * Used identifiers of disadvantages.
 */
export enum DisadvantageIdentifier {
  CustomDisadvantage = "1ba46bf8-e3ed-46b4-98e5-8e3edb6ed0a3",
  AfraidOf = "652fe330-59d5-4784-9b4a-dbb527bf12c7",
  Poor = "54ec1dce-32f2-44eb-b501-000dd0da1e3b",
  Slow = "9229365c-6392-4896-8306-c3c7b68bb852",
  NoFlyingBalm = "19d1e013-175b-4b62-859a-b8007a0bf767",
  NoFamiliar = "36950e47-055b-4456-b57f-0501e4104e26",
  MagicalRestriction = "efaacd60-3ed7-4693-a1bf-d69a3a3ab18c",
  DecreasedArcanePower = "3629dbd4-5d0c-4683-be0c-500aed8161fb",
  DecreasedKarmaPoints = "c2a66c6b-0cff-4da8-936c-b3f3ba02719d",
  DecreasedLifePoints = "f0df81a0-b514-47d3-88a8-b94a52d6a329",
  DecreasedSpirit = "08707e83-bff4-40a1-8a21-ca88d61384c8",
  DecreasedToughness = "9bd86082-a773-4d21-b059-a6464b1d5fdc",
  BadLuck = "77cde71d-c720-4be9-902c-65dca331c6d6",
  PersonalityFlaw = "804fdfe2-3472-4719-8ff8-bfdb77c3e922",
  Principles = "52bf0b68-316c-4ca0-abdc-e2691e779801",
  BadHabit = "fe08344e-5e5e-4504-b9e0-58eb67e21743",
  NegativeTrait = "19d422bd-b376-47a7-b69f-1bffde9f0361", // Schlechte Eigenschaft
  Stigma = "8ef5d706-737b-4282-95aa-9549c90464cc",
  Deaf = "33b1ebeb-5dae-41f9-8734-d32e9cd59e2a", // Taub
  Incompetent = "5bde2e37-6a1e-4008-b75c-e9ac106e78cd",
  Obligations = "a8a9aaab-1611-43d6-8803-b33a582a848f", // Verpflichtungen
  Maimed = "496d8bea-35ee-4a5d-928d-8a855c882edc", // Verstümmelt
  BrittleBones = "0ff139db-0a05-45ec-bcd6-42caea87d691", // Gläsern
  SmallSpellSelection = "65ff9a29-ecf4-4f73-9945-7908c89e9059",
  FewerSermons = "2f0a061a-fd26-492d-bff0-746b19bf2921",
  FewerVisions = "bfe12f5c-a3b3-4f2d-bede-8b3f8e8513dd",
}

/**
 * Used identifiers of ranged combat techniques.
 */
export enum RangedCombatTechniqueIdentifier {
  SpittingFire = "9329e5a2-6c0f-4ab0-9536-73707b74407f",
}

/**
 * Used identifiers of advanced skill special abilities.
 */
export enum AdvancedSkillSpecialAbilityIdentifier {
  Fachwissen = "7bb1e727-f9e5-43ca-8f8a-50ae36b67951",
}

/**
 * Used identifiers of combat special abilities.
 */
export enum CombatSpecialAbilityIdentifier {
  CombatReflexes = "0e794818-2572-4fdb-86b3-ec52e9e339c3",
}

/**
 * Used identifiers of general special abilities.
 */
export enum GeneralSpecialAbilityIdentifier {
  SkillSpecialization = "b2fbdf25-d44a-4d50-95a8-2501e220abdd",
  CraftInstruments = "9c57c9ee-6619-4e13-b1cd-056d552d8739",
  Hunter = "29239be5-984c-47b0-ba54-408e8978f3af",
  Literacy = "2da6289d-6c2f-47ff-8046-5fef87dec62f",
  Language = "6cfb462d-e6ab-4d91-bb4b-3d4c0dcac897",
  LanguageSpecialization = "8a6d08a0-3a32-4b72-b3f7-e5aa44cda5bf",
  FireEater = "05448a67-af4e-48a6-928b-5d9219b3aaf6",
}

/**
 * Used identifiers of magical special abilities.
 */
export enum MagicalSpecialAbilityIdentifier {
  PropertyKnowledge = "5d9f3ba7-0fb8-48ca-aebb-baa01c67b4ab",
  GrosseMeditation = "0ffd4668-9d6f-4a87-9957-f099b5e58efb",
  Adaptation = "131ec19f-b950-4b3b-8a76-6100adcb227e",
  Imitationszauberei = "29a948ad-3c18-4e3e-b151-e0e7b53cca02",
}

/**
 * Used identifiers of magical traditions.
 */
export enum MagicalTraditionIdentifier {
  GuildMages = "d9b83dba-cf29-4243-9b85-e03672ac0f02",
  Witches = "f3e5278f-8b84-4e65-9ae9-9dbab870ff32",
  Elves = "7fafbac0-bd86-4c3d-b1fa-5a8b36b674dc",
  Unicorn = "e427bff1-108e-4df3-acfc-0133b5e85f1d",
  Druids = "fc8c24c4-3c11-4231-a866-2350bfdb0117",
  QabalyaMages = "6dd001f3-506c-4c62-b0e9-facfa44435c1",
  IntuitiveMages = "f5dccd70-fc77-4793-8fa2-383b31a7d96a",
  Savants = "16e2ec01-eadd-45f0-93a2-d7384628dcf5",
  Illusionists = "6e04db3b-1157-4d2c-af13-f7f4ca9711d0",
  ArcaneBards = "0d3d1b5a-0550-4e47-9ccf-f2021c5409b6",
  ArcaneDancers = "15a92260-95aa-43ee-87ed-e8083cb08897",
  Schelme = "11b2d97a-632f-4bb5-a6bc-e53addff2071",
  Zauberalchimisten = "a4f341a8-a62a-4d8d-af89-f490b4470f1d",
  TsatuariaAnhaengerinnen = "0818d00e-e18a-4daf-bf39-daa5d5edb8b0",
  Necker = "eceb1fff-7412-4371-a6f2-5fb5889cb3b2",
  Animisten = "147071ec-93a2-4332-9ad4-d55dce2f2355",
  Geoden = "2dd3c077-27a7-4dfd-a316-42dc1ba9b05a",
  Zibilijas = "a6ee6ca5-41cd-4f5a-915a-7e775ede20af",
  BrobimGeoden = "40441cf9-e503-4895-a900-5a00fc2df8bc",
  Darna = "70f59d63-d862-47bc-bd07-c70c9e86d528",
  Runenschoepfer = "ca29d28a-425f-4f64-a601-1c911d4446cf",
}

/**
 * Used identifiers of magical special abilities.
 */
export enum MagicStyleSpecialAbilityIdentifier {
  ScholarDesMagierkollegsZuHoningen = "9cc872c9-1f2c-4bb8-97ed-e0c9135f93a3",
  MadaschwesternStil = "6fdade11-f4b8-46fc-b4dc-010bac9a4f81",
}

/**
 * Used identifiers of pact gifts.
 */
export enum PactGiftIdentifier {
  DunklesAbbildDerBuendnisgabe = "98329d75-1cfe-4a4d-ad8e-0ba69c8c1be4",
}

/**
 * Used identifiers of aspects.
 */
export enum AspectIdentifier {
  General = "b77ab574-fcb2-443f-8952-83e85f5048ab",
  AllgemeinSchamanenritus = "00b4f9d9-9654-48b7-8b70-2b2e5c961552",
}

/**
 * Used identifiers of karma special abilities.
 */
export enum KarmaSpecialAbilityIdentifier {
  AspectKnowledge = "a1c2c1ef-9b1a-4c0b-9bc0-51e4b944269e",
  MasterOfAspect = "9174604f-70b4-4ce2-94b8-3dccd77ec7e1",
  HigherOrdination = "6ff645b0-2b6f-4d7c-a718-c0493105a405",
}

/**
 * Used identifiers of liturgical style special abilities.
 */
export enum LiturgicalStyleSpecialAbilityIdentifier {
  BirdsOfPassage = "fa64616e-daa2-4ea4-a9b0-001579e413c4", // Zugvögel
  HuntressesOfTheWhiteMaiden = "ce21e327-a750-4312-9a1d-6ab165bbcdb2", // Jägerinnen der Weißen Maid
  FollowersOfTheGoldenOne = "53dc9a31-c608-4bb4-b92b-df2a4a567486", // Anhänger des Güldenen
}

/**
 * Used identifiers of blessed traditions.
 */
export enum BlessedTraditionIdentifier {
  Praios = "b4b3ed0e-d4fc-4b72-ba4f-20c37e3dc7c2",
  Phex = "24d3b724-3895-445b-9856-da7a3919df38",
  Firun = "221d147d-ce08-402b-87d9-f59c079d0bc6",
  Rahja = "84350c1e-ed9e-47e4-9fe8-d33e14df7753",
}
