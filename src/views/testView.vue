<template>
  <div>
    <h1>Liste des ordinateurs</h1>

    <div v-if="loading">Chargement...</div>
    <div v-if="error" style="color: red">{{ error }}</div>

    <table v-if="computers.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom</th>
          <th>Serial</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="computer in computers" :key="computer.id">
          <td>{{ computer.id }}</td>
          <td>{{ computer.name }}</td>
          <td>{{ computer.serial }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="totalPages > 1" style="margin-top: 16px;">
      <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
        ← Précédent
      </button>

      <span v-for="page in totalPages" :key="page">
        <button
          @click="changePage(page)"
          :style="page === currentPage ? 'font-weight: bold; text-decoration: underline;' : ''"
        >
          {{ page }}
        </button>
      </span>

      <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
        Suivant →
      </button>

      <p>Page {{ currentPage }} / {{ totalPages }} — {{ total }} ordinateurs</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAssetsItems } from '@/services/glpi'

const computers = ref([])
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const total = ref(0)
const perPage = parseInt(import.meta.env.VITE_PER_PAGE)

const totalPages = computed(() => Math.ceil(total.value / perPage))

async function fetchComputers() {
  loading.value = true
  error.value = null
  try {
    const result = await getAssetsItems('Computer', currentPage.value, perPage)
    computers.value = result.items
    total.value = result.total
  } catch (e) {
    error.value = 'Erreur lors du chargement des ordinateurs'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  await fetchComputers()
}

onMounted(fetchComputers)
</script>