/**
 * Shared class names for the public marketing site.
 *
 * Every marketing page uses the same light palette: cream page, white
 * surfaces, navy type, gold accents. Keeping the tokens here means a page
 * never drifts back to its own one-off colours.
 */

export const serif = "[font-family:Literata,'Times_New_Roman',serif]"

export const mk = {
  section: 'px-6 lg:px-12 py-20 lg:py-28',
  container: 'mx-auto max-w-[1400px]',

  h1: `text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-7xl ${serif} font-semibold tracking-[-1.5px] text-[#0D1B2A]`,
  h2: `text-3xl leading-[1.08] sm:text-4xl lg:text-5xl ${serif} font-semibold tracking-tight text-[#0D1B2A]`,
  h3: `text-xl leading-snug sm:text-2xl ${serif} font-semibold text-[#0D1B2A]`,
  lead: 'text-lg leading-relaxed text-[#0D1B2A]/65',
  body: 'text-[15px] leading-relaxed text-[#0D1B2A]/65',
  gold: 'text-[#A67A1C]',

  primaryCta:
    'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold text-[#0D1B2A] bg-gradient-to-b from-[#F2C65A] to-[#C9972B] shadow-[0_12px_28px_-12px_rgba(201,151,43,0.9),0_1px_0_rgba(255,255,255,0.45)_inset] transition hover:brightness-105',
  darkCta:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-[#0D1B2A] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#16283D]',
  outlineCta:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-[#0D1B2A]/15 bg-white px-6 py-3.5 text-sm font-semibold text-[#0D1B2A] transition hover:border-[#C9972B]',
  textLink:
    'inline-flex items-center gap-2 text-sm font-semibold text-[#A67A1C] transition-all hover:gap-3',

  card: 'rounded-2xl border border-[#0D1B2A]/[0.08] bg-white',
  photo: 'relative overflow-hidden rounded-2xl bg-[#E9E1D3]',
  shadow: 'shadow-[0_30px_60px_-34px_rgba(13,27,42,0.45)]',
}
