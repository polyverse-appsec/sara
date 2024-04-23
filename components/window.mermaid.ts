export {};

declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void;
      contentLoaded: () => void;
    };
  }
}