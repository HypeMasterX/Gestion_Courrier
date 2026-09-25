import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})


export async function login(username: string, password: string) {
  const response = await api.post('token/', { username, password })
  localStorage.setItem('token', response.data.token)
}

export function logout() {
  localStorage.removeItem('token')
}

export function estConnecte(): boolean {
  return !!localStorage.getItem('token')
}
export interface UtilisateurConnecte {
  id: number
  username: string
  role: string
}

export async function getUtilisateurConnecte(): Promise<UtilisateurConnecte> {
  const response = await api.get('utilisateur-courant/')
  return response.data
}
export default api

