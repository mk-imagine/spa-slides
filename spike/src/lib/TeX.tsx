import { useMemo } from 'react';
import katex from 'katex';

interface TeXProps {
  children: string;
  block?: boolean;
}

export function TeX({ children, block = false }: TeXProps) {
  // throwOnError: a typo in a formula should fail loudly, not render red text in front of an audience.
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: true, output: 'htmlAndMathml' }),
    [children, block],
  );
  const Tag = block ? 'div' : 'span';
  return <Tag className="tex" dangerouslySetInnerHTML={{ __html: html }} />;
}
