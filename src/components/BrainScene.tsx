import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function BrainMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Create brain-like point cloud
  const { positions, linePositions } = useMemo(() => {
    const pts: number[] = [];
    const lines: number[] = [];
    const count = 600;
    const tempVec = new THREE.Vector3();

    // Generate points on a deformed sphere (brain-like shape)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      let r = 1.8;

      // Deform to look more like a brain
      r += Math.sin(phi * 3) * 0.15;
      r += Math.cos(theta * 2) * 0.1;
      r += Math.sin(theta * 5 + phi * 3) * 0.08;

      // Add slight vertical compression
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) * 0.85;
      const z = r * Math.sin(phi) * Math.sin(theta);

      // Add the central fissure
      const fissure = Math.abs(x) < 0.05 ? 0.9 : 1;

      pts.push(x * fissure, y, z * fissure);
    }

    // Create neural connections between nearby points
    for (let i = 0; i < count; i++) {
      tempVec.set(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
      for (let j = i + 1; j < count; j++) {
        const dx = pts[j * 3] - pts[i * 3];
        const dy = pts[j * 3 + 1] - pts[i * 3 + 1];
        const dz = pts[j * 3 + 2] - pts[i * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.6 && Math.random() > 0.7) {
          lines.push(
            pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2],
            pts[j * 3], pts[j * 3 + 1], pts[j * 3 + 2]
          );
        }
      }
    }

    return {
      positions: new Float32Array(pts),
      linePositions: new Float32Array(lines),
    };
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Brain points */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#4da6ff"
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Neural connections */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#2d8cf0"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Outer glow sphere */}
      <mesh>
        <sphereGeometry args={[2.1, 32, 32]} />
        <meshBasicMaterial
          color="#1a6dd4"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function FloatingParticles() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.02;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.01) * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={500}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#4da6ff"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function HoloCard({ position, label }: { position: [number, number, number]; label: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <planeGeometry args={[1.2, 0.5]} />
        <meshBasicMaterial
          color="#1a3a5c"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Card border glow */}
      <mesh position={position}>
        <planeGeometry args={[1.22, 0.52]} />
        <meshBasicMaterial
          color="#2d8cf0"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          wireframe
        />
      </mesh>
    </Float>
  );
}

export default function BrainScene() {
  return (
    <div className="h-[500px] w-full md:h-[600px] lg:h-[700px]">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#4da6ff" />

        <BrainMesh />
        <FloatingParticles />

        <HoloCard position={[-2.8, 1.5, 0.5]} label="AI Chat Support" />
        <HoloCard position={[2.8, 1.5, 0.5]} label="Mood Analytics" />
        <HoloCard position={[-2.8, -1.2, 0.5]} label="Counselor Booking" />
        <HoloCard position={[2.8, -1.2, 0.5]} label="Emotional Monitoring" />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
