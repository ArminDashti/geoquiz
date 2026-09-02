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
import { fetchInviteCode, updateInviteCode } from '@/lib/auth'

const inviteCode = ref('')
const message = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const saving = ref(false)

async function load() {
  errorMessage.value = null
  try {
    const data = await fetchInviteCode()
    inviteCode.value = data.invite_code
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load invite code'
  }
}

async function save() {
  message.value = null
  errorMessage.value = null
  saving.value = true
  try {
    const data = await updateInviteCode(inviteCode.value.trim())
    inviteCode.value = data.invite_code
    message.value = 'Invite code updated.'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Update failed'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mx-auto max-w-md space-y-4 px-4 py-10">
    <Card>
      <CardHeader>
        <CardTitle>Admin</CardTitle>
        <CardDescription>Manage the signup invite code.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <label class="block space-y-1 text-sm">
          <span>Invite code</span>
          <input
            v-model="inviteCode"
            class="w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        <Button :disabled="saving" @click="save">
          {{ saving ? 'Saving…' : 'Save' }}
        </Button>
        <p v-if="message" class="text-sm text-green-700 dark:text-green-400">{{ message }}</p>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      </CardContent>
    </Card>
  </div>
</template>
