import { useState, useEffect } from 'react'
import type { SyncOperation, SyncResult } from '../utils/syncOperations'
import { executeSyncOperation } from '../utils/syncOperations'

interface SyncPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  leftFolderPath: string
  rightFolderPath: string
  operations: SyncOperation[]
  onSyncComplete: () => void
}

export function SyncPreviewModal({
  isOpen,
  onClose,
  leftFolderPath,
  rightFolderPath,
  operations,
  onSyncComplete,
}: SyncPreviewModalProps) {
  const [selectedOps, setSelectedOps] = useState<Set<number>>(new Set())
  const [isExecuting, setIsExecuting] = useState(false)
  const [results, setResults] = useState<SyncResult[]>([])
  const [showResults, setShowResults] = useState(false)

  // Reset selection when operations change or modal opens
  useEffect(() => {
    if (isOpen && operations.length > 0) {
      setSelectedOps(new Set(operations.map((_, i) => i)))
      setResults([])
      setShowResults(false)
    }
  }, [isOpen, operations])

  const toggleOperation = (index: number) => {
    const newSelected = new Set(selectedOps)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedOps(newSelected)
  }

  const toggleAll = () => {
    if (selectedOps.size === operations.length) {
      setSelectedOps(new Set())
    } else {
      setSelectedOps(new Set(operations.map((_, i) => i)))
    }
  }

  const getOperationIcon = (type: SyncOperation['type']) => {
    switch (type) {
      case 'copy-to-left':
        return '←'
      case 'copy-to-right':
        return '→'
      case 'delete-left':
        return '✕ L'
      case 'delete-right':
        return '✕ R'
    }
  }

  const getOperationColor = (type: SyncOperation['type']) => {
    switch (type) {
      case 'copy-to-left':
        return 'var(--diff-removed-line)'
      case 'copy-to-right':
        return 'var(--diff-added-line)'
      case 'delete-left':
        return 'var(--diff-removed-line)'
      case 'delete-right':
        return 'var(--diff-removed-line)'
    }
  }

  const getOperationLabel = (type: SyncOperation['type']) => {
    switch (type) {
      case 'copy-to-left':
        return 'Copy from Right to Left'
      case 'copy-to-right':
        return 'Copy from Left to Right'
      case 'delete-left':
        return 'Delete from Left'
      case 'delete-right':
        return 'Delete from Right'
    }
  }

  const executeSelected = async () => {
    setIsExecuting(true)
    setShowResults(false)

    const opsToExecute = operations.filter((_, i) => selectedOps.has(i))
    const execResults: SyncResult[] = []

    for (const op of opsToExecute) {
      const result = await executeSyncOperation(leftFolderPath, rightFolderPath, op)
      execResults.push(result)
      setResults([...execResults])
    }

    setIsExecuting(false)
    setShowResults(true)
  }

  const handleConfirm = async () => {
    await executeSelected()
  }

  const handleFinish = () => {
    if (results.every(r => r.success)) {
      onSyncComplete()
      onClose()
    }
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  if (!isOpen) return null

  return (
    <div className="sync-preview-overlay">
      <div className="sync-preview-modal">
        <div className="sync-preview-header">
          <span className="sync-preview-title">Sync Preview</span>
          <span className="sync-preview-count">{selectedOps.size} / {operations.length} selected</span>
          <button className="sync-preview-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sync-preview-content">
          {!showResults ? (
            <>
              <div className="sync-preview-toolbar">
                <button className="sync-preview-btn" onClick={toggleAll}>
                  {selectedOps.size === operations.length ? 'Unselect All' : 'Select All'}
                </button>
              </div>

              <div className="sync-preview-list">
                {operations.length === 0 ? (
                  <div className="sync-preview-empty">
                    No sync operations to perform
                  </div>
                ) : (
                  operations.map((op, index) => (
                    <div
                      key={index}
                      className={`sync-preview-item ${selectedOps.has(index) ? 'selected' : ''}`}
                      onClick={() => toggleOperation(index)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOps.has(index)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleOperation(index)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="sync-preview-checkbox"
                      />

                      <span
                        className="sync-preview-icon"
                        style={{ color: getOperationColor(op.type) }}
                      >
                        {getOperationIcon(op.type)}
                      </span>

                      <span className="sync-preview-type">
                        {getOperationLabel(op.type)}
                      </span>

                      <span className="sync-preview-path">
                        {op.relativePath}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="sync-preview-results">
              <div className="sync-results-summary">
                <span className="sync-results-success">✓ {successCount} succeeded</span>
                {failCount > 0 && (
                  <span className="sync-results-failed">✕ {failCount} failed</span>
                )}
              </div>

              {failCount > 0 && (
                <div className="sync-results-errors">
                  {results
                    .filter(r => !r.success)
                    .map((r, i) => (
                      <div key={i} className="sync-result-error">
                        <span className="sync-error-path">{r.operation.relativePath}</span>
                        <span className="sync-error-msg">{r.error}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sync-preview-footer">
          {!showResults ? (
            <>
              <button
                className="sync-preview-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="sync-preview-confirm"
                onClick={handleConfirm}
                disabled={isExecuting || selectedOps.size === 0}
              >
                {isExecuting ? 'Executing...' : `Execute ${selectedOps.size} Operations`}
              </button>
            </>
          ) : (
            <>
              {failCount > 0 && (
                <button className="sync-preview-retry" onClick={handleConfirm}>
                  Retry Failed
                </button>
              )}
              <button className="sync-preview-finish" onClick={handleFinish}>
                Finish
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}