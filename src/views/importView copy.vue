<template>
  <div class="csv-importer">
    <div class="card">
      <h3>Importateur CSV</h3>
      
      <!-- Zone de sélection de fichier -->
      <div class="file-zone">
        <input
          type="file"
          id="csvFile"
          accept=".csv"
          @change="handleFileSelect"
          ref="fileInput"
          class="file-input"
        />
        <label for="csvFile" class="file-label">
          <span v-if="!fileName">📁 Choisir un fichier CSV</span>
          <span v-else>📄 {{ fileName }}</span>
        </label>
      </div>

      <!-- Options d'import -->
      <div class="options" v-if="fileName">
        <div class="option-group">
          <label>
            <input type="checkbox" v-model="options.stopOnError" />
            Arrêter à la première erreur
          </label>
        </div>
        
        <div class="option-group">
          <label>Taille des lots :</label>
          <select v-model.number="options.batchSize">
            <option :value="1">1 (séquentiel)</option>
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
        </div>

        <div class="option-group">
          <label>
            <input type="checkbox" v-model="options.useBatches" />
            Utiliser l'envoi par lots (Promise.all)
          </label>
        </div>

        <div class="option-group">
          <label>Délai entre les lots (ms) :</label>
          <input type="number" v-model.number="options.batchDelay" min="0" max="5000" />
        </div>
      </div>

      <!-- Actions -->
      <div class="actions" v-if="fileName && !importing">
        <button @click="startImport" class="btn-primary" :disabled="!canImport">
          🚀 Démarrer l'import ({{ totalItems }} lignes)
        </button>
        <button @click="clearFile" class="btn-secondary">🗑️ Effacer</button>
      </div>

      <div class="actions" v-if="importing">
        <button @click="cancelImport" class="btn-danger">⏹️ Annuler</button>
      </div>

      <!-- Progression -->
      <div class="progress-section" v-if="importing || progress.current > 0">
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: progress.percentage + '%' }"
          ></div>
        </div>
        <div class="progress-stats">
          <span>📊 {{ progress.current }} / {{ progress.total }}</span>
          <span>✅ Succès: {{ progress.success }}</span>
          <span>❌ Échecs: {{ progress.failed }}</span>
          <span>{{ progress.percentage }}%</span>
        </div>
      </div>

      <!-- Résultats -->
      <div class="results" v-if="results">
        <div class="result-summary">
          <h4>Résultats de l'import</h4>
          <div class="summary-stats">
            <div class="stat success">✅ {{ results.success }}</div>
            <div class="stat failed">❌ {{ results.failed }}</div>
            <div class="stat total">📊 {{ results.total }}</div>
          </div>
        </div>

        <div class="errors-list" v-if="results.errors && results.errors.length > 0">
          <h4>Erreurs ({{ results.errors.length }})</h4>
          <div class="error-item" v-for="(error, idx) in results.errors" :key="idx">
            <strong>Ligne {{ error.index + 1 }}:</strong> {{ error.message }}
            <pre v-if="showDetails">{{ JSON.stringify(error.item, null, 2) }}</pre>
          </div>
          <button @click="showDetails = !showDetails" class="btn-text">
            {{ showDetails ? 'Masquer' : 'Afficher' }} les détails
          </button>
        </div>

        <div class="success-list" v-if="results.success > 0 && showSuccessDetails">
          <h4>Imports réussis</h4>
          <div class="success-item" v-for="(item, idx) in results.successDetails" :key="idx">
            {{ item.name || 'Sans nom' }} - {{ item.serial || 'Pas de série' }}
          </div>
        </div>
      </div>

      <!-- Aperçu CSV -->
      <div class="preview" v-if="previewData.length > 0 && !importing">
        <h4>Aperçu des données ({{ previewData.length }} lignes)</h4>
        <div class="preview-table-wrapper">
          <table class="preview-table">
            <thead>
              <tr>
                <th>#</th>
                <th v-for="col in columns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in previewData.slice(0, 5)" :key="idx">
                <td>{{ idx + 1 }}</td>
                <td v-for="col in columns" :key="col">
                  <span class="cell-value">{{ row[col] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="previewData.length > 5" class="preview-note">
            ... et {{ previewData.length - 5 }} autres lignes
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'CsvImporter',
  props: {
    apiUrl: {
      type: String,
      required: true,
      default: '/api/computers'
    },
    separator: {
      type: String,
      default: ','
    },
    insertItemFunction: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const fileInput = ref(null)
    const fileName = ref('')
    const csvData = ref('')
    const previewData = ref([])
    const columns = ref([])
    const importing = ref(false)
    const cancelImportFlag = ref(false)
    const showDetails = ref(false)
    const showSuccessDetails = ref(false)
    
    const progress = ref({
      current: 0,
      total: 0,
      success: 0,
      failed: 0,
      percentage: 0
    })
    
    const results = ref(null)
    
    const options = ref({
      stopOnError: false,
      batchSize: 10,
      useBatches: false,
      batchDelay: 500
    })
    
    const totalItems = computed(() => previewData.value.length)
    const canImport = computed(() => totalItems.value > 0)
    
    // Parser le CSV
    const parseCSV = (csvText) => {
      const lines = csvText.trim().split('\n')
      const headers = lines[0].split(props.separator).map(h => h.trim())
      columns.value = headers
      
      const results = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        const obj = {}
        
        headers.forEach((header, index) => {
          let value = values[index] || ''
          
          // Enlever les guillemets
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1)
          }
          
          // Convertir les types
          if (value === 'null' || value === '') {
            obj[header] = null
          } else if (value === 'true') {
            obj[header] = true
          } else if (value === 'false') {
            obj[header] = false
          } else if (!isNaN(value) && value !== '') {
            obj[header] = Number(value)
          } else {
            obj[header] = value
          }
        })
        
        results.push(obj)
      }
      
      return results
    }
    
    // Parser une ligne CSV (gère les virgules dans les guillemets)
    const parseCSVLine = (line) => {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === props.separator && !inQuotes) {
          result.push(current)
          current = ''
        } else {
          current += char
        }
      }
      
      result.push(current)
      return result
    }
    
    // Lire le fichier CSV
    const readCSVFile = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onload = (event) => {
          try {
            const data = parseCSV(event.target.result)
            resolve(data)
          } catch (error) {
            reject(error)
          }
        }
        
        reader.onerror = () => reject(reader.error)
        reader.readAsText(file, 'UTF-8')
      })
    }
    
    // Nettoyer un item (enlever les champs null/empty)
    const cleanItem = (item) => {
      return Object.fromEntries(
        Object.entries(item).filter(([_, v]) => v !== null && v !== '')
      )
    }
    
    // Importer séquentiellement
    const importSequential = async (items) => {
      const errors = []
      const successDetails = []
      let success = 0
      let failed = 0
      
      for (let i = 0; i < items.length; i++) {
        if (cancelImportFlag.value) {
          console.log('Import annulé')
          break
        }
        
        const item = items[i]
        const cleanItemObj = cleanItem(item)
        
        try {
          const response = await props.insertItemFunction(props.apiUrl, cleanItemObj)
          success++
          successDetails.push(cleanItemObj)
          progress.value.success = success
          
          if (options.value.onItemSuccess) {
            options.value.onItemSuccess(i, item, response)
          }
        } catch (error) {
          failed++
          errors.push({ index: i, item, message: error.message })
          progress.value.failed = failed
          
          if (options.value.onItemError) {
            options.value.onItemError(i, item, error)
          }
          
          if (options.value.stopOnError) {
            throw new Error(`Import arrêté à l'index ${i}: ${error.message}`)
          }
        }
        
        progress.value.current = i + 1
        progress.value.percentage = Math.round(((i + 1) / items.length) * 100)
      }
      
      return { success, failed, total: items.length, errors, successDetails }
    }
    
    // Importer par lots
    const importByBatches = async (items) => {
      const errors = []
      const successDetails = []
      let success = 0
      let failed = 0
      
      for (let i = 0; i < items.length; i += options.value.batchSize) {
        if (cancelImportFlag.value) {
          console.log('Import annulé')
          break
        }
        
        const batch = items.slice(i, i + options.value.batchSize)
        const batchPromises = batch.map(async (item, idx) => {
          const cleanItemObj = cleanItem(item)
          
          try {
            const response = await props.insertItemFunction(props.apiUrl, cleanItemObj)
            return { success: true, index: i + idx, data: response, item: cleanItemObj }
          } catch (error) {
            return { success: false, index: i + idx, error: error.message, item }
          }
        })
        
        const batchResults = await Promise.all(batchPromises)
        
        for (const result of batchResults) {
          if (result.success) {
            success++
            successDetails.push(result.item)
            progress.value.success = success
          } else {
            failed++
            errors.push({ index: result.index, item: result.item, message: result.error })
            progress.value.failed = failed
            
            if (options.value.stopOnError) {
              throw new Error(`Import arrêté à l'index ${result.index}: ${result.error}`)
            }
          }
          progress.value.current = result.index + 1
          progress.value.percentage = Math.round(((result.index + 1) / items.length) * 100)
        }
        
        // Délai entre les lots
        if (i + options.value.batchSize < items.length && options.value.batchDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, options.value.batchDelay))
        }
      }
      
      return { success, failed, total: items.length, errors, successDetails }
    }
    
    // Démarrer l'import
    const startImport = async () => {
      if (!previewData.value.length) {
        alert('Aucune donnée à importer')
        return
      }
      
      importing.value = true
      cancelImportFlag.value = false
      results.value = null
      showDetails.value = false
      showSuccessDetails.value = false
      
      progress.value = {
        current: 0,
        total: previewData.value.length,
        success: 0,
        failed: 0,
        percentage: 0
      }
      
      try {
        let importResults
        if (options.value.useBatches) {
          importResults = await importByBatches(previewData.value)
        } else {
          importResults = await importSequential(previewData.value)
        }
        
        results.value = importResults
        
        if (importResults.errors.length === 0) {
          console.log('✅ Import terminé avec succès !')
          if (confirm('Import terminé ! Voulez-vous effacer le fichier ?')) {
            clearFile()
          }
        } else {
          console.warn(`⚠️ Import terminé avec ${importResults.errors.length} erreur(s)`)
        }
      } catch (error) {
        console.error('❌ Erreur fatale:', error)
        alert(`Erreur lors de l'import: ${error.message}`)
        results.value = {
          success: progress.value.success,
          failed: progress.value.failed,
          total: previewData.value.length,
          errors: [{ index: -1, message: error.message }],
          successDetails: []
        }
      } finally {
        importing.value = false
        cancelImportFlag.value = false
      }
    }
    
    // Annuler l'import
    const cancelImport = () => {
      if (confirm('Voulez-vous vraiment annuler l\'import en cours ?')) {
        cancelImportFlag.value = true
        importing.value = false
      }
    }
    
    // Gérer la sélection du fichier
    const handleFileSelect = async (event) => {
      const file = event.target.files[0]
      
      if (!file) {
        return
      }
      
      if (!file.name.endsWith('.csv')) {
        alert('Le fichier doit être au format CSV')
        fileInput.value.value = ''
        return
      }
      
      fileName.value = file.name
      
      try {
        const data = await readCSVFile(file)
        previewData.value = data
        console.log(`📄 ${data.length} lignes chargées`)
      } catch (error) {
        console.error('Erreur de lecture:', error)
        alert(`Erreur lors de la lecture du fichier: ${error.message}`)
        clearFile()
      }
    }
    
    // Effacer le fichier
    const clearFile = () => {
      fileName.value = ''
      csvData.value = ''
      previewData.value = []
      columns.value = []
      results.value = null
      progress.value = {
        current: 0,
        total: 0,
        success: 0,
        failed: 0,
        percentage: 0
      }
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
    
    return {
      fileInput,
      fileName,
      previewData,
      columns,
      importing,
      progress,
      results,
      options,
      totalItems,
      canImport,
      showDetails,
      showSuccessDetails,
      handleFileSelect,
      startImport,
      cancelImport,
      clearFile
    }
  }
}
</script>

<style scoped>
.csv-importer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

h4 {
  margin: 16px 0 12px 0;
  color: #34495e;
  font-size: 1.1rem;
}

.file-zone {
  margin-bottom: 24px;
}

.file-input {
  display: none;
}

.file-label {
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.2s, box-shadow 0.2s;
}

.file-label:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.options {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.option-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.option-group input[type="number"],
.option-group select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-text {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  margin-top: 8px;
  font-size: 12px;
}

.btn-text:hover {
  text-decoration: underline;
}

.progress-section {
  margin: 20px 0;
}

.progress-bar {
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  height: 30px;
}

.progress-fill {
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  height: 100%;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

.results {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px solid #e9ecef;
}

.result-summary {
  margin-bottom: 20px;
}

.summary-stats {
  display: flex;
  gap: 20px;
}

.stat {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: bold;
}

.stat.success {
  background: #d4edda;
  color: #155724;
}

.stat.failed {
  background: #f8d7da;
  color: #721c24;
}

.stat.total {
  background: #e2e3e5;
  color: #383d41;
}

.errors-list,
.success-list {
  margin-top: 16px;
}

.error-item {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.error-item pre {
  margin-top: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

.success-item {
  background: #d4edda;
  border-left: 4px solid #28a745;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 14px;
}

.preview {
  margin-top: 24px;
}

.preview-table-wrapper {
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table th,
.preview-table td {
  border: 1px solid #dee2e6;
  padding: 8px 12px;
  text-align: left;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.cell-value {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.preview-note {
  margin-top: 8px;
  font-size: 12px;
  color: #6c757d;
  text-align: center;
}

@media (max-width: 768px) {
  .options {
    flex-direction: column;
  }
  
  .progress-stats {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .summary-stats {
    flex-wrap: wrap;
  }
}
</style>