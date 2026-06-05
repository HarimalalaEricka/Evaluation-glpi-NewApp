<script setup>
import { ref } from 'vue'
import { importAssets } from '@/services/importService'

const file2 = ref(null)
const file3 = ref(null)
const assetsFile = ref(null)
const loading = ref(false)
const status = ref('')
const error = ref('')
const isImporting = ref(false)

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
		await importAssets(assetsFile.value)
	} catch (err) {
		error.value = err?.message || 'Erreur lors de l’import.'
	} finally {
		loading.value = false
	}
}
</script>
<template>
	<div class="import-container">
		<h1 class="import-title">Importation des données</h1>

		<form @submit.prevent="submitImport" class="import-form">
			<div class="form-grid">
				<div class="form-group">
					<label class="form-label">CSV actifs</label>
					<div class="file-input-wrapper">
						<input
							type="file"
							accept=".csv,text/csv"
							@change="onAssetsFileChange"
							id="assets-file"
						/>
						<label for="assets-file" class="file-custom-btn">
							{{ assetsFile ? assetsFile.name : 'Choisir un fichier CSV...' }}
						</label>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label">CSV utilisateurs</label>
					<div class="file-input-wrapper">
						<input
							type="file"
							accept=".csv,text/csv"
							@change="onUsersFileChange"
							id="users-file"
						/>
						<label for="users-file" class="file-custom-btn">
							{{ file2 ? file2.name : 'Choisir un fichier CSV...' }}
						</label>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label">CSV techniciens</label>
					<div class="file-input-wrapper">
						<input
							type="file"
							accept=".csv,text/csv"
							@change="onTechsFileChange"
							id="techs-file"
						/>
						<label for="techs-file" class="file-custom-btn">
							{{ file3 ? file3.name : 'Choisir un fichier CSV...' }}
						</label>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label">Fichier ZIP (Images)</label>
					<div class="file-input-wrapper" :class="{ 'disabled': isImporting }">
						<input
							ref="imageFileInput"
							type="file"
							accept=".zip"
							@change="handleImageFileUpload"
							:disabled="isImporting"
							id="zip-file"
						/>
						<label for="zip-file" class="file-custom-btn">
							Choisir le fichier ZIP...
						</label>
					</div>
				</div>
			</div>

			<div class="actions-container">
				<button 
					type="submit" 
					class="submit-btn"
					:disabled="(!assetsFile && !file2 && !file3) || loading"
				>
					{{ loading ? 'Préparation...' : 'Lancer l\'import' }}
				</button>
			</div>
		</form>

		<div v-if="status" class="alert alert-success">{{ status }}</div>
		<div v-if="error" class="alert alert-error">{{ error }}</div>
	</div>
</template>

<style scoped>
/* Conteneur Principal */
.import-container {
	max-width: 800px; /* Légèrement élargi pour le format 2x2 */
	margin: 2rem auto;
	padding: 2rem;
	background-color: #ffffff;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	font-family: system-ui, -apple-system, sans-serif;
}

.import-title {
	font-size: 1.5rem;
	color: #333333;
	margin-bottom: 2rem;
	font-weight: 600;
	border-bottom: 2px solid #f0f0f0;
	padding-bottom: 0.5rem;
}

/* Grille forcée à 2 colonnes */
.form-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr); /* Crée exactement 2 colonnes égales */
	gap: 1.5rem;
	margin-bottom: 2rem;
}

.form-group {
	display: flex;
	flex-direction: column;
}

.form-label {
	font-size: 0.9rem;
	font-weight: 500;
	color: #555555;
	margin-bottom: 0.5rem;
}

/* Design des boutons de fichier */
.file-input-wrapper {
	position: relative;
}

.file-input-wrapper input[type="file"] {
	position: absolute;
	left: 0;
	top: 0;
	opacity: 0;
	width: 100%;
	height: 100%;
	cursor: pointer;
}

.file-custom-btn {
	display: block;
	padding: 0.75rem 1rem;
	background-color: #fafafa;
	border: 1px dashed #cccccc;
	border-radius: 6px;
	font-size: 0.85rem;
	color: #666666;
	text-align: center;
	transition: all 0.2s ease;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.file-input-wrapper:hover .file-custom-btn {
	border-color: #969587;
	background-color: #f5f5f4;
}

.file-input-wrapper.disabled {
	opacity: 0.6;
	pointer-events: none;
}

/* Zone du bouton de validation */
.actions-container {
	display: flex;
	justify-content: flex-end;
	border-top: 1px solid #f0f0f0;
	padding-top: 1.5rem;
}

.submit-btn {
	padding: 0.75rem 2rem;
	background-color: #969587;
	color: #ffffff;
	border: none;
	border-radius: 6px;
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
	background-color: #7e7d70;
}

.submit-btn:disabled {
	background-color: #d9d9d9;
	color: #888888;
	cursor: not-allowed;
}

/* Alertes */
.alert {
	margin-top: 1rem;
	padding: 0.75rem 1rem;
	border-radius: 6px;
	font-size: 0.9rem;
}

.alert-success {
	background-color: #edf7ed;
	color: #1e4620;
	border: 1px solid #c3e6cb;
}

.alert-error {
	background-color: #fde8e8;
	color: #9b1c1c;
	border: 1px solid #f8b4b4;
}

/* Mode Mobile : On repasse sur une seule colonne */
@media (max-width: 600px) {
	.form-grid {
		grid-template-columns: 1fr;
	}
	.import-container {
		margin: 1rem;
		padding: 1rem;
	}
}
</style>
