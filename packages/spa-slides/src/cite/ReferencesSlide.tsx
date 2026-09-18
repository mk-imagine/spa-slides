import { Fragment } from 'react';
import bibliography from 'virtual:spa-slides/bibliography';
import { Slide } from '../core/Slide.js';
import { References } from './Cite.js';

export interface ReferencesSlideProps {
  /** The slide's title. Default: `References`. */
  title?: string;
  /** Which entries to list. Default: the whole bibliography. */
  ids?: string[];
  /** How many columns to set the list in. Default: 2. */
  columns?: number;
  /**
   * How many entries one slide holds before the list continues on another. Default: 8, which fits
   * two columns of full APA references with DOIs.
   */
  perSlide?: number;
  /**
   * Backup slides, left out of the slide count. Default: false, because a talk's references are
   * part of it.
   */
  appendix?: boolean;
}

/**
 * The deck's reference list, over as many slides as it takes.
 *
 * A bibliography outgrows one slide long before a talk has many sources, so the entries are split
 * across slides and set in balanced columns rather than shrunk until they are unreadable. The
 * whole bibliography is listed by default: `spa-slides verify` fails when the bibliography holds
 * an entry no slide cites, so what is listed is what the deck actually shows.
 */
export function ReferencesSlide({ title = 'References', ids, columns = 2, perSlide = 8, appendix = false }: ReferencesSlideProps) {
  if (!Number.isInteger(perSlide) || perSlide < 1) {
    throw new Error(`[spa-slides] <ReferencesSlide perSlide> must be a whole number >= 1, got ${perSlide}`);
  }
  // Sorted here as well as in <References>, so that an entry does not move between slides.
  const keys = (ids ?? Object.keys(bibliography)).slice().sort((a, b) => {
    const reference = (key: string) => bibliography[key]?.reference ?? key;
    return reference(a).localeCompare(reference(b));
  });
  const pages = Array.from({ length: Math.ceil(keys.length / perSlide) }, (_, i) => keys.slice(i * perSlide, (i + 1) * perSlide));

  return (
    <>
      {pages.map((page, i) => (
        <Fragment key={i}>
          <Slide title={i === 0 ? title : `${title} (cont.)`} align="top" appendix={appendix}>
            <div className="sps-references-columns" style={{ columnCount: columns }}>
              <References ids={page} />
            </div>
          </Slide>
        </Fragment>
      ))}
    </>
  );
}
