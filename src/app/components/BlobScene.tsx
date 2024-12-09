import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField } from '@react-three/postprocessing';
import { MeshDistortMaterial, Sphere, Float, MeshWobbleMaterial } from '@react-three/drei';

interface BlobProps {
  color: string;
  isClicking: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}

// Background particle component
function BackgroundParticle({ position, color, mouse }: { 
  position: [number, number, number], 
  color: string,
  mouse: THREE.Vector2 
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const initialPosition = useMemo(() => new THREE.Vector3(...position), [position]);
  
  useFrame(() => {
    if (!mesh.current) return;
    
    // Calculate distance from mouse
    const mouseDistance = new THREE.Vector3(
      mouse.x * 10, 
      mouse.y * 10, 
      0
    ).distanceTo(mesh.current.position);
    
    // Move away from mouse
    if (mouseDistance < 2) {
      const angle = Math.atan2(
        mesh.current.position.y - mouse.y * 10,
        mesh.current.position.x - mouse.x * 10
      );
      mesh.current.position.x += Math.cos(angle) * (2 - mouseDistance) * 0.03;
      mesh.current.position.y += Math.sin(angle) * (2 - mouseDistance) * 0.03;
    }
    
    // Return to original position
    mesh.current.position.lerp(initialPosition, 0.02);
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={mesh} position={position}>
        <dodecahedronGeometry args={[0.2]} />
        <MeshWobbleMaterial 
          color={color} 
          factor={0.4} 
          speed={2} 
          transparent 
          opacity={0.7} 
        />
      </mesh>
    </Float>
  );
}

function Blob({ color, isClicking, onClick }: BlobProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state: { clock: { elapsedTime: number } }) => {
    if (!mesh.current) return;
    
    const time = state.clock.elapsedTime;
    
    mesh.current.position.y = Math.sin(time * 0.5) * 0.2;
    mesh.current.position.x = Math.sin(time * 0.3) * 0.1;
    
    const baseScale = isClicking ? 1.9 : 2;
    const breathe = 
      Math.sin(time * 2) * 0.04 + 
      Math.sin(time * 1.3) * 0.02 + 
      Math.sin(time * 3.1) * 0.01;
    
    mesh.current.scale.setScalar(baseScale + breathe);
    
    mesh.current.rotation.z = Math.sin(time * 0.2) * 0.15;
  });

  return (
    <Sphere
      ref={mesh}
      args={[1, 128, 128]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <MeshDistortMaterial
        color={color}
        distort={hovered ? 0.6 : 0.4}
        speed={isClicking ? 5 : 2}
        roughness={0.2}
        metalness={0.1}
        bumpScale={0.005}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={1}
      />
    </Sphere>
  );
}

// Scene component that uses Three.js hooks
function Scene({ color, isClicking, onClick, onMouseMove }: BlobProps & { onMouseMove: (event: { clientX: number; clientY: number }) => void }) {
  const { size } = useThree();
  const mouse = useRef(new THREE.Vector2());
  
  // Create background particles
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 100; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 30;
      const z = -Math.random() * 15;
      temp.push({
        position: [x, y, z] as [number, number, number],
        color: `hsl(${Math.random() * 360}, 50%, 50%)`
      });
    }
    return temp;
  }, []);

  const handleMouseMove = (event: THREE.Event) => {
    const e = event as unknown as { clientX: number; clientY: number };
    mouse.current.x = (e.clientX / size.width) * 2 - 1;
    mouse.current.y = -(e.clientY / size.height) * 2 + 1;
    onMouseMove(e);
  };

  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 5, 15]} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {particles.map((particle, i) => (
        <BackgroundParticle 
          key={i} 
          position={particle.position} 
          color={particle.color}
          mouse={mouse.current}
        />
      ))}
      
      <Blob color={color} isClicking={isClicking} onClick={onClick} />
      
      <EffectComposer>
        <DepthOfField
          focusDistance={0}
          focalLength={0.02}
          bokehScale={2}
          height={480}
        />
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          blurPass={undefined}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.002, 0.002)}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    </>
  );
}

export default function BlobScene({ color, isClicking, onClick }: BlobProps) {
  const handleMouseMove = (event: { clientX: number; clientY: number }) => {
    // Any additional mouse move handling if needed
  };

  return (
    <Canvas 
      camera={{ 
        position: [0, 0, 5],
        fov: 75, // Wider field of view
        near: 0.1,
        far: 100
      }}
      dpr={[1, 2]} // Better pixel ratio handling
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
    >
      <Scene 
        color={color} 
        isClicking={isClicking} 
        onClick={onClick}
        onMouseMove={handleMouseMove}
      />
    </Canvas>
  );
} 