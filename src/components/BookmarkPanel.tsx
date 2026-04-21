import type { Bookmark } from '../hooks/useBookmarks'

interface BookmarkPanelProps {
  bookmarks: Bookmark[]
  onGoToBookmark: (bookmark: Bookmark) => void
  onRemoveBookmark: (bookmark: Bookmark) => void
  onClearBookmarks: () => void
  isOpen: boolean
  onClose: () => void
}

export function BookmarkPanel({
  bookmarks,
  onGoToBookmark,
  onRemoveBookmark,
  onClearBookmarks,
  isOpen,
  onClose,
}: BookmarkPanelProps) {
  if (!isOpen) return null

  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    if (a.side !== b.side) return a.side === 'left' ? -1 : 1
    return a.lineNumber - b.lineNumber
  })

  return (
    <div className="bookmark-panel-overlay" onClick={onClose}>
      <div className="bookmark-panel" onClick={(e) => e.stopPropagation()}>
        <div className="bookmark-panel-header">
          <span className="bookmark-panel-title">
            📌 Bookmarks ({bookmarks.length})
          </span>
          <div className="bookmark-panel-actions">
            <button
              className="bookmark-clear-btn"
              onClick={onClearBookmarks}
              disabled={bookmarks.length === 0}
            >
              Clear All
            </button>
            <button className="bookmark-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="bookmark-panel-content">
          {bookmarks.length === 0 ? (
            <div className="bookmark-empty">
              <span className="bookmark-empty-icon">📌</span>
              <span className="bookmark-empty-text">No bookmarks</span>
              <span className="bookmark-empty-hint">
                Click line number to add bookmark
              </span>
            </div>
          ) : (
            <div className="bookmark-list">
              {sortedBookmarks.map((bookmark) => (
                <div
                  key={`${bookmark.side}-${bookmark.lineNumber}`}
                  className="bookmark-item"
                  onClick={() => onGoToBookmark(bookmark)}
                >
                  <span className={`bookmark-side-badge ${bookmark.side}`}>
                    {bookmark.side === 'left' ? 'L' : 'R'}
                  </span>
                  <span className="bookmark-line-number">
                    Line {bookmark.lineNumber}
                  </span>
                  {bookmark.label && (
                    <span className="bookmark-label">{bookmark.label}</span>
                  )}
                  <button
                    className="bookmark-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveBookmark(bookmark)
                    }}
                    title="Remove bookmark"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}