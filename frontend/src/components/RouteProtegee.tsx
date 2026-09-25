import { Navigate } from 'react-router-dom'
import { estConnecte } from '../api/client'

export default function RouteProtegee({ children }: { children: React.ReactNode }) {
  if (!estConnecte()) {
    return <Navigate to="/connexion" replace />
  }
  return <>{children}</>
}