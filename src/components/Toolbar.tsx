import type { CompareMode } from '../types'

const COMPARE_MODES: CompareMode[] = [
  { type: 'text', label: 'Text', icon: '📄' },
  { type: 'folder', label: 'Folder', icon: '📁' },
  { type: 'merge', label: 'Merge', icon: '🔀' },
  { type: 'binary', label: 'Binary', icon: '🔢' },
  { type: 'image', label: 'Image', icon: '🖼️' },
]

interface ToolbarProps {
  currentMode: CompareMode
  onModeChange: (mode: CompareMode) => void
  onSwap?: () => void
  onRefresh?: () => void
  onNewSession?: () => void
  onOpenSession?: () => void
  onSaveSession?: () => void
  onPrevDiff?: () => void
  onNextDiff?: () => void
  onFirstDiff?: () => void
  onLastDiff?: () => void
  diffCount?: number
  currentDiffIndex?: number
  hasFiles?: boolean
}

export function Toolbar({
  currentMode,
  onModeChange,
  onSwap,
  onRefresh,
  onNewSession,
  onOpenSession,
  onSaveSession,
  onPrevDiff,
  onNextDiff,
  onFirstDiff,
  onLastDiff,
  diffCount = 0,
  currentDiffIndex = 0,
  hasFiles = false,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-logo">
        <div className="toolbar-logo-icon">⚡</div>
        <span className="toolbar-logo-text">Beyond Compare</span>
      </div>

      <div className="toolbar-divider" />

      {/* Session Controls */}
      <div className="toolbar-session">
        <button className="toolbar-btn" onClick={onNewSession} title="New Session (Ctrl+N)">
          <span className="toolbar-btn-icon">+</span>
        </button>
        <button className="toolbar-btn" onClick={onOpenSession} title="Open Session (Ctrl+O)">
          <span className="toolbar-btn-icon">📂</span>
        </button>
        <button className="toolbar-btn" onClick={onSaveSession} title="Save Session (Ctrl+S)">
          <span className="toolbar-btn-icon">💾</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Compare Modes */}
      <div className="toolbar-modes">
        {COMPARE_MODES.map((mode) => (
          <button
            key={mode.type}
            className={`mode-btn ${currentMode.type === mode.type ? 'active' : ''}`}
            onClick={() => onModeChange(mode)}
            title={`${mode.label} Compare`}
          >
            <span className="mode-btn-icon">{mode.icon}</span>
            <span className="mode-btn-text">{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* Navigation Controls */}
      <div className="toolbar-nav">
        <button
          className="nav-btn"
          onClick={onFirstDiff}
          disabled={!hasFiles || diffCount === 0}
          title="First Difference"
        >
          <span className="nav-btn-icon">⏮</span>
        </button>
        <button
          className="nav-btn"
          onClick={onPrevDiff}
          disabled={!hasFiles || diffCount === 0}
          title="Previous Difference (F7)"
        >
          <span className="nav-btn-icon">▲</span>
        </button>
        <div className="diff-counter" title={`${currentDiffIndex + 1} of ${diffCount} differences`}>
          {hasFiles && diffCount > 0 ? `${currentDiffIndex + 1}/${diffCount}` : '0/0'}
        </div>
        <button
          className="nav-btn"
          onClick={onNextDiff}
          disabled={!hasFiles || diffCount === 0}
          title="Next Difference (F8)"
        >
          <span className="nav-btn-icon">▼</span>
        </button>
        <button
          className="nav-btn"
          onClick={onLastDiff}
          disabled={!hasFiles || diffCount === 0}
          title="Last Difference"
        >
          <span className="nav-btn-icon">⏭</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Actions */}
      <div className="toolbar-actions">
        <button className="action-btn" onClick={onRefresh} title="Refresh (F5)">
          <span className="action-btn-icon">🔄</span>
          Refresh
        </button>
        <button className="action-btn" onClick={onSwap} title="Swap Sides (Ctrl+Shift+S)">
          <span className="action-btn-icon">⇄</span>
          Swap
        </button>
      </div>
    </div>
  )
}