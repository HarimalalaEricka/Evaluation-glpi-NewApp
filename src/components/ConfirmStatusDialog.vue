<script setup>
import { ref, watch } from 'vue'
import { getItems } from '@/services/glpi'

const props = defineProps({
  show: Boolean,
  pendingDrop: Object,
  statusConfig: Object
})

const emit = defineEmits(['confirm', 'cancel'])

const allUsers = ref([])
const requesterQuery = ref('')
const requesterResults = ref([])
const assignQuery = ref('')
const assignResults = ref([])

const dialogData = ref({
  requesters: [],
  assigns: [],
  team: [],
  costs: [],
  newCost: { name: '', duration: '', hourly_rate: '', fixed_cost: '' }
})

// Reset à chaque ouverture
watch(() => props.show, (val) => {
  if (val) {
    dialogData.value = {
      requesters: [],
      assigns: [],
      team: [],
      costs: [],
      newCost: { name: '', duration: '', hourly_rate: '', fixed_cost: '' }
    }
    requesterQuery.value = ''
    assignQuery.value = ''
    requesterResults.value = []
    assignResults.value = []
    loadUsers()
  }
})

function getDialogType() {
  if (!props.pendingDrop) return null
  const glpiId = String(props.statusConfig[props.pendingDrop.targetStatus]?.idStatusGlpi)
  if (glpiId === '2') return 'actors'
  if (glpiId === '6') return 'costs'
  return null
}

async function loadUsers() {
  try {
    const { items } = await getItems('/Administration/User', { is_deleted: false })
    allUsers.value = items
  } catch (err) {
    console.error('Erreur chargement utilisateurs:', err)
  }
}

function searchRequester() {
  const q = requesterQuery.value.trim().toLowerCase()
  requesterResults.value = q
    ? allUsers.value.filter(u => u.username?.toLowerCase().includes(q))
    : []
}

function searchAssign() {
  const q = assignQuery.value.trim().toLowerCase()
  assignResults.value = q
    ? allUsers.value.filter(u => u.username?.toLowerCase().includes(q))
    : []
}

function selectRequester(user) {
  if (!dialogData.value.requesters.find(u => u.id === user.id)) {
    dialogData.value.requesters.push({ id: user.id, name: user.username, type: 'User', role: 'requester' })
  }
  requesterQuery.value = ''
  requesterResults.value = []
}

function selectAssign(user) {
  if (!dialogData.value.assigns.find(u => u.id === user.id)) {
    dialogData.value.assigns.push({ id: user.id, name: user.username, type: 'User', role: 'assigned' })
  }
  assignQuery.value = ''
  assignResults.value = []
}

function addCost() {
  if (!dialogData.value.newCost.name) return
  dialogData.value.costs.push({ ...dialogData.value.newCost })
  dialogData.value.newCost = { name: '', duration: '', hourly_rate: '', fixed_cost: '' }
}

function removeCost(index) {
  dialogData.value.costs.splice(index, 1)
}

function confirm() {
  emit('confirm', {
    team: [...dialogData.value.requesters, ...dialogData.value.assigns],
    costs: dialogData.value.costs
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="overlay" @click.self="$emit('cancel')">
      <div class="popup">

        <!-- HEADER -->
        <div class="popup-header">
          <h3>Changement de statut</h3>
          <button class="close-btn" @click="$emit('cancel')">✕</button>
        </div>

        <!-- TRANSITION INFO -->
        <div class="popup-transition" v-if="pendingDrop">
          <strong>{{ pendingDrop.item.name }}</strong>
          <div class="transition-badges">
            <span class="badge" :style="{
              background: statusConfig[pendingDrop.previousStatus.id]?.background,
              color: statusConfig[pendingDrop.previousStatus.id]?.color
            }">
              {{ statusConfig[pendingDrop.previousStatus.id]?.traduction }}
            </span>
            <span class="arrow">→</span>
            <span class="badge" :style="{
              background: statusConfig[pendingDrop.targetStatus]?.background,
              color: statusConfig[pendingDrop.targetStatus]?.color
            }">
              {{ statusConfig[pendingDrop.targetStatus]?.traduction }}
            </span>
          </div>
        </div>

        <!-- CORPS : ACTEURS -->
        <div v-if="getDialogType() === 'actors'" class="popup-body">
          <div class="field">
            <label>Demandeur</label>
            <input v-model="requesterQuery" placeholder="Rechercher un utilisateur..." @input="searchRequester" />
            <ul v-if="requesterResults.length > 0" class="dropdown">
              <li v-for="u in requesterResults" :key="u.id" @click="selectRequester(u)">{{ u.username }}</li>
            </ul>
            <div class="tags">
              <span v-for="(u, i) in dialogData.requesters" :key="u.id" class="tag">
                {{ u.name }} <button type="button" @click="dialogData.requesters.splice(i, 1)">✕</button>
              </span>
            </div>
          </div>

          <div class="field">
            <label>Attribué à</label>
            <input v-model="assignQuery" placeholder="Rechercher un utilisateur..." @input="searchAssign" />
            <ul v-if="assignResults.length > 0" class="dropdown">
              <li v-for="u in assignResults" :key="u.id" @click="selectAssign(u)">{{ u.username }}</li>
            </ul>
            <div class="tags">
              <span v-for="(u, i) in dialogData.assigns" :key="u.id" class="tag">
                {{ u.name }} <button type="button" @click="dialogData.assigns.splice(i, 1)">✕</button>
              </span>
            </div>
          </div>
        </div>

        <!-- CORPS : COÛTS -->
        <div v-if="getDialogType() === 'costs'" class="popup-body">
          <div class="field">
            <label>Ajouter un coût</label>
            <div class="cost-row">
              <input v-model="dialogData.newCost.name" placeholder="Nom" />
              <input v-model="dialogData.newCost.duration" type="number" min="0" placeholder="Durée (min)" />
              <input v-model="dialogData.newCost.hourly_rate" type="number" min="0" step="0.01" placeholder="Coût horaire (€)" />
              <input v-model="dialogData.newCost.fixed_cost" type="number" min="0" step="0.01" placeholder="Coût fixe (€)" />
              <button type="button" class="btn-add" @click="addCost">+</button>
            </div>
            <ul v-if="dialogData.costs.length > 0" class="cost-list">
              <li v-for="(c, i) in dialogData.costs" :key="i">
                <span><strong>{{ c.name }}</strong> — {{ c.duration }} min — {{ c.hourly_rate }} €/h — {{ c.fixed_cost }} € fixe</span>
                <button type="button" @click="removeCost(i)">✕</button>
              </li>
            </ul>
          </div>
        </div>

        <!-- PAS DE DIALOGUE SPECIFIQUE -->
        <div v-if="!getDialogType()" class="popup-body">
          <p>Confirmer le changement de statut ?</p>
        </div>

        <!-- FOOTER -->
        <div class="popup-footer">
          <button class="btn-cancel" @click="$emit('cancel')">Annuler</button>
          <button class="btn-confirm" @click="confirm">Confirmer</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.popup {
  background: white;
  border-radius: 10px;
  width: 480px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.popup-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #888;
}

.popup-transition {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  font-size: 0.95rem;
}

.popup-transition strong {
  display: block;
  margin-bottom: 8px;
}

.transition-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 600;
}

.arrow {
  color: #888;
  font-size: 1.1rem;
}

.popup-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 0.9rem;
}

.field input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
}

.dropdown {
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 6px 6px;
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.dropdown li {
  padding: 8px 10px;
  cursor: pointer;
}

.dropdown li:hover {
  background: #f5f5f5;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eef2ff;
  color: #4f46e5;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
}

.tag button {
  background: none;
  border: none;
  cursor: pointer;
  color: #4f46e5;
  padding: 0;
  font-size: 0.8rem;
}

.cost-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cost-row input {
  flex: 1;
  min-width: 100px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.btn-add {
  padding: 8px 14px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.cost-list {
  list-style: none;
  padding: 0;
  margin: 10px 0 0;
}

.cost-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 0.88rem;
}

.cost-list li button {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
}

.popup-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn-cancel {
  padding: 8px 18px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.btn-confirm {
  padding: 8px 18px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>