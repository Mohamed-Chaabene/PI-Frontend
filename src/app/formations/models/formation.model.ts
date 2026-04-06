export interface Competence {
  id: number;
  nom: string;
  niveau: string;
  type: string;
}

export interface Formation {
  id: number;
  titre: string;
  categorie: string;
  plateforme: string;
  statut: 'Disponible' | 'Archivée' | 'Bientôt' | string; // string = fallback
  duree: string;
  niveau: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert' | string;
  competences?: Competence[];
}