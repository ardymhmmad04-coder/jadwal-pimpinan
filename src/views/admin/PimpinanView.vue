<template>
  <AdminLayout>
    <div class="p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-display font-bold text-slate-900">Master Pimpinan</h1>
          <p class="text-slate-500 text-sm mt-1">Kelola profil pimpinan yang jadwalnya ditampilkan dan dikelola di sistem</p>
        </div>
        <button @click="openModal()" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Tambah Pimpinan
        </button>
      </div>

      <div v-if="pageError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ pageError }}</div>

      <div class="card p-0 overflow-hidden">
        <div v-if="store.loading && !store.list.length" class="text-center py-12 text-slate-400 text-sm">Memuat...</div>
        <div v-else-if="store.list.length === 0" class="text-center py-12 text-slate-400 text-sm">Belum ada pimpinan</div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-center px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Urutan</th>
              <th class="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pimpinan</th>
              <th class="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Label</th>
              <th class="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">NIP</th>
              <th class="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th class="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="p in store.list" :key="p.id" class="hover:bg-slate-50/80 transition-colors" :class="p.aktif ? '' : 'opacity-60'">
              <td class="px-4 py-4 text-center font-mono text-slate-500">{{ p.urutan }}</td>
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <img v-if="p.foto_url" :src="p.foto_url" class="w-9 h-9 rounded-full object-cover shrink-0 border-2" :style="{ borderColor: p.warna }" alt="" />
                  <div v-else class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" :style="{ background: p.warna }">
                    {{ (p.nama_singkat || p.jabatan).charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-slate-800">{{ p.jabatan }}</p>
                    <p class="text-xs text-slate-400">{{ p.nama || 'Nama pejabat belum diisi' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  <span class="w-2 h-2 rounded-full" :style="{ background: p.warna }"></span>
                  {{ p.nama_singkat || p.jabatan }}
                </span>
              </td>
              <td class="px-5 py-4 text-slate-500 font-mono text-xs">{{ p.nip || '—' }}</td>
              <td class="px-5 py-4 text-center">
                <button @click="toggleAktif(p)" :disabled="busyId === p.id"
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition"
                  :class="p.aktif ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'">
                  {{ p.aktif ? 'Aktif' : 'Nonaktif' }}
                </button>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openModal(p)" class="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                    </svg>
                  </button>
                  <button @click="confirmDelete(p)" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Hapus">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
        <strong>Catatan:</strong> Pimpinan yang sudah memiliki agenda tidak dapat dihapus — nonaktifkan saja agar tidak tampil di layar TV.
        Pimpinan <em>nonaktif</em> disembunyikan dari tampilan publik tetapi datanya tetap tersimpan.
      </div>
    </div>

    <!-- Modal form -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2 class="text-lg font-display font-semibold text-slate-900">{{ isEditing ? 'Edit Pimpinan' : 'Tambah Pimpinan' }}</h2>
            <button @click="closeModal" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Jabatan <span class="text-red-500">*</span></label>
              <input v-model="form.jabatan" type="text" required class="input-field" placeholder="Contoh: Kepala Badan" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Nama Pejabat <span class="text-slate-400 font-normal text-xs">(opsional)</span></label>
              <input v-model="form.nama" type="text" class="input-field" placeholder="Nama lengkap beserta gelar" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Label Singkat</label>
                <input v-model="form.nama_singkat" type="text" class="input-field" placeholder="Kaban, Sekban, Kabid ..." />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">NIP</label>
                <input v-model="form.nip" type="text" class="input-field font-mono" placeholder="Opsional" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Urutan tampil</label>
                <input v-model.number="form.urutan" type="number" min="0" class="input-field" />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Warna penanda</label>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  <button v-for="c in palette" :key="c" type="button" @click="form.warna = c"
                    class="w-7 h-7 rounded-full border-2 transition"
                    :style="{ background: c, borderColor: form.warna === c ? '#0f172a' : 'transparent' }"
                    :title="c"></button>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Foto <span class="text-slate-400 font-normal text-xs">(opsional)</span></label>
              <div class="flex items-center gap-3">
                <img v-if="form.foto_url" :src="form.foto_url" class="w-12 h-12 rounded-full object-cover border border-slate-200" alt="" />
                <input type="file" accept="image/*" @change="onFoto" class="text-xs text-slate-500" />
                <button v-if="form.foto_url" type="button" @click="form.foto_url = ''" class="text-xs text-red-600 hover:underline">Hapus foto</button>
              </div>
            </div>
            <label class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer">
              <input v-model="form.aktif" type="checkbox" class="rounded border-slate-300 text-primary-700" />
              <span class="text-sm text-slate-700">Aktif (tampil di layar TV dan bisa dipilih pada agenda)</span>
            </label>

            <div v-if="formError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{{ formError }}</div>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" @click="closeModal" class="btn-secondary">Batal</button>
              <button type="submit" class="btn-primary" :disabled="isSaving">{{ isSaving ? 'Menyimpan...' : 'Simpan' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal hapus -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showDeleteModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up p-6 text-center">
          <h3 class="text-lg font-display font-semibold text-slate-900 mb-2">Hapus Pimpinan?</h3>
          <p class="text-sm text-slate-500 mb-4"><strong>{{ deleteTarget?.nama_singkat || deleteTarget?.jabatan }}</strong> akan dihapus dari master.</p>
          <div v-if="deleteError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs text-left">{{ deleteError }}</div>
          <div class="flex gap-3">
            <button @click="showDeleteModal = false" class="btn-secondary flex-1 justify-center">Batal</button>
            <button @click="handleDelete" class="btn-danger flex-1 justify-center" :disabled="isDeleting">{{ isDeleting ? 'Menghapus...' : 'Hapus' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { usePimpinanStore } from '@/stores/pimpinan'
import { useAuditTrailStore } from '@/stores/auditTrail'

const store = usePimpinanStore()
const audit = useAuditTrailStore()

const palette = ['#2563eb', '#0ea5e9', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#475569']

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const busyId = ref(null)
const formError = ref('')
const deleteError = ref('')
const pageError = ref('')
const deleteTarget = ref(null)
const fotoFile = ref(null)

const defaultForm = () => ({
  id: null, jabatan: '', nama: '', nama_singkat: '', nip: '',
  foto_url: '', warna: palette[0], urutan: store.list.length + 1, aktif: true,
})
const form = ref(defaultForm())

function openModal(p = null) {
  formError.value = ''
  fotoFile.value = null
  isEditing.value = !!p
  form.value = p
    ? { ...p, nama: p.nama || '', nama_singkat: p.nama_singkat || '', nip: p.nip || '', foto_url: p.foto_url || '' }
    : defaultForm()
  showModal.value = true
}
function closeModal() { showModal.value = false }
function onFoto(e) { fotoFile.value = e.target.files?.[0] || null }

async function handleSubmit() {
  isSaving.value = true
  formError.value = ''
  try {
    let foto = form.value.foto_url || null
    if (fotoFile.value) foto = await store.uploadFoto(fotoFile.value)

    const payload = {
      jabatan:      form.value.jabatan.trim(),
      nama:         form.value.nama?.trim() || null,
      nama_singkat: form.value.nama_singkat?.trim() || null,
      nip:          form.value.nip?.trim() || null,
      foto_url:     foto,
      warna:        form.value.warna,
      urutan:       Number.isFinite(form.value.urutan) ? form.value.urutan : 0,
      aktif:        form.value.aktif,
    }
    if (isEditing.value) {
      await store.update(form.value.id, payload)
      await audit.log({ aksi: 'edit', dataId: form.value.id, dataBaru: payload, tabel: 'pimpinan', keterangan: `Edit pimpinan: ${payload.jabatan}` })
    } else {
      const row = await store.create(payload)
      await audit.log({ aksi: 'tambah', dataId: row?.id, dataBaru: payload, tabel: 'pimpinan', keterangan: `Tambah pimpinan: ${payload.jabatan}` })
    }
    closeModal()
  } catch (e) {
    formError.value = e.message || 'Gagal menyimpan pimpinan.'
  } finally {
    isSaving.value = false
  }
}

async function toggleAktif(p) {
  busyId.value = p.id
  pageError.value = ''
  try {
    await store.update(p.id, { aktif: !p.aktif })
    await audit.log({ aksi: 'edit', dataId: p.id, tabel: 'pimpinan', keterangan: `${p.aktif ? 'Nonaktifkan' : 'Aktifkan'} pimpinan: ${p.jabatan}` })
  } catch (e) {
    pageError.value = e.message || 'Gagal mengubah status.'
  } finally {
    busyId.value = null
  }
}

function confirmDelete(p) { deleteTarget.value = p; deleteError.value = ''; showDeleteModal.value = true }

async function handleDelete() {
  isDeleting.value = true
  deleteError.value = ''
  try {
    const dataLama = { ...deleteTarget.value }
    await store.remove(deleteTarget.value.id)
    await audit.log({ aksi: 'hapus', dataId: dataLama.id, dataLama, tabel: 'pimpinan', keterangan: `Hapus pimpinan: ${dataLama.jabatan}` })
    showDeleteModal.value = false
  } catch (e) {
    deleteError.value = e.message
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  try { await store.fetchAll() } catch (e) { pageError.value = e.message }
})
</script>
