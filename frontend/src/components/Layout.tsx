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

  const liens = role === 'service_courrier'
    ? [{ label: 'Enregistrement', to: '/enregistrement' }]
    : role === 'sg'
      ? [{ label: 'Réception', to: '/reception-sg' }]
      : role === 'pds'
        ? [{ label: 'Dossiers', to: '/dossiers-pds' }]
        : role === 'service_concerne'
          ? [{ label: 'Mes tâches', to: '/mes-taches' }]
          : [
              { label: 'Dossiers', to: '/dossiers' },
              { label: 'Enregistrement', to: '/enregistrement' },
              { label: 'Réception SG', to: '/reception-sg' },
              { label: 'Dossiers PDS', to: '/dossiers-pds' },
              { label: 'Mes tâches', to: '/mes-taches' },
            ]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">G</div>
          <div>
            <Link to={role ? (liens[0]?.to || '/dossiers') : '/dossiers'} className="brand-link">
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
      <nav className="role-nav" aria-label="Navigation principale">
        {liens.map((lien) => <Link key={lien.to} to={lien.to}>{lien.label}</Link>)}
        {role === 'admin' && <a href="/admin/">Administration</a>}
      </nav>
      <main className="page-main">{children}</main>
    </div>
  )
}