import { getItems, insertItem } from './glpi.js'

function getItemLabel(item) {
    return String(item?.username ?? item?.name ?? item?.login ?? '').trim().toLowerCase()
}

async function getExistingItemInUrl(itemUrl, matchValue) {
    const { items } = await getItems(itemUrl)
    const normalizedMatchValue = String(matchValue || '').trim().toLowerCase()

    return items.find((item) => getItemLabel(item) === normalizedMatchValue) || null
}

async function createItemIfMissing(itemUrl, data, matchValue) {
    const existingItem = await getExistingItemInUrl(itemUrl, matchValue)
    if (existingItem) {
        return { item: existingItem, reused: true }
    }

    try {
        const createdItem = await insertItem(itemUrl, data)
        return { item: createdItem, reused: false }
    } catch (error) {
        if (!String(error?.message || '').toLowerCase().includes('existe')) {
            throw error
        }

        const fallbackItem = await getExistingItemInUrl(itemUrl, matchValue)
        if (!fallbackItem) {
            throw error
        }

        return { item: fallbackItem, reused: true }
    }
}

// Fonction pour parser le CSV et retourner un tableau d'objets
function parseCSV(csvText, separator = ',') {
    const lines = csvText.trim().split('\n')
    const headers = lines[0].split(separator).map(h => h.trim())
    
    const results = []
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator)
        const obj = {}
        
        headers.forEach((header, index) => {
            let value = values[index] || ''
            // Enlever les guillemets si présents
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1)
            }
            // Convertir les types basiques
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

// Fonction pour lire un fichier CSV depuis un input file
function readCSVFile(file) {
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

// Fonction principale pour importer le CSV et envoyer les données
export async function importCSVToAPI( itemUrl, items, options = {}) {
    const {
        onProgress,
        onItemSuccess,
        onItemError,
        batchSize = 10,
        stopOnError = false
    } = options
    
    try {
        // 1. Lire et parser le CSV
        // const items = await readCSVFile(file)
        console.log(`📄 ${items.length} lignes à importer`)
        
        const results = {
            total: items.length,
            success: 0,
            failed: 0,
            errors: []
        }
        
        // 2. Envoyer chaque item un par un ou par batch
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            
            // Optionnel : supprimer les champs vides ou null
            const cleanItem = Object.fromEntries(
                Object.entries(item).filter(([_, v]) => v !== null && v !== '')
            )
            
            try {
                const response = await insertItem(itemUrl, cleanItem)
                
                results.success++
                if (onItemSuccess) onItemSuccess(i, item, response)
                if (onProgress) onProgress(i + 1, items.length)
                
            } catch (error) {
                results.failed++
                results.errors.push({ index: i, item, error: error.message })
                
                if (onItemError) onItemError(i, item, error)
                
                if (stopOnError) {
                    throw new Error(`Import arrêté à l'index ${i}: ${error.message}`)
                }
            }
        }
        
        console.log(`✅ Import terminé: ${results.success} succès, ${results.failed} échecs`)
        return results
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error)
        throw error
    }
}

export async function importAssets(file)
{
    const items = await readCSVFile(file)
    console.log('Items à importer:', items)

    const results = {
        total: items.length,
        success: 0,
        failed: 0,
        skipped: 0,
        errors: []
    }

    for (const item of items)
    {
        let user = {}
        user.username = item['user']
        const returnedUserResult = await createItemIfMissing('/Administration/User', user, user.username)
        const returnedUser = returnedUserResult.item
        results.success++
        if (returnedUserResult.reused) {
            results.skipped++
            console.log('Utilisateur existant récupéré:', returnedUser)
        } else {
            console.log('Utilisateur créé:', returnedUser)
        }

        let returnedTech = null
        let tech = {}
        tech.username = item['user_tech']
        const returnedTechResult = await createItemIfMissing('/Administration/User', tech, tech.username)
        returnedTech = returnedTechResult.item
        results.success++
        if (returnedTechResult.reused) {
            results.skipped++
            console.log('Technicien existant récupéré:', returnedTech)
        } else {
            console.log('Technicien créé:', returnedTech)
        }

        let assets = {}
        assets.name = item['nom'] 
        assets.user = returnedUser.id
        assets.user_tech = returnedTech.id
        const returnedAsset = await insertItem('/Assets/' + item['asset'], assets)
        console.log('Actif créé:', assets)
    }

    return results
}