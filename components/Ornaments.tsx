import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS, COLORS } from '../types';

interface OrnamentGroupProps {
  progress: number;
  count: number;
  type: 'gift' | 'ball' | 'light';
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export const OrnamentsGroup: React.FC<OrnamentGroupProps> = ({ progress, count, type, geometry, material }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate Dual-Position System
  const { scatterPositions, treePositions, rotations, scales } = useMemo(() => {
    const scatter = [];
    const tree = [];
    const rots = [];
    const scs = [];

    for (let i = 0; i < count; i++) {
      // Scatter Position: Random sphere, larger radius
      const rScatter = 25 * Math.cbrt(Math.random());
      const thetaScatter = Math.random() * 2 * Math.PI;
      const phiScatter = Math.acos(2 * Math.random() - 1);
      scatter.push(new THREE.Vector3(
        rScatter * Math.sin(phiScatter) * Math.cos(thetaScatter),
        rScatter * Math.sin(phiScatter) * Math.sin(thetaScatter),
        rScatter * Math.cos(phiScatter)
      ));

      // Tree Position: On the surface
      const yNorm = Math.random();
      const y = yNorm * CONSTANTS.TREE_HEIGHT - (CONSTANTS.TREE_HEIGHT / 2) + 2;
      
      // Calculate Radius
      let rMax = (1 - yNorm) * CONSTANTS.TREE_RADIUS;
      let r = rMax;
      const theta = Math.random() * 2 * Math.PI;

      if (type === 'gift') {
         // Gifts attached to the tree surface
         r = rMax * (0.8 + Math.random() * 0.3);
         tree.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      } else {
        // Balls and lights slightly OUTSIDE the branch layer
        const offset = type === 'ball' ? 0.4 : 0.5;
        r = (rMax + offset) * (0.95 + Math.random() * 0.1); 
        tree.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }

      // Random rotation
      rots.push(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0));

      // Scales
      const baseScale = type === 'gift' ? 0.8 : type === 'ball' ? 0.35 : 0.15;
      const s = baseScale * (0.8 + Math.random() * 0.4);
      scs.push(new THREE.Vector3(s, s, s));
    }
    return { scatterPositions: scatter, treePositions: tree, rotations: rots, scales: scs };
  }, [count, type]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // --- ENHANCED ANIMATION RHYTHM ---
    let t = progress;
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let localT = ease;
    
    if (type === 'gift') {
        localT = THREE.MathUtils.mapLinear(t, 0.2, 1, 0, 1);
        localT = THREE.MathUtils.clamp(localT, 0, 1);
        localT = localT < 0.5 ? 2 * localT * localT : -1 + (4 - 2 * localT) * localT;
    }
    if (type === 'light') {
        localT = THREE.MathUtils.mapLinear(t, 0, 0.8, 0, 1);
        localT = THREE.MathUtils.clamp(localT, 0, 1);
        localT = Math.sin(localT * Math.PI / 2); 
    }

    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const start = scatterPositions[i];
      const end = treePositions[i];
      
      // Interpolate position
      tempObj.position.lerpVectors(start, end, localT);
      
      // Scattered State Fluid Motion: Gentle floating bob
      if (t < 0.2) {
          const floatY = Math.sin(time * 0.5 + i * 0.1) * 0.5;
          const floatX = Math.cos(time * 0.3 + i * 0.1) * 0.2;
          tempObj.position.y += floatY * (1 - localT);
          tempObj.position.x += floatX * (1 - localT);
      }

      // Add "Orbit/Swirl" during transition
      if (progress > 0.01 && progress < 0.99) {
          const swirlStr = Math.sin(progress * Math.PI) * 5; 
          const angle = time * 2 + (start.y * 0.1); 
          const offset = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(swirlStr * (1-localT));
          tempObj.position.add(offset);
      }

      // Rotation
      tempObj.rotation.copy(rotations[i]);
      if (progress < 0.9) {
        // Slower, more elegant spin in scattered state
        tempObj.rotation.x += time * 0.5 + i * 0.01;
        tempObj.rotation.y += time * 0.3 + i * 0.01;
      } else {
        // Gentle bob when tree is shaped
        tempObj.rotation.y += Math.sin(time + i) * 0.02;
      }

      // Scale: Pop effect
      tempObj.scale.copy(scales[i]);
      // Flash lights
      if (type === 'light') {
         const flash = Math.sin(time * 3 + i * 10) * 0.2 + 0.9; // Less frantic flashing
         tempObj.scale.multiplyScalar(localT * flash); 
      }

      tempObj.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export const AllOrnaments: React.FC<{ progress: number }> = ({ progress }) => {
  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
  
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.GOLD,
    metalness: 0.9,
    roughness: 0.2,
    envMapIntensity: 2
  }), []);

  const redMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.RED_VELVET,
    metalness: 0.4,
    roughness: 0.3,
  }), []);

  // Use MeshStandardMaterial for Lights to allow tone mapping and controlled glow
  // toneMapped: true prevents it from blowing out to pure white
  const lightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.WARM_WHITE,
    emissive: COLORS.WARM_WHITE,
    emissiveIntensity: 1.5,
    toneMapped: true,
    roughness: 0.2,
    metalness: 0.8
  }), []);

  return (
    <group>
      <OrnamentsGroup 
        progress={progress} 
        count={CONSTANTS.GIFT_COUNT} 
        type="gift" 
        geometry={boxGeo} 
        material={redMaterial} 
      />
      <OrnamentsGroup 
        progress={progress} 
        count={CONSTANTS.BALL_COUNT} 
        type="ball" 
        geometry={sphereGeo} 
        material={goldMaterial} 
      />
      <OrnamentsGroup 
        progress={progress} 
        count={CONSTANTS.LIGHT_COUNT} 
        type="light" 
        geometry={sphereGeo} 
        material={lightMaterial} 
      />
    </group>
  );
};