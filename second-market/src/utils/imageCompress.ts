// ========== 图片压缩工具 ==========
// Canvas 压缩：等比缩放到 maxEdge 边长 → toBlob 输出 Blob
export async function compressImage(
  file: File | Blob,
  maxEdge = 1280,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const { width, height } = img
      let w = width
      let h = height
      if (w > maxEdge || h > maxEdge) {
        const ratio = Math.min(maxEdge / w, maxEdge / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('canvas.toBlob 返回 null'))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

/** 批量压缩 */
export async function compressImages(files: File[], maxEdge = 1280, quality = 0.8): Promise<Blob[]> {
  return Promise.all(files.map(f => compressImage(f, maxEdge, quality)))
}

/** Blob → object URL 辅助（组件卸载时记得 revokeObjectURL） */
export function blobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}
