import { API_BASE } from '@/lib/auth'

export type Country = {
  id: number
  name: string
  iso: string
}

export type CountryFeature = {
  type: 'Feature'
  id?: number
  properties: {
    id: number
    name: string
    iso: string
    color?: string
  }
  geometry: GeoJSON.Geometry
}

export type CountryGeoJSON = {
  type: 'FeatureCollection'
  features: CountryFeature[]
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export function fetchCountries(): Promise<Country[]> {
  return apiGet<Country[]>('/api/v1/countries')
}

export function fetchCountriesGeoJSON(): Promise<CountryGeoJSON> {
  return apiGet<CountryGeoJSON>('/api/v1/countries/geojson')
}

export function fetchCountryNeighbors(id: number): Promise<Country[]> {
  return apiGet<Country[]>(`/api/v1/countries/${id}/neighbors`)
}

export function flagUrl(iso: string, width = 320): string {
  return `https://flagcdn.com/w${width}/${iso.toLowerCase()}.png`
}
