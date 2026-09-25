import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

interface Dossier { id: number; numero: string; objet: string; statut: string; confidentiel: boolean; origine_destinataire: string }
function DossierCard({ dossier, confidentiel = false }: { dossier: Dossier; confidentiel?: boolean }) { return <Link to={`/dossiers/${dossier.id}`} className={`dossier-card${confidentiel ? ' confidentiel' : ''}`}><div><strong>{dossier.numero}</strong>{confidentiel ? <span className="confidential-badge">🔒 Confidentiel</span> : <span className="status-badge">{dossier.statut}</span>}</div><h3>{dossier.objet}</h3><p>{dossier.origine_destinataire}</p></Link> }

export default function DossiersPDS() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [recherche, setRecherche] = useState('')
  const [charge, setCharge] = useState(false)
  const charger = (terme = '') => { setCharge(false); api.get(`dossiers/${terme ? `?search=${encodeURIComponent(terme)}` : ''}`).then((res) => setDossiers(res.data)).finally(() => setCharge(true)) }
  useEffect(() => {
    api.get('dossiers/').then((res) => setDossiers(res.data)).finally(() => setCharge(true))
  }, [])
  const escalades = dossiers.filter((d) => d.statut === 'transmis_pds')
  const confidentiels = dossiers.filter((d) => d.confidentiel)
  return <div className="page-container"><div className="panel page-panel"><div className="panel-header"><div><p className="eyebrow">PDS</p><h1>Dossiers de supervision</h1></div></div><form onSubmit={(e) => { e.preventDefault(); charger(recherche) }} className="search-row"><input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher un dossier..." /><button className="secondary-button">Rechercher</button></form>{charge && dossiers.length === 0 ? <p className="empty-state">Le rôle PDS n'est pas encore activé pour cette instance.</p> : <div className="pds-sections"><section><div className="section-heading"><h2>Dossiers escaladés</h2><span className="status-badge">{escalades.length}</span></div><div className="dossier-grid">{escalades.map((dossier) => <DossierCard key={dossier.id} dossier={dossier} />)}</div>{escalades.length === 0 && <p className="empty-state">Aucun dossier escaladé.</p>}</section><section><div className="section-heading"><h2>Dossiers confidentiels</h2><span className="confidential-badge">🔒 {confidentiels.length}</span></div><div className="dossier-grid">{confidentiels.map((dossier) => <DossierCard key={dossier.id} dossier={dossier} confidentiel />)}</div>{confidentiels.length === 0 && <p className="empty-state">Aucun dossier confidentiel.</p>}</section></div>}</div></div>
}