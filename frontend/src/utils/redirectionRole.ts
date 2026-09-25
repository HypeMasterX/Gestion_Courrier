export function getRouteParDefaut(role: string): string {
  switch (role) {
    case 'service_courrier':
      return '/enregistrement'
    case 'sg':
      return '/reception-sg'
    case 'pds':
      return '/dossiers-pds'
    case 'service_concerne':
      return '/mes-taches'
    default:
      return '/dossiers'
  }
}