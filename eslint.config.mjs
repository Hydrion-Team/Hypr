import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import prettierPlugin from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/*.js", "**/*.cjs", "**/*.mjs", "package-lock.json", "**/*.d.ts"]
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    rules: json.configs.recommended.rules
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    rules: json.configs.recommended.rules
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    rules: json.configs.recommended.rules
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/commonmark",
    rules: markdown.configs.recommended[0].rules
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    rules: css.configs.recommended.rules
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: true,
          project: "./tsconfig.base.json",
        tsconfigRootDir: import.meta.dirname
      }
    },
      extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      strict: ["error", "global"],
      "max-len": ["error", { code: 120, tabWidth: 2 }],
      quotes: ["error", "single", { avoidEscape: true }],
      semi: ["error", "always"],
      "prefer-const": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
            "@typescript-eslint/consistent-type-imports": ["error", {
        prefer: "type-imports",
        disallowTypeAnnotations: false,
        fixStyle: "separate-type-imports"
      }],

      "@typescript-eslint/no-import-type-side-effects": "error",
      "prettier/prettier": ["warn"]
    }
  }
);