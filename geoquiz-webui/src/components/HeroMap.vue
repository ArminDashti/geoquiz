<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import L, { type GeoJSON as LeafletGeoJSON, type Map as LeafletMap, type TileLayer } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchCountriesGeoJSON } from '@/lib/api'
import { withCountryColors } from '@/lib/countryColors'
import { getTheme, type Theme } from '@/lib/theme'

const mapContainer = ref<HTMLDivElement | null>(null)
const mapRef = shallowRef<LeafletMap | null>(null)
const tileRef = shallowRef<TileLayer | null>(null)
const countriesLayerRef = shallowRef<LeafletGeoJSON | null>(null)

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'

const STYLE = {
  weight: 0.6,
  opacity: 0.25,
  color: '#0f172a',
  fillOpacity: 0.55,
}

function tileUrl(theme: Theme): string {
  return theme === 'dark' ? DARK_TILES : LIGHT_TILES
}

function syncTiles(theme: Theme) {
  const map = mapRef.value
  if (!map) return

  if (tileRef.value) {
    map.removeLayer(tileRef.value)
  }

  tileRef.value = L.tileLayer(tileUrl(theme), {
    attribution: '',
    subdomains: 'abcd',
    maxZoom: 6,
  }).addTo(map)
}

async function initMap() {
  if (!mapContainer.value) return

  const map = L.map(mapContainer.value, {
    center: [18, 12],
    zoom: 2,
    minZoom: 2,
    maxZoom: 4,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
  })

  mapRef.value = map
  syncTiles(getTheme())

  try {
    const geojson = withCountryColors(await fetchCountriesGeoJSON())
    countriesLayerRef.value = L.geoJSON(geojson as GeoJSON.GeoJsonObject, {
      style: (feature) => ({
        ...STYLE,
        fillColor: String(feature?.properties?.color ?? '#94a3b8'),
      }),
      interactive: false,
    }).addTo(map)
  } catch {
    // Decorative only — leave basemap if countries fail to load.
  }

  requestAnimationFrame(() => {
    map.invalidateSize()
  })
}

function onThemeStorage(event: StorageEvent) {
  if (event.key !== 'geoquiz-theme') return
  syncTiles(getTheme())
}

function onDocumentClassChange() {
  syncTiles(getTheme())
}

let observer: MutationObserver | null = null

onMounted(() => {
  void initMap()
  window.addEventListener('storage', onThemeStorage)
  observer = new MutationObserver(onDocumentClassChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onThemeStorage)
  observer?.disconnect()
  observer = null
  mapRef.value?.remove()
  mapRef.value = null
  tileRef.value = null
  countriesLayerRef.value = null
})
</script>

<template>
  <div ref="mapContainer" class="h-full w-full" aria-hidden="true" />
</template>
