<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllTickets, updateTicket } from '@/services/ticketService'

const tickets = ref([])
const draggingItem = ref(null)

async function fetchTickets() {
  try {
    const result = await getAllTickets(1, 100)
    tickets.value = result.items
  } catch (e) {
    console.error('Erreur lors du chargement des tickets:', e)
  }
}
onMounted(fetchTickets)

const statusConfig = {
  1: { label: 'Nouveau',            color: '#f39c12', background: '#fef5e7' },
  2: { label: 'En cours (assigné)', color: '#3498db', background: '#ebf5fb' },
  6: { label: 'Clos',               color: '#95a5a6', background: '#f2f3f4' },
}

const statuses = computed(() => Object.keys(statusConfig).map(Number))

const itemsByStatus = (status) => {
  return tickets.value.filter(item => item.status.id === status)
}

function onDragStart(item) {
  draggingItem.value = item
}

function onDragOver(e) {
  e.preventDefault()
}

async function onDrop(targetStatus) {
  if (!draggingItem.value) return
  if (draggingItem.value.status.id === targetStatus) return

  const item = draggingItem.value
  const index = tickets.value.findIndex(t => t.id === item.id)

  if (index !== -1) {
    tickets.value[index].status = {
      id: targetStatus,
      name: statusConfig[targetStatus].label
    }

    const result = await updateTicket(item.id, { status: targetStatus })
    if (result.failed > 0) {
      console.error('Échec de la mise à jour du ticket:', result.errors)
      tickets.value[index].status = item.status
    }
  }

  draggingItem.value = null
}

function onDragEnd() {
  draggingItem.value = null
}
</script>

<template>
  <div class="kanban">
    <div
      class="column"
      v-for="status in statuses"
      :key="status"
      :class="{ 'drag-over': draggingItem && draggingItem.status.id !== status }"
      :style="{
        borderTop: '5px solid ' + statusConfig[status].color,
        backgroundColor: statusConfig[status].background
      }"
      @dragover="onDragOver"
      @drop="onDrop(status)"
    >
      <!-- En-tête de colonne -->
      <div class="column-header">
        <h2 :style="{ color: statusConfig[status].color }">
          {{ statusConfig[status].label }}
        </h2>
        <span class="count" :style="{ backgroundColor: statusConfig[status].color }">
          {{ itemsByStatus(status).length }}
        </span>
      </div>

      <!-- Cartes -->
      <router-link
        :to="'/ticketDetail/' + item.id"
        class="card"
        v-for="item in itemsByStatus(status)"
        :key="item.id"
        draggable="true"
        :class="{ 'dragging': draggingItem?.id === item.id }"
        :style="{ borderLeft: '5px solid ' + statusConfig[item.status.id]?.color }"
        @dragstart="onDragStart(item)"
        @dragend="onDragEnd"
      >
        <p class="card-title">{{ item.name }}</p>
        <span
          class="badge"
          :style="{
            backgroundColor: statusConfig[item.status.id]?.background,
            color: statusConfig[item.status.id]?.color
          }"
        >
          {{ statusConfig[item.status.id]?.label }}
        </span>
      </router-link>

      <!-- Ajouter un ticket — toujours visible en bas de chaque colonne -->
      <router-link
        to="/create-ticket"
        class="add-ticket"
        :style="{ borderLeft: '5px solid ' + statusConfig[status].color }"
      >
        <p class="card-title">
          <span class="add-icon">+</span> Ajouter un ticket
        </p>
        <span
          class="badge"
          :style="{
            backgroundColor: statusConfig[status].background,
            color: statusConfig[status].color
          }"
        >
          {{ statusConfig[status].label }}
        </span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.kanban {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 20px;
}

.column {
  flex: 1;
  padding: 15px;
  border-radius: 12px;
  min-height: 300px;
  min-width: 220px;
  transition: box-shadow 0.2s, transform 0.2s;
}

.column.drag-over {
  box-shadow: 0 0 0 2px #3498db;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.column-header h2 {
  margin: 0;
  font-size: 16px;
  flex: 1;
}

.count {
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
}

.card {
  display: block;
  background: white;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  cursor: grab;
  text-decoration: none;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card.dragging {
  opacity: 0.4;
  cursor: grabbing;
  transform: scale(0.98);
}

.card-title {
  margin: 0 0 8px 0;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.add-ticket {
  display: block;
  background: white;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  transition: box-shadow 0.2s, transform 0.2s;
  cursor: pointer;
}

.add-ticket:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.add-icon {
  font-size: 16px;
  font-weight: 600;
}
</style>