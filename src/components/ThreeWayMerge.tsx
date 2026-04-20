import { useState, useEffect, useRef } from 'react'
import { Editor } from '@monaco-editor/react'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { getLanguageFromPath } from '../utils/diff'

interface MergeFile {
  path: string
  content: string
  language: string
}

interface ThreeWayMergeProps {
  onMergeComplete?: (result: string) => void
}

export function ThreeWayMerge({ onMergeComplete }: ThreeWayMergeProps) {
  const [baseFile, setBaseFile] = useState<MergeFile | null>(null)
  const [leftFile, setLeftFile] = useState<MergeFile | null>(null)
  const [rightFile, setRightFile] = useState<MergeFile | null>(null)
  const [resultContent, setResultContent] = useState<string>('')
  const [conflicts, setConflicts] = useState<ConflictRegion[]>([])
  const [selectedResolutions, setSelectedResolutions] = useState<Map<number, 'base' | 'left' | 'right' | 'manual'>>(new Map())

  const baseEditorRef = useRef<any>(null)
  const leftEditorRef = useRef<any>(null)
  const rightEditorRef = useRef<any>(null)
  const resultEditorRef = useRef<any>(null)

  interface ConflictRegion {
    startLine: number
    endLine: number
    baseContent: string
    leftContent: string
    rightContent: string
    type: 'conflict' | 'resolved'
  }

  const loadFile = async (side: 'base' | 'left' | 'right') => {
    const selected = await open({
      multiple: false,
      title: `Select ${side === 'base' ? 'Base' : side === 'left' ? 'Left' : 'Right'} File`,
    })

    if (selected && typeof selected === 'string') {
      try {
        const content = await readTextFile(selected)
        const language = getLanguageFromPath(selected)

        const file = { path: selected, content, language }

        if (side === 'base') setBaseFile(file)
        else if (side === 'left') setLeftFile(file)
        else setRightFile(file)
      } catch (error) {
        console.error(`Failed to load ${side} file:`, error)
      }
    }
  }

  // Detect conflicts when all files are loaded
  useEffect(() => {
    if (baseFile && leftFile && rightFile) {
      detectConflicts()
    }
  }, [baseFile, leftFile, rightFile])

  const detectConflicts = () => {
    if (!baseFile || !leftFile || !rightFile) return

    const baseLines = baseFile.content.split('\n')
    const leftLines = leftFile.content.split('\n')
    const rightLines = rightFile.content.split('\n')

    const detectedConflicts: ConflictRegion[] = []

    // Simple line-by-line conflict detection
    const maxLines = Math.max(baseLines.length, leftLines.length, rightLines.length)

    for (let i = 0; i < maxLines; i++) {
      const baseLine = baseLines[i] ?? ''
      const leftLine = leftLines[i] ?? ''
      const rightLine = rightLines[i] ?? ''

      // Conflict: both left and right modified the same line differently
      if (leftLine !== baseLine && rightLine !== baseLine && leftLine !== rightLine) {
        detectedConflicts.push({
          startLine: i + 1,
          endLine: i + 1,
          baseContent: baseLine,
          leftContent: leftLine,
          rightContent: rightLine,
          type: 'conflict',
        })
      }
    }

    setConflicts(detectedConflicts)

    // Initialize result with base content
    setResultContent(baseFile.content)
  }

  const resolveConflict = (conflictIndex: number, resolution: 'base' | 'left' | 'right' | 'manual') => {
    const newResolutions = new Map(selectedResolutions)
    newResolutions.set(conflictIndex, resolution)
    setSelectedResolutions(newResolutions)

    // Update result content
    updateResultContent(newResolutions)
  }

  const updateResultContent = (resolutions: Map<number, 'base' | 'left' | 'right' | 'manual'>) => {
    if (!baseFile || !leftFile || !rightFile) return

    const baseLines = baseFile.content.split('\n')
    const leftLines = leftFile.content.split('\n')
    const rightLines = rightFile.content.split('\n')

    const resultLines: string[] = []

    for (let i = 0; i < baseLines.length; i++) {
      const conflict = conflicts.find(c => c.startLine === i + 1)

      if (conflict) {
        const conflictIndex = conflicts.indexOf(conflict)
        const resolution = resolutions.get(conflictIndex)

        switch (resolution) {
          case 'base':
            resultLines.push(baseLines[i])
            break
          case 'left':
            resultLines.push(leftLines[i])
            break
          case 'right':
            resultLines.push(rightLines[i])
            break
          default:
            // Mark as unresolved conflict
            resultLines.push(`<<<<<<< LEFT`)
            resultLines.push(leftLines[i])
            resultLines.push(`=======`)
            resultLines.push(baseLines[i])
            resultLines.push(`>>>>>>> RIGHT`)
            resultLines.push(rightLines[i])
        }
      } else {
        // Non-conflict line
        if (leftLines[i] !== baseLines[i]) {
          resultLines.push(leftLines[i]) // Left modified
        } else if (rightLines[i] !== baseLines[i]) {
          resultLines.push(rightLines[i]) // Right modified
        } else {
          resultLines.push(baseLines[i]) // No change
        }
      }
    }

    setResultContent(resultLines.join('\n'))
  }

  const handleEditorMount = (editor: any, side: 'base' | 'left' | 'right' | 'result') => {
    if (side === 'base') baseEditorRef.current = editor
    else if (side === 'left') leftEditorRef.current = editor
    else if (side === 'right') rightEditorRef.current = editor
    else resultEditorRef.current = editor
  }

  const applyAllResolutions = (resolution: 'base' | 'left' | 'right') => {
    const newResolutions = new Map<number, 'base' | 'left' | 'right' | 'manual'>()
    conflicts.forEach((_, index) => {
      newResolutions.set(index, resolution)
    })
    setSelectedResolutions(newResolutions)
    updateResultContent(newResolutions)
  }

  const getFileName = (path: string) => {
    return path.split(/[/\\]/).pop() || path
  }

  const unresolvedCount = conflicts.length - selectedResolutions.size

  return (
    <div className="three-way-merge">
      <div className="merge-header">
        <span className="merge-title">Three-Way Merge</span>
        <span className="merge-conflicts-count">
          {conflicts.length > 0 ? `${unresolvedCount} unresolved / ${conflicts.length} conflicts` : 'No conflicts detected'}
        </span>
      </div>

      <div className="merge-toolbar">
        <button className="merge-load-btn" onClick={() => loadFile('base')}>
          📁 Load Base
        </button>
        <button className="merge-load-btn" onClick={() => loadFile('left')}>
          📁 Load Left
        </button>
        <button className="merge-load-btn" onClick={() => loadFile('right')}>
          📁 Load Right
        </button>

        <div className="merge-resolve-all">
          <span className="resolve-label">Resolve All:</span>
          <button className="resolve-btn base" onClick={() => applyAllResolutions('base')}>
            Use Base
          </button>
          <button className="resolve-btn left" onClick={() => applyAllResolutions('left')}>
            Use Left
          </button>
          <button className="resolve-btn right" onClick={() => applyAllResolutions('right')}>
            Use Right
          </button>
        </div>
      </div>

      <div className="merge-panels">
        {/* Base Panel */}
        <div className="merge-panel">
          <div className="merge-panel-header">
            <span className="panel-badge base">BASE</span>
            <span className="panel-path">
              {baseFile ? getFileName(baseFile.path) : 'No file'}
            </span>
          </div>
          <div className="merge-editor">
            <Editor
              height="100%"
              language={baseFile?.language || 'plaintext'}
              value={baseFile?.content || ''}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
              }}
              onMount={(editor) => handleEditorMount(editor, 'base')}
            />
          </div>
        </div>

        {/* Left Panel */}
        <div className="merge-panel">
          <div className="merge-panel-header">
            <span className="panel-badge left">L</span>
            <span className="panel-path">
              {leftFile ? getFileName(leftFile.path) : 'No file'}
            </span>
          </div>
          <div className="merge-editor">
            <Editor
              height="100%"
              language={leftFile?.language || 'plaintext'}
              value={leftFile?.content || ''}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
              }}
              onMount={(editor) => handleEditorMount(editor, 'left')}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="merge-panel">
          <div className="merge-panel-header">
            <span className="panel-badge right">R</span>
            <span className="panel-path">
              {rightFile ? getFileName(rightFile.path) : 'No file'}
            </span>
          </div>
          <div className="merge-editor">
            <Editor
              height="100%"
              language={rightFile?.language || 'plaintext'}
              value={rightFile?.content || ''}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
              }}
              onMount={(editor) => handleEditorMount(editor, 'right')}
            />
          </div>
        </div>
      </div>

      {/* Conflict List */}
      {conflicts.length > 0 && (
        <div className="merge-conflicts">
          <span className="conflicts-title">Conflicts:</span>
          <div className="conflicts-list">
            {conflicts.map((conflict, index) => (
              <div key={index} className="conflict-item">
                <span className="conflict-line">Line {conflict.startLine}</span>
                <div className="conflict-options">
                  <button
                    className={`conflict-btn ${selectedResolutions.get(index) === 'base' ? 'selected' : ''}`}
                    onClick={() => resolveConflict(index, 'base')}
                  >
                    Base
                  </button>
                  <button
                    className={`conflict-btn ${selectedResolutions.get(index) === 'left' ? 'selected' : ''}`}
                    onClick={() => resolveConflict(index, 'left')}
                  >
                    Left
                  </button>
                  <button
                    className={`conflict-btn ${selectedResolutions.get(index) === 'right' ? 'selected' : ''}`}
                    onClick={() => resolveConflict(index, 'right')}
                  >
                    Right
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result Panel */}
      <div className="merge-result">
        <div className="merge-result-header">
          <span className="result-badge">RESULT</span>
          <span className="result-status">
            {unresolvedCount === 0 && conflicts.length > 0 ? '✓ All resolved' : `${unresolvedCount} unresolved`}
          </span>
        </div>
        <div className="merge-result-editor">
          <Editor
            height="100%"
            language={baseFile?.language || 'plaintext'}
            value={resultContent}
            theme="vs-dark"
            options={{
              readOnly: false,
              minimap: { enabled: true },
              fontSize: 13,
              lineNumbers: 'on',
            }}
            onMount={(editor) => handleEditorMount(editor, 'result')}
            onChange={(value) => setResultContent(value || '')}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="merge-actions">
        <button
          className="merge-complete-btn"
          onClick={() => onMergeComplete?.(resultContent)}
          disabled={unresolvedCount > 0}
        >
          {unresolvedCount > 0 ? `Resolve ${unresolvedCount} conflicts first` : 'Complete Merge'}
        </button>
      </div>
    </div>
  )
}