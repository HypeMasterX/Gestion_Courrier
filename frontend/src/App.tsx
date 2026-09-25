import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Connexion from './pages/Connexion'
import Dossiers from './pages/Dossiers'
import NouveauDossier from './pages/NouveauDossier'
import DetailDossier from './pages/DetailDossier'
import RouteProtegee from './components/RouteProtegee'
import Layout from './components/Layout'
import RouteParRole from './components/RouteParRole'
import Enregistrement from './pages/Enregistrement'
import ReceptionSG from './pages/ReceptionSG'
import DossiersPDS from './pages/DossiersPDS'
import MesTaches from './pages/MesTaches'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/dossiers" element={
          <RouteProtegee><Layout><Dossiers /></Layout></RouteProtegee>
        } />
        <Route path="/dossiers/nouveau" element={
          <RouteProtegee><Layout><NouveauDossier /></Layout></RouteProtegee>
        } />
        <Route path="/dossiers/:id" element={
          <RouteProtegee><Layout><DetailDossier /></Layout></RouteProtegee>
        } />
        <Route path="/enregistrement" element={
          <RouteParRole roles={['service_courrier', 'admin']}><Layout><Enregistrement /></Layout></RouteParRole>
        } />
        <Route path="/reception-sg" element={
          <RouteParRole roles={['sg', 'admin']}><Layout><ReceptionSG /></Layout></RouteParRole>
        } />
        <Route path="/dossiers-pds" element={
          <RouteParRole roles={['pds', 'admin']}><Layout><DossiersPDS /></Layout></RouteParRole>
        } />
        <Route path="/mes-taches" element={
          <RouteParRole roles={['service_concerne', 'admin']}><Layout><MesTaches /></Layout></RouteParRole>
        } />
        <Route path="*" element={<Navigate to="/dossiers" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App