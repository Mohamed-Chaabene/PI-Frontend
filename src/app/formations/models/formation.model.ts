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
  statut: 'Disponible' | 'Archivée' | 'Bientôt' | string;
  duree: string;
  niveau: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert' | string;
  competences?: Competence[];

  // ✅ Champs contenus enrichis
  lienExterne?:   string;   // Lien vers Udemy/Coursera
  playlistId?:    string;   // ✅ ID playlist YouTube (remplace youtubeId)
  youtubeId?:     string;   // Gardé pour compatibilité ascendante
  hasEditor?:     boolean;  // Activer l'éditeur de code
  stackBlitzUrl?: string;   // Template éditeur StackBlitz
  writtenUrl?:    string;   // URL formation écrite (W3Schools, MDN...)
  description?:   string;   // Description de la formation
  imageUrl?:      string;   // Thumbnail

  // ✅ Champs du Scheduler / Stats
  badge?:         string;
  totalInscrits?: number;
  noteMoyenne?:   number;
  tauxCompletion?:number;
  scorePopularite?:number;
}

export interface FormationStats {
  formationId:    number;
  titre:          string;
  categorie:      string;
  niveau:         string;
  statut:         string;
  badge:          string | null;
  totalInscrits:  number;
  noteMoyenne:    number;
  totalCertifies: number;
  totalTermines:  number;
  tauxCompletion: number;
  scorePopularite:number;
}

export interface FormationSuggestion {
  playlistId:     string;   // ✅ ID playlist
  titre:          string;
  thumbnail:      string;
  chaineYoutube:  string;
  writtenUrl:     string;
  categorie:      string;
  niveau:         string;
  nbVideos:       number;   // ✅ Nombre de vidéos dans la playlist
  dureeTotale?:   string;   // ✅ Durée totale estimée (ex: "2h 30min")
}

export interface YoutubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  position: number;
}
export interface DocSuggestion {
  id:         string;
  titre:      string;
  source:     string;      // "DevDocs.io", "dev.to", "GitHub"
  sourceType: string;      // "devdocs", "devto", "github"
  url:        string;
}