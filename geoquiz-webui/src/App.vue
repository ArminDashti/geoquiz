<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/useAuth'
import { resolveAssetUrl } from '@/lib/auth'
import { getTheme, toggleTheme, type Theme } from '@/lib/theme'

const router = useRouter()
const { user, isAuthenticated, isAdmin, logout } = useAuth()

const theme = ref<Theme>(getTheme())
const avatarUrl = computed(() => resolveAssetUrl(user.value?.avatar_url))

const navLinkClass =
  'rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
const navLinkActiveClass = 'bg-muted text-foreground'

function syncTheme() {
  theme.value = getTheme()
}

function onLogout() {
  logout()
  void router.push('/')
}

function onToggleTheme() {
  theme.value = toggleTheme()
}

let themeObserver: MutationObserver | null = null

onMounted(() => {
  themeObserver = new MutationObserver(syncTheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = null
})
</script>

<template>
  <div class="flex h-full w-full flex-col bg-background text-foreground">
    <header
      class="sticky top-0 z-40 flex shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-background/95 px-4 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <nav class="flex min-w-0 flex-wrap items-center gap-1 sm:gap-1.5" aria-label="Main">
        <RouterLink
          class="mr-2 shrink-0 text-base font-semibold tracking-tight text-foreground"
          to="/"
        >
          Geoquiz
        </RouterLink>
        <template v-if="isAuthenticated">
          <RouterLink
            :class="navLinkClass"
            :active-class="navLinkActiveClass"
            to="/flag-quiz"
          >
            Flag quiz
          </RouterLink>
          <RouterLink
            :class="navLinkClass"
            :active-class="navLinkActiveClass"
            to="/mapquiz"
          >
            Map quiz
          </RouterLink>
          <RouterLink
            :class="navLinkClass"
            :active-class="navLinkActiveClass"
            to="/score-board"
          >
            Score board
          </RouterLink>
          <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/map">
            Explore
          </RouterLink>
          <RouterLink
            v-if="isAdmin"
            :class="navLinkClass"
            :active-class="navLinkActiveClass"
            to="/admin"
          >
            Admin
          </RouterLink>
        </template>
      </nav>
      <div class="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="onToggleTheme"
        >
          {{ theme === 'dark' ? 'Light' : 'Dark' }}
        </Button>
        <template v-if="isAuthenticated">
          <RouterLink
            v-if="user?.username"
            :class="navLinkClass"
            :to="`/profile/${user.username}`"
          >
            Profile
          </RouterLink>
          <RouterLink to="/account">
            <Button variant="outline" size="sm" class="gap-2">
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                alt=""
                class="h-5 w-5 rounded-full object-cover"
              />
              Account
            </Button>
          </RouterLink>
          <Button variant="ghost" size="sm" @click="onLogout">Log out</Button>
        </template>
        <template v-else>
          <RouterLink to="/login">
            <Button variant="outline" size="sm">Log in</Button>
          </RouterLink>
          <RouterLink to="/signup">
            <Button size="sm">Sign up</Button>
          </RouterLink>
        </template>
      </div>
    </header>
    <main class="min-h-0 flex-1 overflow-auto">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>
