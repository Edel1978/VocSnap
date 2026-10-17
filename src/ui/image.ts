// Verkleinert ein Foto im Speicher. Das Original wird nirgends abgelegt.
export async function shrinkImage(file: Blob, maxEdge: number): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85))
    canvas.width = canvas.height = 0
    return blob ?? file
  } catch {
    return file
  }
}
