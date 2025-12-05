import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { Foliage } from './Foliage';
import { AllOrnaments } from './Ornaments';
import { Branches } from './Branches';
import { Star } from './Star';
import { TreeState } from '../types';

interface ChristmasTreeProps {
  treeState: TreeState;
}

export const ChristmasTree: React.FC<ChristmasTreeProps> = ({ treeState }) => {
  const groupRef = useRef<React.ComponentRef<'group'>>(null);
  const progressRef = useRef(0);

  useFrame((state, delta) => {
    // Determine target value based on state
    const target = treeState === TreeState.TREE_SHAPE ? 1 : 0;
    
    // Dynamic Damping for "Cool" Rhythm
    // When scattering (Target 0): Fast (Lambda higher)
    // When Assembling (Target 1): Majestic/Slow (Lambda lower)
    const smoothing = target === 0 ? 4 : 2; 
    
    progressRef.current = MathUtils.damp(progressRef.current, target, smoothing, delta);
    
    // Slowly rotate the whole tree when formed
    if (groupRef.current) {
        if (progressRef.current > 0.8) {
           groupRef.current.rotation.y += delta * 0.1;
        } else {
            // Add some drift during scatter state
            groupRef.current.rotation.y += delta * 0.02;
        }
    }
  });

  return (
    <group ref={groupRef}>
        {/* The Solid Green Body */}
        <Branches progress={progressRef.current} />
        
        {/* The Sparkles/Aura */}
        <Foliage progress={progressRef.current} />
        
        {/* The Decorations */}
        <AllOrnaments progress={progressRef.current} />

        {/* The Crowning Star */}
        <Star progress={progressRef.current} />
    </group>
  );
};