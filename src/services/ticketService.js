import { getItems, getItemById, insertItem, updateItem } from "./glpi";
import { getItemsV1, insertItemV1 } from "./glpiV1";

export async function getTickets(page, perPage)
{
    try {
        return await getItems('/Assistance/Ticket', { is_deleted: false }, { page, perPage })
    } catch (err) {
        console.error('Erreur lors de la récupération des tickets :', err)
        throw err
    }
}
export async function getAllTickets()
{
    try {
        return await getItems('/Assistance/Ticket', { is_deleted: false }, {})
    } catch (err) {
        console.error('Erreur lors de la récupération des tickets :', err)
        throw err
    }
}
export async function getTicketById(id) {
    let result = {
        ticket: null,
        itemsTicket: {}
    }
    try {
        result.ticket = await getItemById('/Assistance/Ticket', id)

        const { items } = await getItemsV1(`/Ticket/${id}/Item_Ticket`)
        result.itemsTicket = items

    } catch (err) {
        console.error('Erreur lors de la récupération du ticket :', err)
        throw err
    }
    return result
}
export async function createTicket(jsonData) {
    console.log('Données du ticket à créer:', jsonData)
    const results = {
        success: 0,
        failed: 0,
        errors: []
    }
    try {
        let ticket = {
            date_creation: jsonData.date || new Date().toISOString(),
            date: jsonData.date || new Date().toISOString(),
            date_mod: jsonData.date || new Date().toISOString(),
            name: jsonData.name,
            content: jsonData.content,
            type: jsonData.type,
            status: jsonData.status,
            priority: jsonData.priority,
        }

        console.log(`🧾 TICKET PAYLOAD:`, JSON.stringify(ticket, null, 2))
        const returnedTicket = await insertItem('/Assistance/Ticket', ticket)

        // insertion des items liés au ticket
        for (const item of jsonData.items) {
            let itTicket = {
                input: {
                    items_id: item.id,           
                    itemtype: item.itemtype,      
                    tickets_id: returnedTicket.id
                }
            }
            console.log(`🧾 ITEM TICKET PAYLOAD:`, JSON.stringify(itTicket, null, 2))
            await insertItemV1('/Ticket/' + returnedTicket.id + '/Item_Ticket', itTicket)
        }

        results.success++
    } catch (err) {
        results.failed++
        const message = err?.message || String(err)
        results.errors.push({ error: message })
        console.error(`❌ ERREUR:`, message)
    }
    return results
}

export async function updateTicket(id, jsonStatusData)
{
    console.log('Données du ticket à mettre à jour:', jsonStatusData)
    const results = {
        success: 0,
        failed: 0,
        errors: []
    }
    try {
        let ticket = {
            status: jsonStatusData.status,
            date_mod: new Date().toISOString(),
        }

        console.log(`🧾 TICKET PAYLOAD:`, JSON.stringify(ticket, null, 2))
        const returnedTicket = await updateItem('/Assistance/Ticket', ticket, id)
        results.success++
    } catch (err) {
        results.failed++
        const message = err?.message || String(err)
        results.errors.push({ error: message })
        console.error(`❌ ERREUR:`, message)
    }
    return results
}