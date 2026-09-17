declare module '@citation-js/core' {
  export class Cite {
    constructor(data: unknown);
    static async(data: unknown): Promise<Cite>;
    data: Array<{ id: string; [key: string]: unknown }>;
    format(type: 'citation' | 'bibliography', options?: Record<string, unknown>): string;
  }
}
declare module '@citation-js/plugin-bibtex';
declare module '@citation-js/plugin-csl';
