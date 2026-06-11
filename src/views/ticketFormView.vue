<script setup>
import { ref, onMounted } from 'vue'
import { createTicket } from '@/services/ticketService'
import { getItems } from '@/services/glpi'

const loading = ref(false)
const error = ref(null)
const success = ref(false)

// --- Assets (pour "Éléments") ---
const assetQuery = ref('')
const assetResults = ref([])
const allAssets = ref([])

// --- Utilisateurs (pour "Demandeur" et "Attribué à") ---
const allUsers = ref([])

const requesterQuery = ref('')
const requesterResults = ref([])

const assignQuery = ref('')
const assignResults = ref([])

const form = ref({
    name: '',
    content: '',
    type: '',
    status: '',
    priority: '',
    date: '',
    items: [],
    requesters: [],
    assigns: [],
})

async function loadAssets() {
    try {
        const { items: assetTypes } = await getItems('/Assets')
        let all = []
        for (const type of assetTypes) {
            const { items } = await getItems(`/Assets/${type.itemtype}`, { is_deleted: false })
            all = [...all, ...items.map(item => ({ ...item, itemtype: type.itemtype }))]
        }
        allAssets.value = all
    } catch (err) {
        console.error('Erreur chargement assets:', err)
    }
}

async function loadUsers() {
    try {
        const { items } = await getItems('/Administration/User', { is_deleted: false })
        allUsers.value = items
    } catch (err) {
        console.error('Erreur chargement utilisateurs:', err)
    }
}

function searchAsset() {
    const q = assetQuery.value.trim().toLowerCase()
    assetResults.value = q
        ? allAssets.value.filter(i => i.name?.toLowerCase().includes(q))
        : []
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

function selectAsset(item) {
    const exists = form.value.items.find(i => i.id === item.id && i.itemtype === item.itemtype)
    if (!exists) {
        form.value.items.push({ id: item.id, itemtype: item.itemtype, name: item.name })
    }
    assetQuery.value = ''
    assetResults.value = []
}

function removeItem(index) {
    form.value.items.splice(index, 1)
}

function selectRequester(user) {
    const exists = form.value.requesters.find(u => u.id === user.id)
    if (!exists) {
        form.value.requesters.push({ id: user.id, name: user.username })
    }
    requesterQuery.value = ''
    requesterResults.value = []
}

function removeRequester(index) {
    form.value.requesters.splice(index, 1)
}

function selectAssign(user) {
    const exists = form.value.assigns.find(u => u.id === user.id)
    if (!exists) {
        form.value.assigns.push({ id: user.id, name: user.username })
    }
    assignQuery.value = ''
    assignResults.value = []
}

function removeAssign(index) {
    form.value.assigns.splice(index, 1)
}

async function submitForm() {
    loading.value = true
    error.value = null
    success.value = false
    try {
        await createTicket(form.value)
        success.value = true
    } catch (err) {
        error.value = err?.message || 'Erreur lors de la création du ticket'
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadAssets()
    loadUsers()
})
</script>

<template>
    <div>
        <h1>Créer un ticket</h1>

        <div v-if="success" style="color: green">Ticket créé avec succès</div>
        <div v-if="error" style="color: red">{{ error }}</div>

        <form @submit.prevent="submitForm">

            <div>
                <label>Titre</label>
                <input v-model="form.name" type="text" required />
            </div>

            <div>
                <label>Description</label>
                <textarea v-model="form.content" required />
            </div>

            <div>
                <label>Type</label>
                <select v-model="form.type" required>
                    <option value="1">Incident</option>
                    <option value="2">Demande</option>
                </select>
            </div>

            <div>
                <label>Statut</label>
                <select v-model="form.status" required>
                    <option value="1">Nouveau</option>
                    <option value="2">Assigné</option>
                    <option value="6">Clos</option>
                </select>
            </div>

            <div>
                <label>Priorité</label>
                <select v-model="form.priority" required>
                    <option value="1">Très basse</option>
                    <option value="2">Basse</option>
                    <option value="3">Moyenne</option>
                    <option value="4">Haute</option>
                    <option value="5">Très haute</option>
                    <option value="6">Critique</option>
                </select>
            </div>

            <div>
                <label>Date</label>
                <input v-model="form.date" type="datetime-local" required />
            </div>

            <!-- DEMANDEUR -->
            <div>
                <label>Demandeur</label>
                <input
                    v-model="requesterQuery"
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    @input="searchRequester"
                />
                <ul v-if="requesterResults.length > 0" style="border: 1px solid #ccc; list-style: none; padding: 0; margin: 0;">
                    <li
                        v-for="user in requesterResults"
                        :key="user.id"
                        style="padding: 8px; cursor: pointer;"
                        @click="selectRequester(user)"
                    >
                        {{ user.username }}
                    </li>
                </ul>
                <ul v-if="form.requesters.length > 0" style="margin-top: 8px;">
                    <li v-for="(user, index) in form.requesters" :key="user.id">
                        {{ user.name }}
                        <button type="button" @click="removeRequester(index)">✕</button>
                    </li>
                </ul>
            </div>

            <!-- ATTRIBUÉ À -->
            <div>
                <label>Attribué à</label>
                <input
                    v-model="assignQuery"
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    @input="searchAssign"
                />
                <ul v-if="assignResults.length > 0" style="border: 1px solid #ccc; list-style: none; padding: 0; margin: 0;">
                    <li
                        v-for="user in assignResults"
                        :key="user.id"
                        style="padding: 8px; cursor: pointer;"
                        @click="selectAssign(user)"
                    >
                        {{ user.username }}
                    </li>
                </ul>
                <ul v-if="form.assigns.length > 0" style="margin-top: 8px;">
                    <li v-for="(user, index) in form.assigns" :key="user.id">
                        {{ user.name }}
                        <button type="button" @click="removeAssign(index)">✕</button>
                    </li>
                </ul>
            </div>

            <!-- ÉLÉMENTS LIÉS -->
            <div>
                <label>Éléments</label>
                <input
                    v-model="assetQuery"
                    type="text"
                    placeholder="Rechercher un élément..."
                    @input="searchAsset"
                />
                <ul v-if="assetResults.length > 0" style="border: 1px solid #ccc; list-style: none; padding: 0; margin: 0;">
                    <li
                        v-for="result in assetResults"
                        :key="`${result.itemtype}-${result.id}`"
                        style="padding: 8px; cursor: pointer;"
                        @click="selectAsset(result)"
                    >
                        {{ result.itemtype }} — {{ result.name }}
                    </li>
                </ul>
                <ul v-if="form.items.length > 0" style="margin-top: 8px;">
                    <li v-for="(item, index) in form.items" :key="index">
                        {{ item.itemtype }} — {{ item.name }}
                        <button type="button" @click="removeItem(index)">✕</button>
                    </li>
                </ul>
            </div>

            <button type="submit" :disabled="loading">
                {{ loading ? 'Création...' : 'Créer le ticket' }}
            </button>

        </form>
    </div>
</template>