import type { CountryGeoJSON } from '@/lib/api'

export const REVEAL_MS = 5000

const PALETTE = [
  '#38bdf8',
  '#22d3ee',
  '#34d399',
  '#a3e635',
  '#fbbf24',
  '#fb923c',
  '#f87171',
  '#e879f9',
  '#a78bfa',
  '#60a5fa',
  '#2dd4bf',
  '#f472b6',
]

export function colorForCountryId(id: number): string {
  const index = Math.abs(id) % PALETTE.length
  return PALETTE[index] ?? '#94a3b8'
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function countryNameFromProperties(
  properties: Record<string, unknown> | null | undefined,
): string {
  if (!properties) return 'Unknown'
  const name = properties.name
  return typeof name === 'string' && name ? name : 'Unknown'
}

export function withCountryColors(geojson: CountryGeoJSON): CountryGeoJSON {
  return {
    ...geojson,
    features: geojson.features.map((feature) => {
      const id = feature.properties?.id ?? feature.id ?? 0
      return {
        ...feature,
        properties: {
          ...feature.properties,
          color: feature.properties.color ?? colorForCountryId(id),
        },
      }
    }),
  }
}
