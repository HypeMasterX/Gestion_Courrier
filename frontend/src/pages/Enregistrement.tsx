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

export default function Enregistrement() {
  const [form, setForm] = useState({ type_courrier: 'arrivee', origine_destinataire: '', objet: '', confidentiel: false })
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [recherche, setRecherche] = useState('')
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')

  const charger = (terme = '') => {
    api.get(`dossiers/${terme ? `?search=${encodeURIComponent(terme)}` : ''}`).then((res) => setDossiers(res.data))
  }

  useEffect(() => { charger() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    setMessage('')
    try {
      const response = await api.post('dossiers/', form)
      await api.post(`dossiers/${response.data.id}/changer_statut/`, { statut: 'transmis_sg' })
      setForm({ type_courrier: 'arrivee', origine_destinataire: '', objet: '', confidentiel: false })
      setMessage('Courrier enregistré et transmis au SG.')
      charger(recherche)
    } catch {
      setErreur("Erreur lors de l'enregistrement ou de la transmission au SG.")
    }
  }

  return <div className="page-container">
    <div className="panel page-panel">
      <div className="panel-header"><div><p className="eyebrow">Service Courrier</p><h1>Enregistrer un courrier</h1></div></div>
      <form onSubmit={handleSubmit} className="form-stack">
        <div className="field-group"><label>Type de courrier</label><select value={form.type_courrier} onChange={(e) => setForm({ ...form, type_courrier: e.target.value })}><option value="arrivee">Arrivée</option><option value="depart">Départ</option></select></div>
        <div className="field-group"><label>{form.type_courrier === 'arrivee' ? 'Origine' : 'Destinataire'}</label><input required value={form.origine_destinataire} onChange={(e) => setForm({ ...form, origine_destinataire: e.target.value })} /></div>
        <div className="field-group"><label>Objet</label><input required value={form.objet} onChange={(e) => setForm({ ...form, objet: e.target.value })} /></div>
        <label className="checkbox-row"><input type="checkbox" checked={form.confidentiel} onChange={(e) => setForm({ ...form, confidentiel: e.target.checked })} /><span>Confidentiel</span></label>
        {erreur && <p className="error-text">{erreur}</p>}
        {message && <p className="success-text">{message}</p>}
        <button type="submit" className="primary-button">Enregistrer et transmettre au SG</button>
      </form>
    </div>
    <div className="panel page-panel section-panel">
      <div className="panel-header"><div><p className="eyebrow">Suivi</p><h2>Courriers enregistrés</h2></div></div>
      <form onSubmit={(e) => { e.preventDefault(); charger(recherche) }} className="search-row"><input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher par numéro, objet, origine..." /><button className="secondary-button" type="submit">Rechercher</button></form>
      <div className="table-wrapper"><table><thead><tr><th>Numéro</th><th>Objet</th><th>Origine/Destinataire</th><th>Statut</th><th></th></tr></thead><tbody>{dossiers.map((dossier) => <tr key={dossier.id}><td>{dossier.numero}</td><td>{dossier.objet}</td><td>{dossier.origine_destinataire}</td><td><span className="status-badge">{dossier.statut}</span></td><td><Link className="table-link" to={`/dossiers/${dossier.id}`}>Voir</Link></td></tr>)}</tbody></table></div>
      {dossiers.length === 0 && <p className="empty-state">Aucun courrier enregistré.</p>}
    </div>
  </div>
}