// <script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { checkCode } from "../services/entreService.js";

const router = useRouter();
const userConnected = ref(null);
const code = ref("nam");


async function Connect() {
  try {
    const result = await checkCode(code.value);
    if (result) {
      userConnected.value = result;

      // stockage dans session
      localStorage.setItem("userConnected", JSON.stringify(result));
      //redirection
      router.push("/dashboard");
    }
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    alert("Une erreur est survenue lors de la connexion.");
  }
}
</script>
<template>
  <div>
    <h1>Login</h1>
    <label for="pwd">Code d acces:</label>
    <input type="password" id="pwd" v-model="code" required />
    <button @click="Connect">Se connecter</button>
  </div>
</template>
<style lang=""></style>
