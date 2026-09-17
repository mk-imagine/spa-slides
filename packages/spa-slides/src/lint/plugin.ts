import type { ESLint, Rule } from 'eslint';

/** The JSX attribute shapes these rules inspect. ESLint's own AST types stop at ESTree and omit JSX. */
interface JsxAttribute {
  type: 'JSXAttribute';
  name: { type: 'JSXIdentifier'; name: string } | { type: 'JSXNamespacedName' };
  value:
    | null
    | { type: 'Literal'; value: unknown }
    | { type: 'JSXExpressionContainer'; expression: { type: string; value?: unknown; quasis?: { value: { cooked: string } }[]; expressions?: unknown[] } };
}

function attributeName(node: JsxAttribute): string | undefined {
  return node.name.type === 'JSXIdentifier' ? node.name.name : undefined;
}

/** The attribute's value when it is a fixed string, written either as `x="…"` or `x={"…"}` / `x={`…`}`. */
function staticString(node: JsxAttribute): string | undefined {
  const value = node.value;
  if (!value) return undefined;
  if (value.type === 'Literal') return typeof value.value === 'string' ? value.value : undefined;
  const expression = value.expression;
  if (expression.type === 'Literal' && typeof expression.value === 'string') return expression.value;
  if (expression.type === 'TemplateLiteral' && expression.expressions?.length === 0) return expression.quasis?.[0]?.value.cooked;
  return undefined;
}

const noInlineStyle: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow inline styles, which bypass the design tokens' },
    messages: {
      inlineStyle: 'Inline styles bypass the design tokens. Use a component prop, or a class whose CSS uses --sps-* tokens.',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node: Rule.Node) {
        const attribute = node as unknown as JsxAttribute;
        if (attributeName(attribute) === 'style') context.report({ node, messageId: 'inlineStyle' });
      },
    };
  },
};

/** Attributes whose value is a color. */
const COLOR_ATTRIBUTE = /^(fill|stroke|color|stopColor|floodColor|lightingColor|backgroundColor)$/;
/** Values that do not fix a color of their own. */
const ALLOWED_COLOR = /^(none|currentColor|transparent|inherit|var\(--[\w-]+\))$/;
/** Values that are unmistakably colors, whatever attribute they appear in. */
const COLOR_FUNCTION = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;

const noRawColor: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow hard-coded colors in markup' },
    messages: {
      rawColor: 'Hard-coded color "{{value}}". Use a token such as var(--sps-color-accent), or currentColor.',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node: Rule.Node) {
        const attribute = node as unknown as JsxAttribute;
        const name = attributeName(attribute);
        const value = staticString(attribute)?.trim();
        if (name === undefined || value === undefined) return;
        const colorAttribute = COLOR_ATTRIBUTE.test(name) && !ALLOWED_COLOR.test(value);
        if (colorAttribute || COLOR_FUNCTION.test(value)) {
          context.report({ node, messageId: 'rawColor', data: { value } });
        }
      },
    };
  },
};

export const plugin: ESLint.Plugin = {
  meta: { name: '@mk-imagine/spa-slides' },
  rules: {
    'no-inline-style': noInlineStyle,
    'no-raw-color': noRawColor,
  },
};
