import React, { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'

interface AddToPlaylistMenuProps {
  trackId: number
  playlists: any[]
  onAdded?: () => void
}

export function AddToPlaylistMenu({ trackId, playlists, onAdded }: AddToPlaylistMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) {
      setOpen(false)
      return
    }
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      const width = 200
      const left = Math.min(rect.right - width, window.innerWidth - width - 8)
      const top = rect.bottom + 6
      setPos({ top, left: Math.max(8, left) })
    }
    setOpen(true)
  }

  const add = async (playlistId: number) => {
    await window.api.addToPlaylist(playlistId, trackId)
    window.dispatchEvent(new Event('playlists-updated'))
    setOpen(false)
    onAdded?.()
  }

  const createAndAdd = () => {
    window.dispatchEvent(new CustomEvent('open-create-playlist', { detail: { trackId } }))
    setOpen(false)
  }

  return (
    <>
      <button
        ref={btnRef}
        className="icon-btn"
        onClick={toggle}
        title="Add to playlist"
      >
        <Plus size={16} />
      </button>
      {open && (
        <div
          ref={menuRef}
          className="popup-menu"
          style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-menu-label">Add to playlist</div>
          {playlists.length === 0 && (
            <div className="popup-menu-empty">No playlists yet</div>
          )}
          {playlists.map((pl) => (
            <button key={pl.id} className="popup-menu-item" onClick={() => add(pl.id)}>
              {pl.name}
            </button>
          ))}
          <button className="popup-menu-item accent" onClick={createAndAdd}>
            New playlist…
          </button>
        </div>
      )}
    </>
  )
}
