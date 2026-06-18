// Type declarations for mammoth's browser entry point, which ships without
// bundled .d.ts files. Only the small surface we use is declared.
declare module "mammoth/mammoth.browser" {
  interface ExtractResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  interface MammothBrowser {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<ExtractResult>;
  }
  const mammoth: MammothBrowser;
  export default mammoth;
}
