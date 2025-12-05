import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONSTANTS, COLORS } from '../types';

interface BranchesProps {
  progress: number;
}

export const Branches: React.FC<BranchesProps> = ({ progress }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  const count = CONSTANTS.BRANCH_COUNT;

  const { scatterData, treeData, scales } = useMemo(() => {
    const scatterPositions = [];
    const scatterRotations = [];
    const treePositions = [];
    const treeRotations = [];
    const scales = [];

    for (let i = 0; i < count; i++) {
        // --- SCATTER STATE ---
        // Random sphere distribution
        const rScatter = 18 * Math.cbrt(Math.random());
        const thetaScatter = Math.random() * 2 * Math.PI;
        const phiScatter = Math.acos(2 * Math.random() - 1);
        
        scatterPositions.push(new THREE.Vector3(
            rScatter * Math.sin(phiScatter) * Math.cos(thetaScatter),
            rScatter * Math.sin(phiScatter) * Math.sin(thetaScatter),
            rScatter * Math.cos(phiScatter)
        ));
        
        scatterRotations.push(new THREE.Euler(
            Math.random() * Math.PI, 
            Math.random() * Math.PI, 
            Math.random() * Math.PI
        ));

        // --- TREE STATE (Tree Form) ---
        // Cone distribution volume (filling the inside)
        const yNorm = Math.random(); 
        const y = yNorm * CONSTANTS.TREE_HEIGHT - (CONSTANTS.TREE_HEIGHT / 2) + 2; 
        
        // Radius at this height
        const maxR = (1 - yNorm) * CONSTANTS.TREE_RADIUS;
        // Distribute heavily towards outside but keep some inside
        const r = Math.pow(Math.random(), 0.3) * maxR; 
        const theta = Math.random() * 2 * Math.PI;

        const tPos = new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta));
        treePositions.push(tPos);

        // Rotation: Point outwards and slightly up
        const lookAtPos = new THREE.Vector3(tPos.x * 2, tPos.y, tPos.z * 2); // Look out
        const dummyObj = new THREE.Object3D();
        dummyObj.position.copy(tPos);
        dummyObj.lookAt(lookAtPos);
        // Tilt up a bit
        dummyObj.rotateX(-Math.PI / 4);
        // Randomize slightly
        dummyObj.rotateZ((Math.random() - 0.5) * 0.5);
        dummyObj.rotateY((Math.random() - 0.5) * 0.5);
        
        treeRotations.push(dummyObj.rotation.clone());

        // Scale
        const scale = 0.5 + Math.random() * 0.8;
        scales.push(new THREE.Vector3(scale, scale * 1.5, scale));
    }

    return {
        scatterData: { positions: scatterPositions, rotations: scatterRotations },
        treeData: { positions: treePositions, rotations: treeRotations },
        scales
    };
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Use a spring-like elastic ease for "cool" effect
    let t = progress;
    // Smooth step
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const dummyQ = new THREE.Quaternion();
    const targetQ = new THREE.Quaternion();
    const scatterQ = new THREE.Quaternion();
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
        // Interpolate Position
        tempObj.position.lerpVectors(scatterData.positions[i], treeData.positions[i], ease);
        
        // Add "Explosion" turbulence
        if (t > 0.1 && t < 0.9) {
            const noise = Math.sin(t * Math.PI * 4 + i) * 0.5 * (1 - ease);
            tempObj.position.y += noise;
        }

        // Fluid Scatter Motion: Gentle bobbing
        if (t < 0.1) {
            const floatY = Math.sin(time * 0.5 + i * 0.1) * 0.5;
            tempObj.position.y += floatY * (1 - t*10); // Fade out as it forms
        }

        // Interpolate Rotation
        scatterQ.setFromEuler(scatterData.rotations[i]);
        targetQ.setFromEuler(treeData.rotations[i]);
        dummyQ.slerpQuaternions(scatterQ, targetQ, ease);
        tempObj.setRotationFromQuaternion(dummyQ);

        // Gentle rotation in scatter state
        if (t < 0.5) {
             tempObj.rotation.x += Math.sin(time * 0.2 + i) * 0.05 * (1-ease);
             tempObj.rotation.y += time * 0.1 * (1-ease);
        }

        tempObj.scale.copy(scales[i]);
        
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geometry = useMemo(() => new THREE.ConeGeometry(0.2, 0.8, 4), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.EMERALD,
    roughness: 0.4, // Glossier
    metalness: 0.2,
    flatShading: true,
    envMapIntensity: 1.2
  }), []);

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};