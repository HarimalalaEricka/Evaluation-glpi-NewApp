export async function getStatusById(id) {
    const response = await fetch(`http://localhost:3000/status/${id}`)
    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Erreur SQLite ${response.status}: ${text}`)
    }

    return await response.json()
}
export async function getColors() {
    const response = await fetch('http://localhost:3000/colors')

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Erreur SQLite ${response.status}: ${text}`)
    }

    const colors = await response.json()

    const enriched = await Promise.all(
        colors.map(async (color) => {
            const status = await getStatusById(color.id)

            return {
                ...color,
                label: status.label 
            }
        })
    )
    return enriched
}
export async function getStatus() {
    const response = await fetch('http://localhost:3000/status')

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Erreur SQLite ${response.status}: ${text}`)
    }

    return await response.json()
}

export async function updateColor(id, color, background) {
    const response = await fetch(`http://localhost:3000/colors/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ color, background })
    })

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Erreur SQLite ${response.status}: ${text}`)
    }

    return await response.json()
}

export async function updateTraduction(id, traduction, idLangue, idStatus)
{
    const response = await fetch(`http://localhost:3000/traductions/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ traduction, idLangue, idStatus })
    })
    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Erreur SQLite ${response.status}: ${text}`)
    }

    return await response.json()
}

export async function getLangue(id) {
    const response = await fetch(`http://localhost:3000/langues`)
    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Erreur SQLite ${response.status}: ${text}`)
    }

    return await response.json()
}

export async function getTraductionByLangue(id)
{
    const response = await fetch(`http://localhost:3000/traductions/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })

    const trad = await response.json()

    const enriched = await Promise.all(
        trad.map(async (translation) => {
            const status = await getStatusById(translation.idStatus)

            return {
                ...translation,
                label: status.label 
            }
        })
    )
    return enriched
}

export async function insertLangue(langue)
{
    const response = await fetch(`http://localhost:3000/langues`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ langue})
    })
    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Erreur SQLite ${response.status}: ${text}`)
    }
    const returnedLangue = await response.json()

    const status = await getStatus()  // await manquant

    for (const state of status) {
        const idLangue = returnedLangue.id
        const idStatus = state.id  // renommé pour correspondre au backend

        const response = await fetch(`http://localhost:3000/traductions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idLangue, idStatus })  // idStatus au lieu de statt
        })

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Erreur SQLite ${response.status}: ${text}`)
        }
    }
}

export async function getTraductrionByLangueAndStatus(idLangue, idStatus)
{
    const response = await fetch(`http://localhost:3000/traductions/${idLangue}/${idStatus}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    })
    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Erreur SQLite ${response.status}: ${text}`)
    }
    const returntraduction = await response.json()
    return returntraduction.traduction
}