const BASE_URL = import.meta.env.DEV
  ? '/glpi-api'
  : (import.meta.env.VITE_API_BACKEND_URL || '/glpi-api')
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET
const USERNAME = import.meta.env.VITE_USERNAME
const PASSWORD = import.meta.env.VITE_PASSWORD
const GRANT_TYPE = import.meta.env.VITE_GRANT_TYPE
const SCOPE = import.meta.env.VITE_SCOPE

let cachedToken = null
let tokenExpiry = null

function joinApiPath(...parts) {
  return parts
    .filter(Boolean)
    .map((part, index) => {
      const value = String(part)
      if (index === 0) {
        return value.replace(/\/+$/, '')
      }

      return value.replace(/^\/+|\/+$/g, '')
    })
    .join('/')
}

export async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const params = new URLSearchParams()
  params.append('grant_type', GRANT_TYPE)
  params.append('client_id', CLIENT_ID)
  params.append('client_secret', CLIENT_SECRET)
  params.append('username', USERNAME)
  params.append('password', PASSWORD)
  params.append('scope', SCOPE)

  const response = await fetch(joinApiPath(BASE_URL, 'token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token request failed ${response.status}: ${text}`)
  }

  const data = await response.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000
  return cachedToken
}

export async function getItems(item, filters = {}, params = {}) {
    const token = await getToken()
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
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
        }
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

export async function getItemById(itemType, itemId) {
    const token = await getToken()
    const response = await fetch(joinApiPath(BASE_URL, itemType, itemId), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    })

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`API error ${response.status}: ${text}`)
    }

    const data = await response.json()
    return data
}

export async function deleteItem(itemType, itemId)
{
    const token = await getToken()
    const response = await fetch(joinApiPath(BASE_URL, itemType, itemId), {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    })

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`API error ${response.status}: ${text}`)
    }

        const text = await response.text()
    if (!text) return null
    try {
        return JSON.parse(text)
    } catch (e) {
        return text
    }
}

export async function insertItem(itemUrl, data)
{
    const token = await getToken()
    const response = await fetch(joinApiPath(BASE_URL, itemUrl), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`API error ${response.status}: ${text}`)
    }

    const text = await response.text()
    if (!text) return null
    console.log('json a envoyer:', JSON.parse(text))
    try {
      return JSON.parse(text)
    } catch (e) {
      return text
    }
}
export async function updateItem(itemUrl, data, idItem)
{
    const token = await getToken()
    const response = await fetch(joinApiPath(BASE_URL, itemUrl, idItem), {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`API error ${response.status}: ${text}`)
    }

    const text = await response.text()
    if (!text) return null
    console.log('json a envoyer:', JSON.parse(text))
    try {
      return JSON.parse(text)
    } catch (e) {
      return text
    }
}

export async function patchItem(itemUrl, data)
{
    const token = await getToken()
    const response = await fetch(joinApiPath(BASE_URL, itemUrl), {
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    body: JSON.stringify(data)
    })

    if (!response.ok) {
    const text = await response.text()
    throw new Error(`API error ${response.status}: ${text}`)
    }

    const text = await response.text()
    if (!text) return null
    try {
    return JSON.parse(text)
    } catch (e) {
    return text
    }
}

export async function getAssetsItems(itemType, page = 1, perPage = 10) 
{
  const token = await getToken()
  const start = (page - 1) * perPage

  const response = await fetch(joinApiPath(BASE_URL, 'Assets', itemType) + `?start=${start}&limit=${perPage}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  })

  console.log('Status:', response.status)
  console.log('Content-Range:', response.headers.get('Content-Range'))

  if (!response.ok && response.status !== 206) {
    const text = await response.text()
    throw new Error(`API error ${response.status}: ${text}`)
  }

  const contentRange = response.headers.get('Content-Range')
  let total = 0
  if (contentRange) {
    total = parseInt(contentRange.split('/')[1])
  }

  const data = await response.json()
  console.log('Data reçue:', data)

  let items = []
  if (Array.isArray(data)) items = data
  else if (data && Array.isArray(data.data)) items = data.data
  else if (data && Array.isArray(data.results)) items = data.results

  return { items, total }
}