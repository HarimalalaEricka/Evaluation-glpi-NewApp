<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getAllTickets, updateTicket } from '@/services/ticketService'
import { getColors, getLangue, getTraductionByLangue, getTraductrionByLangueAndStatus } from '@/services/sqlite.js'

const tickets = ref([])
const draggingItem = ref(null)
const statusConfig = ref({});
const colors = ref({});
const langues = ref([]);
const selectedLang = ref(null);
const traductionConfig = ref([]);
const isInitializing = ref(true)

async function getTraductrion(idLangue, idStatus)
{
    await getTraductrionByLangueAndStatus(idLangue, idStatus)
}

async function loadColors() {
  try {
    colors.value = await getColors();
    await loadLangues(); // s'assurer que selectedLang est défini

    await Promise.all(
      colors.value.map(async (c) => {
        const trad = await getTraductrionByLangueAndStatus(selectedLang.value, c.idStatus);
        statusConfig.value[c.idStatus] = {
          label: c.label,
          color: c.color,
          background: c.background,
          idStatus: c.idStatus,
          traduction: trad?.traduction // fallback sur le label si pas de trad
        };
      })
    );

  } catch (e) {
    console.error("Erreur lors du chargement des couleurs:", e);
  }
}

async function loadLangues() {
  try {
    langues.value = await getLangue();
    console.log("Langues chargées:", langues.value);
    if (langues.value.length > 0 && !selectedLang.value) {
      selectedLang.value = langues.value[0].id;
    }
  } catch (e) {
    console.error("Erreur chargement langues:", e);
  }
}

async function loadTraductions(langId) {
  if (!langId) return;
  try {
    traductionConfig.value = [];
    const data = await getTraductionByLangue(langId);
    traductionConfig.value = data;
    console.log("Traductions chargées:", data);
  } catch (e) {
    console.error("Erreur chargement traductions:", e);
  }
}

// =======================
// WATCH : CHANGEMENT LANGUE
// =======================
watch(selectedLang, async (langId) => {
  if (isInitializing.value) return  // ignore pendant l'init
  if (!langId) return
  await applyTraductions(langId)
})

async function applyTraductions(langId) {
  if (!langId || colors.value.length === 0) return
  await Promise.all(
    colors.value.map(async (c) => {
      const trad = await getTraductrionByLangueAndStatus(langId, c.idStatus)
      if (statusConfig.value[c.idStatus]) {
        statusConfig.value[c.idStatus].traduction = trad
      }
    })
  )
}



async function fetchTickets() {
  try {
    const result = await getAllTickets(1, 100)
    tickets.value = result.items

    console.log("Premier ticket :", tickets.value[0])
    console.log("Tous les tickets :", tickets.value)
  } catch (e) {
    console.error(e)
  }
}
onMounted(async () => {
  isInitializing.value = true  // bloque le watch

  await loadColors()
  await loadLangues()                          
  await applyTraductions(selectedLang.value)  
  await fetchTickets()

  isInitializing.value = false  // réactive le watch pour les changements manuels
})

const statuses = computed(() => Object.keys(statusConfig.value).map(Number))

const itemsByStatus = (status) => {
  return tickets.value.filter(item => {
    // Vérification de sécurité au cas où l'objet status serait null ou mal formé
    if (!item.status) return false; 
    
    // On force la conversion en String pour éviter le piège 1 === "1" (qui fait false)
    const itemId = item.status.id !== undefined ? item.status.id : item.status;
    return String(itemId) === String(status);
  })
}
console.log("Premier ticket :", tickets.value[0])

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
        name: statusConfig.value[targetStatus].label
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
    <select id="lang-select" v-model="selectedLang">
        <option v-for="l in langues" :key="l.id" :value="l.id">
          {{ l.langue }}
        </option>
      </select>
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
          {{ statusConfig[status].traduction }}
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
          {{ statusConfig[item.status.id]?.traduction }}
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
          {{ statusConfig[status].traduction }}
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