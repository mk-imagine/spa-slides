import { tmpdir } from 'node:os';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { spaSlidesLint } from './config.js';

async function lint(code: string, filePath = 'src/slides/Example.tsx') {
  const eslint = new ESLint({ cwd: tmpdir(), overrideConfigFile: true, overrideConfig: spaSlidesLint() });
  const [result] = await eslint.lintText(code, { filePath });
  return result!.messages.map((m) => m.ruleId);
}

describe('spa-slides/no-inline-style', () => {
  it('rejects a style attribute', async () => {
    expect(await lint('export const A = () => <p style={{ fontSize: 13 }}>x</p>;')).toEqual(['spa-slides/no-inline-style']);
  });

  it('allows class names', async () => {
    expect(await lint('export const A = () => <p className="caption">x</p>;')).toEqual([]);
  });
});

describe('spa-slides/no-raw-color', () => {
  it('rejects hex colors in color attributes, in every string form', async () => {
    const code = `export const A = () => (
      <svg>
        <rect fill="#ff0000" />
        <rect stroke={'#333'} />
        <rect fill={\`#abc\`} />
      </svg>
    );`;
    expect(await lint(code)).toEqual(Array(3).fill('spa-slides/no-raw-color'));
  });

  it('rejects named colors in color attributes', async () => {
    expect(await lint('export const A = () => <rect fill="red" />;')).toEqual(['spa-slides/no-raw-color']);
  });

  it('rejects color functions in any attribute', async () => {
    expect(await lint('export const A = () => <div data-tint="rgb(0 0 0)" />;')).toEqual(['spa-slides/no-raw-color']);
  });

  it('allows tokens, currentColor, and none', async () => {
    const code = `export const A = () => (
      <svg>
        <rect fill="var(--sps-color-accent)" />
        <rect stroke="currentColor" fill="none" />
      </svg>
    );`;
    expect(await lint(code)).toEqual([]);
  });

  it('does not mistake a fragment link for a color', async () => {
    expect(await lint('export const A = () => <a href="#add">x</a>;')).toEqual([]);
  });

  it('leaves computed values alone', async () => {
    expect(await lint('export const A = ({ c }: { c: string }) => <rect fill={c} />;')).toEqual([]);
  });
});

describe('spaSlidesLint', () => {
  it('only applies to the configured files', async () => {
    // Outside `files`, ESLint reports only that no configuration matched (a message with no rule).
    expect(await lint('export const A = () => <p style={{}} />;', 'scripts/tool.tsx')).toEqual([null]);
  });
});
