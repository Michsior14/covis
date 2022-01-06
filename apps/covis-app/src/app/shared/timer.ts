export class PausableTimer {
  #start!: number;
  #id?: number;

  constructor(private callback: () => void, private delay: number) {
    this.resume();
  }

  /**
   * Pause the timer
   */
  public pause(): void {
    window.clearTimeout(this.#id);
    this.#id = undefined;
    this.delay -= Date.now() - this.#start;
  }

  /**
   * Resume the timer
   */
  public resume(): void {
    if (this.#id) {
      return;
    }

    this.#start = Date.now();
    this.#id = window.setTimeout(this.callback, this.delay);
  }
}
