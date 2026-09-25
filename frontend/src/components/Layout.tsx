import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout, getUtilisateurConnecte } from '../api/client'

const ROLE_LABELS: Record<string, string> = {
  service_courrier: 'Service Courrier',
  sg: 'Secrétariat Général',
  pds: 'PDS',
  service_concerne: 'Service concerné',
  admin: 'Administrateur',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getUtilisateurConnecte().then((u) => {
      setUsername(u.username)
      setRole(u.role)
    }).catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/connexion')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">G</div>
          <div>
            <Link to="/dossiers" className="brand-link">
              Gestion Courrier
            </Link>
            <div className="brand-subtitle">Mairie de Banfora</div>
          </div>
        </div>

        <div className="user-chip">
          <div>
            <div className="user-name">{username}</div>
            <small className="user-role">{role ? ROLE_LABELS[role] || role : ''}</small>
          </div>
          <button className="logout-button" onClick={handleLogout}>Déconnexion</button>
        </div>
      </header>
      <main className="page-main">{children}</main>
    </div>
  )
}