<script setup>
import { ref, onMounted } from 'vue'
import { countElements, countTickets } from '../services/dashboardService'

const elementCounts = ref({ countElement: {}, countTotal: 0 })
const ticketCounts = ref({ countTicket: {}, countTotal: 0 })
const showElement = ref(true)
const showTicket = ref(false)

async function ShowElement() {
  showElement.value = true
  showTicket.value = false
  elementCounts.value = await countElements()
}

async function ShowTicket() {
  showElement.value = false
  showTicket.value = true
  ticketCounts.value = await countTickets()
}

onMounted(() => {
  ShowElement() // charge elements par défaut au démarrage
})
</script>
<template>
  <div class="dashboard-container">
    <button @click="ShowElement">Elements</button>
    <button @click="ShowTicket">Tickets</button>

    <div v-if="showElement">
      <h2>Elements</h2>
      <h3>Total : {{ elementCounts.countTotal }}</h3>
      <table border="1">
        <tr>
          <th>Type</th>
          <th>Count</th>
        </tr>
        <tr v-for="(count, type) in elementCounts.countElement" :key="type">
          <td>{{ type }}</td>
          <td>{{ count }}</td>
        </tr>
      </table>
    </div>

    <div v-if="showTicket">
      <h2>Tickets</h2>
      <h3>Total : {{ ticketCounts.countTotal }}</h3>
      <table border="1">
        <tr>
          <th>Type</th>
          <th>Count</th>
        </tr>
        <tr v-for="(count, type) in ticketCounts.countTicket" :key="type">
          <td>{{ type }}</td>
          <td>{{ count }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>