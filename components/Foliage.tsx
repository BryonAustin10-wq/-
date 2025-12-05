import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS, COLORS } from '../types';

interface FoliageProps {
  progress: number; // 0 to 1 lerp value driven by parent
}

// Custom Shader for high performance morphing
const foliageVertexShader = `
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;

  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aRandom;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Cubic ease-out for smoother transition
    float t = uProgress;
    float ease = 1.0 - pow(1.0 - t, 3.0);
    
    // Mix positions (Dual-Position System)
    vec3 pos = mix(aScatterPos, aTreePos, ease);
    
    // Add a slight "breathing" or wind effect when formed
    if (uProgress > 0.8) {
       float wind = sin(uTime * 2.0 + pos.y * 0.5) * 0.05 * (uProgress);
       pos.x += wind;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (4.0 * uPixelRatio) * (1.0 / -mvPosition.z);
    
    // Sparkle effect
    float sparkle = sin(uTime * 3.0 + aRandom * 100.0);
    vAlpha = 0.6 + 0.4 * sparkle;
  }
`;

const foliageFragmentShader = `
  uniform vec3 uColorBase;
  uniform vec3 uColorTip;
  varying float vAlpha;

  void main() {
    // Soft particle circle
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    
    // Gradient color
    vec3 finalColor = mix(uColorBase, uColorTip, 0.5);
    
    gl_FragColor = vec4(finalColor, 1.0); // No transparency for depth write perf, or keep alpha 1
  }
`;

export const Foliage: React.FC<FoliageProps> = ({ progress }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  const uniforms = useMemo(() => ({
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
    uColorBase: { value: new THREE.Color(COLORS.EMERALD) },
    uColorTip: { value: new THREE.Color(COLORS.EMERALD_LIGHT) }
  }), []);

  const [positions, scatterPositions, treePositions, randoms] = useMemo(() => {
    const count = CONSTANTS.PARTICLE_COUNT;
    const scatter = new Float32Array(count * 3);
    const tree = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    
    // Dummy positions for initial buffer
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // SCATTER: Random point in a large sphere
      const rScatter = 20 * Math.cbrt(Math.random());
      const thetaScatter = Math.random() * 2 * Math.PI;
      const phiScatter = Math.acos(2 * Math.random() - 1);
      
      scatter[i * 3] = rScatter * Math.sin(phiScatter) * Math.cos(thetaScatter);
      scatter[i * 3 + 1] = rScatter * Math.sin(phiScatter) * Math.sin(thetaScatter);
      scatter[i * 3 + 2] = rScatter * Math.cos(phiScatter);

      // TREE: Cone shape
      // Height from -1 to height-1
      const yNorm = Math.random(); 
      const y = yNorm * CONSTANTS.TREE_HEIGHT - (CONSTANTS.TREE_HEIGHT / 2) + 2; 
      // Radius decreases as height increases
      const rMax = (1 - yNorm) * CONSTANTS.TREE_RADIUS; 
      const r = Math.sqrt(Math.random()) * rMax; // Uniform distribution in disc
      const theta = Math.random() * 2 * Math.PI;

      tree[i * 3] = r * Math.cos(theta);
      tree[i * 3 + 1] = y;
      tree[i * 3 + 2] = r * Math.sin(theta);

      rnd[i] = Math.random();
    }
    
    return [pos, scatter, tree, rnd];
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uProgress.value = progress;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={scatterPositions.length / 3}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
         <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};