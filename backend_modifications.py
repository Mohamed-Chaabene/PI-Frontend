# Modifications proposées pour le back-end (api_suggestions.py)

from fastapi import FastAPI, Query
from typing import List, Optional
import json
from pathlib import Path

app = FastAPI()

# Supposons que les données des formations sont stockées dans un fichier JSON
FORMATIONS_DATA_PATH = Path("data/formations.json")

def load_formations():
    if FORMATIONS_DATA_PATH.exists():
        with open(FORMATIONS_DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

@app.get("/api/suggestions/formations")
async def get_formation_suggestions(
    titre: str = Query(..., description="Titre de la formation à rechercher"),
    niveau: Optional[str] = Query(None, description="Niveau de filtrage (Débutant, Intermédiaire, Avancé, Expert)")
) -> List[dict]:
    formations = load_formations()

    # Filtrer par titre (recherche insensible à la casse)
    filtered = [
        f for f in formations
        if titre.lower() in f.get('titre', '').lower()
    ]

    # Filtrer par niveau si spécifié
    if niveau:
        filtered = [
            f for f in filtered
            if f.get('niveau', '').lower() == niveau.lower()
        ]

    # Si aucun résultat pour le niveau spécifié, retourner des formations du niveau demandé
    # ou des formations générales si aucune n'existe pour ce niveau
    if not filtered and niveau:
        # Essayer de trouver des formations pour ce niveau spécifiquement
        niveau_formations = [
            f for f in formations
            if f.get('niveau', '').lower() == niveau.lower()
        ]
        if niveau_formations:
            filtered = niveau_formations[:10]  # Limiter à 10 suggestions
        else:
            # Si aucune formation pour ce niveau, retourner les premières formations disponibles
            filtered = formations[:10]

    # Calculer dureeTotale si elle n'existe pas
    for f in filtered:
        if 'dureeTotale' not in f and 'duree' in f:
            f['dureeTotale'] = f['duree']
        elif 'dureeTotale' not in f:
            f['dureeTotale'] = "Durée non spécifiée"

    # Retourner les suggestions formatées
    suggestions = []
    for f in filtered[:10]:  # Limiter à 10 suggestions
        suggestion = {
            "playlistId": f.get("playlistId", ""),
            "titre": f.get("titre", ""),
            "thumbnail": f.get("imageUrl", ""),
            "chaineYoutube": f.get("plateforme", ""),
            "writtenUrl": f.get("writtenUrl", ""),
            "categorie": f.get("categorie", ""),
            "niveau": f.get("niveau", ""),
            "nbVideos": f.get("nbVideos", 0),
            "dureeTotale": f.get("dureeTotale", "Durée non spécifiée")
        }
        suggestions.append(suggestion)

    return suggestions

# Endpoint pour vérifier la disponibilité des formations par niveau
@app.get("/api/formations/check-niveaux")
async def check_formations_by_niveau():
    formations = load_formations()
    niveaux = ["Débutant", "Intermédiaire", "Avancé", "Expert"]
    result = {}

    for niv in niveaux:
        count = len([
            f for f in formations
            if f.get('niveau', '').lower() == niv.lower()
        ])
        result[niv] = {
            "count": count,
            "available": count > 0
        }

    return result</content>
<parameter name="filePath">c:\Users\User\PI-Frontend\backend_modifications.py