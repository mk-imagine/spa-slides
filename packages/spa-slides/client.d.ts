// Ambient types for decks. Add "@mk-imagine/spa-slides/client" to the deck's tsconfig "types".

/** `import shot from './images/diff.png?image'` — the URL plus the image's pixel size, read at build time. */
declare module '*?image' {
  const image: import('@mk-imagine/spa-slides').ImageAsset;
  export default image;
}
