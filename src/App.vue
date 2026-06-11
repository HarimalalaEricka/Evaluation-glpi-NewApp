<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Disconnect from './components/Disconnect.vue'

const route = useRoute()

// Routes qui n'affichent pas la navbar
const noNavbarRoutes = ['entre']

// Routes de backoffice
const backofficeRoutes = [
  'import',
  'delete',
  'dashboard',
  'tickets',
  'ticketFiche',
  'configKanban'
]

const shouldShowNavbar = computed(() => !noNavbarRoutes.includes(route.name))
const isBackoffice = computed(() => backofficeRoutes.includes(route.name))
// console.log(isBackoffice.value)

const isAdmin = computed(() => {
  return !!localStorage.getItem('userConnected')
})
</script>

<template>
  <div id="app-root" :class="{ 'backoffice': isBackoffice }">
    <nav v-if="shouldShowNavbar" class="navbar">
      <div class="navbar-container">
        <router-link to="/" class="navbar-brand">
          {{ isBackoffice ? '🔧 Admin' : '🛍️ NewApp' }}
        </router-link>
        <ul class="navbar-menu">
          <li v-if="isBackoffice">
            <router-link to="/dashboard">Acceuil</router-link>
          </li>
          <li v-if="isBackoffice">
            <router-link to="/import">Import</router-link>
          </li>
          <li v-if="isBackoffice">
            <router-link to="/delete">Supprimer</router-link>
          </li>
          <li v-if="isBackoffice">
            <router-link to="/tickets">Tickets</router-link>
          </li>
          <li v-if="isBackoffice">
            <router-link to="/config-kanban">Config</router-link>
          </li>
          <li v-if="!isBackoffice">
            <router-link to="/">Éléments</router-link>
          </li>
          <li v-if="!isBackoffice">
            <router-link to="/ticket-list">Liste des tickets</router-link>
          </li>
          <li v-if="!isBackoffice">
            <router-link to="/create-ticket">Créer un ticket</router-link>
          </li>
        </ul>
        <Disconnect v-if="shouldShowNavbar && isBackoffice" />
        <a href="/entre" v-if="shouldShowNavbar && !isBackoffice">Connect</a>
      </div>
    </nav>
    
    <main :class="{ 'container': shouldShowNavbar }">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  padding-top: var(--spacing-lg);
  padding-bottom: var(--spacing-xl);
}

main.container {
  max-width: 1200px;
  margin: var(--spacing-lg) auto 0;
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
  width: 100%;
}
</style>
