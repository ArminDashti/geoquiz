<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { fetchScores, type ScoreBoardEntry } from '@/lib/auth'
import {
  aggregateScoresByUser,
  compareByWilsonRank,
  scorePercent,
  wrongCount,
} from '@/lib/scoring'

type RankedRow = {
  username: string
  rank: number
  answered: number
  correct: number
  wrong: number
  score: number
}

function toRankedRows(entries: ScoreBoardEntry[]): RankedRow[] {
  const aggregated = aggregateScoresByUser(entries)
  const sorted = [...aggregated].sort(compareByWilsonRank)
  return sorted.map((entry, index) => ({
    username: entry.username,
    rank: index + 1,
    answered: entry.total,
    correct: entry.correct,
    wrong: wrongCount(entry.correct, entry.total),
    score: scorePercent(entry.correct, entry.total),
  }))
}

const mapScores = ref<ScoreBoardEntry[]>([])
const flagScores = ref<ScoreBoardEntry[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)

const mapRows = computed(() => toRankedRows(mapScores.value))
const flagRows = computed(() => toRankedRows(flagScores.value))

async function load() {
  loading.value = true
  errorMessage.value = null
  try {
    const [map, flag] = await Promise.all([
      fetchScores('map'),
      fetchScores('flag'),
    ])
    mapScores.value = map
    flagScores.value = flag
  } catch (err) {
    mapScores.value = []
    flagScores.value = []
    errorMessage.value = err instanceof Error ? err.message : 'Could not load scores'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6 px-4 py-8">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Score board</h1>
      <p class="text-sm text-muted-foreground">
        One row per user (totals aggregated), ranked by fair score (Wilson)
      </p>
    </div>

    <p v-if="loading" class="text-sm text-muted-foreground">Loading scores…</p>
    <p v-else-if="errorMessage" class="text-sm text-red-600 dark:text-red-400">
      {{ errorMessage }}
    </p>

    <template v-else>
      <Card>
        <CardHeader>
          <CardTitle>Map quiz</CardTitle>
          <CardDescription>Aggregated map quiz totals per user</CardDescription>
        </CardHeader>
        <CardContent>
          <p v-if="!mapRows.length" class="text-sm text-muted-foreground">
            No map quiz scores yet.
          </p>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr class="border-b border-border text-muted-foreground">
                  <th class="px-2 py-2 font-medium">Rank</th>
                  <th class="px-2 py-2 font-medium">Username</th>
                  <th class="px-2 py-2 font-medium">Answered</th>
                  <th class="px-2 py-2 font-medium">Correct</th>
                  <th class="px-2 py-2 font-medium">Wrong</th>
                  <th class="px-2 py-2 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in mapRows"
                  :key="row.username"
                  class="border-b border-border last:border-0"
                >
                  <td class="px-2 py-2 tabular-nums">{{ row.rank }}</td>
                  <td class="px-2 py-2">
                    <RouterLink
                      class="font-medium text-primary hover:underline"
                      :to="`/profile/${row.username}`"
                    >
                      {{ row.username }}
                    </RouterLink>
                  </td>
                  <td class="px-2 py-2 tabular-nums">{{ row.answered }}</td>
                  <td class="px-2 py-2 tabular-nums">{{ row.correct }}</td>
                  <td class="px-2 py-2 tabular-nums">{{ row.wrong }}</td>
                  <td class="px-2 py-2 font-semibold tabular-nums">{{ row.score }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flag quiz</CardTitle>
          <CardDescription>Aggregated flag quiz totals per user</CardDescription>
        </CardHeader>
        <CardContent>
          <p v-if="!flagRows.length" class="text-sm text-muted-foreground">
            No flag quiz scores yet.
          </p>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr class="border-b border-border text-muted-foreground">
                  <th class="px-2 py-2 font-medium">Rank</th>
                  <th class="px-2 py-2 font-medium">Username</th>
                  <th class="px-2 py-2 font-medium">Answered</th>
                  <th class="px-2 py-2 font-medium">Correct</th>
                  <th class="px-2 py-2 font-medium">Wrong</th>
                  <th class="px-2 py-2 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in flagRows"
                  :key="row.username"
                  class="border-b border-border last:border-0"
                >
                  <td class="px-2 py-2 tabular-nums">{{ row.rank }}</td>
                  <td class="px-2 py-2">
                    <RouterLink
                      class="font-medium text-primary hover:underline"
                      :to="`/profile/${row.username}`"
                    >
                      {{ row.username }}
                    </RouterLink>
                  </td>
                  <td class="px-2 py-2 tabular-nums">{{ row.answered }}</td>
                  <td class="px-2 py-2 tabular-nums">{{ row.correct }}</td>
                  <td class="px-2 py-2 tabular-nums">{{ row.wrong }}</td>
                  <td class="px-2 py-2 font-semibold tabular-nums">{{ row.score }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
