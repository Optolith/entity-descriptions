// @ts-check
import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import jsdoc from "eslint-plugin-jsdoc"
import globals from "globals"
import ts from "typescript-eslint"

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  jsdoc.configs["flat/recommended-typescript-error"],
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Possible problems
      "require-atomic-updates": "error",
      "no-self-compare": "error",
      "no-unmodified-loop-condition": "error",

      // Suggestions
      "accessor-pairs": "error",
      "arrow-body-style": "error",
      "class-methods-use-this": "warn",
      "default-case": "error",
      eqeqeq: "error",
      "guard-for-in": "error",
      "init-declarations": "error",
      "no-alert": "error",
      "no-caller": "error",
      "no-eval": "error",
      "no-extend-native": [
        2,
        {
          exceptions: ["Array", "Map", "Set"],
        },
      ],
      "no-extra-bind": "error",
      "no-floating-decimal": "error",
      "no-implicit-coercion": "error",
      "no-implied-eval": "error",
      "no-iterator": "error",
      "no-labels": "error",
      "no-lone-blocks": "error",
      "no-lonely-if": "error",
      "no-loop-func": "error",
      "no-multi-str": "error",
      "no-new": "error",
      "no-new-func": "error",
      "no-new-wrappers": "error",
      "no-octal": "error",
      "no-octal-escape": "error",
      "no-param-reassign": "error",
      "no-proto": "error",
      "no-redeclare": "off",
      "no-return-assign": "error",
      "no-script-url": "error",
      "no-throw-literal": "error",
      "no-useless-call": "error",
      "no-useless-computed-key": "error",
      "no-useless-concat": "error",
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "no-void": "error",
      "no-warning-comments": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-destructuring": [
        2,
        {
          VariableDeclarator: {
            array: true,
            object: true,
          },
          AssignmentExpression: {
            array: false,
            object: false,
          },
        },
      ],
      "prefer-named-capture-group": "warn",
      "prefer-numeric-literals": "error",
      "prefer-object-has-own": "error",
      "prefer-promise-reject-errors": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-template": "error",
      radix: "error",
      "require-unicode-regexp": "error",
      "symbol-description": "error",
      yoda: "error",

      // TypeScript
      "@typescript-eslint/adjacent-overload-signatures": "error",
      "@typescript-eslint/array-type": "error",
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/member-delimiter-style": [
        2,
        {
          multiline: {
            delimiter: "none",
          },
          singleline: {
            delimiter: "semi",
            requireLast: false,
          },
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "interface",
          format: ["PascalCase"],
          custom: {
            regex: "^I[A-Z]",
            match: false,
          },
        },
      ],
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-redeclare": "error",
      "@typescript-eslint/no-shadow": [
        "error",
        {
          ignoreTypeValueShadow: true,
        }
      ],
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-use-before-define": "error",
      "@typescript-eslint/no-useless-constructor": "error",
      "@typescript-eslint/prefer-for-of": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",

      // JSDoc
      "jsdoc/check-tag-names": [
        "error",
        {
          definedTags: ["main", "integer", "minItems"],
        },
      ],
      "jsdoc/require-jsdoc": [
        "error",
        {
          contexts: [
            "TSInterfaceDeclaration",
            "TSMethodSignature",
            "TSEnumDeclaration",
            "TSTypeAliasDeclaration",
            "ExportNamedDeclaration > VariableDeclaration",
          ],
          publicOnly: true,
          require: {
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            ClassExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
        },
      ],
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-description": [
        "error",
        {
          contexts: [
            "any",
          ]
        },
      ],
    },
  },
  eslintConfigPrettier,
  {
    ignores: [
      "*.config.js",
    ],
  },
]
