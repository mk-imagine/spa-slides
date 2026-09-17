/** Resolves a file in public/ relative to the built index.html, so it works from file://. */
export function asset(path: string) {
  return `${import.meta.env.BASE_URL}${path}`;
}
