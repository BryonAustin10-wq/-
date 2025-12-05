import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { TreeState, COLORS } from './types';
import { ChristmasTree } from './components/ChristmasTree';
import { Overlay } from './components/Overlay';

function Scene({ treeState }: { treeState: TreeState }) {
  return (
    <>
      <PerspectiveCameraWithIntro />
      
      {/* Lighting - Arix Signature: Deep contrasts, sparkling gold */}
      <ambientLight intensity={0.3} color="#002010" />
      {/* Highlight Key Light */}
      <pointLight position={[10, 10, 10]} intensity={1.5} color={COLORS.GOLD_HIGHLIGHT} />
      {/* Fill Light */}
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#cceeff" />
      {/* Rim Light for drama */}
      <spotLight 
        position={[0, 20, -5]} 
        angle={0.5} 
        penumbra={1} 
        intensity={3} 
        castShadow 
        color={COLORS.WARM_WHITE}
      />

      {/* Environment */}
      <Environment preset="lobby" background={false} blur={0.8} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Main Content */}
      <ChristmasTree treeState={treeState} />

      {/* Post Processing for the "Cinematic Glow" */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.3} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

// Separate component to handle initial camera movement if desired, 
// or just standard controls
const PerspectiveCameraWithIntro = () => {
  return (
    <OrbitControls 
      makeDefault 
      minPolarAngle={Math.PI / 4} 
      maxPolarAngle={Math.PI / 1.8}
      minDistance={10}
      maxDistance={40}
      enablePan={false}
      autoRotate={true}
      autoRotateSpeed={0.5}
    />
  );
};

export default function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.SCATTERED);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Background Gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#052018_0%,_#000000_100%)] z-0" />
      
      <Canvas
        shadows
        // Moved Camera back to Z=28 and Y=2 to fit larger tree comfortably
        camera={{ position: [0, 2, 28], fov: 45 }}
        gl={{ antialias: false, toneMappingExposure: 1.1 }} // Perf opt + exposure
        dpr={[1, 2]} // Handle high DPI
        className="z-1"
      >
        <Suspense fallback={null}>
          <Scene treeState={treeState} />
        </Suspense>
      </Canvas>

      <Overlay currentState={treeState} onToggle={setTreeState} />
    </div>
  );
}