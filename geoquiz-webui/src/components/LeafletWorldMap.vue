<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import L, { type GeoJSON as LeafletGeoJSON, type Layer, type Map as LeafletMap, type Path } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchCountriesGeoJSON } from '@/lib/api'
import {
  REVEAL_MS,
  countryNameFromProperties,
  escapeHtml,
  withCountryColors,
} from '@/lib/countryColors'

const emit = defineEmits<{
  ready: []
  error: [message: string]
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const mapRef = shallowRef<LeafletMap | null>(null)
const countriesLayerRef = shallowRef<LeafletGeoJSON | null>(null)
const highlightedLayerRef = shallowRef<Path | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const DEFAULT_STYLE = {
  weight: 0.8,
  opacity: 0.35,
  color: '#0f172a',
  fillOpacity: 0.72,
}

const HIGHLIGHT_STYLE = {
  weight: 1.4,
  opacity: 0.8,
  color: '#0f172a',
  fillColor: '#ffffff',
  fillOpacity: 0.55,
}

function clearReveal() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  const map = mapRef.value
  map?.closePopup()

  const highlighted = highlightedLayerRef.value
  if (highlighted) {
    countriesLayerRef.value?.resetStyle(highlighted)
    highlightedLayerRef.value = null
  }
}

function revealCountry(layer: Layer, name: string, latlng: L.LatLng) {
  clearReveal()

  if (layer instanceof L.Path) {
    layer.setStyle(HIGHLIGHT_STYLE)
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront()
    }
    highlightedLayerRef.value = layer
  }

  const map = mapRef.value
  if (!map) return

  L.popup({
    closeButton: false,
    autoClose: false,
    closeOnClick: false,
    className: 'country-name-popup',
    offset: L.point(0, -12),
  })
    .setLatLng(latlng)
    .setContent(`<strong>${escapeHtml(name)}</strong>`)
    .openOn(map)

  hideTimer = setTimeout(() => {
    clearReveal()
  }, REVEAL_MS)
}

async function initMap() {
  if (!mapContainer.value) return

  const map = L.map(mapContainer.value, {
    center: [20, 10],
    zoom: 2,
    minZoom: 1,
    maxZoom: 8,
    zoomControl: false,
    attributionControl: false,
  })

  L.control.zoom({ position: 'topright' }).addTo(map)
  L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 8,
  }).addTo(map)

  mapRef.value = map

  try {
    const geojson = withCountryColors(await fetchCountriesGeoJSON())

    const countriesLayer = L.geoJSON(geojson as GeoJSON.GeoJsonObject, {
      style: (feature) => ({
        ...DEFAULT_STYLE,
        fillColor: String(feature?.properties?.color ?? '#94a3b8'),
      }),
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: () => {
            map.getContainer().style.cursor = 'pointer'
          },
          mouseout: () => {
            map.getContainer().style.cursor = ''
          },
          click: (event) => {
            const name = countryNameFromProperties(
              feature.properties as Record<string, unknown> | null | undefined,
            )
            revealCountry(layer, name, event.latlng)
          },
        })
      },
    }).addTo(map)

    countriesLayerRef.value = countriesLayer

    // Leaflet measures the container on init; fix tiles if layout settles after mount.
    requestAnimationFrame(() => {
      map.invalidateSize()
    })

    emit('ready')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load map data'
    emit('error', message)
  }
}

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  clearReveal()
  mapRef.value?.remove()
  mapRef.value = null
  countriesLayerRef.value = null
  highlightedLayerRef.value = null
})
</script>

<template>
  <div ref="mapContainer" class="h-full w-full" />
</template>

<style>
.country-name-popup .leaflet-popup-content-wrapper {
  padding: 0.25rem 0.35rem;
  border-radius: 0.5rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
}

.country-name-popup .leaflet-popup-content {
  margin: 0.35rem 0.55rem;
  font-size: 0.95rem;
}

.country-name-popup .leaflet-popup-tip-container {
  display: none;
}
</style>
