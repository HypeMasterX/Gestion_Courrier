import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUtilisateurConnecte, login } from '../api/client'
import { getRouteParDefaut } from '../utils/redirectionRole'

export default function Connexion() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    try {
      await login(username, password)
      const utilisateur = await getUtilisateurConnecte()
      navigate(getRouteParDefaut(utilisateur.role))
    } catch {
      setErreur('Identifiant ou mot de passe incorrect.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-badge">BANFORA</div>
        <h1>Gestion du Courrier</h1>
        <p className="login-subtitle">Accès sécurisé aux services de la mairie</p>

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="field-group">
            <label>Identifiant</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex. sg01"
            />
          </div>

          <div className="field-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {erreur && <p className="error-text">{erreur}</p>}

          <button type="submit" className="primary-button full-width">Se connecter</button>
        </form>
      </div>
    </div>
  )
}