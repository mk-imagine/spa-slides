import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { plugin } from './plugin.js';

export interface LintOptions {
  /** Files the design rules apply to. Default: everything under src/. */
  files?: string[];
}

/**
 * The deck's design rules as an ESLint flat config. `spa-slides lint` uses it directly;
 * for editor integration, re-export it from the deck's eslint.config.js:
 *
 *   import { spaSlidesLint } from '@mk-imagine/spa-slides/eslint';
 *   export default spaSlidesLint();
 *
 * A rule can be switched off for one line, visibly, with
 * `// eslint-disable-next-line spa-slides/no-inline-style`.
 */
export function spaSlidesLint({ files = ['src/**/*.{js,jsx,ts,tsx}'] }: LintOptions = {}): Linter.Config[] {
  return [
    { ignores: ['dist/**', 'report/**', 'node_modules/**'] },
    {
      files,
      languageOptions: {
        parser: tseslint.parser as Linter.Parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { 'spa-slides': plugin },
      rules: {
        'spa-slides/no-inline-style': 'error',
        'spa-slides/no-raw-color': 'error',
        'spa-slides/american-spelling': 'error',
      },
    },
  ];
}
