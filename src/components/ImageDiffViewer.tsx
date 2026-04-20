import { useState, useEffect } from 'react'
import { readFile } from '@tauri-apps/plugin-fs'

interface ImageDiffViewerProps {
  leftPath?: string
  rightPath?: string
}

export function ImageDiffViewer({ leftPath, rightPath }: ImageDiffViewerProps) {
  const [leftImage, setLeftImage] = useState<string | null>(null)
  const [rightImage, setRightImage] = useState<string | null>(null)
  const [leftSize, setLeftSize] = useState<{ width: number; height: number } | null>(null)
  const [rightSize, setRightSize] = useState<{ width: number; height: number } | null>(null)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'difference'>('side-by-side')
  const [overlayOpacity, setOverlayOpacity] = useState(0.5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (leftPath) {
      loadImage(leftPath, setLeftImage, setLeftSize)
    } else {
      setLeftImage(null)
      setLeftSize(null)
    }
  }, [leftPath])

  useEffect(() => {
    if (rightPath) {
      loadImage(rightPath, setRightImage, setRightSize)
    } else {
      setRightImage(null)
      setRightSize(null)
    }
  }, [rightPath])

  const loadImage = async (
    path: string,
    setImage: (data: string | null) => void,
    setSize: (size: { width: number; height: number } | null) => void
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const fileData = await readFile(path)
      const base64 = arrayBufferToBase64(fileData)
      const mimeType = getMimeType(path)
      const dataUrl = `data:${mimeType};base64,${base64}`

      // Get image dimensions
      const img = new Image()
      img.onload = () => {
        setSize({ width: img.width, height: img.height })
        setIsLoading(false)
      }
      img.onerror = () => {
        setError('Failed to load image')
        setIsLoading(false)
      }
      img.src = dataUrl

      setImage(dataUrl)
    } catch (err) {
      setError(`Failed to read file: ${(err as Error).message}`)
      setIsLoading(false)
    }
  }

  const arrayBufferToBase64 = (buffer: Uint8Array): string => {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  const getMimeType = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || ''
    switch (ext) {
      case 'png':
        return 'image/png'
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg'
      case 'gif':
        return 'image/gif'
      case 'bmp':
        return 'image/bmp'
      case 'webp':
        return 'image/webp'
      case 'svg':
        return 'image/svg+xml'
      case 'ico':
        return 'image/x-icon'
      case 'tiff':
      case 'tif':
        return 'image/tiff'
      default:
        return 'image/png'
    }
  }

  const getFileName = (path: string) => {
    return path.split(/[/\\]/).pop() || path
  }

  const areImagesDifferent = () => {
    if (!leftSize || !rightSize) return false
    return leftSize.width !== rightSize.width || leftSize.height !== rightSize.height
  }

  if (!leftPath && !rightPath) {
    return (
      <div className="image-diff-empty">
        <div className="image-empty-icon">🖼️</div>
        <div className="image-empty-title">Select images to compare</div>
        <div className="image-empty-subtitle">
          Choose two image files to see their differences
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="image-diff-loading">
        <div className="image-spinner">⏳</div>
        <div className="image-loading-text">Loading images...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="image-diff-error">
        <div className="image-error-icon">❌</div>
        <div className="image-error-text">{error}</div>
      </div>
    )
  }

  return (
    <div className="image-diff-container">
      {/* Header */}
      <div className="image-diff-header">
        <div className="image-info">
          {leftPath && leftSize && (
            <div className="image-file-info left">
              <span className="image-badge">L</span>
              <span className="image-name">{getFileName(leftPath)}</span>
              <span className="image-size">{leftSize.width} × {leftSize.height}</span>
            </div>
          )}
          {rightPath && rightSize && (
            <div className="image-file-info right">
              <span className="image-badge">R</span>
              <span className="image-name">{getFileName(rightPath)}</span>
              <span className="image-size">{rightSize.width} × {rightSize.height}</span>
            </div>
          )}
        </div>

        {/* View mode controls */}
        <div className="image-controls">
          <div className="image-view-modes">
            <button
              className={`image-mode-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
            >
              Side by Side
            </button>
            <button
              className={`image-mode-btn ${viewMode === 'overlay' ? 'active' : ''}`}
              onClick={() => setViewMode('overlay')}
            >
              Overlay
            </button>
            <button
              className={`image-mode-btn ${viewMode === 'difference' ? 'active' : ''}`}
              onClick={() => setViewMode('difference')}
            >
              Difference
            </button>
          </div>

          {viewMode === 'overlay' && (
            <div className="image-opacity-control">
              <label className="opacity-label">Opacity:</label>
              <input
                type="range"
                min="0"
                max="100"
                value={overlayOpacity * 100}
                onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
                className="opacity-slider"
              />
              <span className="opacity-value">{Math.round(overlayOpacity * 100)}%</span>
            </div>
          )}
        </div>

        {/* Difference indicator */}
        {areImagesDifferent() && (
          <div className="image-diff-warning">
            ⚠️ Images have different dimensions
          </div>
        )}
      </div>

      {/* Image views */}
      <div className="image-views">
        {viewMode === 'side-by-side' && (
          <div className="image-side-by-side">
            <div className="image-pane left">
              {leftImage ? (
                <img src={leftImage} alt="Left image" className="image-display" />
              ) : (
                <div className="image-pane-empty">No left image</div>
              )}
            </div>
            <div className="image-pane right">
              {rightImage ? (
                <img src={rightImage} alt="Right image" className="image-display" />
              ) : (
                <div className="image-pane-empty">No right image</div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'overlay' && (
          <div className="image-overlay-container">
            {leftImage && (
              <img src={leftImage} alt="Left image" className="image-overlay-base" />
            )}
            {rightImage && (
              <img
                src={rightImage}
                alt="Right image"
                className="image-overlay-top"
                style={{ opacity: overlayOpacity }}
              />
            )}
          </div>
        )}

        {viewMode === 'difference' && (
          <div className="image-difference-container">
            <canvas
              id="diffCanvas"
              className="image-difference-canvas"
              ref={(canvas) => {
                if (canvas && leftImage && rightImage && leftSize && rightSize) {
                  computeDifference(canvas, leftImage, rightImage, leftSize, rightSize)
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="image-status-bar">
        <div className="image-status-item">
          Mode: {viewMode === 'side-by-side' ? 'Side by Side' : viewMode === 'overlay' ? 'Overlay' : 'Difference'}
        </div>
        {leftSize && rightSize && (
          <div className="image-status-item">
            {areImagesDifferent() ? '⚠️ Different dimensions' : '✓ Same dimensions'}
          </div>
        )}
      </div>
    </div>
  )
}

// Compute pixel difference between two images
function computeDifference(
  canvas: HTMLCanvasElement,
  leftImage: string,
  rightImage: string,
  leftSize: { width: number; height: number },
  rightSize: { width: number; height: number }
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const maxWidth = Math.max(leftSize.width, rightSize.width)
  const maxHeight = Math.max(leftSize.height, rightSize.height)

  canvas.width = maxWidth
  canvas.height = maxHeight

  const leftImg = new Image()
  const rightImg = new Image()

  let leftLoaded = false
  let rightLoaded = false

  const drawDifference = () => {
    if (!leftLoaded || !rightLoaded) return

    // Create temporary canvases for each image
    const leftCanvas = document.createElement('canvas')
    const rightCanvas = document.createElement('canvas')

    leftCanvas.width = maxWidth
    leftCanvas.height = maxHeight
    rightCanvas.width = maxWidth
    rightCanvas.height = maxHeight

    const leftCtx = leftCanvas.getContext('2d')
    const rightCtx = rightCanvas.getContext('2d')

    if (!leftCtx || !rightCtx) return

    // Draw images on temporary canvases
    leftCtx.drawImage(leftImg, 0, 0)
    rightCtx.drawImage(rightImg, 0, 0)

    // Get image data
    const leftData = leftCtx.getImageData(0, 0, maxWidth, maxHeight)
    const rightData = rightCtx.getImageData(0, 0, maxWidth, maxHeight)

    // Create difference data
    const diffData = ctx.createImageData(maxWidth, maxHeight)

    for (let i = 0; i < leftData.data.length; i += 4) {
      const rDiff = Math.abs(leftData.data[i] - rightData.data[i])
      const gDiff = Math.abs(leftData.data[i + 1] - rightData.data[i + 1])
      const bDiff = Math.abs(leftData.data[i + 2] - rightData.data[i + 2])

      // Highlight differences in red
      if (rDiff > 10 || gDiff > 10 || bDiff > 10) {
        diffData.data[i] = 255     // R
        diffData.data[i + 1] = 0   // G
        diffData.data[i + 2] = 0   // B
        diffData.data[i + 3] = 255 // A
      } else {
        // Same pixels shown in grayscale
        const avg = (leftData.data[i] + leftData.data[i + 1] + leftData.data[i + 2]) / 3
        diffData.data[i] = avg
        diffData.data[i + 1] = avg
        diffData.data[i + 2] = avg
        diffData.data[i + 3] = 255
      }
    }

    ctx.putImageData(diffData, 0, 0)
  }

  leftImg.onload = () => {
    leftLoaded = true
    drawDifference()
  }

  rightImg.onload = () => {
    rightLoaded = true
    drawDifference()
  }

  leftImg.src = leftImage
  rightImg.src = rightImage
}