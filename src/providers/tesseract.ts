import { TESSERACT_ASSETS, TESSERACT_LANGS } from '../config/providers'
import { wordsToPairs, type OcrWord } from './layout'
import { ScanError, type OcrProvider, type ScanRequest, type ScanResult } from './types'

export function tesseractLangs(sourceLang: string, targetLang: string): string[] {
  return [...new Set([sourceLang, targetLang].map((l) => TESSERACT_LANGS[l]).filter(Boolean))]
}

export const tesseractProvider: OcrProvider = {
  id: 'tesseract',
  async recognize(req: ScanRequest): Promise<ScanResult> {
    // Erst bei Bedarf laden, hält das Hauptpaket klein.
    const { createWorker, PSM } = await import('tesseract.js')
    const langs = tesseractLangs(req.sourceLang, req.targetLang)
    const base = new URL(`${import.meta.env.BASE_URL}${TESSERACT_ASSETS}`, document.baseURI).href
    let worker: Awaited<ReturnType<typeof createWorker>> | undefined
    try {
      worker = await createWorker(langs.length ? langs : ['eng'], undefined, {
        workerPath: `${base}worker.min.js`,
        corePath: base,
        langPath: `${base}lang`,
        logger: (m) => {
          if (m.status === 'recognizing text') req.onProgress?.(m.progress)
        },
      })
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK, preserve_interword_spaces: '1' })
      const { data } = await worker.recognize(req.image, {}, { blocks: true })
      const words: OcrWord[] = (data.blocks ?? []).flatMap((b) =>
        b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words.map((w) => ({ text: w.text, ...w.bbox })))),
      )
      const { pairs, skipped } = wordsToPairs(words)
      return { provider: 'tesseract', words: pairs, skipped }
    } catch (e) {
      if (e instanceof ScanError) throw e
      // Ohne Service Worker (E5) kommen Kern und Sprachdaten beim ersten Mal noch aus dem Netz.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ScanError('offline')
      throw new ScanError('failed')
    } finally {
      await worker?.terminate()
    }
  },
}
