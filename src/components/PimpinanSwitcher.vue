<template>
  <!-- Super Admin / Admin dengan >1 pimpinan: bisa memilih -->
  <select v-if="auth.canChoosePimpinan" v-model="model" class="input-field w-auto min-w-52">
    <option value="">{{ auth.isSuperadmin() ? 'Semua Pimpinan' : 'Semua pimpinan saya' }}</option>
    <option v-for="p in options" :key="p.id" :value="p.id">
      {{ p.nama_singkat || p.jabatan }}{{ p.aktif ? '' : ' (nonaktif)' }}
    </option>
  </select>

  <!-- Admin dengan satu pimpinan: dikunci otomatis -->
  <div v-else
    class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700">
    <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
    </svg>
    <span class="font-medium">{{ auth.contextLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['change'])
const auth = useAuthStore()

const options = computed(() => auth.selectablePimpinan)

const model = computed({
  get: () => auth.activePimpinanId || '',
  set: (v) => { auth.setActivePimpinan(v); emit('change', v || null) },
})
</script>
