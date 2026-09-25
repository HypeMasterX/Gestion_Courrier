import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function NouveauDossier() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    type_courrier: 'arrivee',
    origine_destinataire: '',
    objet: '',
    confidentiel: false,
  })
  const [erreur, setErreur] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    try {
      await api.post('dossiers/', form)
      navigate('/dossiers')
    } catch {
      setErreur("Erreur lors de la création du dossier.")
    }
  }

  return (
    <div className="page-container">
      <div className="panel large-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Service Courrier</p>
            <h1>Nouveau dossier</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="field-group">
            <label>Type de courrier</label>
            <select
              value={form.type_courrier}
              onChange={(e) => setForm({ ...form, type_courrier: e.target.value })}
            >
              <option value="arrivee">Courrier Arrivée</option>
              <option value="depart">Courrier Départ</option>
            </select>
          </div>

          <div className="field-group">
            <label>{form.type_courrier === 'arrivee' ? 'Expéditeur' : 'Destinataire'}</label>
            <input
              type="text"
              value={form.origine_destinataire}
              onChange={(e) => setForm({ ...form, origine_destinataire: e.target.value })}
              placeholder="Nom ou institution"
            />
          </div>

          <div className="field-group">
            <label>Objet</label>
            <input
              type="text"
              value={form.objet}
              onChange={(e) => setForm({ ...form, objet: e.target.value })}
              placeholder="Objet du dossier"
            />
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.confidentiel}
              onChange={(e) => setForm({ ...form, confidentiel: e.target.checked })}
            />
            <span>Confidentiel</span>
          </label>

          {erreur && <p className="error-text">{erreur}</p>}

          <button type="submit" className="primary-button full-width">Créer le dossier</button>
        </form>
      </div>
    </div>
  )
}