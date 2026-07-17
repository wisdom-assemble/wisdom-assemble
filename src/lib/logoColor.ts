// テナントのcolor_theme（hex）から3D押し出し効果用の影色（暗め・同系色）を生成する

function hexToHueSaturation(hex: string): { h: number; s: number } {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100) }
}

export function getLogoShadowShades(colorTheme: string): string[] {
  const { h, s } = hexToHueSaturation(colorTheme)
  return [5, 4, 3, 2, 1].map(i => `hsl(${h}, ${s}%, ${8 + i * 4}%)`)
}

// Sample Logo builderの3D押し出し(fx-3d)と同じdarken()。カスタムロゴのtreatment="3d"用。
export function darkenHex(hex: string, amt: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const dr = Math.max(0, Math.round(r * (1 - amt)))
  const dg = Math.max(0, Math.round(g * (1 - amt)))
  const db = Math.max(0, Math.round(b * (1 - amt)))
  return `rgb(${dr},${dg},${db})`
}
