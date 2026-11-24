import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export const usePimpinanStore = defineStore('pimpinan', () => {
  const list    = ref([])
  const loading = ref(false)
  const loaded  = ref(false)

  const aktifList = computed(() => list.value.filter(p => p.aktif))
  const byId = computed(() => Object.fromEntries(list.value.map(p => [p.id, p])))

  // Label pendek untuk chip/filter: nama_singkat, jika kosong pakai jabatan
  function label(id) {
    const p = byId.value[id]
    return p ? (p.nama_singkat || p.jabatan) : '—'
  }
  function labels(ids = []) {
    return ids.map(label).join(', ')
  }

  // Super Admin melihat semua (termasuk nonaktif); publik/Admin hanya yang diizinkan RLS
  async function fetchAll() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('pimpinan')
        .select('*')
        .order('urutan', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      list.value = data || []
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function ensureLoaded() {
    if (!loaded.value) await fetchAll()
  }

  async function create(payload) {
    const { data, error } = await supabase.from('pimpinan').insert([payload]).select().single()
    if (error) throw error
    await fetchAll()
    return data
  }

  async function update(id, payload) {
    const { data, error } = await supabase.from('pimpinan').update(payload).eq('id', id).select().single()
    if (error) throw error
    await fetchAll()
    return data
  }

  async function remove(id) {
    const { error } = await supabase.from('pimpinan').delete().eq('id', id)
    if (error) {
      // 23503 = foreign key violation (masih dipakai agenda)
      if (error.code === '23503') {
        throw new Error('Pimpinan ini masih memiliki agenda. Nonaktifkan saja agar tidak tampil di layar TV, atau pindahkan agendanya terlebih dahulu.')
      }
      throw error
    }
    await fetchAll()
  }

  async function uploadFoto(file) {
    const ext = file.name.split('.').pop()
    const path = `pimpinan/foto-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('instansi-assets').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('instansi-assets').getPublicUrl(path)
    return data.publicUrl
  }

  // ── Penugasan Admin Pimpinan ──────────────────────────────
  // Hasil: { [profileId]: [pimpinanId, ...] }
  async function fetchAssignments() {
    const { data, error } = await supabase.from('profile_pimpinan').select('profile_id,pimpinan_id')
    if (error) throw error
    const map = {}
    for (const r of data || []) (map[r.profile_id] ||= []).push(r.pimpinan_id)
    return map
  }

  async function setAssignments(profileId, pimpinanIds) {
    const { error } = await supabase.rpc('set_penugasan_user', {
      p_profile: profileId,
      p_pimpinan_ids: pimpinanIds,
    })
    if (error) throw error
  }

  return {
    list, loading, loaded, aktifList, byId,
    label, labels, fetchAll, ensureLoaded, create, update, remove, uploadFoto,
    fetchAssignments, setAssignments,
  }
})
