// 检测是否为二进制文件
export function isBinaryFile(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() || ''

  const binaryExtensions = [
    // 文档格式
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp',
    // 可执行文件
    'exe', 'dll', 'so', 'dylib', 'app', 'deb', 'rpm',
    // 压缩文件
    'zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz',
    // 图片
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'tiff', 'tif', 'svg',
    // 音视频
    'mp3', 'mp4', 'avi', 'mov', 'wav', 'flac', 'ogg', 'wmv', 'mkv', 'webm',
    // 数据库
    'db', 'sqlite', 'sqlite3',
    // 其他二进制
    'bin', 'dat', 'iso', 'dmg', 'pkg',
  ]

  return binaryExtensions.includes(ext)
}

// 获取文件类型描述
export function getFileTypeDescription(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''

  const typeMap: Record<string, string> = {
    pdf: 'PDF Document',
    doc: 'Word Document',
    docx: 'Word Document',
    xls: 'Excel Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    ppt: 'PowerPoint Presentation',
    pptx: 'PowerPoint Presentation',
    png: 'PNG Image',
    jpg: 'JPEG Image',
    jpeg: 'JPEG Image',
    gif: 'GIF Image',
    zip: 'ZIP Archive',
    exe: 'Executable',
    mp3: 'Audio File',
    mp4: 'Video File',
  }

  return typeMap[ext] || 'Binary File'
}