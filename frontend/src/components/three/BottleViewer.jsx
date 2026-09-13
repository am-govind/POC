import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import BottleMesh from './BottleMesh';

function ViewerScene({ modelType }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <spotLight position={[4, 6, 4]} intensity={1.5} color="#d4a574" />
      <BottleMesh type={modelType} autoRotate={false} />
      <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={5} blur={2} />
      <Environment preset="city" />
      <OrbitControls enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.8} />
    </>
  );
}

export default function BottleViewer({ modelType = 'spirits-amber', imageUrl }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile && imageUrl) {
    return (
      <img src={imageUrl} alt="" className="w-full h-full object-contain p-8" />
    );
  }

  return (
    <div className="w-full h-full min-h-[320px]">
      <Canvas camera={{ position: [0, 0.5, 4], fov: 40 }}>
        <Suspense fallback={null}>
          <ViewerScene modelType={modelType} />
        </Suspense>
      </Canvas>
    </div>
  );
}
