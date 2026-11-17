import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export interface FinalFXUniforms {
  tDiffuse: { value: THREE.Texture | null };
  uTime: { value: number };
  uHpRatio: { value: number };
  uHitAberration: { value: number };
  uResolution: { value: THREE.Vector2 };
}

export const FinalFXShader = {
  name: 'FinalFXShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uHpRatio: { value: 1.0 },
    uHitAberration: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uHpRatio;
    uniform float uHitAberration;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // Fast pseudo-random generator
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5, 0.5);
      vec2 distFromCenter = uv - center;

      // 1. Chromatic aberration on damage hit
      float aberrationDist = uHitAberration * 0.018;
      vec2 caOffset = normalize(distFromCenter + 0.0001) * aberrationDist;

      float r = texture2D(tDiffuse, uv - caOffset).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv + caOffset).b;
      vec3 color = vec3(r, g, b);

      // 2. Cinematic Vignette
      float d = length(distFromCenter);
      float vignette = smoothstep(0.85, 0.35, d);
      color *= mix(0.68, 1.0, vignette);

      // 3. Film Grain (subtle high-frequency noise)
      float grain = (hash(uv * uResolution * 0.5 + fract(uTime * 37.0)) - 0.5) * 0.045;
      color += grain;

      // 4. Low HP desaturation and pulsing red perimeter
      if (uHpRatio < 0.4) {
        float desatFactor = clamp((0.4 - uHpRatio) / 0.4, 0.0, 1.0);
        float luma = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(color, vec3(luma), desatFactor * 0.7);

        // Pulsing red edges
        float pulse = 0.5 + 0.5 * sin(uTime * 6.28);
        float redEdge = smoothstep(0.35, 0.75, d) * desatFactor * (0.6 + 0.4 * pulse);
        color = mix(color, vec3(0.65, 0.02, 0.02), redEdge * 0.85);
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export class FinalFXPass {
  public readonly pass: ShaderPass;

  constructor() {
    this.pass = new ShaderPass(FinalFXShader);
  }

  public update(_dt: number, time: number, hpRatio: number, hitAberration: number): void {
    const u = this.pass.uniforms as unknown as FinalFXUniforms;
    u.uTime.value = time;
    u.uHpRatio.value = hpRatio;
    u.uHitAberration.value = hitAberration;
  }

  public setSize(w: number, h: number): void {
    const u = this.pass.uniforms as unknown as FinalFXUniforms;
    u.uResolution.value.set(w, h);
  }
}
