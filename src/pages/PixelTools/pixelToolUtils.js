/** 序列帧按文件名自然排序，保证 GIF 合成顺序正确 */
export function sortFilesByName(files) {
  return [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}

export function revokeObjectUrl(url) {
  if (url) URL.revokeObjectURL(url)
}
