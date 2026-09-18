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

/** British spellings this rule rejects, with the American form. Inflections are generated below. */
const SPELLINGS: [string, string][] = [
  ['colour', 'color'], ['behaviour', 'behavior'], ['favour', 'favor'], ['honour', 'honor'], ['labour', 'labor'],
  ['neighbour', 'neighbor'], ['centre', 'center'], ['metre', 'meter'], ['litre', 'liter'], ['fibre', 'fiber'],
  ['theatre', 'theater'], ['grey', 'gray'], ['labelled', 'labeled'], ['labelling', 'labeling'],
  ['unlabelled', 'unlabeled'], ['modelled', 'modeled'], ['modelling', 'modeling'], ['cancelled', 'canceled'],
  ['cancelling', 'canceling'], ['travelled', 'traveled'], ['travelling', 'traveling'], ['signalled', 'signaled'],
  ['totalled', 'totaled'], ['levelled', 'leveled'], ['fuelled', 'fueled'], ['marvellous', 'marvelous'],
  ['skilful', 'skillful'], ['fulfil', 'fulfill'], ['instalment', 'installment'], ['enrolment', 'enrollment'],
  ['analyse', 'analyze'], ['paralyse', 'paralyze'], ['catalogue', 'catalog'], ['programme', 'program'],
  ['practise', 'practice'], ['licence', 'license'], ['defence', 'defense'], ['offence', 'offense'],
  ['pretence', 'pretense'], ['artefact', 'artifact'], ['judgement', 'judgment'], ['ageing', 'aging'],
  ['whilst', 'while'], ['amongst', 'among'], ['learnt', 'learned'], ['spelt', 'spelled'],
  ['normalise', 'normalize'], ['organise', 'organize'], ['recognise', 'recognize'], ['emphasise', 'emphasize'],
  ['summarise', 'summarize'], ['categorise', 'categorize'], ['visualise', 'visualize'], ['minimise', 'minimize'],
  ['maximise', 'maximize'], ['standardise', 'standardize'], ['initialise', 'initialize'], ['randomise', 'randomize'],
  ['generalise', 'generalize'], ['characterise', 'characterize'], ['prioritise', 'prioritize'],
  ['specialise', 'specialize'], ['utilise', 'utilize'], ['apologise', 'apologize'], ['equalise', 'equalize'],
  ['realise', 'realize'], ['criticise', 'criticize'], ['memorise', 'memorize'], ['optimise', 'optimize'],
  ['stabilise', 'stabilize'], ['familiarise', 'familiarize'], ['digitise', 'digitize'],
];

/** Plural, past and participle forms, plus the `-isation` nouns, so the list stays short. */
function inflect([british, american]: [string, string]): [string, string][] {
  const forms: [string, string][] = [[british, american]];
  const stem = (word: string) => (word.endsWith('e') ? word.slice(0, -1) : word);
  forms.push([`${british}s`, `${american}s`]);
  forms.push([british.endsWith('e') ? `${british}d` : `${british}ed`, american.endsWith('e') ? `${american}d` : `${american}ed`]);
  forms.push([`${stem(british)}ing`, `${stem(american)}ing`]);
  if (british.endsWith('ise')) {
    forms.push([`${british.slice(0, -1)}ation`, `${american.slice(0, -1)}ation`]);
    forms.push([`${british.slice(0, -1)}ations`, `${american.slice(0, -1)}ations`]);
  }
  return forms;
}

const AMERICAN = new Map(SPELLINGS.flatMap(inflect).map(([british, american]) => [british, american]));
/** Runs of letters, and the words inside one: `tintColours` is `tint`, then `Colours`. */
const WORD = /[A-Za-z]+/g;
const SEGMENT = /[A-Z]?[a-z]+|[A-Z]+(?![a-z])/g;

/** The American form, wearing the case the source used. */
function matchCase(found: string, american: string): string {
  if (found === found.toUpperCase()) return american.toUpperCase();
  if (found[0] === found[0]!.toUpperCase()) return american[0]!.toUpperCase() + american.slice(1);
  return american;
}

const americanSpelling: Rule.RuleModule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: { description: 'Require American spelling in code, comments and slide text' },
    messages: { british: 'British spelling "{{found}}". Write "{{american}}".' },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        const source = context.sourceCode.getText();
        for (const word of source.matchAll(WORD)) {
          for (const segment of word[0].matchAll(SEGMENT)) {
            const american = AMERICAN.get(segment[0].toLowerCase());
            if (american === undefined) continue;
            const start = word.index + segment.index;
            const range: [number, number] = [start, start + segment[0].length];
            const written = matchCase(segment[0], american);
            context.report({
              loc: { start: context.sourceCode.getLocFromIndex(range[0]), end: context.sourceCode.getLocFromIndex(range[1]) },
              messageId: 'british',
              data: { found: segment[0], american: written },
              fix: (fixer) => fixer.replaceTextRange(range, written),
            });
          }
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
    'american-spelling': americanSpelling,
  },
};
