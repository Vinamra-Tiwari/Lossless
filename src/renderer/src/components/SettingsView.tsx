import React, { useState, useEffect } from 'react'
import { Folder, Trash2 } from 'lucide-react'

export function SettingsView() {
  const [folders, setFolders] = useState<any[]>([])

  const loadFolders = async () => {
    const data = await window.api.getLibraryFolders()
    setFolders(data)
  }

  useEffect(() => {
    loadFolders()
    window.addEventListener('library-cleared', loadFolders)
    window.addEventListener('folders-updated', loadFolders)
    return () => {
      window.removeEventListener('library-cleared', loadFolders)
      window.removeEventListener('folders-updated', loadFolders)
    }
  }, [])

  const handleRemoveFolder = async (path: string) => {
    if (!confirm(`Remove this folder and its tracks from the library?\n\n${path}`)) return
    await window.api.removeLibraryFolder(path)
    loadFolders()
    window.dispatchEvent(new Event('library-cleared'))
  }

  return (
    <div className="settings-panel">
      <h2>Library</h2>
      <div className="settings-card">
        <h3>Watched folders</h3>
        <p className="empty-copy">You can add multiple folders. Tracks from all of them stay in one library.</p>
        {folders.length === 0 ? (
          <p className="empty-copy" style={{ marginTop: 16 }}>No folders added yet.</p>
        ) : (
          <ul className="folder-list">
            {folders.map((folder) => (
              <li key={folder.id}>
                <div className="folder-path">
                  <Folder size={18} />
                  <span>{folder.path}</span>
                </div>
                <button
                  className="icon-btn danger"
                  onClick={() => handleRemoveFolder(folder.path)}
                  title="Remove folder"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
