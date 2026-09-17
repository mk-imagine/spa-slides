// reveal.js 6.0.2 types declare isPrintingPDF(), but the runtime API only exposes isPrintView().
// Delete this once the upstream reveal.d.ts is fixed.
export {};

declare module 'reveal.js' {
  interface RevealApi {
    isPrintView(): boolean;
  }
}
