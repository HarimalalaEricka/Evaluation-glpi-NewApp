import { getItems, insertItem, patchItem } from './glpi.js'
import { insertItemV1  } from './glpiV1.js'

function getItemLabel(item) {
    return String(item?.username ?? item?.name ?? item?.login ?? '').trim().toLowerCase()
}

async function getExistingItemInUrl(itemUrl, matchValue, filters = {}) {
    const { items } = await getItems(itemUrl, filters)
    const normalizedMatchValue = String(matchValue || '').trim().toLowerCase()

    return items.find((item) => getItemLabel(item) === normalizedMatchValue) || null
}

async function createItemIfMissing(itemUrl, data, matchValue, filters = {}) {
    const existingItem = await getExistingItemInUrl(itemUrl, matchValue, filters)
    if (existingItem) {
        if( existingItem.is_deleted) {
            try {
                const patchedItem = await patchItem(`${itemUrl}/${existingItem.id}`, { is_deleted: false })
                console.log(`✅ Item réactivé:`, patchedItem)
                return { item: patchedItem, reused: true }
            } catch (err) {
                console.error(`❌ Échec de la réactivation de "${matchValue}":`, err)
            }
        }
        return { item: existingItem, reused: true }
    }

    try {
        const createdItem = await insertItem(itemUrl, data)
        return { item: createdItem, reused: false }
    } catch (error) {
        if (!String(error?.message || '').toLowerCase().includes('existe')) {
            throw error
        }

        const fallbackItem = await getExistingItemInUrl(itemUrl, matchValue, filters)
        if (!fallbackItem) {
            throw error
        }

        return { item: fallbackItem, reused: true }
    }
}

// Fonction pour parser le CSV et retourner un tableau d'objets
function parseCSV(csvText, separator = ',') {
    const lines = csvText.trim().split(/\r?\n/)
    const headers = parseCSVLine(lines[0], separator)

    const results = []
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue
        const values = parseCSVLine(lines[i], separator)
        const obj = {}
        headers.forEach((header, index) => {
            const raw = values[index] ?? ''
            if (raw === 'null' || raw === '') obj[header] = null
            else if (raw === 'true')          obj[header] = true
            else if (raw === 'false')         obj[header] = false
            else if (!isNaN(raw))             obj[header] = Number(raw)
            else                              obj[header] = raw
        })
        results.push(obj)
    }
    return results
}

/**
 * Parse une seule ligne CSV en respectant le standard RFC 4180 :
 * - champs entre guillemets peuvent contenir des virgules
 * - guillemets doublés ("") = guillemet littéral
 */
function parseCSVLine(line, separator = ',') {
    const fields = []
    let i = 0

    while (i < line.length) {
        if (line[i] === '"') {
            // Champ entre guillemets
            let field = ''
            i++ // saute le guillemet ouvrant
            while (i < line.length) {
                if (line[i] === '"' && line[i + 1] === '"') {
                    field += '"'  // guillemet échappé
                    i += 2
                } else if (line[i] === '"') {
                    i++ // guillemet fermant
                    break
                } else {
                    field += line[i++]
                }
            }
            fields.push(field)
            if (line[i] === separator) i++ // saute le séparateur
        } else {
            // Champ sans guillemets
            const end = line.indexOf(separator, i)
            if (end === -1) {
                fields.push(line.slice(i).trim())
                break
            } else {
                fields.push(line.slice(i, end).trim())
                i = end + 1
            }
        }
    }
    return fields
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
            console.log(cleanItem)
            
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

    for (const [index, item] of items.entries())
    {
        const rowLabel = `[Ligne ${index + 1} - ${item['Name'] || 'sans nom'}]`

        try
        {
            // ── USER ──────────────────────────────────────────────
            let returnedUser = null
            if (item['User'] !== null)
            {
                let user = {}
                user.name = item['User'].replace(/\r/g, '').trim()
                console.log(`${rowLabel} 🧾 USER PAYLOAD:`, JSON.stringify(user, null, 2))

                try {
                    const returnedUserResult = await createItemIfMissing('/Administration/User', user, user.name)
                    returnedUser = returnedUserResult.item

                    if (returnedUserResult.reused) {
                        console.log(`${rowLabel} ♻️  Utilisateur existant récupéré:`, returnedUser)
                    } else {
                        console.log(`${rowLabel} ✅ Utilisateur créé:`, returnedUser)
                    }
                } catch (err) {
                    throw new Error(`Utilisateur "${user.name}" : ${extractApiError(err)}`)
                }
            }

            // ── STATE ─────────────────────────────────────────────
            let returnedState = null
            try {
                let state = { 
                    name: item['Status']?.trim() ,
                    comment: ""
                }
                returnedState = (await createItemIfMissing('/Dropdowns/State', state, state.name)).item
            } catch (err) {
                throw new Error(`Status "${item['Status']}" : ${extractApiError(err)}`)
            }

            // ── LOCATION ──────────────────────────────────────────
            let returnedLocation = null
            try {
                let location = { name: item['Location']?.trim() }
                returnedLocation = (await createItemIfMissing('/Dropdowns/Location', location, location.name)).item
            } catch (err) {
                throw new Error(`Location "${item['Location']}" : ${extractApiError(err)}`)
            }

            // ── MANUFACTURER ──────────────────────────────────────
            let returnedManufacturer = null
            try {
                let manufacturer = { name: item['Manufacturer']?.trim() }
                returnedManufacturer = (await createItemIfMissing('/Dropdowns/Manufacturer', manufacturer, manufacturer.name)).item
            } catch (err) {
                throw new Error(`Manufacturer "${item['Manufacturer']}" : ${extractApiError(err)}`)
            }

            // ── MODEL ─────────────────────────────────────────────
            let returnedModel = null
            try {
                let model = { name: item['Model']?.trim() }
                const modelEndpoint = `/Dropdowns/${item['Item_Type']}Model`
                returnedModel = (await createItemIfMissing(modelEndpoint, model, model.name)).item
            } catch (err) {
                throw new Error(`Model "${item['Model']}" : ${extractApiError(err)}`)
            }

            // ── ASSET ─────────────────────────────────────────────
            let assets = {
                name:         item['Name']?.trim(),
                otherserial:  item['Inventory_Number']?.trim(),
                status:    returnedState?.id,
                location: returnedLocation?.id,
                manufacturer: returnedManufacturer?.id,
                model:    returnedModel?.id,
                is_deleted:   false,
            }

            if (returnedUser) {
                assets.user = returnedUser.id
            }

            console.log(`${rowLabel} 🧾 ASSET PAYLOAD:`, JSON.stringify(assets, null, 2))

            const returnedAsset = await insertItem('/Assets/' + item['Item_Type'], assets)
            console.log(`${rowLabel} ✅ Actif créé:`, returnedAsset)

            results.success++

        }
        catch (err)
        {
            results.failed++
            const message = err?.message || String(err)
            results.errors.push({ row: index + 1, name: item['Name'] || '?', error: message })
            console.error(`${rowLabel} ❌ ERREUR:`, message)
        }
    }

    console.group('RÉSUMÉ IMPORT')
    console.log(`Total   : ${results.total}`)
    console.log(`Succès  : ${results.success}`)
    console.log(`Échoués : ${results.failed}`)
    console.log(`Ignorés : ${results.skipped}`)
    if (results.errors.length > 0) {
        console.group('Erreurs détaillées')
        results.errors.forEach(e => console.error(`  Ligne ${e.row} (${e.name}): ${e.error}`))
        console.groupEnd()
    }
    console.groupEnd()

    return results
}

function extractApiError(err) {
    try {
        // Si l'erreur contient du JSON (réponse API)
        const match = err?.message?.match(/\{.*\}$/s)
        if (match) {
            const parsed = JSON.parse(match[0])
            const extra = parsed?.additional_messages?.map(m => m.message).join(', ')
            return parsed?.title + (extra ? ` → ${extra}` : '')
        }
    } catch (_) { /* pas du JSON, on continue */ }

    return err?.message || String(err)
}

export async function importTicket(file)
{
    const items = await readCSVFile(file)
    console.log('Tickets à importer:', items)

    const results = {
        total: items.length,
        success: 0,
        failed: 0,
        errors: []
    }

    for (const [index, item] of items.entries())
    {
        const rowLabel = `[Ligne ${index + 1} - ${item['Name'] || 'sans nom'}]`
        try {
            const date = item['Date']
            const heure = item['Heure']
            // 1. transformer DD/MM/YYYY -> YYYY-MM-DD
            const [day, month, year] = date.split('/');

           const glpiDateCreation = `${year}-${month}-${day} ${heure}:00`

            const type = item['Type']
            let type_id = 0
            if( type === 'Incident')
            {
                type_id = 1
            }
            else if( type === 'Demande')
            {
                type_id = 2
            }

            const status = item['Status']
            let status_id = 0
            if( status === 'New') status_id = 1
            else if( status === 'Approval') status_id = 10
            else if( status === 'Assigned') status_id = 2
            else if( status === 'Planned') status_id = 3
            else if( status === 'Pending') status_id = 4
            else if( status === 'Solved') status_id = 5
            else if( status === 'Closed') status_id = 6

            const priority = item['Priority']
            let priority_id = 0
            if( priority === 'Very low') priority_id = 1
            else if( priority === 'Low') priority_id = 2
            else if( priority === 'Medium') priority_id = 3
            else if( priority === 'High') priority_id = 4
            else if( priority === 'Very high') priority_id = 5
            else if( priority === 'Critical') priority_id = 6
            let ticket = {
                date_creation: glpiDateCreation,
                date: glpiDateCreation,
                date_mod: glpiDateCreation,
                name: item['Titre'],
                content: item['Description'],
                type: type_id,
                status: status_id,
                priority: priority_id,
                external_id: item['Ref_Ticket']
            }

            console.log(`${rowLabel} 🧾 TICKET PAYLOAD:`, JSON.stringify(ticket, null, 2))
            const returnedTicket = await insertItem('/Assistance/Ticket', ticket)

            const itemsTicket = item['Items']
            const tableauItem = JSON.parse(itemsTicket)
            const { items: assets } = await getItems('/Assets')

            for (const tab of tableauItem) {
                let assetT = null

                for (const assetType of assets) {
                    const { items: found } = await getItems('/Assets/' + assetType.itemtype, { name: tab, is_deleted: false })
                    if (found && found.length > 0) {
                        assetT = {
                            id: found[0].id,
                            itemtype: assetType.itemtype
                        }
                        break  // ← break seulement si trouvé
                    }
                }
                console.log('assetT:', assetT)
                if (!assetT) {
                    console.warn(`⚠️ Aucun asset trouvé pour : ${tab}`)
                    continue
                }
                let itTicket = {
                    input: {
                        items_id: assetT.id,
                        itemtype: assetT.itemtype,
                        tickets_id : returnedTicket.id
                    }
                }
                console.log(`${rowLabel} 🧾 ITEM TICKET PAYLOAD:`, JSON.stringify(itTicket, null, 2))
                const itemTicket = await insertItemV1('/Ticket/' + returnedTicket.id + '/Item_Ticket', itTicket)
            }
            

        } catch (err)
        {
            results.failed++
            const message = err?.message || String(err)
            results.errors.push({ row: index + 1, name: item['Name'] || '?', error: message })
            console.error(`${rowLabel} ❌ ERREUR:`, message)
        }
    }
    console.group('RÉSUMÉ IMPORT')
    console.log(`Total   : ${results.total}`)
    console.log(`Succès  : ${results.success}`)
    console.log(`Échoués : ${results.failed}`)
    console.log(`Ignorés : ${results.skipped}`)
    if (results.errors.length > 0) {
        console.group('Erreurs détaillées')
        results.errors.forEach(e => console.error(`  Ligne ${e.row} (${e.name}): ${e.error}`))
        console.groupEnd()
    }
    console.groupEnd()

    return results
}
export async function importCost(file)
{
    const items = await readCSVFile(file)
    console.log('Tickets à importer:', items)

    const results = {
        total: items.length,
        success: 0,
        failed: 0,
        errors: []
    }

    for (const [index, item] of items.entries())
    {
        const rowLabel = `[Ligne ${index + 1} - ${item['Name'] || 'sans nom'}]`
        try {
            const concernedTicket = item['Num_Ticket']
            const foundTicket = await getItems('/Assistance/Ticket', { external_id: concernedTicket })
            const ticketId = foundTicket.items[0].id
            let cost = {
                duration: item['Duration_second'],
                cost_time: item['Time_Cost'],
                cost_fixed: item['Fixed_Cost'],
                ticket: ticketId
            }
            console.log(`${rowLabel} 🧾 COST PAYLOAD:`, JSON.stringify(cost, null, 2))
            console.log('foundTicket:', foundTicket)
            const returnedCost = await insertItem('/Assistance/Ticket/' + ticketId + '/Cost', cost)
        } catch (err)
        {
            results.failed++
            const message = err?.message || String(err)
            results.errors.push({ row: index + 1, name: item['Name'] || '?', error: message })
            console.error(`${rowLabel} ❌ ERREUR:`, message)
        }
    }
    console.group('RÉSUMÉ IMPORT')
    console.log(`Total   : ${results.total}`)
    console.log(`Succès  : ${results.success}`)
    console.log(`Échoués : ${results.failed}`)
    console.log(`Ignorés : ${results.skipped}`)
    if (results.errors.length > 0) {
        console.group('Erreurs détaillées')
        results.errors.forEach(e => console.error(`  Ligne ${e.row} (${e.name}): ${e.error}`))
        console.groupEnd()
    }
    console.groupEnd()

    return results
}