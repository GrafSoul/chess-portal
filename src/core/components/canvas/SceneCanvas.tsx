import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import * as THREE from 'three';

interface SceneCanvasProps {
  children: ReactNode;
}

/** Main 3D canvas wrapper with optimized defaults */
export function SceneCanvas({ children }: SceneCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 8, 8], fov: 45, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      className="w-full h-full"
    >
      <Suspense fallback={null}>
        {children}
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
