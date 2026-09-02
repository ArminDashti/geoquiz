<script setup lang="ts">
import { RouterLink } from 'vue-router'
import HeroMap from '@/components/HeroMap.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/lib/useAuth'

const { isAuthenticated, isAdmin } = useAuth()
</script>

<template>
  <div class="home-page">
    <section class="hero relative isolate min-h-[calc(100dvh-8.5rem)] overflow-hidden">
      <div class="pointer-events-none absolute inset-0 opacity-70 dark:opacity-55">
        <HeroMap />
      </div>
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/75 via-background/55 to-background"
      />
      <div
        class="hero-content relative z-10 mx-auto flex min-h-[calc(100dvh-8.5rem)] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center"
      >
        <p class="hero-kicker mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Geography
        </p>
        <h1 class="hero-title text-5xl font-semibold tracking-tight sm:text-6xl">
          Geoquiz
        </h1>
        <p class="hero-lead mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          Learn the world through flags, maps, and play.
        </p>
        <div class="hero-actions mt-8 flex flex-wrap items-center justify-center gap-3">
          <template v-if="isAuthenticated">
            <RouterLink to="/flag-quiz">
              <Button size="lg">Start flag quiz</Button>
            </RouterLink>
            <RouterLink to="/map">
              <Button size="lg" variant="outline">Explore map</Button>
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/signup">
              <Button size="lg">Sign up</Button>
            </RouterLink>
            <RouterLink to="/login">
              <Button size="lg" variant="outline">Log in</Button>
            </RouterLink>
            <RouterLink to="/map">
              <Button size="lg" variant="ghost">Explore map</Button>
            </RouterLink>
          </template>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-4xl space-y-6 px-4 pb-14 pt-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight">Ways to play</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Pick a quiz or open the interactive map.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Flag quiz</CardTitle>
            <CardDescription>Guess the country from its flag.</CardDescription>
          </CardHeader>
          <CardContent>
            <RouterLink to="/flag-quiz">
              <Button :disabled="!isAuthenticated">
                {{ isAuthenticated ? 'Start flag quiz' : 'Log in to play' }}
              </Button>
            </RouterLink>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Map quiz</CardTitle>
            <CardDescription>Identify countries from cropped map regions.</CardDescription>
          </CardHeader>
          <CardContent>
            <RouterLink to="/mapquiz">
              <Button :disabled="!isAuthenticated">
                {{ isAuthenticated ? 'Start map quiz' : 'Log in to play' }}
              </Button>
            </RouterLink>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Explore map</CardTitle>
            <CardDescription>Click countries to reveal their names.</CardDescription>
          </CardHeader>
          <CardContent>
            <RouterLink to="/map">
              <Button variant="outline">Open map</Button>
            </RouterLink>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score board</CardTitle>
            <CardDescription>Recent high scores for map and flag quizzes.</CardDescription>
          </CardHeader>
          <CardContent>
            <RouterLink to="/score-board">
              <Button variant="outline">View scores</Button>
            </RouterLink>
          </CardContent>
        </Card>
      </div>

      <div v-if="isAdmin" class="pt-2">
        <RouterLink to="/admin">
          <Button variant="outline">Admin invite code</Button>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-kicker,
.hero-title,
.hero-lead,
.hero-actions {
  animation: hero-rise 0.6s ease-out both;
}

.hero-title {
  animation-delay: 0.08s;
}

.hero-lead {
  animation-delay: 0.16s;
}

.hero-actions {
  animation-delay: 0.24s;
}

@keyframes hero-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-kicker,
  .hero-title,
  .hero-lead,
  .hero-actions {
    animation: none;
  }
}
</style>
