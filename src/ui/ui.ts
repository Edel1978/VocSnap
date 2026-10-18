// Gemeinsame Klassen im Stil A3. Seiten nutzen nur diese, damit das Aussehen an einer Stelle bleibt.
export const card = 'rounded-3xl bg-white p-4 shadow-card dark:bg-slate-900 dark:shadow-card-dark'
export const input =
  'w-full rounded-2xl border-2 border-slate-200 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800'
export const press = 'transition-[transform,box-shadow] duration-150 active:translate-y-1'
export const button = `rounded-2xl bg-white px-3 py-2 text-sm font-bold text-indigo-700 shadow-card disabled:opacity-40 dark:bg-slate-800 dark:text-indigo-300 dark:shadow-card-dark ${press}`
export const primary = `rounded-2xl bg-orange-400 px-4 py-3.5 text-center font-display text-lg font-bold text-indigo-950 shadow-press active:shadow-[0_1px_0_#c2410c] disabled:opacity-40 disabled:active:translate-y-0 ${press}`
export const secondary = `rounded-2xl bg-indigo-600 px-4 py-3 text-center font-display font-semibold text-white shadow-press-indigo active:shadow-[0_1px_0_#3730a3] disabled:opacity-40 ${press}`
export const danger = 'rounded-xl px-3 py-2 text-sm font-bold text-rose-600 dark:text-rose-400'
export const muted = 'text-sm text-slate-500 dark:text-slate-400'
export const heading = 'mb-3 font-display text-lg font-semibold text-indigo-950 dark:text-slate-100'
export const chosen = 'bg-indigo-600 text-white shadow-press-indigo'
export const choice = 'bg-slate-100 dark:bg-slate-800'
