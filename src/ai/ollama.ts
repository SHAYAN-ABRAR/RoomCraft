import type {
  DesignStyle,
  FurnitureKind,
  MaterialKind,
  Unit,
} from '@/lib/types'
import { CATALOG } from '@/data/catalog'
import { STYLE_PRESETS } from '@/data/styles'
import { ALL_MATERIALS, MATERIALS } from '@/data/materials'
import { parseDimension } from '@/lib/units'
import { clamp } from '@/lib/utils'
import type { AIAction, AIResult, FurnitureParams } from './types'

/** Length-unit token used inside dimension regexes (longest-first). */
const UNIT_RE = `(?:mm|cm|inches|inch|in|feet|foot|ft|m|'|")`

/** Find a dimension (in meters) tied to any of `keywords`, in either word order. */
function dimByKeyword(text: string, keywords: string[], unit: Unit): number | null {
  const kw = keywords.join('|')
  const num = `(\\d+(?:\\.\\d+)?\\s*${UNIT_RE})`
  // "64 inch (in/of) length"
  let m = text.match(new RegExp(`${num}\\s*(?:in\\s+|of\\s+)?(?:${kw})\\b`))
  if (m) return parseDimension(m[1].trim(), unit)
  // "length (of/is/to/:) 64 inch"
  m = text.match(new RegExp(`(?:${kw})\\b\\s*(?:of\\s+|is\\s+|to\\s+|=|:)?\\s*${num}`))
  if (m) return parseDimension(m[1].trim(), unit)
  return null
}

/** Parse "A x B [unit]" footprint syntax, e.g. "24 x 24 inch", "3m x 4m", "10' x 12'". */
function parseDimsPair(text: string, unit: Unit): { width: number; depth: number } | null {
  const m = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${UNIT_RE})?\\s*(?:x|×|by)\\s*(\\d+(?:\\.\\d+)?)\\s*(${UNIT_RE})?`))
  if (!m) return null
  const wUnit = m[2] || m[4] || ''
  const dUnit = m[4] || m[2] || ''
  const w = parseDimension(`${m[1]} ${wUnit}`.trim(), unit)
  const d = parseDimension(`${m[3]} ${dUnit}`.trim(), unit)
  return w && d ? { width: w, depth: d } : null
}

/** Parse component counts: "4 door", "6 drawers", "5 shelves", "3 seater". */
function parseComponents(text: string): FurnitureParams {
  const out: FurnitureParams = {}
  const grab = (re: RegExp) => {
    const m = text.match(re)
    return m ? clamp(parseInt(m[1]), 1, 10) : null
  }
  const doors = grab(/(\d+)\s*[- ]?\s*doors?\b/)
  const drawers = grab(/(\d+)\s*[- ]?\s*drawers?\b/)
  const shelves = grab(/(\d+)\s*[- ]?\s*shel(?:f|ves)\b/)
  const seats = grab(/(\d+)\s*[- ]?\s*(?:seats?|seater)\b/)
  if (doors !== null) out.doors = doors
  if (drawers !== null) out.drawers = drawers
  if (shelves !== null) out.shelves = shelves
  if (seats !== null) out.seats = seats
  return out
}

/** Local Ollama endpoint + model. Configurable here. */
export const OLLAMA_URL = 'http://localhost:11434'
export const OLLAMA_MODEL = 'gemma4:31b-cloud'

const KINDS = CATALOG.map((c) => c.kind)
const STYLE_IDS = STYLE_PRESETS.map((s) => s.id)

/* ----------------------------------------------------- text → vocabulary */
const KIND_SYNONYMS: Record<string, FurnitureKind> = {
  bed: 'bed', 'king bed': 'bed', mattress: 'bed',
  wardrobe: 'wardrobe', closet: 'wardrobe', almirah: 'wardrobe',
  sofa: 'sofa', couch: 'sofa', settee: 'sofa',
  armchair: 'armchair', 'accent chair': 'armchair', recliner: 'armchair',
  desk: 'desk', workstation: 'desk', 'office desk': 'desk',
  'dining table': 'diningTable', 'dinner table': 'diningTable',
  'coffee table': 'coffeeTable',
  table: 'diningTable',
  chair: 'chair', 'dining chair': 'chair',
  bookshelf: 'bookshelf', bookcase: 'bookshelf', shelf: 'bookshelf', shelves: 'bookshelf',
  tv: 'tvUnit', television: 'tvUnit', 'tv unit': 'tvUnit', 'tv cabinet': 'tvUnit', 'tv stand': 'tvUnit', 'media console': 'tvUnit',
  nightstand: 'nightstand', 'bedside table': 'nightstand', 'side table': 'nightstand',
  dresser: 'dresser', 'chest of drawers': 'dresser',
  'dressing table': 'dressingTable', 'dressing-table': 'dressingTable', vanity: 'dressingTable', 'vanity table': 'dressingTable', 'makeup table': 'dressingTable', 'make up table': 'dressingTable',
  cabinet: 'cabinet', cupboard: 'cabinet',
  rug: 'rug', carpet: 'rug',
  plant: 'plant', tree: 'plant', greenery: 'plant',
  lamp: 'lamp', light: 'lamp', 'floor lamp': 'lamp',
}

const MATERIAL_SYNONYMS: Record<string, MaterialKind> = {
  oak: 'oak', wood: 'oak', wooden: 'oak',
  walnut: 'walnut', 'dark wood': 'walnut',
  white: 'whiteMatte', 'white matte': 'whiteMatte',
  gloss: 'whiteGloss', glossy: 'whiteGloss', 'white gloss': 'whiteGloss',
  black: 'blackMatte', dark: 'blackMatte',
  grey: 'fabricGrey', gray: 'fabricGrey', 'grey fabric': 'fabricGrey',
  beige: 'fabricBeige', cream: 'fabricBeige', linen: 'fabricBeige',
  leather: 'leatherBrown', brown: 'leatherBrown',
  metal: 'metal', steel: 'metal', chrome: 'metal',
  marble: 'marble', stone: 'marble',
  glass: 'glass',
}

function findKind(text: string): FurnitureKind | null {
  const t = text.toLowerCase()
  // prefer multi-word matches first
  const keys = Object.keys(KIND_SYNONYMS).sort((a, b) => b.length - a.length)
  for (const k of keys) if (t.includes(k)) return KIND_SYNONYMS[k]
  return null
}

function findMaterial(text: string): MaterialKind | null {
  const t = text.toLowerCase()
  const keys = Object.keys(MATERIAL_SYNONYMS).sort((a, b) => b.length - a.length)
  for (const k of keys) if (t.includes(k)) return MATERIAL_SYNONYMS[k]
  return null
}

function findStyle(text: string): DesignStyle | null {
  const t = text.toLowerCase()
  for (const s of STYLE_IDS) if (t.includes(s)) return s
  if (t.includes('scandi')) return 'scandinavian'
  return null
}

/* ----------------------------------------------------- local rule parser */
export function localParse(text: string, unit: Unit): AIResult {
  const t = text.toLowerCase().trim()
  const actions: AIAction[] = []

  // Intent to create a NEW item (vs. editing an existing one). Distinguishes
  // "make a wardrobe" (add) from "make the table wider" (resize).
  const addIntent =
    /\b(add|create|generate|build|design|give me)\b/.test(t) ||
    /\bi\s+(want|need)\b/.test(t) ||
    /\b(make|put|place)\s+(a|an|some|another|\d|two|three|four)\b/.test(t)

  // view changes
  if (/\b(top|bird'?s eye|plan|overhead)\b/.test(t)) actions.push({ type: 'view', mode: t.includes('2d') ? 'plan2d' : 'top' })
  if (/\b(walk ?through|first person|inside)\b/.test(t)) actions.push({ type: 'view', mode: 'firstPerson' })

  // style
  const style = findStyle(t)
  if (style && /(style|make|turn|theme|look|vibe|design)/.test(t)) actions.push({ type: 'style', style })

  // global material change ("change all to walnut", "make everything white")
  const mat = findMaterial(t)
  if (mat && /(all|everything|every)/.test(t)) actions.push({ type: 'material', target: 'all', material: mat })

  // clear
  if (/\b(clear|empty|remove (all|everything)|reset furniture)\b/.test(t)) actions.push({ type: 'clear' })

  // remove specific
  if (/\b(remove|delete|get rid of)\b/.test(t) && !/(all|everything)/.test(t)) {
    const k = findKind(t)
    actions.push({ type: 'remove', target: k ?? 'selected' })
  }

  // move
  if (/\b(move|put|place|shift|push)\b/.test(t)) {
    const k = findKind(t)
    const to =
      /(left|west)/.test(t) ? 'left' :
      /(right|east)/.test(t) ? 'right' :
      /(back|north|top)/.test(t) ? 'back' :
      /(front|south|bottom)/.test(t) ? 'front' :
      /(cent(er|re)|middle)/.test(t) ? 'center' : ''
    if (to && (k || /\bit\b|selected/.test(t))) actions.push({ type: 'move', target: k ?? 'selected', to })
  }

  // resize an existing item ("increase table width to 6 feet", "make the desk 1.5m wide")
  if (!addIntent && /(increase|resize|widen|grow|shrink|expand|set|change|make|adjust|reduce)/.test(t) && /(width|height|depth|wide|tall|deep|long|size)/.test(t)) {
    const k = findKind(t)
    const width = dimByKeyword(t, ['width', 'wide', 'length', 'long'], unit)
    const depth = dimByKeyword(t, ['depth', 'deep'], unit)
    const height = dimByKeyword(t, ['height', 'tall', 'high'], unit)
    if (width !== null || depth !== null || height !== null) {
      const a: AIAction = { type: 'resize', target: k ?? 'selected' }
      if (width !== null) a.width = width
      if (depth !== null) a.depth = depth
      if (height !== null) a.height = height
      actions.push(a)
    }
  }

  // material on a specific kind ("change the sofa to leather")
  if (mat && !/(all|everything)/.test(t) && /(change|make|set|turn)/.test(t)) {
    const k = findKind(t)
    if (k) actions.push({ type: 'material', target: k, material: mat })
  }

  // add ("add a walnut wardrobe", "generate a 4-door wardrobe 64in wide", "create 4 chairs")
  if (addIntent && actions.length === 0) {
    const k = findKind(t)
    if (k) {
      const components = parseComponents(t)

      // Dimensions: prefer keyword association, then "A x B" syntax, then positional.
      let width = dimByKeyword(t, ['width', 'wide', 'length', 'long'], unit)
      let depth = dimByKeyword(t, ['depth', 'deep'], unit)
      let height = dimByKeyword(t, ['height', 'tall', 'high'], unit)
      if (width === null && depth === null) {
        const pair = parseDimsPair(t, unit)
        if (pair) {
          width = pair.width
          depth = pair.depth
        }
      }
      if (width === null && depth === null && height === null) {
        const dims = t.match(new RegExp(`\\d+(?:\\.\\d+)?\\s*${UNIT_RE}`, 'g')) ?? []
        const parsed = dims.map((d) => parseDimension(d, unit)).filter((x): x is number => !!x)
        width = parsed[0] ?? null
        depth = parsed[1] ?? null
        height = parsed[2] ?? null
      }

      // Quantity: ignore numbers tied to dimensions or components (e.g. "4 door", "24 x 24 in").
      const cleaned = t
        .replace(new RegExp(`\\d+(?:\\.\\d+)?\\s*(?:${UNIT_RE})?\\s*(?:x|×|by)\\s*\\d+(?:\\.\\d+)?\\s*(?:${UNIT_RE})?`, 'g'), ' ')
        .replace(new RegExp(`\\d+(?:\\.\\d+)?\\s*${UNIT_RE}`, 'g'), ' ')
        .replace(/\d+\s*[- ]?\s*(?:doors?|drawers?|shel(?:f|ves)|seats?|seater)\b/g, ' ')
      const countMatch = cleaned.match(/\b(\d+)\b/)
      const count = countMatch ? clamp(parseInt(countMatch[1]), 1, 8) : 1

      const a: AIAction = { type: 'add', item: k, count }
      if (mat) a.material = mat
      if (width !== null) a.width = width
      if (depth !== null) a.depth = depth
      if (height !== null) a.height = height
      if (Object.keys(components).length) a.params = components
      actions.push(a)
    }
  }

  // configure components of an existing item ("make it 4 doors", "6 drawers on the dresser")
  if (actions.length === 0) {
    const comp = parseComponents(t)
    if (Object.keys(comp).length) {
      const k = findKind(t)
      actions.push({ type: 'configure', target: k ?? 'selected', params: comp })
    }
  }

  // "luxury interior" / "furnish the room" -> add a starter set in a style
  if (actions.length === 0 && /(furnish|design (the|my) room|luxury interior|fill the room|complete (the )?room|set up)/.test(t)) {
    const s = findStyle(t) ?? 'modern'
    actions.push({ type: 'style', style: s })
    ;(['bed', 'wardrobe', 'nightstand', 'rug', 'plant'] as FurnitureKind[]).forEach((item) => actions.push({ type: 'add', item }))
  }

  const reply = actions.length
    ? describeActions(actions)
    : "I can add or generate furniture, move and resize pieces, restyle the room, change materials, and switch views. Try: \"Generate a walnut wardrobe 2m wide\" or \"Make the room Scandinavian\"."

  return { reply, actions, fromModel: false }
}

function describeActions(actions: AIAction[]): string {
  const compStr = (p?: FurnitureParams) => {
    if (!p) return ''
    const bits: string[] = []
    if (typeof p.doors === 'number') bits.push(`${p.doors}-door`)
    if (typeof p.drawers === 'number') bits.push(`${p.drawers}-drawer`)
    if (typeof p.shelves === 'number') bits.push(`${p.shelves}-shelf`)
    if (typeof p.seats === 'number') bits.push(`${p.seats}-seat`)
    return bits.length ? bits.join(' ') + ' ' : ''
  }
  const parts = actions.map((a) => {
    switch (a.type) {
      case 'add': return `added ${a.count && a.count > 1 ? a.count + '× ' : 'a '}${compStr(a.params)}${a.material ? a.material + ' ' : ''}${labelFor(a.item)}`
      case 'remove': return `removed the ${a.target === 'selected' ? 'selected item' : labelFor(a.target)}`
      case 'move': return `moved the ${a.target} to the ${a.to}`
      case 'resize': return `resized the ${a.target}`
      case 'configure': return `updated the ${a.target === 'selected' ? 'selected item' : labelFor(a.target)} → ${compStr(a.params).trim() || 'config'}`
      case 'material': return `changed ${a.target === 'all' ? 'everything' : a.target} to ${MATERIALS[a.material].label}`
      case 'style': return `restyled the room → ${a.style}`
      case 'view': return `switched to ${a.mode} view`
      case 'clear': return 'cleared the room'
    }
  })
  const s = parts.join(', ')
  return `Done — ${s}.`.replace('Done — Done', 'Done')
}

function labelFor(kind: string): string {
  return CATALOG.find((c) => c.kind === kind)?.label.toLowerCase() ?? kind
}

/* ----------------------------------------------------- Ollama model path */
function systemPrompt(context: string): string {
  return `You are the design assistant for an AI interior planner. Translate the user's request into structured edits.

Reply with STRICT JSON only, shape:
{"reply": string, "actions": Action[]}

Action types:
- {"type":"add","item":KIND,"count"?:number,"material"?:MATERIAL,"width"?:meters,"height"?:meters,"depth"?:meters,"params"?:{doors?,drawers?,shelves?,seats?}}
- {"type":"remove","target":KIND|"selected"|"all"}
- {"type":"move","target":KIND|"selected","to":"left"|"right"|"back"|"front"|"center"}
- {"type":"resize","target":KIND|"selected","width"?:meters,"height"?:meters,"depth"?:meters}
- {"type":"configure","target":KIND|"selected","params":{doors?,drawers?,shelves?,seats?}}
- {"type":"material","target":KIND|"all"|"selected","material":MATERIAL}
- {"type":"style","style":STYLE}
- {"type":"view","mode":"orbit"|"top"|"plan2d"|"firstPerson"}
- {"type":"clear"}

KIND ∈ [${KINDS.join(', ')}]
MATERIAL ∈ [${ALL_MATERIALS.join(', ')}]
STYLE ∈ [${STYLE_IDS.join(', ')}]
All dimensions in METERS (convert inches/feet/cm). "count" is HOW MANY items to add — it is NOT the number of doors/drawers; "a 4 door wardrobe" means count:1 with params.doors:4. "length"/"wide" → width, "deep" → depth, "tall" → height. "reply" is one friendly sentence. If the user just chats, return an empty actions array.

${context}`
}

export async function chatWithAI(
  userText: string,
  context: string,
  unit: import('@/lib/types').Unit,
  signal?: AbortSignal,
): Promise<AIResult> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: 'json',
        options: { temperature: 0.3 },
        messages: [
          { role: 'system', content: systemPrompt(context) },
          { role: 'user', content: userText },
        ],
      }),
    })
    if (!res.ok) throw new Error(`Ollama ${res.status}`)
    const data = await res.json()
    const parsed = JSON.parse(data.message?.content ?? '{}')
    const actions: AIAction[] = Array.isArray(parsed.actions) ? parsed.actions.filter(validAction) : []
    const reply = typeof parsed.reply === 'string' && parsed.reply ? parsed.reply : describeActions(actions)
    return { reply, actions, fromModel: true }
  } catch {
    // Offline / model unavailable → deterministic local understanding.
    return localParse(userText, unit)
  }
}

function validAction(a: unknown): a is AIAction {
  if (!a || typeof a !== 'object') return false
  const t = (a as { type?: string }).type
  return ['add', 'remove', 'move', 'resize', 'configure', 'material', 'style', 'view', 'clear'].includes(t ?? '')
}
