import { getItems } from "./glpi";

export async function countElements()
{
    let countTotal = 0
    let countElement = {}
    try {
        const { items: assets } = await getItems('/Assets')
        console.log('Assets reçus pour comptage :', assets)
        let asset = null
        for (const type of assets)
        {
            asset = await getItems(`/Assets/${type.itemtype}`, { is_deleted: false }, { range: '0-0'})
            countElement[type.itemtype] = asset.total
            countTotal += asset.total
        }
    } catch (err) {
        console.error('Erreur lors du comptage des éléments :', err)
    }
    console.log('Nombre d\'éléments par type :', countElement)
    console.log('Nombre total d\'éléments :', countTotal)
    return { countElement, countTotal }
}

export async function countTickets() {
    let countTotal = 0
    let countTicket = {
        incident: 0,
        demand: 0
    }
    try {
        const { total: totalIncident } = await getItems('/Assistance/Ticket', { is_deleted: false, type: 1 }, { range: '0-0' })
        countTicket.incident = totalIncident

        const { total: totalDemand } = await getItems('/Assistance/Ticket', { is_deleted: false, type: 2 }, { range: '0-0' })
        countTicket.demand = totalDemand

        countTotal = countTicket.incident + countTicket.demand

    } catch (err) {
        console.error('Erreur lors du comptage des éléments :', err)
    }
    console.log('Nombre total :', countTotal)
    console.log('Par type :', countTicket)
    return { countTicket, countTotal }
}