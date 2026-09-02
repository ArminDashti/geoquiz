<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MapQuizMap from '@/components/MapQuizMap.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  fetchCountries,
  fetchCountriesGeoJSON,
  fetchCountryNeighbors,
  type Country,
  type CountryGeoJSON,
} from '@/lib/api'
import { submitScore } from '@/lib/auth'

const TOTAL_ROUNDS = 10

const countries = ref<Country[]>([])
const geojson = ref<CountryGeoJSON | null>(null)
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const round = ref(0)
const correctCount = ref(0)
const target = ref<Country | null>(null)
const neighborIds = ref<number[]>([])
const choices = ref<Country[]>([])
const answered = ref(false)
const selectedId = ref<number | null>(null)
const finished = ref(false)
const saving = ref(false)

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

async function pickRound() {
  const pool = countries.value
  if (pool.length < 4) {
    errorMessage.value = 'Not enough countries for a quiz'
    return
  }

  let attempts = 0
  while (attempts < 40) {
    attempts += 1
    const candidate = pool[Math.floor(Math.random() * pool.length)]!
    try {
      const neighbors = await fetchCountryNeighbors(candidate.id)
      if (neighbors.length === 0) continue

      const distractorPool = pool.filter((c) => c.id !== candidate.id)
      const distractors = shuffle(distractorPool).slice(0, 3)
      if (distractors.length < 3) continue

      target.value = candidate
      neighborIds.value = neighbors.map((n) => n.id)
      choices.value = shuffle([candidate, ...distractors])
      answered.value = false
      selectedId.value = null
      return
    } catch {
      /* try another */
    }
  }
  errorMessage.value = 'Could not start a map quiz round'
}

async function load() {
  loading.value = true
  errorMessage.value = null
  try {
    const [list, gj] = await Promise.all([fetchCountries(), fetchCountriesGeoJSON()])
    countries.value = list
    geojson.value = gj
    round.value = 1
    correctCount.value = 0
    finished.value = false
    await pickRound()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load map quiz'
  } finally {
    loading.value = false
  }
}

async function finishQuiz() {
  finished.value = true
  saving.value = true
  try {
    await submitScore({
      quiz_type: 'map',
      correct: correctCount.value,
      total: TOTAL_ROUNDS,
    })
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Could not save score'
  } finally {
    saving.value = false
  }
}

function onChoose(country: Country) {
  if (answered.value || !target.value) return
  answered.value = true
  selectedId.value = country.id
  if (country.id === target.value.id) {
    correctCount.value += 1
  }
}

async function nextRound() {
  if (round.value >= TOTAL_ROUNDS) {
    await finishQuiz()
    return
  }
  round.value += 1
  await pickRound()
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="border-b border-border px-4 py-3">
      <h1 class="text-lg font-semibold">Map quiz</h1>
      <p class="text-sm text-muted-foreground">
        Round {{ Math.min(round, TOTAL_ROUNDS) }} / {{ TOTAL_ROUNDS }} · Score
        {{ correctCount }}
      </p>
    </div>

    <p v-if="loading" class="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
    <p v-else-if="errorMessage" class="px-4 py-6 text-sm text-red-600">{{ errorMessage }}</p>

    <div v-else-if="finished" class="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Quiz complete</CardTitle>
          <CardDescription>
            You scored {{ correctCount }} / {{ TOTAL_ROUNDS }}
            <span v-if="saving"> · saving…</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button @click="load">Play again</Button>
        </CardContent>
      </Card>
    </div>

    <div v-else class="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_320px]">
      <div class="min-h-[320px]">
        <MapQuizMap
          :geojson="geojson"
          :target-id="target?.id ?? null"
          :neighbor-ids="neighborIds"
          :answered="answered"
          @error="(msg) => (errorMessage = msg)"
        />
      </div>
      <aside class="border-t border-border p-4 lg:border-l lg:border-t-0">
        <Card>
          <CardHeader>
            <CardTitle>Which country is highlighted?</CardTitle>
            <CardDescription>Neighbor names are labeled on the map.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button
              v-for="choice in choices"
              :key="choice.id"
              class="w-full justify-start"
              :variant="
                answered
                  ? choice.id === target?.id
                    ? 'default'
                    : choice.id === selectedId
                      ? 'outline'
                      : 'ghost'
                  : 'outline'
              "
              :disabled="answered"
              @click="onChoose(choice)"
            >
              {{ choice.name }}
            </Button>
            <Button v-if="answered" class="w-full" @click="nextRound">
              {{ round >= TOTAL_ROUNDS ? 'Finish' : 'Next' }}
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  </div>
</template>
