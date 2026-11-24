import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { usePimpinanStore } from '@/stores/pimpinan'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)
  const profile = ref(null)
  const loading = ref(true)

  // Pimpinan yang ditugaskan ke user ini (khusus Admin Pimpinan)
  const assignedIds = ref([])
  // Konteks pimpinan yang sedang dikelola. null = semua (yang boleh diakses user)
  const activePimpinanId = ref(null)

  async function fetchProfile(userId) {
    const { data: prof, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) console.error('fetchProfile error:', error.message)
    profile.value = prof || null

    assignedIds.value = []
    if (prof?.role === 'admin_pimpinan') {
      const { data: rows, error: e2 } = await supabase
        .from('profile_pimpinan')
        .select('pimpinan_id')
        .eq('profile_id', userId)
      if (e2) console.error('fetch penugasan error:', e2.message)
      assignedIds.value = (rows || []).map(r => r.pimpinan_id)
    }

    // Konteks awal: Admin dengan satu pimpinan langsung terkunci ke pimpinan itu
    if (prof?.role === 'admin_pimpinan' && assignedIds.value.length === 1) {
      activePimpinanId.value = assignedIds.value[0]
    } else if (!assignedIds.value.includes(activePimpinanId.value) && prof?.role === 'admin_pimpinan') {
      activePimpinanId.value = null
    }
  }

  async function init() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    if (user.value) await fetchProfile(user.value.id)
    loading.value = false

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (user.value) await fetchProfile(user.value.id)
      else { profile.value = null; assignedIds.value = []; activePimpinanId.value = null }
    })
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    await fetchProfile(data.user.id)
    return data
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value    = null
    profile.value = null
    assignedIds.value = []
    activePimpinanId.value = null
  }

  const isAuthenticated  = () => !!user.value
  const isSuperadmin     = () => profile.value?.role === 'superadmin'
  const isAdminPimpinan  = () => profile.value?.role === 'admin_pimpinan'

  // Pimpinan yang boleh dipilih user ini (objek lengkap)
  const selectablePimpinan = computed(() => {
    const store = usePimpinanStore()
    if (isSuperadmin()) return store.list
    return store.list.filter(p => assignedIds.value.includes(p.id))
  })

  // Super Admin atau Admin dengan >1 pimpinan boleh memilih; selain itu terkunci
  const canChoosePimpinan = computed(() =>
    isSuperadmin() || assignedIds.value.length > 1
  )

  // Admin Pimpinan tanpa penugasan sama sekali
  const hasNoAssignment = computed(() =>
    isAdminPimpinan() && assignedIds.value.length === 0
  )

  // Daftar id yang dipakai untuk menyaring query agenda.
  //   null  = tanpa filter (Super Admin memilih "Semua")
  //   [ ... ] = filter overlap; array kosong = tidak ada akses
  const activeIds = computed(() => {
    if (activePimpinanId.value) return [activePimpinanId.value]
    if (isSuperadmin()) return null
    return assignedIds.value
  })

  function setActivePimpinan(id) {
    const next = id || null
    if (next && !isSuperadmin() && !assignedIds.value.includes(next)) return
    activePimpinanId.value = next
  }

  // Teks konteks untuk navigasi/dashboard
  const contextLabel = computed(() => {
    const store = usePimpinanStore()
    if (activePimpinanId.value) return store.label(activePimpinanId.value)
    if (isSuperadmin()) return 'Semua Pimpinan'
    if (assignedIds.value.length === 0) return 'Belum ada penugasan'
    return assignedIds.value.map(id => store.label(id)).join(', ')
  })

  return {
    user, profile, loading, assignedIds, activePimpinanId,
    init, login, logout, isAuthenticated, isSuperadmin, isAdminPimpinan,
    selectablePimpinan, canChoosePimpinan, hasNoAssignment, activeIds, contextLabel,
    setActivePimpinan,
  }
})
