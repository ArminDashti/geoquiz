<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { fetchCountries, flagUrl, type Country } from '@/lib/api'
import { submitScore } from '@/lib/auth'

const TOTAL_ROUNDS = 10

const countries = ref<Country[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const round = ref(0)
const correctCount = ref(0)
const target = ref<Country | null>(null)
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

function pickRound() {
  const pool = countries.value.filter((c) => c.iso && c.iso.length === 2)
  if (pool.length < 4) {
    errorMessage.value = 'Not enough countries with ISO codes for a quiz'
    return
  }
  const shuffled = shuffle(pool)
  const next = shuffled[0]!
  const distractors = shuffled.slice(1, 4)
  target.value = next
  choices.value = shuffle([next, ...distractors])
  answered.value = false
  selectedId.value = null
}

async function load() {
  loading.value = true
  errorMessage.value = null
  try {
    countries.value = await fetchCountries()
    round.value = 1
    correctCount.value = 0
    finished.value = false
    pickRound()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load countries'
  } finally {
    loading.value = false
  }
}

async function finishQuiz() {
  finished.value = true
  saving.value = true
  try {
    await submitScore({
      quiz_type: 'flag',
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

function nextRound() {
  if (round.value >= TOTAL_ROUNDS) {
    void finishQuiz()
    return
  }
  round.value += 1
  pickRound()
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-4 px-4 py-8">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Flag quiz</h1>
      <p class="text-sm text-muted-foreground">
        Round {{ Math.min(round, TOTAL_ROUNDS) }} / {{ TOTAL_ROUNDS }} · Score
        {{ correctCount }}
      </p>
    </div>

    <p v-if="loading" class="text-sm text-muted-foreground">Loading…</p>
    <p v-else-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

    <Card v-else-if="finished">
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

    <Card v-else-if="target">
      <CardHeader>
        <CardTitle>Which country is this?</CardTitle>
        <CardDescription>Choose one of the four options.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex justify-center rounded-md border border-border bg-muted/40 p-6">
          <img
            :src="flagUrl(target.iso)"
            :alt="`Flag of ${target.name}`"
            class="max-h-40 w-auto rounded shadow"
          />
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <Button
            v-for="choice in choices"
            :key="choice.id"
            class="justify-start"
            :variant="
              answered
                ? choice.id === target.id
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
        </div>
        <Button v-if="answered" @click="nextRound">
          {{ round >= TOTAL_ROUNDS ? 'Finish' : 'Next' }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
