import React, { useState, useEffect } from 'react'
import { Folder, Trash2 } from 'lucide-react'

export function SettingsView() {
  const [folders, setFolders] = useState<any[]>([])

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    const data = await window.api.getLibraryFolders()
    setFolders(data)
  }

  const handleRemoveFolder = async (path: string) => {
    if (confirm(`Remove ${path} from watched folders? Note: You may need to click 'Clear Library' to fully purge its tracks.`)) {
      await window.api.removeLibraryFolder(path)
      loadFolders()
    }
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ marginBottom: '24px' }}>Library Management</h2>
      <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', color: 'var(--text-secondary)' }}>Watched Folders</h3>
        {folders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No folders added yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {folders.map((folder) => (
              <li key={folder.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--bg-primary)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Folder size={18} color="var(--text-secondary)" />
                  <span style={{ wordBreak: 'break-all' }}>{folder.path}</span>
                </div>
                <button 
                  onClick={() => handleRemoveFolder(folder.path)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
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
