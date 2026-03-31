# Contribute

## Prerequisites

You will need Node.js installed. Install dependencies via `npm install`/`npm i`.

## Development

### Overview

There are three areas of importance when adding new entity descriptions or editing existing ones.

- `src/index.ts`: Register new entity descriptions in the `registeredEntityDescriptionCreators` object.
- `src/entities`: This folder contains files with entity descriptors. You will find all existing ones in files directly within this folder. If you want to add a new entity descriptor, append to a fitting file or create a new one here.
- `src/entities/partial`: This folder contains reusable helper functions for entity descriptors.

### `Reader` and `StdReader`

Sometimes, always having to explicitly pass functions and values a function depends on can be quite cumbersome. This is where `Reader<E, T>` comes in. Essentially, it serves as a _dependency injection_ mechanism. You can _ask_ (via `Reader.ask`) for the whole value of the environment (`E`) or extract specific parts via `Reader.asks`. Providing the values by calling the `run` method on a `Reader` instance will return a value of type `T`.

Since the environment values are quite similar across the project, there is a specific type `StdReader<T, K, E, AE, CE>` with an associated type `StdEnv<K, E, AE, CE>` that makes dealing with the same environment parts way easier and shorter. `StdReader` is in fact just a shortcut of combining `Reader` and `StdEnv`. But `StdEnv`’s type arguments need to be explained.

- `K`: A set of abbreviations of the keys required for this environment. For example, `"t"` corresponds to the `translate` function and `"ibi"` to the `getInstanceById` function. See the `EnvMapAbbr` type in `src/entities/partial/reader.ts` for all available abbreviations. If you need multiple values from `StdEnv`, separate them with pipes. For example `"t" | "ibi"` requires both `translate` and `getInstanceById`. If you use `ibi`, `ai` (`getAllInstances`), or `acibp` (`getAllChildInstancesByParent`), you will need to provide values for the type parameters `E`, `AE`, and `CE`, respectively. Type parameters you do not need should be set to `never`.
- `E`: The set of entity names you want to request single instances from. If you need to get instances from multiple entities, separate them with pipes.
- `AE`: The set of entity names you want to request all instances from. If you need to get instances from multiple entities, separate them with pipes.
- `CE`: The set of child entity names you need to get instances from for a specific parent instance (e.g. getting all enhancements for a spell).

There are a lot of functions that wrap `Reader.asks` already, which makes working with `Reader`s way more straightforward.

#### Examples

Direct use for a translation string:

```ts
const translationReader = Reader.asks((env: StdEnv<"t">) =>
  env.translate("Specific translation string"),
)
// somewhere up higher in the call hierarchy:
const actualTranslation = translationReader.run({ translation })
```

Translate with helper functions:

```ts
const translationReader = translateR("Specific translation string")
```

_Note:_ The `R` suffix for helper functions makes clear that it is returning a `Reader` instance instead of the final value.

#### Working with `Reader` instances

`Reader` instances need to be passed up to calling functions to that the uppermost function returns a `Reader` that contains the environment for all values it needs to produce.

You cannot modify a value from a `Reader` directly. Instead, use the `map` method to provide a function that modifies the value. To chain multiple `Reader`-producing functions together, use the `then` method. The function that gets passed to it receives the result from the previous reader and can return a new `Reader` with the same environment type. Use the `thenW` method to return a `Reader` with a different environment; the two environments will be merged.

To work with `Reader` instances in arrays, use `Reader.sequence` or `Reader.traverse`. The former one combines an array of `Reader`s into a single `Reader` of all the results of the array, the latter one applies a `Reader`-returning function to all elements of the array and then combines all results into a single `Reader`.

## Building

To build once or build whenever there are changes, use the following command:

- **One-time build:** `npm run build`
- **Continuous building (watch mode):** `npm run watch`

## Testing

To check if the output matches your expectations, you can run the `testOutput.ts` script in the `scripts` folder. From the project root, call it the following way:

```sh
node ./scripts/testOutput.ts -d ../path/to/data <locale> <entity> <instance>
```

Replace values as appropriate:

- `../path/to/data` is the path to a local copy of the `elyukai/optolith-data` repository
- `<locale>` is a locale identifier that exists in the database (e.g. `de-DE`)
- `<entity>` is a valid entity name (e.g. `Spell`)
- `<instance>` is a UUID of an instance of the specified entity

This will print a formatted textual representation to the terminal.
