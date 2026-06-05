export async function getUtilisateurs() {
    const response = await fetch('http://localhost:3000/utilisateurs')

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`Erreur SQLite ${response.status}: ${text}`)
    }

    return await response.json()
}