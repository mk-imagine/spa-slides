/** An image imported with the `?image` query: its URL and intrinsic pixel size, known at build time. */
export interface ImageAsset {
  src: string;
  width: number;
  height: number;
}
