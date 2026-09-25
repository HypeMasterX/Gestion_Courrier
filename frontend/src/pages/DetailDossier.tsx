import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'

interface Dossier {
  id: number
  numero: string
  type_courrier: string
  objet: string
  statut: string
  confidentiel: boolean
  verrouille: boolean
  origine_destinataire: string
}

interface Imputation {
  id: number
  libelle: string
  portee: string
}

interface Service {
  id: number
  nom: string
}

interface JournalEntry {
  id: number
  action: string
  horodatage: string
  utilisateur_nom: string
}

const TRANSITIONS: Record<string, Record<string, string[]>> = {
  arrivee: {
    enregistre: ['transmis_sg'],
    transmis_sg: ['en_traitement', 'transmis_pds'],
    transmis_pds: ['en_traitement'],
    imputation_definitive: ['archive'],
  },
  depart: {
    redige: ['en_validation'],
    en_validation: ['signe'],
    signe: ['expedie'],
    expedie: ['classe'],
  },
}

export default function DetailDossier() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [imputations, setImputations] = useState<Imputation[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [imputationsSelectionnees, setImputationsSelectionnees] = useState<number[]>([])
  const [servicesSelectionnes, setServicesSelectionnes] = useState<number[]>([])
  const [estDefinitive, setEstDefinitive] = useState(false)
  const [commentaire, setCommentaire] = useState('')
  const [erreur, setErreur] = useState('')

  const charger = () => {
    api.get(`dossiers/${id}/`).then((res) => setDossier(res.data))
    api.get('imputations/').then((res) => setImputations(res.data))
    api.get('services/').then((res) => setServices(res.data))
    api.get(`journal-audit/?dossier=${id}`).then((res) => setJournal(res.data))
  }

  useEffect(() => {
    charger()
  }, [id])

  const handleTransition = async (nouveauStatut: string) => {
    setErreur('')
    try {
      await api.post(`dossiers/${id}/changer_statut/`, { statut: nouveauStatut })
      charger()
    } catch {
      setErreur("Vous n'avez pas le droit d'effectuer cette transition, ou elle n'est pas autorisée depuis ce statut.")
    }
  }

  const toggleImputation = (imputationId: number) => {
    setImputationsSelectionnees((actuelles) =>
      actuelles.includes(imputationId)
        ? actuelles.filter((id) => id !== imputationId)
        : [...actuelles, imputationId]
    )
  }

  const toggleService = (serviceId: number) => {
    setServicesSelectionnes((actuels) =>
      actuels.includes(serviceId)
        ? actuels.filter((id) => id !== serviceId)
        : [...actuels, serviceId]
    )
  }

  const handleImputation = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')

    if (imputationsSelectionnees.length === 0) {
      setErreur('Veuillez cocher au moins une imputation.')
      return
    }

    const servicesCibles = servicesSelectionnes.length > 0 ? servicesSelectionnes : [null]
    const payload = {
      dossier: Number(id),
      imputations: imputationsSelectionnees.flatMap((imputationId) =>
        servicesCibles.map((serviceId) => ({
          imputation: imputationId,
          service_destinataire: serviceId,
          commentaire,
          est_definitive: estDefinitive,
        }))
      ),
    }

    try {
      await api.post('imputations-dossier/bulk/', payload)
      setImputationsSelectionnees([])
      setServicesSelectionnes([])
      setCommentaire('')
      setEstDefinitive(false)
      charger()
    } catch {
      setErreur("Erreur lors de l'application des imputations.")
    }
  }

  if (!dossier) return <div className="page-container"><div className="panel"><p>Chargement...</p></div></div>

  const transitionsPossibles = TRANSITIONS[dossier.type_courrier]?.[dossier.statut] || []

  return (
    <div className="page-container">
      <div className="panel detail-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Dossier</p>
            <h1>{dossier.numero} {dossier.confidentiel && '🔒'}</h1>
          </div>
          <button className="secondary-button" onClick={() => navigate('/dossiers')}>&larr; Retour</button>
        </div>

        <div className="detail-meta">
          <div><span>Objet</span><strong>{dossier.objet}</strong></div>
          <div><span>{dossier.type_courrier === 'arrivee' ? 'Expéditeur' : 'Destinataire'}</span><strong>{dossier.origine_destinataire}</strong></div>
          <div><span>Statut</span><strong>{dossier.statut} {dossier.verrouille && '(verrouillé)'}</strong></div>
        </div>

        {erreur && <p className="error-text">{erreur}</p>}

        {transitionsPossibles.length > 0 && (
          <div className="action-block">
            <h3>Faire avancer le dossier</h3>
            <div className="action-buttons">
              {transitionsPossibles.map((statut) => (
                <button key={statut} className="secondary-button" onClick={() => handleTransition(statut)}>
                  → {statut}
                </button>
              ))}
            </div>
          </div>
        )}

        {!dossier.verrouille && (
          <div className="action-block">
            <h3>Cocher les imputations</h3>
            <form onSubmit={handleImputation} className="form-stack">
              <div className="check-list">
                <p><strong>Imputations</strong></p>
                {imputations.map((imp) => (
                  <label key={imp.id} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={imputationsSelectionnees.includes(imp.id)}
                      onChange={() => toggleImputation(imp.id)}
                    />
                    <span>{imp.libelle}</span>
                  </label>
                ))}
              </div>

              <div className="check-list">
                <p><strong>Services destinataires</strong></p>
                {services.map((s) => (
                  <label key={s.id} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={servicesSelectionnes.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                    />
                    <span>{s.nom}</span>
                  </label>
                ))}
              </div>

              <div className="field-group">
                <textarea placeholder="Commentaire (optionnel)" value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)} />
              </div>

              <label className="checkbox-row">
                <input type="checkbox" checked={estDefinitive} onChange={(e) => setEstDefinitive(e.target.checked)} />
                <span>Imputation définitive (verrouillera le dossier)</span>
              </label>

              <button type="submit" className="primary-button">Appliquer les imputations</button>
            </form>
          </div>
        )}

        <div className="action-block">
          <h3>Historique</h3>
          <ul className="history-list">
            {journal.map((j) => (
              <li key={j.id}>
                <small>{new Date(j.horodatage).toLocaleString('fr-FR')}</small>
                <span>{j.utilisateur_nom} : {j.action}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}