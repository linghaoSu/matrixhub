const INLINE_LABEL_HORIZONTAL_PADDING = 32
// Canvas measurement and DOM layout round sub-pixel widths differently;
// reserve a small buffer so borderline labels don't clip by 1px.
const MEASUREMENT_BUFFER = 2

let measureContext: CanvasRenderingContext2D | null = null

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') {
    return null
  }

  measureContext ??= document.createElement('canvas').getContext('2d')

  return measureContext
}

export function measureTextWidth(text: string, font: string): number {
  const context = getMeasureContext()

  if (!context) {
    return 0
  }

  context.font = font

  return context.measureText(text).width
}

function getBodySmFont(): string {
  if (typeof document === 'undefined') {
    return ''
  }

  const bodyStyle = window.getComputedStyle(document.body)
  const fontSize = bodyStyle.getPropertyValue('--mantine-font-size-sm').trim()
    || bodyStyle.fontSize
  const fontFamily = bodyStyle.fontFamily || 'sans-serif'

  return `${fontSize} ${fontFamily}`
}

export interface InlineLabelColumnWidthOptions {
  min?: number
  max?: number
}

// Shared width for a group of inline field labels: widest translated label
// plus the section's horizontal padding, clamped to [min, max]. Labels wider
// than max fall back to truncation with a tooltip.
export function getInlineLabelColumnWidth(
  labels: readonly string[],
  {
    min = 80, max = 160,
  }: InlineLabelColumnWidthOptions = {},
): number {
  const font = getBodySmFont()

  if (!font) {
    return min
  }

  const widest = labels.reduce(
    (width, label) => Math.max(width, measureTextWidth(label, font)),
    0,
  )

  return Math.min(
    max,
    Math.max(min, Math.ceil(widest + INLINE_LABEL_HORIZONTAL_PADDING + MEASUREMENT_BUFFER)),
  )
}
