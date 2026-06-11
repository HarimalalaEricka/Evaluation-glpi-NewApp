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

export async function getItemsV1(item, filters = {}, params = {}) {
    const sessionToken = await getTokenV1()
    // Pagination GLPI (start, limit) → page, perPage
    if (params.page !== undefined || params.perPage !== undefined) {
        const page = params.page || 1
        const perPage = params.perPage || 10
        params.start = (page - 1) * perPage
        params.limit = perPage
        delete params.page
        delete params.perPage
    }
    const url = new URL(joinApiPath(BASE_URL, item), window.location.origin) // ✅

    // 📌 FILTER GLPI (format key==value;key2==value2)
    if (Object.keys(filters).length > 0) {
        const filterString = Object.entries(filters)
            .map(([key, value]) => `${key}==${value}`)
            .join(';')

        url.searchParams.append('filter', filterString)
    }

    // 📌 PARAMS (range, sort, order, etc.)
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value)
        }
    })

    console.log('URL:', url.toString())

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'App-Token': APP_TOKEN,
            'Session-Token': sessionToken
        },
    })

    console.log('Status:', response.status)
    console.log('Content-Range:', response.headers.get('Content-Range'))

    if (!response.ok && response.status !== 206) {
        const text = await response.text()
        throw new Error(`API error ${response.status}: ${text}`)
    }

    // 📌 TOTAL via Content-Range
    let total = 0
    const contentRange = response.headers.get('Content-Range')

    if (contentRange) {
        total = parseInt(contentRange.split('/')[1]) || 0
    }

    // 📌 DATA parsing flexible
    let data = await response.json()

    let items = []
    if (Array.isArray(data)) items = data
    else if (data?.data && Array.isArray(data.data)) items = data.data
    else if (data?.results && Array.isArray(data.results)) items = data.results

    return {
        items,
        total,
        contentRange
    }
}

export async function getDocId(Type, Id) {
  const res = await getItemsV1(`/Document`, { is_deleted: 0 }, {})
  console.log("📦 RAW DOCUMENT RESPONSE:", res)

  const documents = res.documents ?? res.data ?? res.items ?? []

  console.log("📄 DOCUMENTS ARRAY:", documents)

  if (!Array.isArray(documents)) {
    console.log("❌ documents n'est pas un tableau")
    return null
  }

  for (const doc of documents) {
    console.log("➡️ DOC:", doc)

    const resItem = await getItemsV1(
      `/Document/${doc.id}/Document_Item`,
      {},
      {}
    )

    console.log("📎 DOCUMENT ITEM RESPONSE:", resItem)

    const documentItem = resItem.items ?? []

    const match = documentItem.find(i =>
      String(i.items_id) === String(Id) &&
      String(i.itemtype).trim().toLowerCase() ===
        String(Type).trim().toLowerCase()
    )

    if (match) {
      console.log("✅ MATCH TROUVÉ:", match)
      return doc.id
    }
  }

  console.log("❌ AUCUN MATCH")
  return null
}

export function detectMime(data) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)

    // sécurité : éviter erreurs si fichier trop petit
    if (bytes.length < 4) return null

    // JPEG : FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return { mime: 'image/jpeg', ext: 'jpg' }
    }

    // PNG : 89 50 4E 47
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4E &&
      bytes[3] === 0x47
    ) {
      return { mime: 'image/png', ext: 'png' }
    }

    // GIF : 47 49 46
    if (
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46
    ) {
      return { mime: 'image/gif', ext: 'gif' }
    }

    // WEBP : 52 49 46 46 .... 57 45 42 50
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { mime: 'image/webp', ext: 'webp' }
    }

    // BMP : 42 4D
    if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
      return { mime: 'image/bmp', ext: 'bmp' }
    }

    return null
}

export async function uploadDocument(fileBlob, fileName) {
    const token = await getTokenV1()

    const buffer = await fileBlob.arrayBuffer()
    const detected = detectMime(buffer)

    if (!detected) {
        throw new Error("Format fichier non supporté")
    }

    const fixedFile = new File(
        [buffer],
        fileName.replace(/\.\w+$/, `.${detected.ext}`),
        { type: detected.mime }
    )

    const formData = new FormData()

    formData.append(
        "uploadManifest",
        JSON.stringify({
            input: {
                name: fixedFile.name,
                _filename: ["filename[0]"],
                entities_id: 0
            }
        })
    )

    formData.append("filename[0]", fixedFile)

    const response = await fetch(
        joinApiPath(BASE_URL, "/Document"),
        {
            method: "POST",
            headers: {
                "App-Token": APP_TOKEN,
                "Session-Token": token
            },
            body: formData
        }
    )

    if (!response.ok) {
        throw new Error(await response.text())
    }

    return await response.json()
}