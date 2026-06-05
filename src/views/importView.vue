<script setup>
import { ref } from 'vue'
import { importAssets } from '@/services/importService'

const file2 = ref(null)
const file3 = ref(null)
const assetsFile = ref(null)
const loading = ref(false)
const status = ref('')
const error = ref('')

function onUsersFileChange(event) {
	file2.value = event.target.files?.[0] || null
	status.value = ''
	error.value = ''
}

function onTechsFileChange(event) {
	file3.value = event.target.files?.[0] || null
	status.value = ''
	error.value = ''
}

function onAssetsFileChange(event) {
	assetsFile.value = event.target.files?.[0] || null
	status.value = ''
	error.value = ''
}

async function submitImport() {
	if (!assetsFile.value && !file2.value && !file3.value) {
		error.value = 'Sélectionne au moins un fichier CSV.'
		return
	}

	loading.value = true
	status.value = ''
	error.value = ''

	try {
		status.value = 'Fichiers prêts. Les fonctions d import seront branchées ensuite.'
		await importAssets(assetsFile.value)
	} catch (err) {
		error.value = err?.message || 'Erreur lors de l’import.'
	} finally {
		loading.value = false
	}
}
</script>
<template>
	<div>
		<h1>Import CSV</h1>

		<form @submit.prevent="submitImport">
			<div>
				<label>CSV actifs</label>
				<input
					type="file"
					accept=".csv,text/csv"
					@change="onAssetsFileChange"
				/>
			</div>
			<div>
				<label>CSV utilisateurs</label>
				<input
					type="file"
					accept=".csv,text/csv"
					@change="onUsersFileChange"
				/>
			</div>

			<div>
				<label>CSV techniciens</label>
				<input
					type="file"
					accept=".csv,text/csv"
					@change="onTechsFileChange"
				/>
			</div>
		
			<button type="submit" :disabled="!assetsFile && !file2 && !file3 || loading">
				{{ loading ? 'Préparation...' : 'Lancer l import' }}
			</button>
		</form>

		<p v-if="status">{{ status }}</p>
		<p v-if="error">{{ error }}</p>
	</div>
</template>


