# src/api.py
import json
import os
import random
import re
from pathlib import Path
from urllib import error as urlerror
from urllib import request as urlrequest

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
HF_API_URL = os.getenv(
    "HF_API_URL",
    "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
).strip()
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "").strip()
HF_TIMEOUT = max(5, int(os.getenv("HF_TIMEOUT", "60")))
AI_PROVIDER = os.getenv("AI_QUESTION_PROVIDER", "huggingface").strip().lower()

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


OFF_TOPIC_KEYWORDS = [
    "beaute", "beauté", "maquillage", "coiffure", "mode", "fashion", "sport", "voyage",
    "cuisine", "recette", "musique", "cinema", "film", "serie", "gaming", "jeu",
    "jardinage", "animaux", "astrologie", "divertissement"
]


def _normalize_level_for_seed(level: str) -> str:
    mapping = {
        "DEBUTANT": "Junior",
        "INTERMEDIAIRE": "Intermediate",
        "AVANCE": "Senior",
        "EXPERT": "Expert",
    }
    raw = (level or "").strip().upper()
    return mapping.get(raw, level or "Intermediate")


def _build_generation_prompt(req: GenerateRequest) -> str:
    domain = (req.domaine or "INFORMATIQUE").strip().upper()
    category = (req.categorie or "TECHNIQUE").strip().upper()
    level = _normalize_level_for_seed(req.niveau)
    q_type = (req.type or "QCM").strip().upper()
    theme = (req.theme or "general").strip()

    return (
        "Tu es un expert en conception de questions d'entretien et d'evaluation. "
        "Genere UNIQUEMENT un JSON valide, sans texte additionnel, sans markdown, sans explication. "
        "Le JSON doit correspondre au schema suivant: {contenu, type, points, theme, choix}. "
        "Toutes les questions doivent etre en francais, precises, professionnelles, non ambigues et adaptees au poste. "
        "Evite les questions trop generales ou du type definissez...; privilegie des cas concrets, des situations reelles et des bonnes reponses solides. "
        "Pour QCM: 4 choix minimum avec distracteurs plausibles. Pour QCU: 4 choix minimum avec une seule bonne reponse. "
        "Pour VRAI_FAUX: propose une affirmation claire, sans nuance inutile, avec exactement Vrai/Faux. "
        "Ne duplique pas les questions dans la meme serie. "
        f"Contexte -> domaine:{domain} | categorie:{category} | niveau:{level} | type:{q_type} | theme:{theme}."
    )


def _build_external_generation_prompt(req: GenerateRequest) -> str:
    base_prompt = _build_generation_prompt(req)
    nombre = max(1, min(int(req.nombre or 1), 10))

    return (
        f"{base_prompt} "
        f"Retourne exactement {nombre} questions sous forme d'un tableau JSON valide. "
        "Chaque element doit respecter le schema {contenu, type, points, theme, choix}. "
        "Ne fournis aucune explication, aucun markdown et aucun texte en dehors du JSON."
    )


def _normalize_text(value: str) -> str:
    return " ".join(str(value or "").lower().split())


def _is_job_related_theme(req: GenerateRequest) -> bool:
    text = _normalize_text(f"{req.theme} {req.categorie} {req.domaine}")
    if not text:
        return True

    for keyword in OFF_TOPIC_KEYWORDS:
        if keyword in text:
            return False

    return True


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


def _strip_code_fences(text: str) -> str:
    cleaned = str(text or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _extract_json_payload(text: str):
    cleaned = _strip_code_fences(text)
    candidates = [cleaned]

    array_start = cleaned.find("[")
    array_end = cleaned.rfind("]")
    if array_start != -1 and array_end != -1 and array_end > array_start:
        candidates.append(cleaned[array_start : array_end + 1])

    object_start = cleaned.find("{")
    object_end = cleaned.rfind("}")
    if object_start != -1 and object_end != -1 and object_end > object_start:
        candidates.append(cleaned[object_start : object_end + 1])

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except Exception:
            continue

    return None


def _normalize_external_question(item: dict, req: GenerateRequest) -> QuestionOut | None:
    if not isinstance(item, dict):
        return None

    contenu = str(item.get("contenu") or item.get("question") or item.get("text") or "").strip()
    if not contenu:
        return None

    q_type = str(item.get("type") or req.type or "QCM").strip().upper()
    theme = str(item.get("theme") or req.theme or "emploi").strip() or "emploi"

    try:
        points = int(item.get("points") or 1)
    except Exception:
        points = 1
    points = max(1, min(points, 10))

    raw_choices = item.get("choix") if isinstance(item.get("choix"), list) else []
    choix = _ensure_valid_choices(q_type, raw_choices)

    return QuestionOut(
        contenu=contenu,
        type=q_type,
        points=points,
        theme=theme,
        choix=choix,
    )


def _parse_external_questions_response(text: str, req: GenerateRequest) -> list[QuestionOut]:
    payload = _extract_json_payload(text)
    if isinstance(payload, dict):
        for key in ("questions", "data", "items", "results"):
            if isinstance(payload.get(key), list):
                payload = payload[key]
                break

    if not isinstance(payload, list):
        return []

    results: list[QuestionOut] = []
    for item in payload:
        if len(results) >= max(1, min(int(req.nombre or 1), 10)):
            break
        question = _normalize_external_question(item, req)
        if question is not None:
            results.append(question)

    return results


def _call_external_provider(req: GenerateRequest) -> list[QuestionOut]:
    if AI_PROVIDER not in {"huggingface", "hf", "external"} or not HF_API_URL:
        return []

    payload = {
        "inputs": _build_external_generation_prompt(req),
        "parameters": {
            "max_new_tokens": 1200,
            "temperature": max(0.1, float(req.temperature or 0.7)),
            "top_p": 0.9,
            "do_sample": True,
            "return_full_text": False,
        },
        "options": {
            "wait_for_model": True,
        },
    }

    headers = {
        "Content-Type": "application/json",
    }
    if HF_API_TOKEN:
        headers["Authorization"] = f"Bearer {HF_API_TOKEN}"

    request = urlrequest.Request(
        HF_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urlrequest.urlopen(request, timeout=HF_TIMEOUT) as response:
            response_body = response.read().decode("utf-8")
    except urlerror.HTTPError:
        return []
    except Exception:
        return []

    try:
        raw = json.loads(response_body)
    except Exception:
        raw = response_body

    generated_text = ""
    if isinstance(raw, list) and raw:
        first_item = raw[0]
        if isinstance(first_item, dict):
            generated_text = str(
                first_item.get("generated_text")
                or first_item.get("text")
                or first_item.get("content")
                or ""
            ).strip()
        else:
            generated_text = str(first_item).strip()
    elif isinstance(raw, dict):
        if raw.get("error"):
            return []
        generated_text = str(
            raw.get("generated_text")
            or raw.get("text")
            or raw.get("content")
            or ""
        ).strip()
    elif isinstance(raw, str):
        generated_text = raw.strip()

    if not generated_text:
        return []

    return _parse_external_questions_response(generated_text, req)


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


def _generate_job_questions(req: GenerateRequest) -> list[QuestionOut]:
    if not _is_job_related_theme(req):
        raise HTTPException(
            400,
            "Le chatbot répond uniquement aux thèmes liés à l'emploi, au recrutement et aux entretiens.",
        )

    external_questions = _call_external_provider(req)
    if external_questions:
        return external_questions

    # Fallback local si le provider externe n'est pas disponible ou ne renvoie
    # pas de JSON exploitable.
    return _fallback_generate(req)


# ── Endpoint principal ────────────────────────────────
@app.post("/generate", response_model=list[QuestionOut])
def generate(req: GenerateRequest):
    try:
        return _generate_job_questions(req)
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

        return _generate_job_questions(req)
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
        "mode": "external" if AI_PROVIDER in {"huggingface", "hf", "external"} and HF_API_URL else "fallback",
        "provider": AI_PROVIDER,
        "external_api": HF_API_URL or None,
        "seed_examples": seed_count,
        "model_files": {
            "vocab_exists": VOCAB_PATH.exists(),
            "weights_exists": MODEL_PATH.exists(),
        },
    }