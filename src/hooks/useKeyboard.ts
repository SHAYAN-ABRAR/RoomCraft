import { useEffect } from 'react'
import { useDesignStore } from '@/store/useDesignStore'

const STEP = 0.05 // 5 cm nudge
const ROT = Math.PI / 12 // 15°

/** Global CAD-style keyboard shortcuts for the editor. */
export function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return

      const s = useDesignStore.getState()
      if (s.viewOnly) return
      const id = s.selectedId
      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        e.shiftKey ? s.redo() : s.undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        s.redo()
        return
      }
      if (mod && e.key.toLowerCase() === 'd' && id) {
        e.preventDefault()
        s.duplicateFurniture(id)
        return
      }

      if (!id) {
        if (e.key === 'Escape') s.select(null)
        return
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          s.removeFurniture(id)
          break
        case 'Escape':
          s.select(null)
          break
        case 'r':
          s.rotateFurniture(id, ROT)
          break
        case 'R':
          s.rotateFurniture(id, -ROT)
          break
        case 'l':
          s.toggleLock(id)
          break
        case 'ArrowUp':
          e.preventDefault()
          s.nudgeFurniture(id, 0, -STEP)
          break
        case 'ArrowDown':
          e.preventDefault()
          s.nudgeFurniture(id, 0, STEP)
          break
        case 'ArrowLeft':
          e.preventDefault()
          s.nudgeFurniture(id, -STEP, 0)
          break
        case 'ArrowRight':
          e.preventDefault()
          s.nudgeFurniture(id, STEP, 0)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
