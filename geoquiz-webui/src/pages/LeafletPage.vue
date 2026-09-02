<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LeafletWorldMap from '@/components/LeafletWorldMap.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const router = useRouter()
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

function goToMapLibre() {
  void router.push('/')
}

function goToFlagQuiz() {
  void router.push('/flag-quiz')
}

function goToMapQuiz() {
  void router.push('/mapquiz')
}
</script>

<template>
  <div class="relative h-full w-full overflow-hidden">
    <LeafletWorldMap class="absolute inset-0" @ready="onReady" @error="onError" />

    <div class="pointer-events-none absolute left-4 top-4 z-10 max-w-sm">
      <Card class="pointer-events-auto bg-white/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Geoquiz</CardTitle>
          <CardDescription>{{ status }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
          <div class="flex flex-wrap gap-2">
            <Button v-if="errorMessage" size="sm" @click="reloadPage">Retry</Button>
            <Button size="sm" variant="outline" @click="goToMapLibre">MapLibre</Button>
            <Button size="sm" variant="outline" @click="goToFlagQuiz">Flag quiz</Button>
            <Button size="sm" variant="outline" @click="goToMapQuiz">Map quiz</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
