export class PausableTimer {
  #start!: number;
  #id?: number;

  constructor(private callback: () => void, private delay: number) {
    this.resume();
  }

  public pause() {
    window.clearTimeout(this.#id);
    this.#id = undefined;
    this.delay -= Date.now() - this.#start;
  }

  public resume() {
    if (this.#id) {
      return;
    }

    this.#start = Date.now();
    this.#id = window.setTimeout(this.callback, this.delay);
  }
}
