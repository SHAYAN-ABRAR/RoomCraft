<div align="center">

# 🛋️ RoomCraft

### Design your dream room in 3D — powered by AI.

RoomCraft is a browser-based interior design studio. Sketch a room, drop in furniture, and let an AI assistant restyle, resize, and arrange everything for you — in real-time 3D, down to the millimeter.



<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r185-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

</div>

---

## ✨ Features

- 🎨 **Real-time 3D editor** — a live WebGL scene built on React Three Fiber, with PBR materials, soft shadows, and cinematic post-processing.
- 🤖 **AI design assistant** — just type what you want: *"Generate a walnut wardrobe 2m wide"*, *"Make the room Scandinavian"*, *"Move the sofa to the left"*. Backed by a local Ollama LLM, with a **deterministic offline parser** so it still understands you with no model running.
- 🪑 **19 furniture types, fully parametric** — set doors, drawers, shelves, and seats; resize by real-world dimensions; swap between **12 materials** (oak, walnut, marble, leather, glass…).
- 🎭 **10 curated style presets** — Modern, Minimal, Luxury, Industrial, Japandi, Scandinavian, Bohemian, Classic, Dark, and Bright — each restyles the whole room in one click.
- 🧠 **Smart space insights** — automatic collision detection, doorway & window clearance checks, walkway analysis, and crowding/coverage warnings.
- 📐 **Millimeter-accurate & unit-aware** — work in metric or imperial (`m` / `cm` / `mm` / `ft` / `in`); every dimension is real.
- 👁️ **Multiple views** — orbit, top-down, 2D floor plan, and a first-person walkthrough.
- 🔗 **Share with a link** — the entire design is compressed into the URL (no backend), opening in a clean read-only viewer.
- 📤 **Export anything** — PNG snapshot, portable JSON project, or a CSV **bill of materials** / shopping list.
- ⌨️ **Keyboard shortcuts & autosave** — your work persists locally between sessions.

---

## 🛠️ Tech Stack

| Layer | Tools |
| --- | --- |
| **Framework** | React 19, TypeScript, Vite |
| **3D / Rendering** | Three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing |
| **Styling** | Tailwind CSS v4, Framer Motion, lucide-react |
| **State** | Zustand (with local persistence) |
| **AI** | Ollama (local LLM) + deterministic rule-based fallback |
| **Sharing** | lz-string URL compression |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm

### Installation

```bash
# clone
git clone https://github.com/SHAYAN-ABRAR/RoomCraft.git
cd RoomCraft

# install dependencies
npm install

# start the dev server
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint the codebase with Oxlint |

---

## 🤖 AI Assistant (optional setup)

RoomCraft works out of the box — the assistant falls back to a built-in natural-language parser when no model is available. For richer, more flexible understanding, run a local [Ollama](https://ollama.com) model:

```bash
# install Ollama, then pull a model
ollama pull llama3
```

Point RoomCraft at your model by editing the endpoint and model name in
[`src/ai/ollama.ts`](src/ai/ollama.ts):

```ts
export const OLLAMA_URL = 'http://localhost:11434'
export const OLLAMA_MODEL = 'llama3'
```

**Try saying:**
- `Generate a 4-door walnut wardrobe 64 inches wide`
- `Furnish the room in a luxury style`
- `Make everything white`
- `Switch to top view`
- `Remove the coffee table`


---


<div align="center">

**Built by [Shayan Abrar](https://github.com/SHAYAN-ABRAR)**

⭐ If you like RoomCraft, consider starring the repo!

</div>
