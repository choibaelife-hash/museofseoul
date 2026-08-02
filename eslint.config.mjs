import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // studio/ is a separate sub-project with its own tooling — its build
    // output (studio/dist) contains huge minified bundles that crash ESLint
    // (OOM) if linted.
    "studio/**",
  ]),
]);

export default eslintConfig;
