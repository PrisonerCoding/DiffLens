import type { FolderItem } from '../types'

interface FolderTreeProps {
  items: FolderItem[]
  onItemClick?: (item: FolderItem) => void
  expandedPaths?: Set<string>
  onToggleExpand?: (path: string) => void
}

export function FolderTree({ items, onItemClick, expandedPaths, onToggleExpand }: FolderTreeProps) {
  const getStatusIcon = (status: FolderItem['status']) => {
    switch (status) {
      case 'added':
        return '➕'
      case 'removed':
        return '➖'
      case 'modified':
        return '📝'
      case 'equal':
        return '✓'
    }
  }

  const getStatusColor = (status: FolderItem['status']) => {
    switch (status) {
      case 'added':
        return 'var(--diff-added-line)'
      case 'removed':
        return 'var(--diff-removed-line)'
      case 'modified':
        return 'var(--diff-modified-line)'
      case 'equal':
        return 'var(--text-muted)'
    }
  }

  const renderItem = (item: FolderItem, depth: number = 0) => {
    const isExpanded = expandedPaths?.has(item.path)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.path} className="tree-item">
        <div
          className="tree-row"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (item.type === 'folder' && onToggleExpand) {
              onToggleExpand(item.path)
            } else if (onItemClick) {
              onItemClick(item)
            }
          }}
        >
          {item.type === 'folder' && (
            <span className="tree-expand-icon">
              {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
            </span>
          )}

          <span className="tree-item-icon">
            {item.type === 'folder' ? '📁' : '📄'}
          </span>

          <span className="tree-item-name">{item.name}</span>

          <span
            className="tree-status-icon"
            style={{ color: getStatusColor(item.status) }}
          >
            {getStatusIcon(item.status)}
          </span>
        </div>

        {isExpanded && item.children && (
          <div className="tree-children">
            {item.children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="tree-empty">
        <div className="tree-empty-text">No folder selected</div>
      </div>
    )
  }

  return (
    <div className="folder-tree">
      {items.map((item) => renderItem(item))}
    </div>
  )
}