
<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTickets } from '@/services/ticketService'

const tickets = ref([])
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const total = ref(0)
const perPage = parseInt(import.meta.env.VITE_PER_PAGE)

const totalPages = computed(() => Math.ceil(total.value / perPage))

async function fetchTickets() {
  loading.value = true
  error.value = null
  try {
    const result = await getTickets(currentPage.value, perPage)
    tickets.value = result.items
    total.value = result.total
  } catch (e) {
    error.value = 'Erreur lors du chargement des tickets'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  await fetchTickets()
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

function getPriorityLabel(priority) {
  switch (priority) {
    case 1: return 'Très basse'
    case 2: return 'Basse'
    case 3: return 'Moyenne'
    case 4: return 'Haute'
    case 5: return 'Très haute'
    case 6: return 'Majeure'
    default: return 'Inconnue'
  }
}

onMounted(fetchTickets)
</script>
<template>
  <div>
    <h1>Liste des tickets</h1>

    <div v-if="loading">Chargement...</div>
    <div v-if="error" style="color: red">{{ error }}</div>

    <table v-if="tickets.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Titre</th>
          <th>Description</th>
          <th>Status</th>
          <th>Priorité</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ticket in tickets" :key="ticket.id">
          <td>{{ ticket.id }}</td>
          <td>{{ ticket.name }}</td>
          <td>{{ ticket.content }}</td>
          <td>{{ ticket.status.name }}</td>
          <td>{{ getPriorityLabel(ticket.priority) }}</td>
          <td>{{ formatDate(ticket.date_creation) }}</td>
          <td>
            <router-link :to="`/tickets/${ticket.id}`">Voir</router-link>
          </td>
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
