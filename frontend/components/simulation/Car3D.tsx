'use client';

import { useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface Car3DProps {
  speed: number;
  currentSector: number;
  isPitting: boolean;
  onSectorChange?: (sector: number) => void;
  onLapComplete?: () => void;
}

export default function Car3D({
  speed,
  isPitting,
  onSectorChange,
  onLapComplete,
}: Car3DProps) {
  const carRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const lastSectorRef = useRef(0);

  useFrame((state, delta) => {
    if (!carRef.current) return;

    // Speed affects progress around track
    const speedMultiplier = speed / 200; // Normalize speed
    progressRef.current += delta * speedMultiplier * 0.5;

    if (progressRef.current >= Math.PI * 2) {
      progressRef.current = 0;
      onLapComplete?.();
    }

    // Calculate position on circular track
    const radius = isPitting ? 15 : 20; // Closer to center when pitting
    const x = 15 + radius * Math.cos(progressRef.current);
    const z = 20 + radius * Math.sin(progressRef.current);

    carRef.current.position.set(x, 0.5, z);

    // Rotate car to face direction of travel
    const nextAngle = progressRef.current + 0.1;
    const nextX = 15 + radius * Math.cos(nextAngle);
    const nextZ = 20 + radius * Math.sin(nextAngle);
    
    const direction = new Vector3(nextX - x, 0, nextZ - z).normalize();
    carRef.current.lookAt(carRef.current.position.clone().add(direction));

    // Detect sector changes
    const newSector = Math.floor((progressRef.current / (Math.PI * 2)) * 4);
    if (newSector !== lastSectorRef.current) {
      lastSectorRef.current = newSector;
      onSectorChange?.(newSector);
    }

    // Add slight bobbing motion for realism
    carRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 10) * 0.05;
  });

  return (
    <group ref={carRef}>
      {/* Main car body */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[1.2, 0.4, 2.5]} />
        <meshStandardMaterial
          color="#ff4500"
          roughness={0.3}
          metalness={0.8}
          emissive="#ff4500"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Cockpit/canopy */}
      <mesh castShadow position={[0, 0.6, -0.3]}>
        <boxGeometry args={[0.9, 0.4, 1.2]} />
        <meshStandardMaterial
          color="#000000"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Front wing */}
      <mesh castShadow position={[0, 0.1, 1.5]}>
        <boxGeometry args={[1.5, 0.05, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Rear wing */}
      <mesh castShadow position={[0, 0.8, -1.3]}>
        <boxGeometry args={[1.4, 0.05, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Wheels */}
      {[
        [-0.6, 0, 1], // Front left
        [0.6, 0, 1],  // Front right
        [-0.6, 0, -1], // Rear left
        [0.6, 0, -1],  // Rear right
      ].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}

      {/* Racing number */}
      <mesh position={[0, 0.51, 0]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Headlights */}
      {[-0.4, 0.4].map((x, idx) => (
        <pointLight
          key={idx}
          position={[x, 0.2, 1.8]}
          color="#ffffff"
          intensity={2}
          distance={10}
          castShadow
        />
      ))}

      {/* Engine glow */}
      <pointLight
        position={[0, 0.3, -1.5]}
        color="#ff4500"
        intensity={speed / 100}
        distance={5}
      />
    </group>
  );
}
