import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';
import { whaleSound } from '@/utils/sounds';

interface BlobProps {
  color: string;
  isClicking: boolean;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}

function BackgroundParticles({ count = 100, color }: { count?: number; color: string }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { mouse, viewport } = useThree();
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const position = [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ];
      // Generate a unique color for each particle based on the main color but with variation
      const hsl = new THREE.Color(color).getHSL({ h: 0, s: 0, l: 0 });
      const particleColor = new THREE.Color().setHSL(
        (hsl.h + Math.random() * 0.2) % 1,
        hsl.s * (0.8 + Math.random() * 0.4),
        hsl.l * (0.8 + Math.random() * 0.4)
      );
      
      temp.push({
        position,
        color: particleColor,
        scale: 0.03 + Math.random() * 0.02,
        speed: 0.2 + Math.random() * 0.3
      });
    }
    return temp;
  }, [count, color]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.getElapsedTime();

    // Convert mouse position to world space
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseY = (mouse.y * viewport.height) / 2;

    particles.forEach((particle, i) => {
      const matrix = new THREE.Matrix4();
      const [baseX, baseY, baseZ] = particle.position;

      // Calculate distance to mouse
      const dx = mouseX - baseX;
      const dy = mouseY - baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - dist / 3);

      // Add mouse-based movement
      const x = baseX + Math.sin(time * particle.speed + i) * 0.2 + dx * influence * 0.1;
      const y = baseY + Math.cos(time * particle.speed + i) * 0.2 + dy * influence * 0.1;
      const z = baseZ + Math.sin(time * particle.speed + i) * 0.2;

      const scale = particle.scale * (1 + influence * 0.5);
      
      matrix.setPosition(x, y, z);
      matrix.scale(new THREE.Vector3(scale, scale, scale));
      mesh.current.setMatrixAt(i, matrix);
      mesh.current.setColorAt(i, particle.color);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.instanceColor!.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial transparent opacity={0.6} vertexColors />
    </instancedMesh>
  );
}

function Stars({ count = 1000 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  const stars = useMemo(() => {
    const temp = [];
    const radius = 50; // Larger radius for stars
    
    for (let i = 0; i < count; i++) {
      // Use spherical coordinates for better distribution
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random()); // Cube root for better distribution
      
      const position = [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ];
      
      // Randomize star properties
      const brightness = 0.2 + Math.random() * 0.8;
      const size = 0.02 + Math.random() * 0.08;
      const twinkleSpeed = 0.5 + Math.random() * 2;
      
      temp.push({
        position,
        brightness,
        size,
        twinkleSpeed
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.getElapsedTime();

    stars.forEach((star, i) => {
      const matrix = new THREE.Matrix4();
      const [x, y, z] = star.position;
      
      // Add twinkling effect
      const twinkle = Math.sin(time * star.twinkleSpeed) * 0.5 + 0.5;
      const scale = star.size * (0.8 + twinkle * 0.4);
      
      matrix.setPosition(x, y, z);
      matrix.scale(new THREE.Vector3(scale, scale, scale));
      mesh.current?.setMatrixAt(i, matrix);
    });

    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </instancedMesh>
  );
}

function Blob({ color, isClicking, onClick }: BlobProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    whaleSound.playWhaleClick();
    onClick(event);
  };
  
  useFrame((state) => {
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
      onClick={handleClick}
      onPointerOver={(e) => {
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <MeshDistortMaterial
        color={color}
        distort={hovered ? 0.6 : 0.4}
        speed={isClicking ? 5 : 2}
        roughness={0.1}
        metalness={0.3}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={2}
        emissive={color}
        emissiveIntensity={isClicking ? 2 : hovered ? 1 : 0.5}
      />
    </Sphere>
  );
}

export default function BlobScene({ color, isClicking, onClick }: BlobProps) {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to bottom, #000000, #0a0a2c, #000000)'
    }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
      >
        {/* Create a gradient background */}
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 5, 30]} />
        
        {/* Add more ambient lighting for atmosphere */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#4169e1" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4169e1" />
        
        {/* Add stars */}
        <Stars count={2000} />
        
        {/* Keep existing particles but make them more subtle */}
        <BackgroundParticles count={50} color={color} />
        
        {/* Main blob */}
        <Blob color={color} isClicking={isClicking} onClick={onClick} />
        
        <EffectComposer>
          <Bloom
            intensity={2}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
} 