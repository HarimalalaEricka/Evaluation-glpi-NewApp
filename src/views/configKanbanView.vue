<script setup>
import { ref, onMounted, watch } from "vue";
import { getColors, updateColor, getLangue, getTraductionByLangue, updateTraduction, insertLangue } from "@/services/sqlite.js";

const color = ref(true);
const lang = ref(false);
const statusConfig = ref({});
const defaultConfig = ref({});
const langues = ref([]);
const selectedLang = ref(null);
const traductionConfig = ref([]);
const newLangue = ref(false)
const newLangueLabel = ref('')

// =======================
// LOAD
// =======================
async function loadLangues() {
  try {
    langues.value = await getLangue();
    console.log("Langues chargées:", langues.value);
    if (langues.value.length > 0 && !selectedLang.value) {
      selectedLang.value = langues.value[0].id;
    }
  } catch (e) {
    console.error("Erreur chargement langues:", e);
  }
}

async function loadTraductions(langId) {
  if (!langId) return;
  try {
    traductionConfig.value = [];
    const data = await getTraductionByLangue(langId);
    traductionConfig.value = data;
    console.log("Traductions chargées:", data);
  } catch (e) {
    console.error("Erreur chargement traductions:", e);
  }
}

async function loadColors() {
  try {
    const colors = await getColors();
    colors.forEach((c) => {
      const entry = {
        label: c.label,
        color: c.color,
        background: c.background,
      };
      statusConfig.value[c.id] = { ...entry };
      defaultConfig.value[c.id] = { ...entry };
    });
  } catch (e) {
    console.error("Erreur chargement couleurs:", e);
  }
}

// =======================
// WATCH : CHANGEMENT LANGUE
// =======================
watch(selectedLang, (langId) => {
  loadTraductions(langId);
});

// =======================
// SWITCH MODE
// =======================
async function ColorConfig() {
  color.value = true;
  lang.value = false;
  await loadColors();
}

async function LangConfig() {
  lang.value = true;
  color.value = false;
  await loadLangues();
}

// =======================
// COLORS ACTIONS
// =======================
function resetColor(status) {
  statusConfig.value[status].color = defaultConfig.value[status].color;
  statusConfig.value[status].background = defaultConfig.value[status].background;
}

function resetAllColors() {
  for (const status in defaultConfig.value) {
    statusConfig.value[status].color = defaultConfig.value[status].color;
    statusConfig.value[status].background = defaultConfig.value[status].background;
  }
}

function saveColors() {
  for (const status in statusConfig.value) {
    const config = statusConfig.value[status];
    updateColor(status, config.color, config.background)
      .then(() => console.log(`Couleurs statut ${status} mises à jour`))
      .catch((e) => console.error(`Erreur statut ${status}:`, e));
  }
  alert("Couleurs enregistrées !");
}

// =======================
// LANG ACTIONS
// =======================
async function resetAllTrad() {
  await loadTraductions(selectedLang.value);
}

function saveTrad() {
    for( const trad of traductionConfig.value) {
        updateTraduction(trad.id, trad.traduction, trad.idLangue, trad.idStatus)
            .then(() => console.log(`Traduction ${trad.label} mise à jour`))
            .catch((e) => console.error(`Erreur traduction ${trad.label}:`, e));
    }
//   console.log("Traductions:", traductionConfig.value);
  alert("Traductions enregistrées !");
}

async function newLangueadd()
{
    newLangue.value = true
}
async function createNewLangue() {
  if (!newLangueLabel.value.trim()) return
  try {
    await insertLangue(newLangueLabel.value)
    newLangueLabel.value = ''        // reset le champ
    await loadLangues()              // recharge la liste
  } catch (e) {
    console.error("Erreur lors de l'insertion de la langue:", e)
  }
}
onMounted(async () => {
  await loadLangues();
});
</script>

<template>
  <div>
    <button @click="ColorConfig">Couleur</button>
    <button @click="LangConfig">Langue</button>

    <!-- ================= COULEURS ================= -->
    <div v-if="color">
      <h2>Configuration de la couleur</h2>

      <table border="1">
        <tr>
          <th>Statut</th>
          <th>Couleur</th>
          <th>Background</th>
          <th>Action</th>
        </tr>

        <tr v-for="(config, status) in statusConfig" :key="status">
          <td>{{ config.label }}</td>

          <td>
            <div
              :style="{
                backgroundColor: config.color,
                width: '30px',
                height: '30px',
                borderRadius: '4px',
                cursor: 'pointer',
                border: '2px solid #ccc',
              }"
              @click="$refs['colorPicker_' + status][0].click()"
            ></div>
            <input
              type="color"
              v-model="config.color"
              :ref="'colorPicker_' + status"
              style="display: none"
            />
          </td>

          <td>
            <div
              :style="{
                backgroundColor: config.background,
                width: '30px',
                height: '30px',
                borderRadius: '4px',
                cursor: 'pointer',
                border: '2px solid #ccc',
              }"
              @click="$refs['colorPicker_bg_' + status][0].click()"
            ></div>
            <input
              type="color"
              v-model="config.background"
              :ref="'colorPicker_bg_' + status"
              style="display: none"
            />
          </td>

          <td>
            <button @click="resetColor(status)">Réinitialiser</button>
          </td>
        </tr>
      </table>

      <br />
      <button @click="saveColors">Enregistrer</button>
      <button @click="resetAllColors">Réinitialiser tout</button>
    </div>

    <!-- ================= LANGUES ================= -->
    <div v-if="lang">
      <h2>Configuration de la langue</h2>
        <button @click="newLangueadd">Nouvelle Langue</button>
        <div v-if="newLangue">
            <label for="newLangue">Langue: </label>
            <input type="text" v-model="newLangueLabel" name="newLangue">
            <button @click="createNewLangue">Creer</button>
        </div>
      <label for="lang-select">Sélectionnez la langue :</label>
      <select id="lang-select" v-model="selectedLang">
        <option v-for="l in langues" :key="l.id" :value="l.id">
          {{ l.langue }}
        </option>
      </select>

      <table border="1">
        <tr>
          <th>Statut</th>
          <th>Traduction</th>
          <th>Actions</th>
        </tr>

        <tr v-for="(trad, index) in traductionConfig" :key="index">
          <td>{{ trad.label }}</td>
          <td>
            <input v-model="trad.traduction" />
          </td>
          <td>
            <button @click="resetAllTrad">Réinitialiser</button>
          </td>
        </tr>
      </table>

      <br />
      <button @click="saveTrad">Enregistrer</button>
      <button @click="resetAllTrad">Réinitialiser tout</button>
    </div>
  </div>
</template>