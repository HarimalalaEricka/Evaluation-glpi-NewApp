<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTicketById } from '@/services/ticketService'
import { getItemById, getDocumentUrl } from '@/services/glpi'
import { getDocId } from '@/services/glpiV1'

const route = useRoute()
const ticket = ref(null)
const itemsWithAssets = ref([])
const loading = ref(false)
const error = ref(null)
const ticketId = computed(() => route.params.id)

async function fetchTicket() {
    try {
        loading.value = true
        error.value = null
        ticket.value = await getTicketById(ticketId.value)

        // Charger les assets liés
        itemsWithAssets.value = await Promise.all(
            ticket.value.itemsTicket.map(async (item) => {
                const asset = await getItemById(`/Assets/${item.itemtype}`, item.items_id)
                const doc_id = await getDocId(item.itemtype, item.items_id)
                console.log('doc_id pour', item.itemtype, item.items_id, ':', doc_id)
                return {
                    ...item,
                    assetName: asset.name,
                    status: asset.status.name,
                    location: asset.location.name,
                    manufacturer: asset.manufacturer.name,
                    model: asset.model.name,
                    inv: asset.otherserial,
                    user: asset.user.name,
                    documentUrl: getDocumentUrl( doc_id, item.itemtype, item.items_id)
                }
            })
        )
    } catch (e) {
        error.value = 'Erreur lors du chargement du ticket'
        console.error(e)
    } finally {
        loading.value = false
    }
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

onMounted(fetchTicket)
</script>

<template>
    <div>
        <h1>Détails du ticket</h1>

        <div v-if="loading">Chargement...</div>
        <div v-if="error" style="color: red">{{ error }}</div>

        <div v-if="ticket">
            <p><strong>ID:</strong> {{ ticket.ticket.id }}</p>
            <p><strong>Nom:</strong> {{ ticket.ticket.name }}</p>
            <p><strong>Description:</strong> {{ ticket.ticket.content }}</p>
            <p><strong>Status:</strong> {{ ticket.ticket.status.name }}</p>
            <p><strong>Priorité:</strong> {{ getPriorityLabel(ticket.ticket.priority) }}</p>
            <p><strong>Date de création:</strong> {{ formatDate(ticket.ticket.date_creation) }}</p>

            <h2>Élément(s) lié(s)</h2>
            <table border="1" style="margin-top: 16px;">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Type</th>
                        <th>Nom</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Manufacturer</th>
                        <th>Model</th>
                        <th>Numéro d'inventaire</th>
                        <th>Utilisateur</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in itemsWithAssets" :key="item.id">
                        <td>
                            <img :src="item.documentUrl" :alt="item.assetName" width="70" height="70"/>
                        </td>   
                        <td>{{ item.itemtype }}</td>
                        <td>{{ item.assetName }}</td>
                        <td>{{ item.status }}</td>
                        <td>{{ item.location }}</td>
                        <td>{{ item.manufacturer }}</td>
                        <td>{{ item.model }}</td>
                        <td>{{ item.inv }}</td>
                        <td>{{ item.user }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>