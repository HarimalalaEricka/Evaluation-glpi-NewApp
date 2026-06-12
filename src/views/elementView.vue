<script setup>
import { ref, computed, onMounted } from 'vue'
import { getElements } from '@/services/elementService.js'
import { getItems, getDocumentUrl } from '@/services/glpi.js'
import { getDocId } from '@/services/glpiV1.js'

const elements = ref([])
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const total = ref(0)
const perPage = parseInt(import.meta.env.VITE_PER_PAGE)

const totalPages = computed(() => Math.ceil(total.value / perPage))

// Données pour les selects
const assetTypes = ref([])
const states = ref([])
const locations = ref([])
const manufacturers = ref([])
const users = ref([])

// Filtres
const filters = ref({
    name: '',
    itemtype: '',
    status: '',
    location: '',
    manufacturer: '',
    model: '',
    otherserial: '',
    user: ''
})

async function loadFilterData() {
    try {
        const { items: types } = await getItems('/Assets')
        assetTypes.value = types

        const { items: stateItems } = await getItems('/Dropdowns/State')
        states.value = stateItems

        const { items: locationItems } = await getItems('/Dropdowns/Location')
        locations.value = locationItems

        const { items: manufacturerItems } = await getItems('/Dropdowns/Manufacturer')
        manufacturers.value = manufacturerItems

        const { items: userItems } = await getItems('/Administration/User')
        users.value = userItems
    } catch (e) {
        console.error('Erreur chargement filtres:', e)
    }
}

async function fetchElements() {
    loading.value = true
    error.value = null
    try {
        const result = await getElements(currentPage.value, perPage, filters.value)
        elements.value = result.items
        elements.value = await Promise.all(elements.value.map(async (element) => {
            const doc_id = await getDocId(element.itemtype, element.id)
            return {
                ...element,
                documentUrl: getDocumentUrl(doc_id, element.itemtype, element.id)
            }
        }))
        total.value = result.total
    } catch (e) {
        error.value = 'Erreur lors du chargement des éléments'
        console.error(e)
    } finally {
        loading.value = false
    }
}

async function search() {
    currentPage.value = 1
    await fetchElements()
}

function resetFilters() {
    filters.value = {
        name: '',
        itemtype: '',
        status: '',
        location: '',
        manufacturer: '',
        model: '',
        otherserial: '',
        user: ''
    }
    search()
}

async function changePage(page) {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    await fetchElements()
}

onMounted(async () => {
    await loadFilterData()
    await fetchElements()
})
</script>

<template>
    <div>
        <h1>Liste des éléments</h1>

        <!-- Filtres -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">
            <div>
                <label>Nom</label>
                <input v-model="filters.name" type="text" placeholder="Rechercher par nom..." />
            </div>

            <div>
                <label>Type</label>
                <select v-model="filters.itemtype">
                    <option value="">Tous</option>
                    <option v-for="type in assetTypes" :key="type.itemtype" :value="type.itemtype">
                        {{ type.itemtype }}
                    </option>
                </select>
            </div>

            <div>
                <label>Statut</label>
                <select v-model="filters.status">
                    <option value="">Tous</option>
                    <option v-for="state in states" :key="state.id" :value="state.id">
                        {{ state.name }}
                    </option>
                </select>
            </div>

            <div>
                <label>Localisation</label>
                <select v-model="filters.location">
                    <option value="">Toutes</option>
                    <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                        {{ loc.name }}
                    </option>
                </select>
            </div>

            <div>
                <label>Fabricant</label>
                <select v-model="filters.manufacturer">
                    <option value="">Tous</option>
                    <option v-for="m in manufacturers" :key="m.id" :value="m.id">
                        {{ m.name }}
                    </option>
                </select>
            </div>

            <div>
                <label>Modèle</label>
                <input v-model="filters.model" type="text" placeholder="Modèle..." />
            </div>

            <div>
                <label>N° Inventaire</label>
                <input v-model="filters.otherserial" type="text" placeholder="N° inventaire..." />
            </div>

            <div>
                <label>Utilisateur</label>
                <select v-model="filters.user">
                    <option value="">Tous</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">
                        {{ u.username }}
                    </option>
                </select>
            </div>
        </div>

        <div style="margin-bottom: 16px;">
            <button @click="search">Rechercher</button>
            <button @click="resetFilters" style="margin-left: 8px;">Réinitialiser</button>
        </div>

        <div v-if="loading">Chargement...</div>
        <div v-if="error" style="color: red">{{ error }}</div>

        <table v-if="elements.length" border="1">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Type</th>
                    <th>Nom</th>
                    <th>N° Inventaire</th>
                    <th>Statut</th>
                    <th>Localisation</th>
                    <th>Fabricant</th>
                    <th>Model</th>
                    <th>User</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="element in elements" :key="`${element.itemtype}-${element.id}`">
                    <td>
                        <img :src="element.documentUrl" :alt="element.name" width="70" height="70"/>
                    </td>
                    <td>{{ element.itemtype }}</td>
                    <td>{{ element.name }}</td>
                    <td>{{ element.otherserial }}</td>
                    <td>{{ element.status?.name }}</td>
                    <td>{{ element.location?.name }}</td>
                    <td>{{ element.manufacturer?.name }}</td>
                    <td>{{ element.model?.name }}</td>
                    <td>{{ element.user?.name }}</td>
                </tr>
            </tbody>
        </table>

        <div v-if="!loading && elements.length === 0">Aucun élément trouvé</div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" style="margin-top: 16px;">
            <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">← Précédent</button>

            <span v-for="page in totalPages" :key="page">
                <button
                    @click="changePage(page)"
                    :style="page === currentPage ? 'font-weight: bold; text-decoration: underline;' : ''"
                >
                    {{ page }}
                </button>
            </span>

            <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">Suivant →</button>

            <p>Page {{ currentPage }} / {{ totalPages }} — {{ total }} éléments</p>
        </div>
    </div>
</template>