import { Canvas } from '@react-three/fiber';
import { Environment, Float, Sparkles, OrbitControls } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import BottleMesh from './BottleMesh';

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <spotLight position={[5, 8, 5]} angle={0.3} penumbra={1} intensity={2} color="#d4a574" castShadow />
      <pointLight position={[-4, 2, -3]} intensity={1} color="#c9a227" />
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <BottleMesh type="spirits-amber" autoRotate />
      </Float>
      <Sparkles count={80} scale={8} size={2} speed={0.3} color="#d4a574" />
      <Environment preset="night" />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
}

export default function HeroScene({ fallback = false }) {
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const isMobile = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
    [],
  );

  if (fallback || reducedMotion || isMobile) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink-light to-[#2a1f10] flex items-center justify-center">
        <div className="w-32 h-48 rounded-full bg-gradient-to-b from-gold/30 to-transparent blur-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [0, 1, 5], fov: 45 }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
