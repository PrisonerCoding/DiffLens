import type { FileContent } from '../types'

interface DiffReportOptions {
  leftFile: FileContent
  rightFile: FileContent
  diffStats: {
    added: number
    removed: number
    modified: number
  }
  showLineNumbers?: boolean
}

export function generateDiffReport(options: DiffReportOptions): string {
  const { leftFile, rightFile, diffStats, showLineNumbers = true } = options

  const timestamp = new Date().toLocaleString()
  const leftFileName = leftFile.path.split(/[/\\]/).pop() || leftFile.path
  const rightFileName = rightFile.path.split(/[/\\]/).pop() || rightFile.path

  // Compute line-level diff
  const leftLines = leftFile.content.split('\n')
  const rightLines = rightFile.content.split('\n')

  const diffHtml = generateDiffHtml(leftLines, rightLines, showLineNumbers)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diff Report: ${leftFileName} vs ${rightFileName}</title>
  <style>
    :root {
      --bg-primary: #1a1a2e;
      --bg-secondary: #16213e;
      --bg-tertiary: #0f3460;
      --text-primary: #eaeaea;
      --text-secondary: #a0a0a0;
      --text-muted: #6b6b6b;
      --diff-added-bg: rgba(46, 160, 67, 0.15);
      --diff-added-line: #2ea043;
      --diff-removed-bg: rgba(248, 81, 73, 0.15);
      --diff-removed-line: #f85149;
      --diff-modified-bg: rgba(210, 153, 34, 0.15);
      --diff-modified-line: #d29922;
      --border-color: #2a2a4a;
      --accent-primary: #e94560;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      padding: 20px;
    }

    .report-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .report-header {
      background: var(--bg-secondary);
      padding: 24px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      margin-bottom: 24px;
    }

    .report-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-primary);
    }

    .report-meta {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .report-meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .report-meta-label {
      font-size: 12px;
      color: var(--text-muted);
    }

    .report-meta-value {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .report-stats {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }

    .stat-item {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
    }

    .stat-item.added {
      background: var(--diff-added-bg);
      color: var(--diff-added-line);
    }

    .stat-item.removed {
      background: var(--diff-removed-bg);
      color: var(--diff-removed-line);
    }

    .stat-item.modified {
      background: var(--diff-modified-bg);
      color: var(--diff-modified-line);
    }

    .files-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .file-panel {
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .file-header {
      background: var(--bg-tertiary);
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .file-badge {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }

    .file-badge.left {
      background: linear-gradient(135deg, #f85149 0%, #c93632 100%);
    }

    .file-badge.right {
      background: linear-gradient(135deg, #2ea043 0%, #238636 100%);
    }

    .file-name {
      font-size: 14px;
      color: var(--text-primary);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-path {
      font-size: 12px;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .file-content {
      padding: 16px;
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.6;
      max-height: 600px;
      overflow-y: auto;
    }

    .diff-line {
      display: flex;
      padding: 2px 0;
      white-space: pre;
    }

    .line-number {
      width: 50px;
      color: var(--text-muted);
      text-align: right;
      padding-right: 12px;
      user-select: none;
      opacity: 0.5;
    }

    .line-content {
      flex: 1;
      padding: 0 8px;
    }

    .diff-line.added {
      background: var(--diff-added-bg);
    }

    .diff-line.added .line-content {
      color: var(--diff-added-line);
    }

    .diff-line.removed {
      background: var(--diff-removed-bg);
    }

    .diff-line.removed .line-content {
      color: var(--diff-removed-line);
    }

    .diff-line.equal {
      background: transparent;
    }

    .diff-line.equal .line-content {
      color: var(--text-secondary);
    }

    .diff-indicator {
      width: 20px;
      text-align: center;
      font-weight: 600;
    }

    .diff-indicator.added {
      color: var(--diff-added-line);
    }

    .diff-indicator.removed {
      color: var(--diff-removed-line);
    }

    .report-footer {
      margin-top: 24px;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      text-align: center;
      color: var(--text-muted);
      font-size: 12px;
    }

    @media (max-width: 768px) {
      .files-section {
        grid-template-columns: 1fr;
      }

      .report-meta {
        flex-direction: column;
        gap: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <h1 class="report-title">Diff Comparison Report</h1>
      <div class="report-meta">
        <div class="report-meta-item">
          <span class="report-meta-label">Left File</span>
          <span class="report-meta-value">${leftFileName}</span>
        </div>
        <div class="report-meta-item">
          <span class="report-meta-label">Right File</span>
          <span class="report-meta-value">${rightFileName}</span>
        </div>
        <div class="report-meta-item">
          <span class="report-meta-label">Generated</span>
          <span class="report-meta-value">${timestamp}</span>
        </div>
        <div class="report-meta-item">
          <span class="report-meta-label">Language</span>
          <span class="report-meta-value">${leftFile.language || 'plaintext'}</span>
        </div>
      </div>
      <div class="report-stats">
        <span class="stat-item added">+${diffStats.added} added</span>
        <span class="stat-item removed">-${diffStats.removed} removed</span>
        <span class="stat-item modified">~${diffStats.modified} modified</span>
      </div>
    </div>

    <div class="files-section">
      <div class="file-panel">
        <div class="file-header">
          <span class="file-badge left">L</span>
          <span class="file-name">${leftFileName}</span>
          <span class="file-path">${leftFile.path}</span>
        </div>
        <div class="file-content">
          ${diffHtml.left}
        </div>
      </div>

      <div class="file-panel">
        <div class="file-header">
          <span class="file-badge right">R</span>
          <span class="file-name">${rightFileName}</span>
          <span class="file-path">${rightFile.path}</span>
        </div>
        <div class="file-content">
          ${diffHtml.right}
        </div>
      </div>
    </div>

    <div class="report-footer">
      Generated by Beyond Compare Clone • ${timestamp}
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function generateDiffHtml(
  leftLines: string[],
  rightLines: string[],
  showLineNumbers: boolean
): { left: string; right: string } {
  // Simple line-by-line comparison
  const leftHtml: string[] = []
  const rightHtml: string[] = []

  const leftSet = new Set(leftLines)
  const rightSet = new Set(rightLines)

  for (let i = 0; i < leftLines.length; i++) {
    const line = leftLines[i]
    const rightHasLine = rightSet.has(line)
    const rightHasSameIndex = i < rightLines.length && rightLines[i] === line

    const status = rightHasSameIndex ? 'equal' : (rightHasLine ? 'modified' : 'removed')
    const indicator = status === 'removed' ? '-' : (status === 'modified' ? '~' : ' ')
    const lineNum = showLineNumbers ? `<span class="line-number">${i + 1}</span>` : ''

    leftHtml.push(`<div class="diff-line ${status}">
      ${lineNum}
      <span class="diff-indicator ${status}">${indicator}</span>
      <span class="line-content">${escapeHtml(line)}</span>
    </div>`)
  }

  for (let i = 0; i < rightLines.length; i++) {
    const line = rightLines[i]
    const leftHasLine = leftSet.has(line)
    const leftHasSameIndex = i < leftLines.length && leftLines[i] === line

    const status = leftHasSameIndex ? 'equal' : (leftHasLine ? 'modified' : 'added')
    const indicator = status === 'added' ? '+' : (status === 'modified' ? '~' : ' ')
    const lineNum = showLineNumbers ? `<span class="line-number">${i + 1}</span>` : ''

    rightHtml.push(`<div class="diff-line ${status}">
      ${lineNum}
      <span class="diff-indicator ${status}">${indicator}</span>
      <span class="line-content">${escapeHtml(line)}</span>
    </div>`)
  }

  return {
    left: leftHtml.join('\n'),
    right: rightHtml.join('\n'),
  }
}

export function downloadReport(htmlContent: string, fileName: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}