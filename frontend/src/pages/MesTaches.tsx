import { useEffect, useState } from 'react'
import api from '../api/client'

interface Imputation { id: number; libelle: string; instruction_claire: string }
interface ImputationDossier { imputation: number; imputation_libelle: string; commentaire: string }
interface Dossier { id: number; numero: string; objet: string; imputations_appliquees: ImputationDossier[] }

export default function MesTaches() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [imputations, setImputations] = useState<Imputation[]>([])
  const [erreur, setErreur] = useState('')
  const charger = () => { api.get('dossiers/').then((res) => setDossiers(res.data)); api.get('imputations/').then((res) => setImputations(res.data)) }
  useEffect(() => { charger() }, [])
  const renvoyer = async (id: number) => { setErreur(''); try { await api.post(`dossiers/${id}/renvoyer_au_sg/`); charger() } catch { setErreur('Impossible de renvoyer ce rapport au SG.') } }
  const instruction = (item: ImputationDossier) => imputations.find((imputation) => imputation.id === item.imputation)?.instruction_claire || item.imputation_libelle
  return <div className="page-container"><div className="panel page-panel"><div className="panel-header"><div><p className="eyebrow">Service concerné</p><h1>Mes tâches</h1></div></div>{erreur && <p className="error-text">{erreur}</p>}<div className="tache-grid">{dossiers.map((dossier) => <article className="tache-card" key={dossier.id}><div className="tache-card-header"><span className="priority-badge">À traiter</span><strong>{dossier.numero}</strong></div><h2>{dossier.objet}</h2><div className="instruction-list">{dossier.imputations_appliquees.map((item, index) => <div key={`${item.imputation}-${index}`}><span>Instruction</span><p>{instruction(item)}</p>{item.commentaire && <small>Commentaire : {item.commentaire}</small>}</div>)}</div><button className="primary-button" onClick={() => renvoyer(dossier.id)}>Renvoyer mon rapport au SG</button></article>)}</div>{dossiers.length === 0 && <p className="empty-state">Aucune tâche attribuée à votre service.</p>}</div></div>
}