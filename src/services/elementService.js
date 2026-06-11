import { getItems } from "./glpi";

let cachedTotals = null
let cachedAssetTypes = null

async function getAssetTypes() {
    if (cachedAssetTypes) return cachedAssetTypes
    const { items } = await getItems('/Assets')
    cachedAssetTypes = items
    return cachedAssetTypes
}

async function getTotals(assets, filters = {}) {
    const hasFilters = Object.values(filters).some(v => v !== '' && v !== null && v !== undefined)
    if (!hasFilters && cachedTotals) return cachedTotals

    const totals = {}

    for (const type of assets) {
        if (filters.itemtype && type.itemtype !== filters.itemtype) {
            totals[type.itemtype] = 0
            continue
        }

        const glpiFilters = buildServerFilters(filters)
        const { total } = await getItems(
            `/Assets/${type.itemtype}`,
            { ...glpiFilters, is_deleted: false },
            { range: '0-0' }
        )
        totals[type.itemtype] = total
    }

    if (!hasFilters) cachedTotals = totals
    return totals
}

function buildServerFilters(filters = {}) {
    const glpiFilters = { is_deleted: false }

    if (filters.status)       glpiFilters.status       = filters.status
    if (filters.location)     glpiFilters.location     = filters.location
    if (filters.manufacturer) glpiFilters.manufacturer = filters.manufacturer
    if (filters.user)         glpiFilters.user         = filters.user

    return glpiFilters
}

function clientFilter(items, filters) {
    return items.filter(item => {
        if (filters.name && !item.name?.toLowerCase().includes(filters.name.toLowerCase())) return false
        if (filters.model && !item.model?.name?.toLowerCase().includes(filters.model.toLowerCase())) return false
        if (filters.otherserial && !item.otherserial?.toLowerCase().includes(filters.otherserial.toLowerCase())) return false
        return true
    })
}

export async function getElements(page = 1, perPage = 10, filters = {}) {
    let allItems = []

    const hasTextFilter = !!(filters.name || filters.model || filters.otherserial)
    const assets = await getAssetTypes()
    const glpiFilters = buildServerFilters(filters)

    if (hasTextFilter) {
        // Charger tout pour filtrer côté client
        for (const type of assets) {
            if (filters.itemtype && type.itemtype !== filters.itemtype) continue

            const { items } = await getItems(
                `/Assets/${type.itemtype}`,
                glpiFilters
            )
            allItems = [...allItems, ...items.map(item => ({ ...item, itemtype: type.itemtype }))]
        }

        // Filtrage côté client
        allItems = clientFilter(allItems, filters)

        const total = allItems.length
        const start = (page - 1) * perPage
        const items = allItems.slice(start, start + perPage)

        return { items, total, page, perPage }

    } else {
        // Pagination serveur
        const totals = await getTotals(assets, filters)
        const total = Object.values(totals).reduce((a, b) => a + b, 0)

        const start = (page - 1) * perPage
        const end = start + perPage
        let offset = 0

        for (const type of assets) {
            if (filters.itemtype && type.itemtype !== filters.itemtype) {
                offset += totals[type.itemtype]
                continue
            }

            const typeTotal = totals[type.itemtype]
            const typeEnd = offset + typeTotal

            if (end <= offset || start >= typeEnd) {
                offset += typeTotal
                continue
            }

            const typeStart = Math.max(0, start - offset)
            const typeLimit = Math.min(typeTotal, end - offset) - typeStart

            const { items } = await getItems(
                `/Assets/${type.itemtype}`,
                glpiFilters,
                { start: typeStart, limit: typeLimit }
            )

            allItems = [...allItems, ...items.map(item => ({ ...item, itemtype: type.itemtype }))]
            offset += typeTotal
        }

        return { items: allItems, total, page, perPage }
    }
}

export async function countElements(filters = {}) {
    let countElement = {}
    let countTotal = 0

    try {
        const assets = await getAssetTypes()
        const glpiFilters = buildServerFilters(filters)

        for (const type of assets) {
            const { total } = await getItems(
                `/Assets/${type.itemtype}`,
                { ...glpiFilters, is_deleted: false },
                { range: '0-0' }
            )
            countElement[type.itemtype] = total
            countTotal += total
        }
    } catch (err) {
        console.error('Erreur lors du comptage des éléments :', err)
        throw err
    }

    return { countElement, countTotal }
}