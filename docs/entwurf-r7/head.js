// Gemeinsamer Kopf: Schriften, CSS der App, Icons per data-i.
const P = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10', book: 'M4 5h16v14H4zM8 9h8M8 13h5', trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12h2M3 12h2M12 3v2M12 19v2M17 7l1.5-1.5M5.5 18.5L7 17M17 17l1.5 1.5M5.5 5.5L7 7', play: 'M7 4.5v15l12-7.5z',
  flame: 'M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 11.5C8 9 9.5 8 9.5 6c2 1 2.5 2.5 2.5 2.5S13 6 12 3zM10 14.5a2 2 0 0 0 4 0c0-1.5-2-2.5-2-4-1 1-2 2.5-2 4z',
  calendar: 'M3.5 5h17v15h-17zM3.5 10h17M8 3v4M16 3v4', camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', plus: 'M12 5v14M5 12h14',
  chevron: 'M9 6l6 6-6 6', check: 'M5 12.5l4.5 4.5L19 7', list: 'M9 6h11M9 12h11M9 18h11M4.5 6h0M4.5 12h0M4.5 18h0', sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z', keyboard: 'M3 6h18v12H3zM7 10h0M11 10h0M15 10h0M7 14h10', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4', redo: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4', pencil: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', back: 'M15 6l-6 6 6 6',
  cards: 'M7 4h11a2 2 0 0 1 2 2v11M4 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', ear: 'M6 10a6 6 0 1 1 12 0c0 3-2 4-3 5.5S14 19 12 20a3 3 0 0 1-3-2M9 10a3 3 0 0 1 6 0',
  puzzle: 'M10 4h4v3a2 2 0 1 0 4 0V4h2v6h-3a2 2 0 1 0 0 4h3v6h-6v-3a2 2 0 1 0-4 0v3H4v-6h3a2 2 0 1 0 0-4H4V4z', mic: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7',
}
document.querySelectorAll('[data-i]').forEach((el) => {
  el.innerHTML = `<svg viewBox="0 0 24 24" class="${el.getAttribute('class') ?? 'size-6'}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${P[el.dataset.i]}"/></svg>`
  el.removeAttribute('class')
  el.style.display = 'contents'
})
// Snappy als kleines Bild aus der App ist nicht verfügbar: einfache Karte mit Gesicht.
document.querySelectorAll('[data-snappy]').forEach((el) => {
  el.innerHTML = `<svg viewBox="0 0 100 100" class="${el.getAttribute('class')}"><rect x="14" y="20" width="72" height="66" rx="14" fill="#fff" stroke="#1e1b4b" stroke-width="5" transform="rotate(-6 50 53)"/><path d="M18 34 Q20 18 36 18 L70 14 Q84 13 86 28 L86 32 Z" fill="#fb923c" stroke="#1e1b4b" stroke-width="5" transform="rotate(-6 50 53)"/><circle cx="38" cy="54" r="5" fill="#1e1b4b"/><circle cx="62" cy="51" r="5" fill="#1e1b4b"/><path d="M40 66 Q50 74 61 64" stroke="#1e1b4b" stroke-width="4.5" fill="none" stroke-linecap="round"/><circle cx="30" cy="63" r="4" fill="#fda4af"/><circle cx="71" cy="59" r="4" fill="#fda4af"/></svg>`
  el.removeAttribute('class'); el.style.display = 'contents'
})
