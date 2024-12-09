import { ReactThreeFiber } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: ReactThreeFiber.Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      sphereGeometry: ReactThreeFiber.BufferGeometryNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>
      ambientLight: ReactThreeFiber.LightNode<THREE.AmbientLight, typeof THREE.AmbientLight>
      pointLight: ReactThreeFiber.LightNode<THREE.PointLight, typeof THREE.PointLight>
      meshDistortMaterial: ReactThreeFiber.MaterialNode<typeof MeshDistortMaterial, typeof MeshDistortMaterial>
    }
  }
} 