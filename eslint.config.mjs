import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["**/.next/**", "**/dist/**", "**/next-env.d.ts", "**/node_modules/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
];
