import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Slides are content. They may only compose layout components and token classes;
// anything that bypasses the design tokens is a lint error.
export default defineConfig(
  { ignores: ['dist/**', 'report/**', 'node_modules/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  },
  {
    files: ['src/slides/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style']",
          message: 'Inline styles are not allowed in slides. Use a layout component or a token class.',
        },
        {
          selector: 'JSXAttribute Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
          message: 'Hard-coded colors are not allowed in slides. Use a color token.',
        },
      ],
    },
  },
);
