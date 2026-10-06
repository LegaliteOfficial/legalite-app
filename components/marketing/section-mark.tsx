/**
 * Section label for the marketing site, set like a clause reference in a
 * legal document: a section sign and number, a short gold rule, then the
 * label. Pass `light` when it sits on a dark photo or navy band.
 */
export function SectionMark({
  n,
  children,
  light = false,
}: {
  n?: string
  children: React.ReactNode
  light?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[2.5px] ${
        light ? 'text-[#F2C65A]' : 'text-[#A67A1C]'
      }`}
    >
      {n && (
        <span className="[font-family:Literata,'Times_New_Roman',serif] text-sm normal-case tracking-normal">
          &sect;&nbsp;{n}
        </span>
      )}
      <span className={`h-px w-8 ${light ? 'bg-[#F2C65A]/60' : 'bg-[#C9972B]/60'}`} aria-hidden />
      {children}
    </div>
  )
}

/**
 * Small caption under a photo, styled as an exhibit label.
 */
export function PhotoCaption({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="mt-3 flex gap-2 text-xs text-[#0D1B2A]/50">
      <span className="font-semibold uppercase tracking-wider text-[#A67A1C]">{label}</span>
      {children}
    </p>
  )
}
