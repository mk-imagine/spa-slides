import bibliography from 'virtual:bibliography';

function entry(id: string) {
  const found = bibliography[id];
  if (!found) throw new Error(`[spa-slides] unknown citation key "${id}"`);
  return found;
}

export function Cite({ id }: { id: string }) {
  return <span className="cite">{entry(id).inline}</span>;
}

export function References() {
  const ids = Object.keys(bibliography).sort((a, b) => entry(a).inline.localeCompare(entry(b).inline));
  return (
    <ul className="references">
      {ids.map((id) => (
        <li key={id} dangerouslySetInnerHTML={{ __html: entry(id).html }} />
      ))}
    </ul>
  );
}
