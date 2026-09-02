<script setup lang="ts">
import LeafletWorldMap from '@/components/LeafletWorldMap.vue'

defineEmits<{
  ready: []
  error: [message: string]
}>()
</script>

<template>
  <LeafletWorldMap
    class="h-full w-full"
    @ready="$emit('ready')"
    @error="(msg) => $emit('error', msg)"
  />
</template>
