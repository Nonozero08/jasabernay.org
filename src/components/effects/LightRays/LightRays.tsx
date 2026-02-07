import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';

export type RaysOrigin =
  | 'top-center' | 'top-left' | 'top-right'
  | 'right' | 'left'
  | 'bottom-center' | 'bottom-right' | 'bottom-left';

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

// Cache for hex colors to prevent redundant parsing
const colorCache: Record<string, [number, number, number]> = {};
const hexToRgb = (hex: string): [number, number, number] => {
  if (colorCache[hex]) return colorCache[hex];
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  const rgb: [number, number, number] = m
    ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
    : [1, 1, 1];
  colorCache[hex] = rgb;
  return rgb;
};

const getAnchorAndDir = (origin: RaysOrigin, w: number, h: number) => {
  const outside = 0.2;
  const positions: Record<RaysOrigin, { anchor: [number, number]; dir: [number, number] }> = {
    'top-left': { anchor: [0, -outside * h], dir: [0, 1] },
    'top-right': { anchor: [w, -outside * h], dir: [0, 1] },
    'top-center': { anchor: [0.5 * w, -outside * h], dir: [0, 1] },
    'left': { anchor: [-outside * w, 0.5 * h], dir: [1, 0] },
    'right': { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] },
    'bottom-left': { anchor: [0, (1 + outside) * h], dir: [0, -1] },
    'bottom-center': { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] },
    'bottom-right': { anchor: [w, (1 + outside) * h], dir: [0, -1] },
  };
  return positions[origin] || positions['top-center'];
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

  // 1. Optimized Visibility Observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.01 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. WebGL Lifecycle
  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    let animationId: number;
    let resizeObserver: ResizeObserver;

    const init = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!containerRef.current) return;

          const renderer = new Renderer({
            dpr: Math.min(window.devicePixelRatio, 2),
            alpha: true,
            premultipliedAlpha: false,
            powerPreference: "high-performance"
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
            uniform float iTime, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation, mouseInfluence, noiseAmount, distortion;
            uniform vec2 iResolution, rayPos, rayDir, mousePos;
            uniform vec3 raysColor;
            varying vec2 vUv;

            float noise(vec2 st) {
              return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
              vec2 sourceToCoord = coord - raySource;
              float dist = length(sourceToCoord);
              vec2 dirNorm = sourceToCoord / dist;
              float cosAngle = dot(dirNorm, rayRefDirection);
              float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + dist * 0.01) * 0.2;
              float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
              float maxDistance = iResolution.x * rayLength;
              float lengthFalloff = clamp((maxDistance - dist) / maxDistance, 0.0, 1.0);
              float fadeFalloff = clamp((iResolution.x * fadeDistance - dist) / (iResolution.x * fadeDistance), 0.5, 1.0);
              float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
              float baseStrength = clamp((0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) + (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)), 0.0, 1.0);
              return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
            }

            void main() {
              vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
              vec2 finalRayDir = rayDir;
              if (mouseInfluence > 0.0) {
                vec2 mDir = normalize((mousePos * iResolution.xy) - rayPos);
                finalRayDir = normalize(mix(rayDir, mDir, mouseInfluence));
              }
              float r1 = rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
              float r2 = rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
              vec3 result = vec3(r1 * 0.5 + r2 * 0.4);
              if (noiseAmount > 0.0) {
                result *= (1.0 - noiseAmount + noiseAmount * noise(coord * 0.01 + iTime * 0.1));
              }
              float brightness = 1.0 - (coord.y / iResolution.y);
              result *= vec3(0.1 + brightness * 0.8, 0.3 + brightness * 0.6, 0.5 + brightness * 0.5);
              if (saturation != 1.0) {
                float gray = dot(result, vec3(0.299, 0.587, 0.114));
                result = mix(vec3(gray), result, saturation);
              }
              gl_FragColor = vec4(result * raysColor, 1.0);
            }
          `;

          const uniforms = {
            iTime: { value: 0 },
            iResolution: { value: new Float32Array([0, 0]) },
            rayPos: { value: new Float32Array([0, 0]) },
            rayDir: { value: new Float32Array([0, 1]) },
            raysColor: { value: hexToRgb(raysColor) },
            raysSpeed: { value: raysSpeed },
            lightSpread: { value: lightSpread },
            rayLength: { value: rayLength },
            pulsating: { value: pulsating ? 1.0 : 0.0 },
            fadeDistance: { value: fadeDistance },
            saturation: { value: saturation },
            mousePos: { value: new Float32Array([0.5, 0.5]) },
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
            const { clientWidth: width, clientHeight: height } = containerRef.current;
            renderer.setSize(width, height);
            const w = width * renderer.dpr;
            const h = height * renderer.dpr;
            uniforms.iResolution.value[0] = w;
            uniforms.iResolution.value[1] = h;
            const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
            uniforms.rayPos.value.set(anchor);
            uniforms.rayDir.value.set(dir);
          };

          resizeObserver = new ResizeObserver(updateSize);
          resizeObserver.observe(containerRef.current);
          containerRef.current.appendChild(gl.canvas);
          updateSize();

          const loop = (t: number) => {
            const u = uniformsRef.current;
            if (!u) return;
            u.iTime.value = t * 0.001;

            if (followMouse && mouseInfluence > 0.0) {
              const s = 0.92;
              smoothMouseRef.current.x = smoothMouseRef.current.x * s + mouseRef.current.x * (1 - s);
              smoothMouseRef.current.y = smoothMouseRef.current.y * s + mouseRef.current.y * (1 - s);
              u.mousePos.value[0] = smoothMouseRef.current.x;
              u.mousePos.value[1] = smoothMouseRef.current.y;
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
  }, [isVisible, raysOrigin]); // Added raysOrigin here to simplify re-anchoring logic

  // 3. Dynamic Uniform Updates (Minimal Garbage)
  useEffect(() => {
    const u = uniformsRef.current;
    if (!u) return;
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
  }, [raysColor, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation, mouseInfluence, noiseAmount, distortion]);

  // 4. Optimized Mouse Listener
  useEffect(() => {
    if (!followMouse) return;
    const handleMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [followMouse]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        opacity: isReady ? 1 : 0,
        transition: 'opacity 1s ease-out',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};

export default React.memo(LightRays);