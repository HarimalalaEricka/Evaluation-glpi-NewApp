import { getItems, deleteItem as glpiDeleteItem } from './glpi.js'

async function safeDelete(itemType, itemId) {
    try {
        console.log(`Deleting: ${itemType}/${itemId}`)
        await glpiDeleteItem(itemType, itemId)
        return true
    } catch (error) {
        console.warn(`Suppression ignorée pour ${itemType}/${itemId}:`, error?.message || error)
        return false
    }
}

export async function deleteAll() {
    const types = [
        'Assets',
        'Management'
    ]

    for (const type of types) {
        console.log(`Module: ${type}`)
        const items = await getItems(type, { is_deleted: false })
        await Promise.all(
            items.items
                .filter(item => item.itemtype !== 'SoftwareLicense')
                .map(async (item) => {
                    const href =
                        (type === 'Assets')
                            ? item.href
                            : type === 'Management'
                                ? `/${type}/${item.itemtype}`
                                : item.href

                    if (!href || href === '/') {
                        return null
                    }

                    console.log(`Module: ${href}`)
                    const assets = await getItems(href, { is_deleted: false })

                    const deletePromises = assets.items.map(asset =>
                        safeDelete(href, asset.id)
                    )

                    // ── Si Assets, supprime aussi les modèles associés ──
                if (type === 'Assets') {
                    const skipModelTypes = ['Certificate', 'Appliance', 'Unmanaged']
                    if (skipModelTypes.includes(item.itemtype)) {
                        return Promise.all(deletePromises)
                    }

                    const modelHref = `/Dropdowns/${item.itemtype}Model`
                    console.log(`Module (models): ${modelHref}`)
                    try {
                        const models = await getItems(modelHref)
                        const modelDeletePromises = models.items.map(model =>
                            safeDelete(modelHref, model.id)
                        )
                        deletePromises.push(...modelDeletePromises)
                    } catch (err) {
                        console.warn(`⚠️  Pas de modèles pour ${modelHref}:`, err?.message)
                    }
                }

                    return Promise.all(deletePromises)
                })
        )
    }
    await deleteItems()
    return { success: true }
}

export async function deleteItems() {
    const types = [
        '/Assistance/Ticket',
        '/Assistance/Problem',
        '/Assistance/Change',
        '/Administration/ApprovalSubstitute',
        '/Administration/Entity', 
        '/Administration/Group', 
        '/Administration/User', 
        '/Administration/UserCategory',
        '/Administration/UserTitle',
        '/Assets/Software',
        '/Assets/Rack',
        '/Assets/Enclosure',
        '/Assets/PDU',
        '/Assets/PassiveDCEquipment',
        '/Assets/Socket',
        '/Assets/Cable',
        'Management/License',
        'Management/DomainRecord',
        '/Inventory/Agent',
        '/Inventory/LockedField',
        // '/Inventory/SNMPCredential',
        '/Knowledgebase/Article',
        '/Knowledgebase/Category',
        'Project',
        'Dropdowns/State',
        '/Dropdowns/Location',
        '/Dropdowns/Manufacturer',
        // 'Assets/Custom/'
    ]
    for (const type of types) {
        const res = await getItems(type, { is_deleted: false })
        const items = type === '/Administration/Entity'
            ? res.items.filter(item => item.id !== 0)
            : type === '/Administration/User'
                ? res.items.filter(item => item.id !== 2 && item.id !== 6)
                : res.items
        for (let i = 0; i < items.length; i += 5) {
            const batch = items.slice(i, i + 5)

            await Promise.all(
                batch.map(item =>
                    safeDelete(type, item.id)
                )
            )
        }
    }
}