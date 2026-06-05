<template>
  <section class="users-page">
    <header class="users-header">
      <div>
        <p class="eyebrow">SQLite</p>
        <h1>Liste des utilisateurs</h1>
      </div>

      <button type="button" class="refresh" @click="loadUsers" :disabled="loading">
        Rafraîchir
      </button>
    </header>

    <p v-if="loading" class="state">Chargement...</p>
    <p v-else-if="error" class="state error">{{ error }}</p>

    <div v-else-if="utilisateurs.length" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Password</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="utilisateur in utilisateurs" :key="utilisateur.id ?? utilisateur.name">
            <td>{{ utilisateur.id }}</td>
            <td>{{ utilisateur.name }}</td>
            <td>{{ utilisateur.password }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="state">Aucun utilisateur trouvé.</p>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getUtilisateurs } from '@/services/sqlite'

const utilisateurs = ref([])
const loading = ref(false)
const error = ref(null)

async function loadUsers() {
  loading.value = true
  error.value = null

  try {
    utilisateurs.value = await getUtilisateurs()
  } catch (e) {
    error.value = e?.message || 'Erreur lors du chargement des utilisateurs'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.users-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.users-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6b7280;
}

h1 {
  margin: 0;
  font-size: 30px;
}

.refresh {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
}

.refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.state {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.state.error {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fef2f2;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  background: #f9fafb;
  font-weight: 600;
}

@media (max-width: 640px) {
  .users-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
