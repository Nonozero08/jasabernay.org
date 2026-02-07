import React, { useRef, useEffect, useState } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';

/**
 * OPTIMIZATIONS INCLUDED:
 * 1. Deferred Initialization: Uses double RAF to prevent frame drops on mount.
 * 2. ResizeObserver: Replaces window resize for localized, efficient layout tracking.
 * 3. Graceful Entry: CSS transition prevents the "flash" of an unrendered canvas.
 * 4. Context Management: Explicit WebGL context loss handling on unmount.
 */

export type RaysOrigin =
  | 'top-center'
  | 'top-left'
  | 'top-right'
  | 'right'
  | 'left'
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left';

interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
}

const DEFAULT_COLOR = '#ffffff';

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const getAnchorAndDir = (
  origin: RaysOrigin,
  w: number,
  h: number
): { anchor: [number, number]; dir: [number, number] } => {
  const outside = 0.2;
  switch (origin) {
    case 'top-left': return { anchor: [0, -outside * h], dir: [0, 1] };
    case 'top-right': return { anchor: [w, -outside * h], dir: [0, 1] };
    case 'left': return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case 'right': return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case 'bottom-left': return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-center': return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-right': return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default: return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

const LightRays: React.FC<LightRaysProps> = ({
  raysOrigin = 'top-center',
  raysColor = DEFAULT_COLOR,
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1.0,
  saturation = 1.0,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0.0,
  distortion = 0.0,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const uniformsRef = useRef<any>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // 1. Visibility Observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.01 });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 2. WebGL Lifecycle
  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    let animationId: number;
    let resizeObserver: ResizeObserver;

    const init = () => {
      // Double RAF: Pushes shader compilation and context creation 
      // to the next frame to avoid blocking the main thread during navigation.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!containerRef.current) return;

          const renderer = new Renderer({
            dpr: Math.min(window.devicePixelRatio, 2),
            alpha: true,
            premultipliedAlpha: false
          });
          rendererRef.current = renderer;
          const gl = renderer.gl;

          const vert = `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
              vUv = position * 0.5 + 0.5;
              gl_Position = vec4(position, 0.0, 1.0);
            }
          `;

          const frag = `
            precision highp float;
            uniform float iTime;
            uniform vec2  iResolution;
            uniform vec2  rayPos;
            uniform vec2  rayDir;
            uniform vec3  raysColor;
            uniform float raysSpeed;
            uniform float lightSpread;
            uniform float rayLength;
            uniform float pulsating;
            uniform float fadeDistance;
            uniform float saturation;
            uniform vec2  mousePos;
            uniform float mouseInfluence;
            uniform float noiseAmount;
            uniform float distortion;
            varying vec2 vUv;

            float noise(vec2 st) {
              return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
              vec2 sourceToCoord = coord - raySource;
              vec2 dirNorm = normalize(sourceToCoord);
              float cosAngle = dot(dirNorm, rayRefDirection);
              float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
              float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
              float distance = length(sourceToCoord);
              float maxDistance = iResolution.x * rayLength;
              float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
              float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
              float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
              float baseStrength = clamp((0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) + (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)), 0.0, 1.0);
              return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
            }

            void main() {
              vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
              vec2 finalRayDir = rayDir;
              if (mouseInfluence > 0.0) {
                vec2 mouseDirection = normalize((mousePos * iResolution.xy) - rayPos);
                finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
              }
              vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
              vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
              vec4 result = rays1 * 0.5 + rays2 * 0.4;
              if (noiseAmount > 0.0) {
                result.rgb *= (1.0 - noiseAmount + noiseAmount * noise(coord * 0.01 + iTime * 0.1));
              }
              float brightness = 1.0 - (coord.y / iResolution.y);
              result.rgb *= vec3(0.1 + brightness * 0.8, 0.3 + brightness * 0.6, 0.5 + brightness * 0.5);
              if (saturation != 1.0) {
                float gray = dot(result.rgb, vec3(0.299, 0.587, 0.114));
                result.rgb = mix(vec3(gray), result.rgb, saturation);
              }
              gl_FragColor = vec4(result.rgb * raysColor, result.a);
            }
          `;

          const uniforms = {
            iTime: { value: 0 },
            iResolution: { value: [0, 0] },
            rayPos: { value: [0, 0] },
            rayDir: { value: [0, 1] },
            raysColor: { value: hexToRgb(raysColor) },
            raysSpeed: { value: raysSpeed },
            lightSpread: { value: lightSpread },
            rayLength: { value: rayLength },
            pulsating: { value: pulsating ? 1.0 : 0.0 },
            fadeDistance: { value: fadeDistance },
            saturation: { value: saturation },
            mousePos: { value: [0.5, 0.5] },
            mouseInfluence: { value: mouseInfluence },
            noiseAmount: { value: noiseAmount },
            distortion: { value: distortion }
          };
          uniformsRef.current = uniforms;

          const geometry = new Triangle(gl);
          const program = new Program(gl, { vertex: vert, fragment: frag, uniforms });
          const mesh = new Mesh(gl, { geometry, program });

          const updateSize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            renderer.setSize(width, height);

            const w = width * renderer.dpr;
            const h = height * renderer.dpr;
            uniforms.iResolution.value = [w, h];
            const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
            uniforms.rayPos.value = anchor;
            uniforms.rayDir.value = dir;
          };

          resizeObserver = new ResizeObserver(updateSize);
          resizeObserver.observe(containerRef.current);
          containerRef.current.appendChild(gl.canvas);
          updateSize();

          const loop = (t: number) => {
            if (!uniformsRef.current) return;
            uniforms.iTime.value = t * 0.001;

            if (followMouse && mouseInfluence > 0.0) {
              const s = 0.92;
              smoothMouseRef.current.x = smoothMouseRef.current.x * s + mouseRef.current.x * (1 - s);
              smoothMouseRef.current.y = smoothMouseRef.current.y * s + mouseRef.current.y * (1 - s);
              uniforms.mousePos.value = [smoothMouseRef.current.x, smoothMouseRef.current.y];
            }

            renderer.render({ scene: mesh });
            setIsReady(true);
            animationId = requestAnimationFrame(loop);
          };

          animationId = requestAnimationFrame(loop);
        });
      });
    };

    init();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      if (rendererRef.current) {
        const gl = rendererRef.current.gl;
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        gl.canvas.remove();
      }
      rendererRef.current = null;
      uniformsRef.current = null;
    };
  }, [isVisible]);

  // 3. Dynamic Uniform Updates (No Re-init)
  useEffect(() => {
    if (!uniformsRef.current) return;
    const u = uniformsRef.current;
    u.raysColor.value = hexToRgb(raysColor);
    u.raysSpeed.value = raysSpeed;
    u.lightSpread.value = lightSpread;
    u.rayLength.value = rayLength;
    u.pulsating.value = pulsating ? 1.0 : 0.0;
    u.fadeDistance.value = fadeDistance;
    u.saturation.value = saturation;
    u.mouseInfluence.value = mouseInfluence;
    u.noiseAmount.value = noiseAmount;
    u.distortion.value = distortion;

    // Update placement based on new origin
    if (rendererRef.current) {
      const { anchor, dir } = getAnchorAndDir(
        raysOrigin,
        uniformsRef.current.iResolution.value[0],
        uniformsRef.current.iResolution.value[1]
      );
      u.rayPos.value = anchor;
      u.rayDir.value = dir;
    }
  }, [raysColor, raysSpeed, lightSpread, raysOrigin, rayLength, pulsating, fadeDistance, saturation, mouseInfluence, noiseAmount, distortion]);

  // 4. Mouse Move Listener
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      };
    };

    if (followMouse) {
      window.addEventListener('mousemove', handleMove, { passive: true });
      return () => window.removeEventListener('mousemove', handleMove);
    }
  }, [followMouse]);

  return (
    <div
      ref={containerRef}
      className={`light-rays-container ${className}`}
      style={{
        opacity: isReady ? 1 : 0,
        transition: 'opacity 1.2s ease-out',
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    />
  );
};

export default LightRays;