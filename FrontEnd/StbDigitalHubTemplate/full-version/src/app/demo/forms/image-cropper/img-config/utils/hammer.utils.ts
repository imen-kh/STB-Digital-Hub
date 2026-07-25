// eslint-disable-next-line
export type HammerStatic = new (element: HTMLElement | SVGElement, options?: any) => HammerManager;

/** @docs-private */
export interface HammerManager {
  get(eventName: string): HammerManager;

  set(options: { enable: boolean }): HammerManager;

  // eslint-disable-next-line
  on(eventName: string, handler: (ev: any) => any): void;
}
