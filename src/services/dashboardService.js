import { getItems } from "./glpi";

export async function countElements()
{
    let countElement = {}
    try {
        const { items: assets } = await getItems('/Assets')
        console.log('Assets reçus pour comptage :', assets)
        let asset = null
        for (const type of assets)
        {
            asset = await getItems(`/Assets/${type.itemtype}`, { is_deleted: false }, { range: '0-0'})
            countElement[type.itemtype] = asset.total
        }
    } catch (err) {
        console.error('Erreur lors du comptage des éléments :', err)
    }
    console.log('Nombre d\'éléments par type :', countElement)
    return countElement
}

// export async function countTickets()
// {
//     let countTicket = {}
//     try {
//         const { items: assets } = await getItems('/Assets')
//         console.log('Assets reçus pour comptage :', assets)
//         let asset = null
//         for (const type of assets)
//         {
//             asset = await getItems(`/Assets/${type.itemtype}`, { is_deleted: false }, { range: '0-0'})
//             countTicket[type.itemtype] = asset.total
//         }
//     } catch (err) {
//         console.error('Erreur lors du comptage des éléments :', err)
//     }
//     console.log('Nombre d\'éléments par type :', countTicket)
//     return countTicket
// }