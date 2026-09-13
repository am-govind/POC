import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COLORS = {
  'spirits-amber': '#c47a2c',
  'spirits-clear': '#e8f4f8',
  wine: '#4a1020',
  beer: '#d4a017',
  tequila: '#8fbc8f',
  liqueur: '#6b2d5c',
};

function buildBottleShape(type) {
  const points = [];
  if (type === 'wine') {
    points.push(new THREE.Vector2(0, 0), new THREE.Vector2(0.35, 0), new THREE.Vector2(0.38, 0.5),
      new THREE.Vector2(0.12, 1.2), new THREE.Vector2(0.08, 1.8), new THREE.Vector2(0.06, 2.2));
  } else if (type === 'beer') {
    points.push(new THREE.Vector2(0, 0), new THREE.Vector2(0.4, 0), new THREE.Vector2(0.42, 0.3),
      new THREE.Vector2(0.42, 1.4), new THREE.Vector2(0.15, 1.5), new THREE.Vector2(0.12, 1.8));
  } else if (type === 'liqueur') {
    points.push(new THREE.Vector2(0, 0), new THREE.Vector2(0.45, 0), new THREE.Vector2(0.5, 0.4),
      new THREE.Vector2(0.48, 1.0), new THREE.Vector2(0.2, 1.1), new THREE.Vector2(0.15, 1.5));
  } else if (type === 'tequila') {
    points.push(new THREE.Vector2(0, 0), new THREE.Vector2(0.32, 0), new THREE.Vector2(0.35, 0.6),
      new THREE.Vector2(0.18, 1.4), new THREE.Vector2(0.1, 1.7), new THREE.Vector2(0.08, 2.0));
  } else {
    points.push(new THREE.Vector2(0, 0), new THREE.Vector2(0.3, 0), new THREE.Vector2(0.32, 0.8),
      new THREE.Vector2(0.14, 1.6), new THREE.Vector2(0.1, 2.0), new THREE.Vector2(0.08, 2.4));
  }
  return new THREE.LatheGeometry(points, 32);
}

export default function BottleMesh({ type = 'spirits-amber', autoRotate = true }) {
  const ref = useRef();
  const color = COLORS[type] || COLORS['spirits-amber'];
  const geometry = buildBottleShape(type);

  useFrame((_, delta) => {
    if (autoRotate && ref.current) ref.current.rotation.y += delta * 0.4;
  });

  return (
    <group ref={ref} position={[0, -1.2, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color}
          metalness={0.1}
          roughness={0.15}
          transmission={type === 'spirits-clear' ? 0.85 : 0.6}
          thickness={0.5}
          transparent
          opacity={0.95}
        />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}
