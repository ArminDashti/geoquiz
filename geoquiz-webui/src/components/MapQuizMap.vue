<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import L, { type GeoJSON as LeafletGeoJSON, type Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { CountryGeoJSON } from '@/lib/api'
import { colorForCountryId, escapeHtml } from '@/lib/countryColors'

const props = defineProps<{
  geojson: CountryGeoJSON | null
  targetId: number | null
  neighborIds: number[]
  answered?: boolean
}>()

const emit = defineEmits<{
  ready: []
  error: [message: string]
}>()

const mapContainer = shallowRef<HTMLDivElement | null>(null)
const mapRef = shallowRef<LeafletMap | null>(null)
const quizLayerRef = shallowRef<LeafletGeoJSON | null>(null)
const labelMarkersRef = shallowRef<L.Marker[]>([])

const BASE_PATH_STYLE = {
  weight: 1,
  opacity: 0.75,
  color: '#0f172a',
  fillOpacity: 0.72,
}

function clearQuizLayers() {
  const map = mapRef.value
  if (!map) return

  if (quizLayerRef.value) {
    map.removeLayer(quizLayerRef.value)
    quizLayerRef.value = null
  }

  for (const marker of labelMarkersRef.value) {
    map.removeLayer(marker)
  }
  labelMarkersRef.value = []
}

function randomCrop(bounds: L.LatLngBounds): L.LatLngBounds {
  const south = bounds.getSouth()
  const north = bounds.getNorth()
  const west = bounds.getWest()
  const east = bounds.getEast()

  const height = Math.max(north - south, 0.05)
  const width = Math.max(east - west, 0.05)
  const frac = 0.35 + Math.random() * 0.2
  const cropH = height * frac
  const cropW = width * frac

  const maxSouth = north - cropH
  const maxWest = east - cropW
  const cropSouth = south + Math.random() * Math.max(maxSouth - south, 0)
  const cropWest = west + Math.random() * Math.max(maxWest - west, 0)

  return L.latLngBounds(
    [cropSouth, cropWest],
    [cropSouth + cropH, cropWest + cropW],
  )
}

function centroidOfLayer(layer: L.Layer): L.LatLng | null {
  if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
    return layer.getBounds().getCenter()
  }
  if ('getBounds' in layer && typeof (layer as L.FeatureGroup).getBounds === 'function') {
    return (layer as L.FeatureGroup).getBounds().getCenter()
  }
  return null
}

function featureId(feature: GeoJSON.Feature | undefined): number | undefined {
  const id = feature?.properties && (feature.properties as { id?: number }).id
  return typeof id === 'number' ? id : undefined
}

function fillColorForFeature(feature: GeoJSON.Feature | undefined, isTarget: boolean): string {
  if (isTarget && props.answered) return '#4ade80'
  const propsColor = feature?.properties && (feature.properties as { color?: string }).color
  if (typeof propsColor === 'string' && propsColor) return propsColor
  const id = featureId(feature)
  return colorForCountryId(id ?? 0)
}

function styleForFeature(feature?: GeoJSON.Feature): L.PathOptions {
  const id = featureId(feature)
  const isTarget = id === props.targetId
  return {
    ...BASE_PATH_STYLE,
    weight: isTarget ? 2 : 1,
    opacity: isTarget ? 0.95 : 0.7,
    fillOpacity: isTarget ? 0.85 : 0.65,
    fillColor: fillColorForFeature(feature, isTarget),
  }
}

/** Apply path style to Polygon and MultiPolygon (FeatureGroup of polygons). */
function applyStyleToLayer(layer: L.Layer, style: L.PathOptions) {
  if (layer instanceof L.Path) {
    layer.setStyle(style)
    return
  }
  if (layer instanceof L.LayerGroup) {
    layer.eachLayer((child) => applyStyleToLayer(child, style))
  }
}

function applyTargetStyle() {
  const layer = quizLayerRef.value
  if (!layer) return

  layer.eachLayer((child) => {
    const feature = (child as L.Layer & { feature?: GeoJSON.Feature }).feature
    if (featureId(feature) !== props.targetId) return
    applyStyleToLayer(child, styleForFeature(feature))
  })
}

function renderRound() {
  const map = mapRef.value
  if (!map || !props.geojson || props.targetId === null) return

  clearQuizLayers()

  const neighborSet = new Set(props.neighborIds)
  const visibleIds = new Set<number>([props.targetId, ...props.neighborIds])

  const filtered: CountryGeoJSON = {
    type: 'FeatureCollection',
    features: props.geojson.features.filter((feature) => {
      const id = feature.properties?.id ?? feature.id
      return typeof id === 'number' && visibleIds.has(id)
    }),
  }

  if (filtered.features.length === 0) {
    emit('error', 'No geometry for this round')
    return
  }

  let targetLayer: L.Layer | null = null

  const quizLayer = L.geoJSON(filtered as GeoJSON.GeoJsonObject, {
    style: (feature) => styleForFeature(feature as GeoJSON.Feature | undefined),
    onEachFeature: (feature, layer) => {
      const id = feature.properties?.id as number | undefined
      const name = String(feature.properties?.name ?? '')

      // Ensure MultiPolygon groups inherit the feature color on every ring.
      applyStyleToLayer(layer, styleForFeature(feature as GeoJSON.Feature))

      if (id === props.targetId) {
        targetLayer = layer
        return
      }

      if (id !== undefined && neighborSet.has(id) && name) {
        const center = centroidOfLayer(layer)
        if (!center) return

        const marker = L.marker(center, {
          interactive: false,
          icon: L.divIcon({
            className: 'map-quiz-neighbor-label',
            html: `<span>${escapeHtml(name)}</span>`,
            iconSize: undefined,
            iconAnchor: [0, 0],
          }),
        })
        marker.addTo(map)
        labelMarkersRef.value.push(marker)
      }
    },
  }).addTo(map)

  quizLayerRef.value = quizLayer

  const boundsSource =
    targetLayer && 'getBounds' in targetLayer
      ? (targetLayer as L.Polygon | L.FeatureGroup).getBounds()
      : quizLayer.getBounds()

  if (!boundsSource.isValid()) {
    emit('error', 'Invalid country bounds')
    return
  }

  const crop = randomCrop(boundsSource)
  const paddedMax = boundsSource.pad(0.35)
  map.setMaxBounds(paddedMax)
  map.fitBounds(crop, { animate: false, padding: [24, 24], maxZoom: 8 })

  requestAnimationFrame(() => {
    map.invalidateSize()
  })
}

function initMap() {
  if (!mapContainer.value) return

  const map = L.map(mapContainer.value, {
    center: [20, 10],
    zoom: 2,
    minZoom: 1,
    maxZoom: 8,
    zoomControl: false,
    attributionControl: false,
    maxBoundsViscosity: 0.85,
  })

  L.control.zoom({ position: 'topright' }).addTo(map)
  L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 8,
  }).addTo(map)

  mapRef.value = map

  requestAnimationFrame(() => {
    map.invalidateSize()
  })

  emit('ready')
  renderRound()
}

watch(
  () => [props.targetId, props.neighborIds.join(','), props.geojson] as const,
  () => {
    renderRound()
  },
)

watch(
  () => props.answered,
  () => {
    applyTargetStyle()
  },
)

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  clearQuizLayers()
  mapRef.value?.remove()
  mapRef.value = null
})
</script>

<template>
  <div ref="mapContainer" class="h-full w-full" />
</template>

<style>
.map-quiz-neighbor-label {
  background: transparent;
  border: none;
}

.map-quiz-neighbor-label span {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border-radius: 0.35rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
  color: #0f172a;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  transform: translate(-50%, -50%);
}
</style>
