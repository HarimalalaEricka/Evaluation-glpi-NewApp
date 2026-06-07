import { getItems, getItemById} from "./glpi";
import { getItemsV1} from "./glpiV1";

export async function getTickets(page, perPage)
{
    try {
        return await getItems('/Assistance/Ticket', { is_deleted: false }, { page, perPage })
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