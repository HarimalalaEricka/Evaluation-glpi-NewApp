<script setup>
import { ref, onMounted } from 'vue'
import { createTicket } from '@/services/ticketService'
import { getItems } from '@/services/glpi'

const loading = ref(false)
const error = ref(null)
const success = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const allAssets = ref([]) // ← cache des assets
let searching = ref(false)

const form = ref({
    name: '',
    content: '',
    type: '',
    status: '',
    priority: '',
    date: '',
    items: []
})

// Chargé une seule fois au montage
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

// Recherche sur les données déjà chargées
function searchItem() {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) {
        searchResults.value = []
        return
    }
    searchResults.value = allAssets.value.filter(
        item => item.name?.toLowerCase().includes(query)
    )
}

function selectItem(item) {
    const exists = form.value.items.find(i => i.id === item.id && i.itemtype === item.itemtype)
    if (!exists) {
        form.value.items.push({ id: item.id, itemtype: item.itemtype, name: item.name })
    }
    searchQuery.value = ''
    searchResults.value = []
}

function removeItem(index) {
    form.value.items.splice(index, 1)
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

onMounted(loadAssets) // ← chargement unique
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
                    <option value="10">Approbation</option>
                    <option value="2">Assigné</option>
                    <option value="3">Planifié</option>
                    <option value="4">En attente</option>
                    <option value="5">Résolu</option>
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

            <div>
                <label>Éléments</label>
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Rechercher un élément..."
                    @input="searchItem"
                />
                <div v-if="searching">Recherche...</div>

                <!-- Résultats de recherche -->
                <ul v-if="searchResults.length > 0" style="border: 1px solid #ccc; list-style: none; padding: 0; margin: 0;">
                    <li
                        v-for="result in searchResults"
                        :key="`${result.itemtype}-${result.id}`"
                        style="padding: 8px; cursor: pointer;"
                        @click="selectItem(result)"
                    >
                        {{ result.itemtype }} — {{ result.name }}
                    </li>
                </ul>

                <!-- Items sélectionnés -->
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