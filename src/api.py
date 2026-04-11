# src/api.py
import json
import random
from pathlib import Path

from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel

try:
    import torch
except Exception:
    torch = None

try:
    from dataset import QuestionTokenizer
    from model import QuestionGeneratorModel
except Exception:
    QuestionTokenizer = None
    QuestionGeneratorModel = None

# ── Chargement au démarrage ──────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
VOCAB_PATH = BASE_DIR / "saved_model" / "vocab.json"
MODEL_PATH = BASE_DIR / "saved_model" / "model.pt"
SEED_DATASET_PATH = BASE_DIR / "src" / "app" / "Nesrineai" / "data" / "questions.json"
EXPANDED_DATASET_PATH = BASE_DIR / "src" / "app" / "Nesrineai" / "data" / "questions_expanded.json"

DEVICE = "cpu"
MODEL_READY = False
tokenizer = None
model = None

if torch is not None:
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

if (
    torch is not None
    and QuestionTokenizer is not None
    and QuestionGeneratorModel is not None
    and VOCAB_PATH.exists()
    and MODEL_PATH.exists()
):
    try:
        tokenizer = QuestionTokenizer.load(str(VOCAB_PATH))
        model = QuestionGeneratorModel(
            vocab_size=len(tokenizer.token2id),
            d_model=256,
            nhead=8,
            num_encoder_layers=4,
            num_decoder_layers=4,
            dim_feedforward=512,
        ).to(DEVICE)
        model.load_state_dict(torch.load(str(MODEL_PATH), map_location=DEVICE))
        model.eval()
        MODEL_READY = True
    except Exception:
        MODEL_READY = False

app = FastAPI(title="AI Question Generator")


# ── Schémas ──────────────────────────────────────────
class GenerateRequest(BaseModel):
    domaine: str
    categorie: str
    niveau: str
    type: str
    theme: str = ""
    nombre: int = 3
    temperature: float = 0.7


class QuestionOut(BaseModel):
    contenu: str
    type: str
    points: int
    theme: str
    choix: list


def _normalize_level_for_seed(level: str) -> str:
    mapping = {
        "DEBUTANT": "Junior",
        "INTERMEDIAIRE": "Intermediate",
        "AVANCE": "Senior",
        "EXPERT": "Expert",
    }
    raw = (level or "").strip().upper()
    return mapping.get(raw, level or "Intermediate")


def _load_seed_examples() -> list[dict]:
    examples = []
    for dataset_path in [EXPANDED_DATASET_PATH, SEED_DATASET_PATH]:
        if not dataset_path.exists():
            continue

        try:
            raw = json.loads(dataset_path.read_text(encoding="utf-8"))
            for item in raw:
                output_raw = item.get("output")
                parsed = json.loads(output_raw) if isinstance(output_raw, str) else output_raw
                if isinstance(parsed, dict):
                    examples.append(parsed)
        except Exception:
            continue

    return examples


def _ensure_valid_choices(question_type: str, choices: list[dict]) -> list[dict]:
    if question_type == "VF":
        if not choices or len(choices) < 2:
            return [
                {"texte": "Vrai", "correcte": True, "ordre": 1},
                {"texte": "Faux", "correcte": False, "ordre": 2},
            ]

        normalized = [
            {"texte": "Vrai", "correcte": bool(choices[0].get("correcte", True)), "ordre": 1},
            {"texte": "Faux", "correcte": bool(choices[1].get("correcte", False)), "ordre": 2},
        ]
        if not any(c["correcte"] for c in normalized):
            normalized[0]["correcte"] = True
        if sum(1 for c in normalized if c["correcte"]) > 1:
            normalized[1]["correcte"] = False
        return normalized

    cleaned = []
    for idx, choice in enumerate(choices or [], start=1):
        text = str(choice.get("texte", "")).strip()
        if not text:
            continue
        cleaned.append({
            "texte": text,
            "correcte": bool(choice.get("correcte", False)),
            "ordre": idx,
        })

    if not cleaned:
        cleaned = [
            {"texte": "Option A", "correcte": True, "ordre": 1},
            {"texte": "Option B", "correcte": False, "ordre": 2},
            {"texte": "Option C", "correcte": False, "ordre": 3},
        ]

    if not any(c["correcte"] for c in cleaned):
        cleaned[0]["correcte"] = True

    if question_type == "QCU":
        found = False
        for c in cleaned:
            if c["correcte"] and not found:
                found = True
            else:
                c["correcte"] = False

    return cleaned


def _fallback_generate(req: GenerateRequest) -> list[QuestionOut]:
    seeds = _load_seed_examples()

    if not seeds:
        raise HTTPException(500, "Aucune donnée seed disponible pour la génération fallback.")

    wanted_type = (req.type or "QCM").strip().upper()
    filtered = [s for s in seeds if str(s.get("type", "")).strip().upper() == wanted_type]
    pool = filtered if filtered else seeds

    nombre = max(1, min(int(req.nombre or 1), 10))
    results: list[QuestionOut] = []

    for i in range(nombre):
        base = pool[i % len(pool)]
        q_type = str(base.get("type") or wanted_type or "QCM").strip().upper()
        theme = (req.theme or base.get("theme") or "general").strip()
        contenu = str(base.get("contenu") or "Question générée").strip()
        if req.theme:
            contenu = f"[{theme}] {contenu}"

        points = int(base.get("points") or 1)
        points = max(1, min(points, 10))
        raw_choices = base.get("choix") if isinstance(base.get("choix"), list) else []
        choix = _ensure_valid_choices(q_type, raw_choices)

        results.append(
            QuestionOut(
                contenu=contenu,
                type=q_type,
                points=points,
                theme=theme,
                choix=choix,
            )
        )

    random.shuffle(results)
    return results


def _model_generate(req: GenerateRequest) -> list[QuestionOut]:
    results = []

    nombre = max(1, min(int(req.nombre or 1), 10))
    for _ in range(nombre):
        prompt = (
            f"domaine:{req.domaine} | "
            f"categorie:{req.categorie} | "
            f"niveau:{_normalize_level_for_seed(req.niveau)} | "
            f"type:{req.type} | "
            f"theme:{req.theme or 'general'}"
        )

        src_ids = tokenizer.encode(prompt, max_len=128)
        src = torch.tensor([src_ids], dtype=torch.long)

        raw = model.generate(
            src,
            tokenizer,
            max_new_tokens=512,
            device=DEVICE,
            temperature=req.temperature,
        )

        try:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            data = json.loads(raw[start:end])
            data_type = str(data.get("type") or req.type or "QCM").upper()
            data["choix"] = _ensure_valid_choices(data_type, data.get("choix") or [])
            results.append(QuestionOut(**data))
        except Exception:
            continue

    if not results:
        raise HTTPException(500, "Le modèle n'a pas pu générer de questions valides.")

    return results


# ── Endpoint principal ────────────────────────────────
@app.post("/generate", response_model=list[QuestionOut])
def generate(req: GenerateRequest):
    try:
        if MODEL_READY:
            try:
                return _model_generate(req)
            except Exception:
                return _fallback_generate(req)
        return _fallback_generate(req)
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(500, f"Erreur de génération: {ex}")


@app.post("/questions/entretien/{entretien_id}/ai-generate", response_model=list[QuestionOut])
def generate_for_entretien(entretien_id: int, payload: dict = Body(...)):
    """
    Endpoint compatible avec le frontend recruiter.
    Accepte: categorie, niveau, type, theme, nombre, temperature (sans domaine).
    Deduit domaine depuis categorie.
    """
    try:
        # Mappage simplifié: deduit domaine depuis categorie
        categorie = str(payload.get("categorie", "TECHNIQUE")).strip().upper()
        domaine_map = {
            "TECHNIQUE": "INFORMATIQUE",
            "RH": "BUSINESS",
            "MANAGERIAL": "BUSINESS",
            "FINAL": "BUSINESS",
            "PRESELECTION": "BUSINESS",
            "TEST": "INFORMATIQUE",
        }
        domaine = domaine_map.get(categorie, "INFORMATIQUE")

        req = GenerateRequest(
            domaine=domaine,
            categorie=categorie,
            niveau=str(payload.get("niveau", "Intermediate")).strip(),
            type=str(payload.get("type", "QCM")).strip().upper(),
            theme=str(payload.get("theme", "")).strip(),
            nombre=int(payload.get("nombre", 3)),
            temperature=float(payload.get("temperature", 0.7)),
        )

        if MODEL_READY:
            try:
                return _model_generate(req)
            except Exception:
                return _fallback_generate(req)
        return _fallback_generate(req)
    except HTTPException:
        raise
    except Exception as ex:
        import traceback
        traceback.print_exc()
        raise HTTPException(400, f"Erreur: {str(ex)}")


@app.get("/health")
def health():
    seed_count = len(_load_seed_examples())
    return {
        "status": "ok",
        "device": DEVICE,
        "mode": "model" if MODEL_READY else "fallback",
        "seed_examples": seed_count,
        "model_files": {
            "vocab_exists": VOCAB_PATH.exists(),
            "weights_exists": MODEL_PATH.exists(),
        },
    }