<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { fetchProfile, resolveAssetUrl, type PublicProfile, type Score } from '@/lib/auth'
import { scorePercent } from '@/lib/scoring'
import { useAuth } from '@/lib/useAuth'

const route = useRoute()
const { user } = useAuth()

const profile = ref<PublicProfile | null>(null)
const errorMessage = ref<string | null>(null)

const username = computed(() => {
  const param = route.params.username
  if (typeof param === 'string' && param) return param
  return user.value?.username ?? ''
})

const avatarUrl = computed(() => resolveAssetUrl(profile.value?.avatar_url))

const scoreRows = computed(() => {
  const scores = profile.value?.scores ?? []
  return [...scores].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
})

function quizLabel(quizType: Score['quiz_type']): string {
  return quizType === 'map' ? 'Map quiz' : 'Flag quiz'
}

function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

async function load() {
  errorMessage.value = null
  profile.value = null
  const name = username.value
  if (!name) {
    errorMessage.value = 'Set a username on your account to view a public profile.'
    return
  }
  try {
    profile.value = await fetchProfile(name)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load profile'
  }
}

onMounted(() => {
  void load()
})

watch(
  () => route.fullPath,
  () => {
    void load()
  },
)
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-4 px-4 py-10">
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Public scores for this user.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <template v-if="profile">
          <div class="flex items-center gap-3">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt=""
              class="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p class="font-medium">@{{ profile.username }}</p>
            </div>
          </div>

          <p v-if="scoreRows.length === 0" class="text-sm text-muted-foreground">
            No scores yet.
          </p>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr class="border-b border-border text-muted-foreground">
                  <th class="px-2 py-2 font-medium">Quiz</th>
                  <th class="px-2 py-2 font-medium">Result</th>
                  <th class="px-2 py-2 font-medium">Date and Time</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="score in scoreRows"
                  :key="score.id"
                  class="border-b border-border last:border-0"
                >
                  <td class="px-2 py-2">{{ quizLabel(score.quiz_type) }}</td>
                  <td class="px-2 py-2 font-semibold tabular-nums">
                    {{ scorePercent(score.correct, score.total) }}%
                  </td>
                  <td class="px-2 py-2 text-muted-foreground">
                    {{ formatDateTime(score.created_at) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
