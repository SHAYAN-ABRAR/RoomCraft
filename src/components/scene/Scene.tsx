import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Grid,
  Lightformer,
  OrbitControls,
} from '@react-three/drei'
import * as THREE from 'three'
import { useDesignStore } from '@/store/useDesignStore'
import { Room3D } from './Room3D'
import { Furniture3D } from './Furniture3D'
import type { ViewMode } from '@/lib/types'

type OrbitLike = {
  target: THREE.Vector3
  enableRotate: boolean
  update: () => void
}

function CameraController() {
  const view = useDesignStore((s) => s.view)
  const room = useDesignStore((s) => s.room)
  const { camera, controls } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera
    controls: OrbitLike | null
  }

  const tween = useRef({
    active: false,
    t: 0,
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
    fromT: new THREE.Vector3(),
    toT: new THREE.Vector3(),
  })

  useEffect(() => {
    if (!room || !controls) return
    const cx = room.width / 2
    const cz = room.length / 2
    const maxDim = Math.max(room.width, room.length)
    const goals: Record<ViewMode, { pos: THREE.Vector3; target: THREE.Vector3; rotate: boolean }> = {
      orbit: {
        pos: new THREE.Vector3(cx + maxDim * 0.85, room.height * 1.7, cz + maxDim * 1.05),
        target: new THREE.Vector3(cx, room.height * 0.35, cz),
        rotate: true,
      },
      top: {
        pos: new THREE.Vector3(cx, maxDim * 2.1, cz + 0.001),
        target: new THREE.Vector3(cx, 0, cz),
        rotate: false,
      },
      plan2d: {
        pos: new THREE.Vector3(cx, maxDim * 2.4, cz + 0.001),
        target: new THREE.Vector3(cx, 0, cz),
        rotate: false,
      },
      firstPerson: {
        pos: new THREE.Vector3(cx, 1.6, cz + room.length * 0.3),
        target: new THREE.Vector3(cx, 1.5, cz - room.length * 0.25),
        rotate: true,
      },
    }
    const goal = goals[view]
    const t = tween.current
    t.from.copy(camera.position)
    t.fromT.copy(controls.target)
    t.to.copy(goal.pos)
    t.toT.copy(goal.target)
    t.t = 0
    t.active = true
    controls.enableRotate = goal.rotate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, room?.width, room?.length, room?.height])

  useFrame((_, dt) => {
    const t = tween.current
    if (!t.active || !controls) return
    t.t = Math.min(1, t.t + dt / 0.85)
    const e = 1 - Math.pow(1 - t.t, 3) // easeOutCubic
    camera.position.lerpVectors(t.from, t.to, e)
    controls.target.lerpVectors(t.fromT, t.toT, e)
    controls.update()
    if (t.t >= 1) t.active = false
  })

  return null
}

function SceneContents() {
  const room = useDesignStore((s) => s.room)
  const furniture = useDesignStore((s) => s.furniture)
  const view = useDesignStore((s) => s.view)
  if (!room) return null

  const cx = room.width / 2
  const cz = room.length / 2
  const maxDim = Math.max(room.width, room.length)

  return (
    <>
      <color attach="background" args={['#07070b']} />

      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.4} color="#dfe7ff" groundColor="#1a1712" />
      <directionalLight
        position={[cx + maxDim, room.height * 3, cz - maxDim * 0.4]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-camera-near={0.5}
        shadow-camera-far={maxDim * 6}
        shadow-camera-left={-maxDim}
        shadow-camera-right={maxDim}
        shadow-camera-top={maxDim}
        shadow-camera-bottom={-maxDim}
      />

      <Suspense fallback={null}>
        <Environment resolution={256}>
          <group rotation={[Math.PI / 3, 0, 0]}>
            <Lightformer intensity={2.2} form="rect" position={[0, 6, 0]} scale={[12, 12, 1]} color="#ffffff" />
            <Lightformer intensity={1.1} form="rect" position={[5, 2, 3]} scale={[6, 6, 1]} color="#cfe0ff" />
            <Lightformer intensity={1.0} form="rect" position={[-5, 2, -3]} scale={[6, 6, 1]} color="#ffe9cf" />
          </group>
        </Environment>
      </Suspense>

      <Room3D room={room} />
      {furniture.map((item) => (
        <Furniture3D key={item.id} item={item} />
      ))}

      {view !== 'firstPerson' && (
        <ContactShadows
          position={[cx, 0.002, cz]}
          scale={maxDim * 2.4}
          resolution={1024}
          blur={2.6}
          opacity={0.55}
          far={room.height}
        />
      )}

      <Grid
        position={[cx, -0.03, cz]}
        args={[maxDim * 6, maxDim * 6]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#23232e"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#3a3a4a"
        fadeDistance={maxDim * 5}
        fadeStrength={1.5}
        infiniteGrid={false}
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={1.5}
        maxDistance={maxDim * 4}
        maxPolarAngle={Math.PI / 2 - 0.02}
        target={[cx, room.height * 0.35, cz]}
      />
      <CameraController />
    </>
  )
}

export function Scene() {
  const select = useDesignStore((s) => s.select)
  const room = useDesignStore((s) => s.room)
  const maxDim = room ? Math.max(room.width, room.length) : 5

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ position: [maxDim, maxDim * 1.4, maxDim * 1.5], fov: 45, near: 0.1, far: 1000 }}
      onPointerMissed={() => select(null)}
    >
      <SceneContents />
    </Canvas>
  )
}
