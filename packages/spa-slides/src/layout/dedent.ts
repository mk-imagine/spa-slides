/** Strips surrounding blank lines and the indentation common to every non-blank line. */
export function dedent(text: string): string {
  const lines = text.replace(/\t/g, '    ').split('\n');
  while (lines.length && lines[0]!.trim() === '') lines.shift();
  while (lines.length && lines.at(-1)!.trim() === '') lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim() !== '').map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(Number.isFinite(indent) ? indent : 0).trimEnd()).join('\n');
}
