import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';
import { whaleSound } from '@/utils/sounds';

interface BlobProps {
  color: string;
  isClicking: boolean;
  level: number;
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

function Stars() {
  const positions = useMemo(() => {
    const pos = [];
    const count = 800;
    
    for (let i = 0; i < count; i++) {
      const radius = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      pos.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        -radius * Math.cos(phi) - 15
      );
    }
    return new Float32Array(pos);
  }, []);

  const initialPositions = useMemo(() => new Float32Array(positions), [positions]);
  const rotationOffset = useRef(0);
  const sizes = useMemo(() => {
    const temp = new Float32Array(positions.length / 3);
    for (let i = 0; i < temp.length; i++) {
      temp[i] = Math.random() * 1.5 + 0.5;
    }
    return temp;
  }, [positions]);

  const pointsRef = useRef<THREE.Points>(null);
  const { clock } = useThree();

  // Custom shader material for realistic star appearance
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        size: { value: 3.0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vPosition;
        uniform float time;
        
        void main() {
          vPosition = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(time * 0.5 + position.x * 0.5) * 0.5 + 0.5;
          gl_PointSize = size * (300.0 / length(mvPosition.xyz)) * (0.8 + twinkle * 0.4);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Create a soft circle with a bright core
          float strength = 1.0 - smoothstep(0.0, 0.5, dist);
          strength = pow(strength, 1.5);
          
          // Add rays
          float rays = 0.0;
          for(int i = 0; i < 4; i++) {
            float angle = float(i) * 3.14159 / 2.0;
            vec2 dir = vec2(cos(angle), sin(angle));
            float ray = smoothstep(0.3, 0.0, abs(dot(normalize(center), dir) * length(center)));
            rays += ray * 0.3;
          }
          
          // Combine core and rays
          vec3 color = vec3(1.0);
          float alpha = strength + rays;
          alpha = smoothstep(0.0, 1.0, alpha);
          
          gl_FragColor = vec4(color, alpha * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const time = clock.getElapsedTime();
    
    // Update time uniform for twinkling
    starMaterial.uniforms.time.value = time;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    // Fixed rotation speed
    rotationOffset.current = (time * 0.02) % (Math.PI * 2);
    const angle = rotationOffset.current;

    for (let i = 0; i < positions.length; i += 3) {
      const initialX = initialPositions[i];
      const initialZ = initialPositions[i + 2];
      
      // Apply constant rotation
      positions[i] = initialX * Math.cos(angle) - initialZ * Math.sin(angle);
      positions[i + 2] = initialX * Math.sin(angle) + initialZ * Math.cos(angle);
      
      // Add subtle vertical movement
      positions[i + 1] = initialPositions[i + 1] + 
        Math.sin(time * 0.1 + initialX * 0.1) * 0.2;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={starMaterial} attach="material" />
    </points>
  );
}

function Blob({ color, isClicking, level, onClick }: BlobProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    whaleSound.playWhaleCall(level);
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

export default function BlobScene({ color, isClicking, level, onClick }: BlobProps) {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#000000'
    }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000000']} />
        
        <Stars />
        
        <ambientLight intensity={0.01} />
        <pointLight position={[10, 10, 10]} intensity={0.2} color="#4169e1" />
        
        <BackgroundParticles count={50} color={color} />
        <Blob color={color} isClicking={isClicking} level={level} onClick={onClick} />
        
        <EffectComposer>
          <Bloom
            intensity={2.5}
            luminanceThreshold={0}
            luminanceSmoothing={0.9}
            mipmapBlur
            radius={0.8}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
} 