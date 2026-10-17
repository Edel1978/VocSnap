import { speechLang } from '../config/languages'

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// Spricht den Text mit einer Stimme der Sprache, falls vorhanden. Liefert false, wenn keine Sprachausgabe da ist.
export function speak(text: string, lang: string): boolean {
  if (!canSpeak()) return false
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = speechLang(lang)
  const prefix = u.lang.slice(0, 2)
  const voice =
    synth.getVoices().find((v) => v.lang === u.lang) ?? synth.getVoices().find((v) => v.lang.startsWith(prefix))
  if (voice) u.voice = voice
  u.rate = 0.9
  synth.speak(u)
  return true
}
