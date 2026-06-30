import { RoundedBox } from '@react-three/drei'
import type { FurnitureItem, MaterialKind } from '@/lib/types'
import { pbrProps } from './materials'

/* ----------------------------------------------------------------------------
   Procedural furniture. Every model is built from primitives in LOCAL space,
   centered on (x:0, z:0), resting on the floor (y grows upward from 0).
   Sizes are read live from item.size so resizing is instant.
---------------------------------------------------------------------------- */

type Vec3 = [number, number, number]

function Part({
  size,
  pos,
  material,
  color,
  radius = 0.012,
}: {
  size: Vec3
  pos: Vec3
  material: MaterialKind
  color?: string
  radius?: number
}) {
  const r = Math.min(radius, Math.min(...size) / 2.2)
  return (
    <RoundedBox args={size} radius={r} smoothness={3} position={pos} castShadow receiveShadow>
      <meshPhysicalMaterial {...pbrProps(material, color)} />
    </RoundedBox>
  )
}

const num = (v: unknown, fallback: number) =>
  typeof v === 'number' ? v : fallback

export function FurnitureModel({ item }: { item: FurnitureItem }) {
  const { w, h, d } = item.size
  const mat = item.material
  const accent = item.accent ?? '#2b2c31'
  const p = item.params

  switch (item.kind) {
    /* ---------------------------------------------------------------- Bed */
    case 'bed': {
      const legH = num(p.legs, 0.12)
      const frameH = 0.26
      const mattressT = num(p.mattress, 0.3)
      const headH = num(p.headboard, 1.0)
      const baseY = legH + frameH / 2
      const mY = legH + frameH + mattressT / 2
      const legX = w / 2 - 0.08
      const legZ = d / 2 - 0.08
      return (
        <group>
          <Part size={[w, frameH, d]} pos={[0, baseY, 0]} material={mat} />
          <Part size={[w - 0.08, mattressT, d - 0.08]} pos={[0, mY, 0]} material="whiteMatte" color="#edeae2" radius={0.06} />
          {/* pillows */}
          <Part size={[w / 2 - 0.12, 0.12, 0.34]} pos={[-w / 4, mY + mattressT / 2 + 0.05, -d / 2 + 0.32]} material="whiteMatte" color="#f6f4ee" radius={0.06} />
          <Part size={[w / 2 - 0.12, 0.12, 0.34]} pos={[w / 4, mY + mattressT / 2 + 0.05, -d / 2 + 0.32]} material="whiteMatte" color="#f6f4ee" radius={0.06} />
          {/* duvet */}
          <Part size={[w - 0.04, 0.08, d * 0.62]} pos={[0, mY + mattressT / 2 + 0.02, d * 0.16]} material={mat} radius={0.05} />
          {/* headboard */}
          <Part size={[w, headH, 0.1]} pos={[0, legH + headH / 2, -d / 2 + 0.05]} material={mat} radius={0.04} />
          {/* legs */}
          {([[-legX, -legZ], [legX, -legZ], [-legX, legZ], [legX, legZ]] as const).map(([x, z], i) => (
            <Part key={i} size={[0.08, legH, 0.08]} pos={[x, legH / 2, z]} material="blackMatte" color={accent} />
          ))}
        </group>
      )
    }

    /* ----------------------------------------------------------- Wardrobe */
    case 'wardrobe': {
      const doors = Math.max(1, Math.round(num(p.doors, 3)))
      const plinth = num(p.plinth, 0.08)
      const bodyH = h - plinth
      const doorW = w / doors
      const handles = p.handles !== false
      return (
        <group>
          <Part size={[w, plinth, d]} pos={[0, plinth / 2, 0]} material="blackMatte" color={accent} />
          <Part size={[w, bodyH, d]} pos={[0, plinth + bodyH / 2, 0]} material={mat} />
          {Array.from({ length: doors }).map((_, i) => {
            const x = -w / 2 + doorW * (i + 0.5)
            return (
              <group key={i}>
                <Part size={[doorW - 0.02, bodyH - 0.04, 0.03]} pos={[x, plinth + bodyH / 2, d / 2 - 0.005]} material={mat} radius={0.006} />
                {handles && (
                  <Part
                    size={[0.025, 0.32, 0.025]}
                    pos={[x + (i % 2 === 0 ? doorW / 2 - 0.06 : -doorW / 2 + 0.06), plinth + bodyH / 2, d / 2 + 0.02]}
                    material="metal"
                    color={accent}
                    radius={0.012}
                  />
                )}
              </group>
            )
          })}
        </group>
      )
    }

    /* --------------------------------------------------------------- Sofa */
    case 'sofa':
    case 'armchair': {
      const legH = num(p.legs, 0.1)
      const seats = item.kind === 'sofa' ? Math.max(2, Math.round(num(p.seats, 3))) : 1
      const armW = 0.14
      const backH = h - legH
      const seatH = 0.22
      const seatY = legH + seatH / 2 + 0.02
      const innerW = w - armW * 2
      const cushW = innerW / seats
      return (
        <group>
          {/* base */}
          <Part size={[w, 0.18, d]} pos={[0, legH + 0.09, 0]} material={mat} radius={0.05} />
          {/* back */}
          <Part size={[w, backH * 0.8, 0.16]} pos={[0, legH + backH * 0.4, -d / 2 + 0.08]} material={mat} radius={0.06} />
          {/* arms */}
          <Part size={[armW, backH * 0.62, d]} pos={[-w / 2 + armW / 2, legH + backH * 0.31, 0]} material={mat} radius={0.06} />
          <Part size={[armW, backH * 0.62, d]} pos={[w / 2 - armW / 2, legH + backH * 0.31, 0]} material={mat} radius={0.06} />
          {/* seat cushions */}
          {Array.from({ length: seats }).map((_, i) => {
            const x = -innerW / 2 + cushW * (i + 0.5)
            return (
              <group key={i}>
                <Part size={[cushW - 0.03, 0.16, d - 0.22]} pos={[x, seatY + 0.06, 0.06]} material={mat} radius={0.06} />
                <Part size={[cushW - 0.03, backH * 0.5, 0.12]} pos={[x, legH + backH * 0.42, -d / 2 + 0.2]} material={mat} radius={0.06} />
              </group>
            )
          })}
          {/* legs */}
          {([[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1]] as const).map(([x, z], i) => (
            <Part key={i} size={[0.06, legH, 0.06]} pos={[x, legH / 2, z]} material="metal" color={accent} radius={0.02} />
          ))}
        </group>
      )
    }

    /* ------------------------------------------------- Desk / Tables */
    case 'desk':
    case 'table':
    case 'diningTable':
    case 'coffeeTable': {
      const topT = num(p.thickness, 0.05)
      const topY = h - topT / 2
      const legInset = 0.08
      const lx = w / 2 - legInset
      const lz = d / 2 - legInset
      const legMat: MaterialKind = item.kind === 'coffeeTable' ? mat : mat
      const drawers = Math.round(num(p.drawers, 0))
      return (
        <group>
          <Part size={[w, topT, d]} pos={[0, topY, 0]} material={mat} radius={0.02} />
          {item.kind === 'coffeeTable' && p.shelf !== false && (
            <Part size={[w - 0.12, 0.03, d - 0.12]} pos={[0, 0.12, 0]} material={mat} radius={0.015} />
          )}
          {/* drawers (desk) */}
          {drawers > 0 &&
            Array.from({ length: drawers }).map((_, i) => (
              <group key={i}>
                <Part size={[0.42, (h - topT) / drawers - 0.03, d - 0.12]} pos={[w / 2 - 0.27, (h - topT) * ((i + 0.5) / drawers), 0]} material={mat} radius={0.01} />
                <Part size={[0.12, 0.02, 0.02]} pos={[w / 2 - 0.27, (h - topT) * ((i + 0.5) / drawers), d / 2 - 0.02]} material="metal" color={accent} />
              </group>
            ))}
          {/* legs */}
          {([[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]] as const).map(([x, z], i) => (
            <Part key={i} size={[0.07, h - topT, 0.07]} pos={[x, (h - topT) / 2, z]} material={legMat} radius={0.02} />
          ))}
        </group>
      )
    }

    /* -------------------------------------------------------------- Chair */
    case 'chair': {
      const seatH = 0.45
      const seatT = 0.05
      const backH = num(p.back, 0.45)
      const lx = w / 2 - 0.05
      const lz = d / 2 - 0.05
      return (
        <group>
          <Part size={[w, seatT, d]} pos={[0, seatH, 0]} material={mat} radius={0.02} />
          <Part size={[w, backH, 0.05]} pos={[0, seatH + backH / 2, -d / 2 + 0.03]} material={mat} radius={0.02} />
          {([[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]] as const).map(([x, z], i) => (
            <Part key={i} size={[0.05, seatH, 0.05]} pos={[x, seatH / 2, z]} material={mat} radius={0.015} />
          ))}
        </group>
      )
    }

    /* --------------------------------------------------------- Bookshelf */
    case 'bookshelf': {
      const shelves = Math.max(2, Math.round(num(p.shelves, 5)))
      const t = 0.03
      const gap = (h - t) / shelves
      return (
        <group>
          {p.back !== false && <Part size={[w, h, t]} pos={[0, h / 2, -d / 2 + t / 2]} material={mat} />}
          <Part size={[t, h, d]} pos={[-w / 2 + t / 2, h / 2, 0]} material={mat} />
          <Part size={[t, h, d]} pos={[w / 2 - t / 2, h / 2, 0]} material={mat} />
          {Array.from({ length: shelves + 1 }).map((_, i) => (
            <Part key={i} size={[w, t, d]} pos={[0, i * gap + t / 2, 0]} material={mat} />
          ))}
          {/* a few books for life */}
          {Array.from({ length: shelves }).map((_, i) => (
            <group key={`b${i}`}>
              <Part size={[0.06, gap * 0.6, 0.18]} pos={[-w / 2 + 0.18, i * gap + t + gap * 0.3, 0]} material="blackMatte" color="#7c5cff" radius={0.004} />
              <Part size={[0.05, gap * 0.5, 0.18]} pos={[-w / 2 + 0.26, i * gap + t + gap * 0.25, 0]} material="blackMatte" color="#5b9dff" radius={0.004} />
              <Part size={[0.16, gap * 0.45, 0.16]} pos={[w / 2 - 0.22, i * gap + t + gap * 0.22, 0]} material="whiteMatte" color="#d8cdb8" radius={0.004} />
            </group>
          ))}
        </group>
      )
    }

    /* ----------------------------------------------------------- TV unit */
    case 'tvUnit': {
      const drawers = Math.max(1, Math.round(num(p.drawers, 2)))
      const dw = w / drawers
      return (
        <group>
          <Part size={[w, h, d]} pos={[0, h / 2, 0]} material={mat} />
          {Array.from({ length: drawers }).map((_, i) => {
            const x = -w / 2 + dw * (i + 0.5)
            return (
              <group key={i}>
                <Part size={[dw - 0.03, h - 0.08, 0.03]} pos={[x, h / 2, d / 2 - 0.005]} material={mat} radius={0.01} />
                <Part size={[0.16, 0.02, 0.02]} pos={[x, h / 2, d / 2 + 0.02]} material="metal" color={accent} />
              </group>
            )
          })}
          {p.led !== false && (
            <mesh position={[0, 0.02, d / 2 - 0.02]}>
              <boxGeometry args={[w * 0.9, 0.015, 0.01]} />
              <meshStandardMaterial color={item.accent ?? '#7c5cff'} emissive={item.accent ?? '#7c5cff'} emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
          )}
        </group>
      )
    }

    /* ----------------------------------------- Nightstand / Dresser / Cabinet */
    case 'nightstand':
    case 'dresser': {
      const drawers = Math.max(1, Math.round(num(p.drawers, item.kind === 'dresser' ? 6 : 2)))
      const rows = item.kind === 'dresser' ? Math.ceil(drawers / 2) : drawers
      const cols = item.kind === 'dresser' ? 2 : 1
      const dh = h / rows
      const dw = w / cols
      return (
        <group>
          <Part size={[w, h, d]} pos={[0, h / 2, 0]} material={mat} />
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const x = -w / 2 + dw * (c + 0.5)
              const y = dh * (r + 0.5)
              return (
                <group key={`${r}-${c}`}>
                  <Part size={[dw - 0.04, dh - 0.04, 0.03]} pos={[x, y, d / 2 - 0.005]} material={mat} radius={0.01} />
                  <Part size={[0.12, 0.02, 0.025]} pos={[x, y, d / 2 + 0.02]} material="metal" color={accent} />
                </group>
              )
            }),
          )}
        </group>
      )
    }

    case 'cabinet': {
      const doors = Math.max(1, Math.round(num(p.doors, 2)))
      const dw = w / doors
      return (
        <group>
          <Part size={[w, h, d]} pos={[0, h / 2, 0]} material={mat} />
          {Array.from({ length: doors }).map((_, i) => {
            const x = -w / 2 + dw * (i + 0.5)
            return (
              <group key={i}>
                <Part size={[dw - 0.03, h - 0.06, 0.03]} pos={[x, h / 2, d / 2 - 0.005]} material={mat} radius={0.01} />
                <Part size={[0.025, 0.18, 0.025]} pos={[x + (i % 2 === 0 ? dw / 2 - 0.05 : -dw / 2 + 0.05), h / 2, d / 2 + 0.02]} material="metal" color={accent} radius={0.01} />
              </group>
            )
          })}
        </group>
      )
    }

    /* ----------------------------------------------------- Dressing table */
    case 'dressingTable': {
      const tableH = Math.min(0.78, h * 0.52)
      const topT = 0.04
      const drawers = Math.max(1, Math.round(num(p.drawers, 3)))
      const blockW = w * 0.94
      const dw = blockW / drawers
      const legX = w / 2 - 0.05
      const legZ = d / 2 - 0.05
      const mirrorH = Math.max(0.3, h - tableH - 0.02)
      return (
        <group>
          {/* table top */}
          <Part size={[w, topT, d]} pos={[0, tableH, 0]} material={mat} radius={0.012} />
          {/* drawer block */}
          <Part size={[blockW, 0.18, d * 0.86]} pos={[0, tableH - 0.13, 0]} material={mat} radius={0.01} />
          {Array.from({ length: drawers }).map((_, i) => {
            const x = -blockW / 2 + dw * (i + 0.5)
            return (
              <group key={i}>
                <Part size={[dw - 0.02, 0.14, 0.03]} pos={[x, tableH - 0.13, (d * 0.86) / 2]} material={mat} radius={0.008} />
                <Part size={[0.07, 0.02, 0.02]} pos={[x, tableH - 0.13, (d * 0.86) / 2 + 0.02]} material="metal" color={accent} />
              </group>
            )
          })}
          {/* legs */}
          {([[-legX, -legZ], [legX, -legZ], [-legX, legZ], [legX, legZ]] as const).map(([x, z], i) => (
            <Part key={i} size={[0.05, tableH, 0.05]} pos={[x, tableH / 2, z]} material={mat} radius={0.015} />
          ))}
          {/* mirror */}
          {p.mirror !== false && (
            <>
              <Part size={[w * 0.74, mirrorH, 0.04]} pos={[0, tableH + mirrorH / 2, -d / 2 + 0.05]} material={mat} radius={0.03} />
              <mesh position={[0, tableH + mirrorH / 2, -d / 2 + 0.075]}>
                <planeGeometry args={[w * 0.74 - 0.08, mirrorH - 0.08]} />
                <meshStandardMaterial color="#d4e8f0" metalness={1} roughness={0.06} envMapIntensity={1.5} />
              </mesh>
            </>
          )}
        </group>
      )
    }

    /* ---------------------------------------------------------------- Rug */
    case 'rug':
      return (
        <mesh position={[0, 0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshPhysicalMaterial {...pbrProps(mat)} side={2} />
        </mesh>
      )

    /* -------------------------------------------------------------- Plant */
    case 'plant': {
      const potH = h * 0.28
      return (
        <group>
          <mesh position={[0, potH / 2, 0]} castShadow>
            <cylinderGeometry args={[w * 0.32, w * 0.24, potH, 24]} />
            <meshPhysicalMaterial {...pbrProps(mat)} />
          </mesh>
          {[0.55, 0.72, 0.88].map((f, i) => (
            <mesh key={i} position={[(i - 1) * 0.08, potH + (h - potH) * f, (i - 1) * 0.05]} castShadow>
              <icosahedronGeometry args={[(h - potH) * 0.34 * (1 - i * 0.12), 1]} />
              <meshStandardMaterial color={item.accent ?? '#3f7d4f'} roughness={0.85} flatShading />
            </mesh>
          ))}
        </group>
      )
    }

    /* --------------------------------------------------------------- Lamp */
    case 'lamp':
      return (
        <group>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[w * 0.3, w * 0.34, 0.04, 24]} />
            <meshPhysicalMaterial {...pbrProps('metal', accent)} />
          </mesh>
          <mesh position={[0, h * 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, h * 0.92, 12]} />
            <meshPhysicalMaterial {...pbrProps('metal', accent)} />
          </mesh>
          <mesh position={[0, h - 0.16, 0]} castShadow>
            <coneGeometry args={[w * 0.34, 0.28, 24, 1, true]} />
            <meshStandardMaterial color="#f3ead4" roughness={0.6} side={2} emissive="#ffd9a0" emissiveIntensity={0.5} />
          </mesh>
          <pointLight position={[0, h - 0.2, 0]} intensity={6} distance={4} color="#ffd9a0" castShadow={false} />
        </group>
      )

    default:
      return null
  }
}
