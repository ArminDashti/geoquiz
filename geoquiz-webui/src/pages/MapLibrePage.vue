<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import WorldMap from '@/components/WorldMap.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const status = ref('Loading map…')
const errorMessage = ref<string | null>(null)

function onReady() {
  status.value = 'Click a country to reveal its name for 5 seconds. Zoom with +/- or scroll.'
  errorMessage.value = null
}

function onError(message: string) {
  status.value = 'Map unavailable'
  errorMessage.value = message
}

function reloadPage() {
  window.location.reload()
}
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <WorldMap class="absolute inset-0" @ready="onReady" @error="onError" />

    <div class="pointer-events-none absolute left-4 top-4 z-10 max-w-sm">
      <Card class="pointer-events-auto bg-white/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Geoquiz</CardTitle>
          <CardDescription>{{ status }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
          <Button v-if="errorMessage" size="sm" @click="reloadPage">Retry</Button>
          <p class="text-xs text-muted-foreground">
            MapLibre ·
            <RouterLink class="underline hover:text-foreground" to="/map">Map</RouterLink>
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
