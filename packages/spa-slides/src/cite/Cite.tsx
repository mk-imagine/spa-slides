import { useEffect } from 'react';
import bibliography from 'virtual:spa-slides/bibliography';

/** Attribute the verifier looks for to report citations that did not resolve. */
export const MISSING_CITATION_ATTRIBUTE = 'data-citation-missing';

/** Attribute carrying the keys a citation cites, so the verifier can find references nothing cites. */
export const CITATION_ATTRIBUTE = 'data-citation';

/** Attribute carrying the key of one entry in a reference list. */
export const REFERENCE_ATTRIBUTE = 'data-reference';

export interface CiteProps {
  /** One citation key, or several cited together. */
  id: string | string[];
  /** `Saxe et al. (2019)` for running text, instead of `(Saxe et al., 2019)`. */
  narrative?: boolean;
}

/**
 * A citation from the deck's bibliography (`spaSlides({ bibliography })`). An unknown key renders
 * a visible `[?key]` rather than crashing the deck, and `spa-slides verify` fails until it is fixed.
 */
export function Cite({ id, narrative = false }: CiteProps) {
  const ids = Array.isArray(id) ? id : [id];
  const missing = ids.filter((key) => !bibliography[key]);

  useEffect(() => {
    if (missing.length > 0) console.error(`[spa-slides] unknown citation key: ${missing.join(', ')}`);
  }, [missing.join(' ')]);

  if (missing.length > 0) {
    return (
      <span className="sps-cite sps-cite--missing" {...{ [MISSING_CITATION_ATTRIBUTE]: missing.join(' ') }}>
        [?{missing.join(', ')}]
      </span>
    );
  }
  const entries = ids.map((key) => bibliography[key]!);
  const text = narrative
    ? entries.map((e) => e.narrative).join('; ')
    : `(${entries.map((e) => e.inText).join('; ')})`;
  return (
    <span className="sps-cite" {...{ [CITATION_ATTRIBUTE]: ids.join(' ') }}>
      {text}
    </span>
  );
}

export interface ReferencesProps {
  /** Which entries to list. Default: the whole bibliography. */
  ids?: string[];
}

/** The reference list, alphabetical, in APA style. */
export function References({ ids }: ReferencesProps) {
  const keys = ids ?? Object.keys(bibliography);
  const entries = keys
    .map((key) => ({ key, entry: bibliography[key] }))
    .sort((a, b) => (a.entry?.reference ?? a.key).localeCompare(b.entry?.reference ?? b.key));
  return (
    <ul className="sps-references">
      {entries.map(({ key, entry }) =>
        entry ? (
          <li key={key} {...{ [REFERENCE_ATTRIBUTE]: key }} dangerouslySetInnerHTML={{ __html: entry.reference }} />
        ) : (
          <li key={key} className="sps-cite--missing" {...{ [MISSING_CITATION_ATTRIBUTE]: key }}>
            [?{key}]
          </li>
        ),
      )}
    </ul>
  );
}
