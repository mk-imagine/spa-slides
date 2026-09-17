#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ESLint } from 'eslint';
import { spaSlidesLint } from '../lint/config.js';
import { verifyDeck } from '../verify/index.js';

const USAGE = `Usage: spa-slides <command> [deck-dir] [options]

Commands:
  lint      Check the deck's source against the design rules
  verify    Open the built deck from disk and check every slide

deck-dir defaults to the current directory.

Options for verify:
  --dist <dir>           Build output containing index.html (default: dist)
  --out <dir>            Report directory, emptied first (default: report)
  --expect-slides <n>    Fail unless the deck has exactly n slides
`;

/** Exit codes: 0 passed, 1 checks failed, 2 could not run. */
class UsageError extends Error {}

async function lint(args: string[]): Promise<number> {
  const { positionals } = parseArgs({ args, allowPositionals: true, options: {} });
  const deckDir = resolve(positionals[0] ?? '.');
  const eslint = new ESLint({ cwd: deckDir, overrideConfigFile: true, overrideConfig: spaSlidesLint() });
  const results = await eslint.lintFiles(['src']);
  const formatter = await eslint.loadFormatter('stylish');
  const output = await formatter.format(results);
  const errors = results.reduce((sum, r) => sum + r.errorCount, 0);
  process.stdout.write(output || `No design-rule violations in ${results.length} files.\n`);
  return errors > 0 ? 1 : 0;
}

async function verify(args: string[]): Promise<number> {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      dist: { type: 'string' },
      out: { type: 'string' },
      'expect-slides': { type: 'string' },
    },
  });
  let expectSlides: number | undefined;
  if (values['expect-slides'] !== undefined) {
    expectSlides = Number(values['expect-slides']);
    if (!Number.isInteger(expectSlides) || expectSlides < 1) {
      throw new UsageError(`--expect-slides must be a positive integer, got "${values['expect-slides']}"`);
    }
  }

  const result = await verifyDeck({
    deckDir: positionals[0] ?? '.',
    distDir: values.dist,
    outDir: values.out,
    expectSlides,
    onCheck(check) {
      process.stdout.write(`${check.pass ? 'PASS' : 'FAIL'}  ${check.name}\n`);
      if (!check.pass && check.detail !== undefined) {
        process.stdout.write(`${JSON.stringify(check.detail, null, 2).replace(/^/gm, '      ')}\n`);
      }
    },
  });

  const failed = result.checks.filter((c) => !c.pass).length;
  process.stdout.write(`\n${result.checks.length - failed}/${result.checks.length} checks passed. Report: ${result.outDir}\n`);
  return failed > 0 ? 1 : 0;
}

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  try {
    switch (command) {
      case 'lint':
        return await lint(rest);
      case 'verify':
        return await verify(rest);
      case '-h':
      case '--help':
        process.stdout.write(USAGE);
        return 0;
      default:
        throw new UsageError(command === undefined ? 'no command given' : `unknown command "${command}"`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`spa-slides: ${message}\n${error instanceof UsageError ? `\n${USAGE}` : ''}`);
    return 2;
  }
}

process.exitCode = await main(process.argv.slice(2));
