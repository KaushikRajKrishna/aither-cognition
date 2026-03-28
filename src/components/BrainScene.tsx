import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  MeshTransmissionMaterial,
  Float,
} from "@react-three/drei";
import * as THREE from "three";

// ── Brain geometry (cerebrum + cerebellum as one group) ───────────────────────
function buildBrainGeo() {
  // Elongated ellipsoid base — brains are wider than tall
  const geo = new THREE.SphereGeometry(1, 160, 160);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Stretch into brain-like ellipsoid
    x *= 1.45;
    y *= 1.0;
    z *= 1.15;

    const r = Math.sqrt(x * x + y * y + z * z) || 1e-6;
    const nx = x / r, ny = y / r, nz = z / r;
    const theta = Math.atan2(z, x);
    const phi   = Math.acos(Math.min(1, Math.max(-1, y / r)));

    // ── Gyri & sulci: many frequency layers ──────────────────────────────
    let d = 0;
    d += Math.sin(phi * 9  + theta * 7)  * 0.09;
    d += Math.sin(phi * 6  - theta * 9)  * 0.07;
    d += Math.sin(phi * 14 + theta * 4)  * 0.05;
    d += Math.cos(phi * 7  - theta * 11) * 0.04;
    d += Math.sin(phi * 4  + theta * 13) * 0.035;
    d += Math.cos(phi * 18 - theta * 5)  * 0.025;
    d += Math.sin(phi * 22 + theta * 8)  * 0.018;

    // ── Central longitudinal fissure ──────────────────────────────────────
    // Strong groove along x ≈ 0 plane
    const fissure = Math.exp(-x * x * 28) * 0.28;
    d -= fissure;

    // ── Flatten at back-bottom (occipital/brainstem area) ─────────────────
    const stem = Math.max(0, -y - 0.85) * 0.55;

    pos.setXYZ(i,
      x + nx * d,
      y + ny * d - stem * Math.abs(ny),
      z + nz * d,
    );
  }

  geo.computeVertexNormals();
  return geo;
}

function buildCerebellumGeo() {
  const geo = new THREE.SphereGeometry(0.48, 96, 96);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.sqrt(x * x + y * y + z * z) || 1e-6;
    const nx = x / r, ny = y / r, nz = z / r;
    const theta = Math.atan2(z, x);
    const phi   = Math.acos(Math.min(1, Math.max(-1, y / r)));

    let d = 0;
    d += Math.sin(phi * 16 + theta * 11) * 0.04;
    d += Math.cos(phi * 11 - theta *  8) * 0.03;
    d += Math.sin(phi *  8 + theta * 15) * 0.02;

    pos.setXYZ(i, x + nx * d, y + ny * d, z + nz * d);
  }

  geo.computeVertexNormals();
  return geo;
}

// ── Synapse particles on brain surface ────────────────────────────────────────
function buildSynapses() {
  const count = 700;
  const pts: number[] = [];
  const lines: number[] = [];
  const vecs: THREE.Vector3[] = [];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);

    let r = 1.0;
    r += Math.sin(phi * 9 + theta * 7)  * 0.09;
    r += Math.sin(phi * 6 - theta * 9)  * 0.07;
    r += Math.sin(phi * 14 + theta * 4) * 0.05;
    const fissure = Math.exp(-Math.pow(Math.cos(theta) * Math.sin(phi), 2) * 30) * 0.22;
    r -= fissure;

    const x = r * Math.sin(phi) * Math.cos(theta) * 1.48;
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta) * 1.18;

    pts.push(x, y, z);
    vecs.push(new THREE.Vector3(x, y, z));
  }

  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      if (vecs[i].distanceTo(vecs[j]) < 0.38 && Math.random() > 0.75) {
        lines.push(pts[i*3], pts[i*3+1], pts[i*3+2], pts[j*3], pts[j*3+1], pts[j*3+2]);
      }
    }
  }

  return { pointPos: new Float32Array(pts), linePos: new Float32Array(lines) };
}

// ── Main brain mesh component ─────────────────────────────────────────────────
function BrainMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef  = useRef<THREE.PointLight>(null);

  const brainGeo  = useMemo(buildBrainGeo,       []);
  const cblmGeo   = useMemo(buildCerebellumGeo,  []);
  const { pointPos, linePos } = useMemo(buildSynapses, []);

  // Brain material: purple-pink glassy look like the reference image
  const brainMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color:            new THREE.Color(0x8855cc),
    emissive:         new THREE.Color(0x220066),
    emissiveIntensity: 0.5,
    metalness:        0.15,
    roughness:        0.35,
    transparent:      true,
    opacity:          0.82,
    envMapIntensity:  1.8,
  }), []);

  // Bright cyan rim/inner glow on back face
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    color:    new THREE.Color(0x00ddff),
    transparent: true,
    opacity:  0.18,
    side:     THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) groupRef.current.rotation.y = t * 0.22;
    if (glowRef.current) {
      glowRef.current.intensity = 2.5 + Math.sin(t * 1.4) * 0.6;
    }
  });

  return (
    <group ref={groupRef}>

      {/* Pulsing inner point light — the "glow" coming from inside the brain */}
      <pointLight ref={glowRef} position={[0, 0.1, 0]} color="#00ccff" intensity={2.5} distance={3} />

      {/* ── Cerebrum ─────────────────────────────────────────────── */}
      <mesh geometry={brainGeo} material={brainMat} />
      <mesh geometry={brainGeo} material={glowMat}  scale={1.012} />

      {/* Strong neon edge lines along gyri */}
      <mesh geometry={brainGeo}>
        <meshBasicMaterial
          color="#aa55ff"
          transparent
          opacity={0.12}
          wireframe
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Cerebellum ───────────────────────────────────────────── */}
      <mesh geometry={cblmGeo} material={brainMat} position={[0, -1.08, -0.6]} scale={[1.1, 0.88, 1.0]} />
      <mesh geometry={cblmGeo} material={glowMat}  position={[0, -1.08, -0.6]} scale={[1.12, 0.90, 1.02]} />

      {/* ── Neural synapse particles ─────────────────────────────── */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={pointPos.length / 3} array={pointPos} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.028} color="#66eeff" transparent opacity={0.9} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      {/* ── Neural connections ───────────────────────────────────── */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={linePos.length / 3} array={linePos} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#44aaff" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

    </group>
  );
}

// ── Glass dome enclosure (the crystal ball from the reference image) ───────────
function GlassDome() {
  return (
    <Float speed={0.6} floatIntensity={0.08} rotationIntensity={0}>
      {/* Outer glass sphere */}
      <mesh>
        <sphereGeometry args={[2.1, 64, 64]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={0.3}
          samples={6}
          thickness={0.4}
          chromaticAberration={0.03}
          anisotropy={0.1}
          distortion={0.05}
          distortionScale={0.2}
          temporalDistortion={0.02}
          roughness={0.0}
          color="#aaddff"
          transmissionSampler
        />
      </mesh>

      {/* Inner light scatter lines — cyan streaks like in the reference image */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 1.95;
        const z = Math.sin(angle) * 1.95;
        return (
          <mesh key={i} position={[x * 0.7, 0.5, z * 0.7]} rotation={[Math.random() * 0.5, angle, Math.random() * 0.3]}>
            <planeGeometry args={[0.01, 3.2]} />
            <meshBasicMaterial color="#00ddff" transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        );
      })}

      {/* Dome equator ring glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.1, 0.025, 8, 128]} />
        <meshBasicMaterial color="#00ccff" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </Float>
  );
}

// ── Base platform (glass pedestal like the reference image) ───────────────────
function BasePlatform() {
  return (
    <group position={[0, -2.42, 0]}>
      {/* Disc */}
      <mesh>
        <cylinderGeometry args={[1.9, 2.1, 0.18, 64]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.2}
          roughness={0.05}
          color="#aaddff"
          chromaticAberration={0.02}
        />
      </mesh>
      {/* Rim glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <torusGeometry args={[2.0, 0.018, 8, 96]} />
        <meshBasicMaterial color="#00ddff" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Under-glow */}
      <pointLight position={[0, -0.3, 0]} color="#00ccff" intensity={1.2} distance={3} />
    </group>
  );
}

// ── Ambient background particles ──────────────────────────────────────────────
function BackgroundParticles() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(350 * 3);
    for (let i = 0; i < 350; i++) {
      a[i*3]   = (Math.random() - 0.5) * 12;
      a[i*3+1] = (Math.random() - 0.5) * 12;
      a[i*3+2] = (Math.random() - 0.5) * 12;
    }
    return a;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.018;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={350} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.016} color="#44aaff" transparent opacity={0.4} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

// ── Scene root ────────────────────────────────────────────────────────────────
export default function BrainScene() {
  return (
    <div className="h-[500px] w-full md:h-[600px] lg:h-[700px]">
      <Canvas
        camera={{ position: [0, 0.4, 6.2], fov: 44 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{ background: "transparent" }}
      >
        {/* Lighting to match reference image: strong cyan from above + purple fill */}
        <ambientLight intensity={0.25} color="#112244" />
        <pointLight position={[0,  5,  2]}  intensity={4.0} color="#00ccff" />
        <pointLight position={[-3, 2,  2]}  intensity={1.5} color="#0088ff" />
        <pointLight position={[3,  2, -2]}  intensity={1.5} color="#0066cc" />
        <pointLight position={[0, -4,  0]}  intensity={1.0} color="#004488" />
        <spotLight
          position={[0, 6, 0]}
          angle={0.4}
          penumbra={0.8}
          intensity={3.0}
          color="#00eeff"
          castShadow={false}
        />

        {/* HDR environment for glass reflections */}
        <Environment preset="night" />

        <GlassDome />
        <BrainMesh />
        <BasePlatform />
        <BackgroundParticles />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
