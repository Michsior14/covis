declare module 'threebox-plugin' {
  import type * as three from 'three';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Threebox: any;
  export const THREE: typeof three;
}
