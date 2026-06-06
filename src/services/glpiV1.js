// src/lib/glpiApi.js
const BASE_URL = import.meta.env.VITE_GLPI_URL
const APP_TOKEN = import.meta.env.VITE_APP_TOKEN
const USERNAME = import.meta.env.VITE_USERNAME
const PASSWORD = import.meta.env.VITE_PASSWORD
const SESSION_TTL = Number(import.meta.env.VITE_SESSION_TTL) || 3600000

let cachedSessionToken = null
let tokenExpiry = null

function joinApiPath(...parts) {
  return parts
    .filter(Boolean)
    .map((part, index) => {
      const value = String(part)
      if (index === 0) return value.replace(/\/+$/, '')
      return value.replace(/^\/+|\/+$/g, '')
    })
    .join('/')
}

/**
 * Obtient un session_token pour l'API GLPI v1.
 * Utilise l'authentification par login/mot de passe.
 * Met en cache le token pendant sa durée de vie (défaut 1h).
 */
export async function getTokenV1() {
  // 1. Vérifier le cache
  if (cachedSessionToken && Date.now() < tokenExpiry) {
    return cachedSessionToken
  }

  // 2. Construire l'URL de l'API
  const url = joinApiPath(BASE_URL, 'initSession')

  // 3. Appel à l'API GLPI
  const response = await fetch(url, {
    method: 'POST', // 🔥 On utilise la méthode POST pour l'auth par login/password
    headers: {
      'Content-Type': 'application/json',
      'App-Token': APP_TOKEN
    },
    body: JSON.stringify({
      login: USERNAME,
      password: PASSWORD
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GLPI initSession failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  cachedSessionToken = data.session_token

  // 4. Stocker l'expiration
  tokenExpiry = Date.now() + SESSION_TTL

  return cachedSessionToken
}


export async function insertItemV1(itemUrl, data) {
  const sessionToken = await getTokenV1()  // utilise la fonction définie précédemment
  // 2. Construire l'URL complète
  const url = joinApiPath(BASE_URL, itemUrl)

  // 3. Envoyer la requête POST
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'App-Token': APP_TOKEN,
      'Session-Token': sessionToken
    },
    body: JSON.stringify(data)
  })

  // 4. Gérer les erreurs HTTP
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GLPI API v1 error ${response.status}: ${text}`)
  }

  // 5. Lire la réponse (peut être vide)
  const text = await response.text()
  if (!text) return null

  // 6. Log pour débogage (optionnel)
  console.log('Réponse GLPI v1 :', JSON.parse(text))

  try {
    return JSON.parse(text)
  } catch (e) {
    // Si ce n'est pas du JSON, retourner le texte brut
    return text
  }
}