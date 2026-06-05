<script setup>
import { ref, onMounted } from 'vue'
import { deleteAll } from '@/services/deleteServices'

const status = ref('')
const error = ref('')
const loading = ref(false)

async function handleDelete() {
  loading.value = true
  error.value = ''
  status.value = ''
  try {
    const res = await deleteAll()
    status.value = res?.success ? 'Suppression terminée' : 'Aucun élément supprimé'
  } catch (e) {
    error.value = e?.message || 'Erreur lors de la suppression'
    console.error(e)
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div>
    <h1>Suppression de donnees</h1>
    <div v-if="loading">Traitement en cours...</div>
    <div v-else>
      <button @click="handleDelete">Supprimer</button>
      <div v-if="status">{{ status }}</div>
      <div v-if="error" style="color: red">{{ error }}</div>
    </div>
  </div>
</template>