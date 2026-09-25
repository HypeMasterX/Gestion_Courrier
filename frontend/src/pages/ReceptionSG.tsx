import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

interface Dossier { id: number; numero: string; objet: string; statut: string; confidentiel: boolean; origine_destinataire: string }
interface Statistiques { par_statut: Array<{ statut: string; total: number }> }

function DossierCard({ dossier, urgent = false }: { dossier: Dossier; urgent?: boolean }) {
  return <Link to={`/dossiers/${dossier.id}`} className={`dossier-card${urgent ? ' urgent' : ''}`}><div><strong>{dossier.numero}</strong><span className="status-badge">{dossier.statut}</span></div><h3>{dossier.objet}</h3><p>{dossier.origine_destinataire}</p></Link>
}

export default function ReceptionSG() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null)
  const [recherche, setRecherche] = useState('')
  const charger = (terme = '') => { api.get(`dossiers/${terme ? `?search=${encodeURIComponent(terme)}` : ''}`).then((res) => setDossiers(res.data)); api.get('statistiques/').then((res) => setStatistiques(res.data)) }
  useEffect(() => { charger() }, [])
  const enAttente = dossiers.filter((d) => d.statut === 'transmis_sg')
  const autres = dossiers.filter((d) => d.statut !== 'transmis_sg')
  const total = (statut: string) => statistiques?.par_statut.find((item) => item.statut === statut)?.total ?? 0
  return <div className="page-container"><div className="panel page-panel"><div className="panel-header"><div><p className="eyebrow">Secrétariat Général</p><h1>Réception des dossiers</h1></div></div><div className="stats-grid"><div className="stat-card accent"><span>En attente de décision</span><strong>{total('transmis_sg')}</strong></div><div className="stat-card"><span>Transmis au PDS</span><strong>{total('transmis_pds')}</strong></div><div className="stat-card"><span>En traitement</span><strong>{total('en_traitement')}</strong></div></div><form onSubmit={(e) => { e.preventDefault(); charger(recherche) }} className="search-row"><input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un dossier..." /><button className="secondary-button">Rechercher</button></form><section><div className="section-heading"><h2>Dossiers en attente de décision</h2><span className="status-badge">{enAttente.length}</span></div><div className="dossier-grid">{enAttente.map((dossier) => <DossierCard key={dossier.id} dossier={dossier} urgent />)}</div>{enAttente.length === 0 && <p className="empty-state">Aucun dossier en attente.</p>}</section><details className="collapsible-section"><summary>Tous les dossiers en cours ({autres.length})</summary><div className="dossier-grid">{autres.map((dossier) => <DossierCard key={dossier.id} dossier={dossier} />)}</div>{autres.length === 0 && <p className="empty-state">Aucun autre dossier.</p>}</details></div></div>
}