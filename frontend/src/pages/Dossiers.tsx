import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

interface Dossier {
  id: number
  numero: string
  type_courrier: string
  objet: string
  statut: string
  confidentiel: boolean
  origine_destinataire: string
}

interface UtilisateurConnecte {
  id: number
  username: string
  role: string
}

interface Statistiques {
  total_dossiers: number
  par_statut: Array<{ statut: string; total: number }>
  par_type: Array<{ type_courrier: string; total: number }>
}

const ROLE_LABELS: Record<string, string> = {
  service_courrier: 'Service Courrier',
  sg: 'Secrétariat Général',
  pds: 'PDS',
  service_concerne: 'Service concerné',
  admin: 'Administrateur',
}

export default function Dossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [recherche, setRecherche] = useState('')
  const [utilisateur, setUtilisateur] = useState<UtilisateurConnecte | null>(null)
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null)

  const charger = (terme = '') => {
    api.get(`dossiers/${terme ? `?search=${terme}` : ''}`).then((res) => setDossiers(res.data))
    api.get('statistiques/').then((res) => setStatistiques(res.data))
  }

  useEffect(() => {
    api.get('utilisateur-courant/').then((res) => setUtilisateur(res.data)).catch(() => {})
    charger()
  }, [])

  const handleRecherche = (e: React.FormEvent) => {
    e.preventDefault()
    charger(recherche)
  }

  const titreVue = utilisateur ? ROLE_LABELS[utilisateur.role] || 'Profil' : 'Tableau de bord'
  const peutCreerDossier = utilisateur?.role === 'service_courrier' || utilisateur?.role === 'admin'

  return (
    <div className="page-container">
      <div className="panel page-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{titreVue}</p>
            <h1>Dossiers</h1>
          </div>

          {peutCreerDossier && (
            <Link to="/dossiers/nouveau" className="primary-button">
              + Nouveau dossier
            </Link>
          )}
        </div>

        {statistiques && (
          <div className="stats-grid">
            <div className="stat-card accent">
              <span>Total</span>
              <strong>{statistiques.total_dossiers}</strong>
            </div>
            <div className="stat-card">
              <span>En traitement</span>
              <strong>{statistiques.par_statut.find((x) => x.statut === 'en_traitement')?.total ?? 0}</strong>
            </div>
            <div className="stat-card">
              <span>Archivé</span>
              <strong>{statistiques.par_statut.find((x) => x.statut === 'archive')?.total ?? 0}</strong>
            </div>
          </div>
        )}

        <form onSubmit={handleRecherche} className="search-row">
          <input
            type="text"
            placeholder="Rechercher par numéro, objet, expéditeur..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          <button type="submit" className="secondary-button">Rechercher</button>
        </form>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Type</th>
                <th>Objet</th>
                <th>Origine/Destinataire</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dossiers.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.numero} {d.confidentiel && <span title="Confidentiel">🔒</span>}
                  </td>
                  <td>{d.type_courrier === 'arrivee' ? 'Arrivée' : 'Départ'}</td>
                  <td>{d.objet}</td>
                  <td>{d.origine_destinataire}</td>
                  <td><span className="status-badge">{d.statut}</span></td>
                  <td>
                    <Link to={`/dossiers/${d.id}`} className="table-link">Voir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dossiers.length === 0 && <p className="empty-state">Aucun dossier trouvé.</p>}
      </div>
    </div>
  )
}