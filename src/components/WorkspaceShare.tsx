import { useMemo, useState } from 'react'
import { decodeWorkspace, encodeWorkspace, shareUrl, type WorkspaceSnapshot, type WorkspaceStateInput } from '../core/workspace/persistence'
import '../styles/share.css'

interface WorkspaceShareProps {
  workspace: WorkspaceStateInput
  onImport: (snapshot: WorkspaceSnapshot) => void
  onBack: () => void
}

export function WorkspaceShare({ workspace, onImport, onBack }: WorkspaceShareProps) {
  const payload = useMemo(() => encodeWorkspace(workspace), [workspace])
  const link = useMemo(() => shareUrl(workspace), [workspace])
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState('')

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setMessage('Share link copied.')
    } catch {
      setMessage('Clipboard access was blocked. Select and copy the link manually.')
    }
  }

  const importPayload = () => {
    try {
      const value = importText.trim()
      const maybeUrl = value.startsWith('http://') || value.startsWith('https://') ? new URL(value).searchParams.get('w') : value
      if (!maybeUrl) throw new Error('No workspace payload was found.')
      const snapshot = decodeWorkspace(maybeUrl)
      onImport(snapshot)
      setMessage('Workspace imported.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not import this workspace.')
    }
  }

  return (
    <section className="share-workspace">
      <div className="share-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div><strong>Share</strong></div>
      </div>

      <div className="share-grid">
        <section className="panel share-panel">
          <div className="panel-heading"><span>Share link</span></div>
          <div className="share-body">
            <p>Link includes the machine and input.</p>
            <label><span>URL</span><textarea readOnly value={link} onFocus={(event) => event.currentTarget.select()} /></label>
            <div className="share-actions"><button className="primary-control" onClick={copyLink}>Copy share link</button></div>
          </div>
        </section>

        <section className="panel share-panel">
          <div className="panel-heading"><span>Import</span></div>
          <div className="share-body">
            <p>Paste a share link or payload.</p>
            <label><span>Paste link or payload</span><textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={payload.slice(0, 72) + '…'} /></label>
            <div className="share-actions"><button className="primary-control" disabled={!importText.trim()} onClick={importPayload}>Import and load</button></div>
          </div>
        </section>
      </div>
      <div className="share-payload"><small>Payload</small><code>{payload}</code></div>
      {message && <div className="share-message" role="status">{message}</div>}
    </section>
  )
}
