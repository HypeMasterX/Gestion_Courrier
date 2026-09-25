import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Connexion from './pages/Connexion'
import Dossiers from './pages/Dossiers'
import NouveauDossier from './pages/NouveauDossier'
import DetailDossier from './pages/DetailDossier'
import RouteProtegee from './components/RouteProtegee'
import Layout from './components/Layout'

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
        <Route path="*" element={<Navigate to="/dossiers" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App