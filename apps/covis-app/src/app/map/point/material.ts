import { DiseasePhase } from '@covis/shared';
import { THREE } from 'threebox-plugin';

/**
 * The mapping from the `DiseasePhase` enum to a color.
 */
export const diseaseColor: Record<DiseasePhase, number> = {
  [DiseasePhase.asymptomaticContagiousEarlyStage]: 0xffe599,
  [DiseasePhase.asymptomaticContagiousMiddleStage]: 0xffd966,
  [DiseasePhase.asymptomaticContagiousLateStage]: 0xf1c232,
  [DiseasePhase.dead]: 0x000000,
  [DiseasePhase.healthy]: 0x4fa64f,
  [DiseasePhase.hospitalized]: 0x8e7cc3,
  [DiseasePhase.intensiveCareUnit]: 0xff6666,
  [DiseasePhase.immunity]: 0x4233ff,
  [DiseasePhase.susceptible]: 0x9e9e9e,
  [DiseasePhase.symptomaticEarlyStage]: 0xf9cb9c,
  [DiseasePhase.symptomaticMiddleStage]: 0xf6b26b,
  [DiseasePhase.symptomaticLateStage]: 0xe69138,
};

export class MaterialHelper {
  /**
   * Materials for all disease phases
   */
  static #materials = Object.values(DiseasePhase).reduce(
    (acc, phase) => ({ ...acc, [phase]: this.createMaterial(phase) }),
    {} as Record<DiseasePhase, THREE.ShaderMaterial>
  );

  /**
   * Gets the material for the given disease phase
   *
   * @param diseasePhase The disease phase
   */
  public static getMaterial(diseasePhase: DiseasePhase): THREE.ShaderMaterial {
    return this.#materials[diseasePhase];
  }

  /**
   * Create the material for the disease phase using shader material
   *
   * @param diseasePhase The disease phase
   */
  private static createMaterial(
    diseasePhase: DiseasePhase
  ): THREE.ShaderMaterial {
    const color = this.getColor(diseasePhase);
    return new THREE.ShaderMaterial({
      vertexShader: `
              uniform float size;

              void main() {
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_PointSize = size;
                gl_Position = projectionMatrix * mvPosition;
              }
            `,
      fragmentShader: `
              #extension GL_OES_standard_derivatives : enable
              uniform vec3 color;

              void main() {
                vec2 center = 2.0 * gl_PointCoord - 1.0;
                float strokeSize = 0.6;
                float distance = dot(center, center);
                float delta = fwidth(distance);
                float alpha = 0.7 - smoothstep(1.0 - delta, 1.0 + delta, distance);
                float stroke = 1.0 - smoothstep(strokeSize - delta, strokeSize + delta, distance);
                gl_FragColor = vec4(mix(vec3(0.0, 0.0, 0.0), color, stroke), alpha);
              }
            `,
      uniforms: {
        size: { value: 10.0 },
        color: { value: color },
      },
      transparent: true,
    });
  }

  /**
   * Gets the color for the given disease phase
   *
   * @param diseasePhase The current disease phase
   */
  private static getColor(diseasePhase: DiseasePhase): THREE.Color {
    return new THREE.Color(diseaseColor[diseasePhase]);
  }
}
