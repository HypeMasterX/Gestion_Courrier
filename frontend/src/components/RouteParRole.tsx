import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getUtilisateurConnecte, estConnecte } from '../api/client'
import { getRouteParDefaut } from '../utils/redirectionRole'

export default function RouteParRole({
  roles,
  children,
}: {
  roles: string[]
  children: React.ReactNode
}) {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    getUtilisateurConnecte().then((utilisateur) => setRole(utilisateur.role)).catch(() => setRole(''))
  }, [])

  if (!estConnecte()) return <Navigate to="/connexion" replace />
  if (role === null) return <div className="page-container"><div className="panel"><p>Chargement...</p></div></div>
  if (!roles.includes(role)) return <Navigate to={getRouteParDefaut(role)} replace />
  return <>{children}</>
}