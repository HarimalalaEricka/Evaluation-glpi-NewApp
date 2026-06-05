<template>
  <div>
    <nav style="padding: 1rem; background: #f5f5f5;">
      <!-- <router-link to="/test">Ordinateurs</router-link> -->
      <!-- <span style="margin: 0 0.75rem;">|</span> -->
      <!-- <router-link to="/sqlite">Utilisateurs</router-link> -->
      <!-- <span style="margin: 0 0.75rem;">|</span> -->
      <router-link to="/delete">Suppression</router-link>
      <span style="margin: 0 0.75rem;">|</span>
      <router-link to="/import">Importation</router-link>
      <Disconnect/>
    </nav>
    <main style="padding: 1rem;">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Disconnect from './components/Disconnect.vue'
import { computed } from 'vue'
</script>
