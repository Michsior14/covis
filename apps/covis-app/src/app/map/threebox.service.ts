import { Injectable, NgZone } from '@angular/core';
import { Map } from 'maplibre-gl';
import { Threebox } from 'threebox-plugin';

@Injectable({
  providedIn: 'root',
})
export class ThreeboxService {
  /**
   * The threebox instance
   */
  public get threebox(): typeof Threebox {
    return this.#threebox;
  }

  #window = window as typeof window & { tb: typeof Threebox };
  #threebox!: typeof Threebox;

  constructor(private readonly ngZone: NgZone) {}

  /**
   * Initialize threebox service
   *
   * @param map The maplibre map instance
   */
  public initialize(map: Map): void {
    this.#threebox = new Threebox(map, map.getCanvas().getContext('webgl'), {
      defaultLights: true,
      passiveRendering: false,
    });
    this.#window.tb = this.#threebox; // Needed due to a bug in threebox
  }

  /**
   * Updates the threebox scene
   */
  public update(): void {
    this.ngZone.runOutsideAngular(() => this.#threebox.update());
  }

  /**
   * Dispose the threebox
   */
  public dispose(): void {
    this.#threebox.dispose();
    this.#window.tb = null;
  }
}
