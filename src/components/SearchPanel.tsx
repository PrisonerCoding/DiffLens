import { useState, useEffect, useRef } from 'react'

interface SearchPanelProps {
  isOpen: boolean
  onClose: () => void
  editorRef: any
  side: 'left' | 'right'
}

export function SearchPanel({ isOpen, onClose, editorRef, side }: SearchPanelProps) {
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [isRegex, setIsRegex] = useState(false)
  const [isCaseSensitive, setIsCaseSensitive] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const [currentMatch, setCurrentMatch] = useState(0)
  const [showReplace, setShowReplace] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleSearch = () => {
    if (!editorRef || !searchText) return

    const editor = side === 'left'
      ? editorRef.getOriginalEditor()
      : editorRef.getModifiedEditor()

    if (!editor) return

    // Use Monaco's built-in find action
    const findController = editor.getContribution('editor.contrib.findController')

    if (findController) {
      findController.setSearchString(searchText)

      const options = {
        regex: isRegex,
        caseSensitive: isCaseSensitive,
        wholeWord: false,
      }

      findController.changeOptions(options)

      // Get match count
      const findModel = findController.getModel()
      if (findModel) {
        const matches = findModel.findMatches()
        setMatchCount(matches.length)
        setCurrentMatch(findModel.currentMatchIndex + 1)
      }
    }
  }

  const handleFindNext = () => {
    if (!editorRef) return

    const editor = side === 'left'
      ? editorRef.getOriginalEditor()
      : editorRef.getModifiedEditor()

    editor.trigger('search', 'actions.findWithSelection', null)
    editor.trigger('search', 'editor.action.nextMatchFindAction', null)
  }

  const handleFindPrev = () => {
    if (!editorRef) return

    const editor = side === 'left'
      ? editorRef.getOriginalEditor()
      : editorRef.getModifiedEditor()

    editor.trigger('search', 'editor.action.previousMatchFindAction', null)
  }

  const handleReplace = () => {
    if (!editorRef || !searchText) return

    const editor = side === 'left'
      ? editorRef.getOriginalEditor()
      : editorRef.getModifiedEditor()

    const findController = editor.getContribution('editor.contrib.findController')

    if (findController && replaceText) {
      findController.setSearchString(searchText)
      findController.setReplaceString(replaceText)
      findController.replace()
    }
  }

  const handleReplaceAll = () => {
    if (!editorRef || !searchText) return

    const editor = side === 'left'
      ? editorRef.getOriginalEditor()
      : editorRef.getModifiedEditor()

    const findController = editor.getContribution('editor.contrib.findController')

    if (findController && replaceText) {
      findController.setSearchString(searchText)
      findController.setReplaceString(replaceText)
      findController.replaceAll()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showReplace && e.shiftKey) {
        handleReplace()
      } else {
        handleFindNext()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="search-panel">
      <div className="search-header">
        <span className="search-title">Find {showReplace ? '& Replace' : ''}</span>
        <span className="search-side-badge">{side === 'left' ? 'L' : 'R'}</span>
        <button className="search-toggle" onClick={() => setShowReplace(!showReplace)}>
          {showReplace ? '◀ Find' : '▶ Replace'}
        </button>
        <button className="search-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="search-content">
        <div className="search-row">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="search-btn" onClick={handleFindPrev} disabled={!searchText}>
            ↑
          </button>
          <button className="search-btn" onClick={handleFindNext} disabled={!searchText}>
            ↓
          </button>
        </div>

        {showReplace && (
          <div className="search-row">
            <input
              type="text"
              className="search-input"
              placeholder="Replace with..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="search-btn" onClick={handleReplace} disabled={!searchText || !replaceText}>
              Replace
            </button>
            <button className="search-btn" onClick={handleReplaceAll} disabled={!searchText || !replaceText}>
              All
            </button>
          </div>
        )}

        <div className="search-options">
          <label className="search-option">
            <input
              type="checkbox"
              className="search-checkbox"
              checked={isCaseSensitive}
              onChange={(e) => setIsCaseSensitive(e.target.checked)}
            />
            Case sensitive
          </label>
          <label className="search-option">
            <input
              type="checkbox"
              className="search-checkbox"
              checked={isRegex}
              onChange={(e) => setIsRegex(e.target.checked)}
            />
            Regex
          </label>
        </div>

        {matchCount > 0 && (
          <div className="search-stats">
            {currentMatch} of {matchCount} matches
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for managing search state
export function useSearchPanel(editorRef: any) {
  const [leftSearchOpen, setLeftSearchOpen] = useState(false)
  const [rightSearchOpen, setRightSearchOpen] = useState(false)

  const openLeftSearch = () => setLeftSearchOpen(true)
  const openRightSearch = () => setRightSearchOpen(true)
  const closeLeftSearch = () => setLeftSearchOpen(false)
  const closeRightSearch = () => setRightSearchOpen(false)

  return {
    leftSearchOpen,
    rightSearchOpen,
    openLeftSearch,
    openRightSearch,
    closeLeftSearch,
    closeRightSearch,
  }
}