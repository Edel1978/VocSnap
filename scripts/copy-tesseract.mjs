// Kopiert Tesseract-Worker, -Kern und Sprachdaten nach public/tesseract, damit der Scan ohne fremdes CDN läuft.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const out = 'public/tesseract'
rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'lang'), { recursive: true })

cpSync('node_modules/tesseract.js/dist/worker.min.js', join(out, 'worker.min.js'))
for (const f of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js']) {
  cpSync(join('node_modules/tesseract.js-core', f), join(out, f))
}

// Alle installierten Pakete @tesseract.js-data/<sprache>, kompakte Variante.
const dataDir = 'node_modules/@tesseract.js-data'
for (const lang of existsSync(dataDir) ? readdirSync(dataDir) : []) {
  cpSync(join(dataDir, lang, '4.0.0_best_int', `${lang}.traineddata.gz`), join(out, 'lang', `${lang}.traineddata.gz`))
}
