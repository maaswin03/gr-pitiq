'use client';

import { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';

interface Track3DProps {
  sectorColors?: string[];
}

export default function Track3D({ sectorColors = ['#ff4500', '#ff6347', '#ff7f50', '#ffa07a'] }: Track3DProps) {
  const trackRef = useRef<Mesh>(null);

  // Subtle rotation animation
  useFrame(() => {
    if (trackRef.current) {
      trackRef.current.rotation.z += 0.0002;
    }
  });

  return (
    <group>
      {/* Main track surface - darker with better contrast */}
      <mesh ref={trackRef} rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.5, 20]} receiveShadow>
        <ringGeometry args={[18, 22, 64]} />
        <meshStandardMaterial 
          color="#2a2a2a" 
          roughness={0.95} 
          metalness={0.1}
          emissive="#1a1a1a"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Track sectors - 4 colored sections with glow */}
      {[0, 1, 2, 3].map((sector) => (
        <mesh
          key={sector}
          rotation={[-Math.PI / 2, 0, (sector * Math.PI) / 2]}
          position={[15, -0.48, 20]}
        >
          <ringGeometry args={[18, 22, 16, 1, (sector * Math.PI) / 2, Math.PI / 2]} />
          <meshStandardMaterial
            color={sectorColors[sector]}
            opacity={0.4}
            transparent
            roughness={0.4}
            metalness={0.6}
            emissive={sectorColors[sector]}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Pit lane with glow */}
      <mesh position={[15, -0.47, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 2]} />
        <meshStandardMaterial 
          color="#ff4500" 
          opacity={0.6} 
          transparent 
          emissive="#ff4500"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Start/Finish line - brighter */}
      <mesh position={[15, -0.46, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 0.6]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff" 
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>

      {/* Track boundaries - inner with bright glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.4, 20]}>
        <ringGeometry args={[17.7, 18.1, 64]} />
        <meshStandardMaterial 
          color="#ff6600" 
          emissive="#ff4500" 
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Track boundaries - outer with bright glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -0.4, 20]}>
        <ringGeometry args={[21.9, 22.3, 64]} />
        <meshStandardMaterial 
          color="#ff6600" 
          emissive="#ff4500" 
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Ground plane - much darker for contrast */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, -1.5, 20]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial 
          color="#050505" 
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* Sector markers - taller and brighter */}
      {[0, 1, 2, 3].map((sector) => {
        const angle = (sector * Math.PI) / 2;
        const x = 15 + 20 * Math.cos(angle);
        const z = 20 + 20 * Math.sin(angle);
        return (
          <group key={`marker-${sector}`} position={[x, 0, z]}>
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.4, 0.4, 3]} />
              <meshStandardMaterial
                color={sectorColors[sector]}
                emissive={sectorColors[sector]}
                emissiveIntensity={2}
                toneMapped={false}
              />
            </mesh>
            {/* Point light for glow effect */}
            <pointLight
              color={sectorColors[sector]}
              intensity={3}
              distance={8}
              position={[0, 2, 0]}
            />
          </group>
        );
      })}

      {/* Additional track edge lights */}
      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const x = 15 + 20 * Math.cos(angle);
        const z = 20 + 20 * Math.sin(angle);
        return (
          <pointLight
            key={`edge-light-${i}`}
            position={[x, 0.5, z]}
            color="#ff4500"
            intensity={0.5}
            distance={4}
          />
        );
      })}
    </group>
  );
}
