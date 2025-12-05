import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, CONSTANTS } from '../types';

interface StarProps {
  progress: number;
}

export const Star: React.FC<StarProps> = ({ progress }) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Calculate positions
  const { scatterPos, treePos, scatterRot, treeRot } = useMemo(() => {
    // Scatter: Far out random position
    const r = 25;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const cPos = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
    
    // Tree: Top of the tree
    const tPos = new THREE.Vector3(0, (CONSTANTS.TREE_HEIGHT / 2) + 0.5, 0);

    const cRot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    const tRot = new THREE.Euler(0, 0, 0);

    return { scatterPos: cPos, treePos: tPos, scatterRot: cRot, treeRot: tRot };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Custom easing for the Star: "Snap" into place at the end
    // Remap progress to have a dramatic finish
    const t = progress;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Position Interpolation
    groupRef.current.position.lerpVectors(scatterPos, treePos, ease);

    // Rotation Interpolation
    // When formed (progress near 1), add a continuous slow spin
    const spinSpeed = 1.5;
    if (t > 0.95) {
      groupRef.current.rotation.y += delta * spinSpeed;
    } else {
        // Interpolate rotation quaternion-like (simple Euler lerp for now is fine for scatter)
        groupRef.current.rotation.set(
            THREE.MathUtils.lerp(scatterRot.x, treeRot.x, ease),
            THREE.MathUtils.lerp(scatterRot.y, treeRot.y + (state.clock.elapsedTime * spinSpeed), ease),
            THREE.MathUtils.lerp(scatterRot.z, treeRot.z, ease)
        );
    }

    // Pulse effect in shader/material
    if (materialRef.current) {
        materialRef.current.emissiveIntensity = 2 + Math.sin(state.clock.elapsedTime * 3) * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
        {/* Main Star Body - Icosahedron for crystal look */}
        <mesh>
            <icosahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial 
                ref={materialRef}
                color={COLORS.GOLD_HIGHLIGHT}
                emissive={COLORS.GOLD}
                emissiveIntensity={2}
                roughness={0}
                metalness={1}
            />
        </mesh>
        {/* Halo/Glow mesh */}
        <mesh scale={[1.5, 1.5, 1.5]}>
            <dodecahedronGeometry args={[0.6, 0]} />
            <meshBasicMaterial 
                color={COLORS.GOLD} 
                transparent 
                opacity={0.3} 
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    </group>
  );
};