# src/api.py
import json
import os
import random
import re
from pathlib import Path
from urllib import error as urlerror
from urllib import request as urlrequest

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
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
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
DEFAULT_AI_PROVIDER = "groq" if GROQ_API_KEY else "huggingface"
AI_PROVIDER = os.getenv("AI_QUESTION_PROVIDER", DEFAULT_AI_PROVIDER).strip().lower()

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

# ── Mappatura thèmes spécifiques avec keywords et exemples ────────────
THEME_SPECIFICS = {
    "sql": {
        "keywords": ["sql", "join", "index", "transaction", "requete", "database", "bdd", "schema", "trigger", "index", "optimize", "trigger"],
        "avoid_generic": ["select", "from", "where"],  # Ces mots sont too generic
        "good_questions_keywords": ["index", "join", "transaction", "normalization", "performance"],
        "examples": [
            "Quand choisir INNER JOIN ou LEFT JOIN pour optimiser une requete complexe ?",
            "Comment indexer une table pour accelerer une recherche multi-criteres sur plusieurs colonnes ?",
            "Comment detecter et resoudre un scan complet de table dans SQL ?",
            "Quelle strategie de partitioning pour une table contenant 100 millions d enregistrements ?",
            "Comment ecrire une transaction ACID sans deadlock en case de haute concurrence ?",
        ]
    },
    "angular": {
        "keywords": ["angular", "component", "service", "rxjs", "typescript", "directive", "template", "module", "resolver", "interceptor", "observable"],
        "avoid_generic": ["app", "component", "service"],
        "good_questions_keywords": ["rxjs", "unsubscribe", "trackby", "resolver", "interceptor", "change detection"],
        "examples": [
            "Comment optimiser le rendu d une liste Angular avec 10000 elements en utilisant trackBy ?",
            "Quand preferer un Resolver plutot qu un appel API dans ngOnInit pour eviter les fuites memoire ?",
            "Comment gerer proprement les fuites de souscriptions RxJS dans un component qui change souvent ?",
            "Comment implementer un intercepteur HTTP global pour gerer les erreurs de maniere centralisee ?",
            "Quelle approche pour eviter les dependances circulaires entre modules Angular ?",
        ]
    },
    "javascript": {
        "keywords": ["javascript", "js", "closure", "promise", "async", "await", "event loop", "prototype", "callback", "array", "object"],
        "avoid_generic": ["javascript", "js", "code"],
        "good_questions_keywords": ["closure", "promise", "async await", "event loop", "prototype", "callback"],
        "examples": [
            "Comment expliquer une closure JavaScript avec un cas concret d encapsulation ?",
            "Quelle difference entre Promise, async/await et callback dans une application JavaScript ?",
            "Comment fonctionne l event loop et pourquoi cela impacte les operations asynchrones ?",
            "Quand utiliser le prototype plutot qu une classe ES6 en JavaScript ?",
            "Comment eviter les bugs lies a this dans une fonction JavaScript et ses callbacks ?",
        ]
    },
    "java": {
        "keywords": ["java", "jvm", "polymorphism", "inheritance", "exception", "interface", "abstract", "stream", "lambda"],
        "avoid_generic": ["java", "class", "method"],
        "good_questions_keywords": ["exception handling", "SOLID", "optional", "stream api", "generics"],
        "examples": [
            "Quand preferer une interface a une classe abstraite en Java et pourquoi ?",
            "Comment differentier les exceptions checked, unchecked et les erreurs en Java ?",
            "Comment utiliser Optional pour eviter les NullPointerException sans abuse ?",
            "Quelles sont les avantages du Stream API par rapport aux boucles classiques ?",
            "Comment appliquer les principes SOLID dans une architecture backend Java ?",
        ]
    },
    "python": {
        "keywords": ["python", "decorator", "generator", "context manager", "virtual env", "list comprehension", "pandas", "async"],
        "avoid_generic": ["python", "function", "variable"],
        "good_questions_keywords": ["decorator", "async", "context manager", "comprehension", "generator", "virtual env"],
        "examples": [
            "Quand utiliser une list comprehension plutot qu une boucle classique en Python ?",
            "Quels pieges eviter avec les arguments mutables par defaut en Python ?",
            "Comment utiliser proprement les decorateurs pour ajouter des fonctionnalites ?",
            "Quelle difference entre un generator et une liste en Python pour la performance ?",
            "Comment structurer un projet Python avec virtualenv et requirements.txt ?",
        ]
    },
    "spring": {
        "keywords": ["spring", "spring boot", "bean", "transactional", "controller", "repository", "service", "annotation", "ioc"],
        "avoid_generic": ["spring", "bean", "controller"],
        "good_questions_keywords": ["transactional", "security", "cache", "rest", "dependency injection"],
        "examples": [
            "Quand utiliser @Transactional et quelles sont les pieges courants ?",
            "Comment separer proprement les responsabilites entre Controller, Service et Repository ?",
            "Comment implementer un handler global d erreur avec Spring et @ControllerAdvice ?",
            "Comment securiser une API REST avec Spring Security par role ?",
            "Quelle strategie de cache adopter sans incoherence de donnees dans Spring ?",
        ]
    },
}


def _normalize_level_for_seed(level: str) -> str:
    mapping = {
        "DEBUTANT": "Junior",
        "INTERMEDIAIRE": "Intermediate",
        "AVANCE": "Senior",
        "EXPERT": "Expert",
    }
    raw = (level or "").strip().upper()
    return mapping.get(raw, level or "Intermediate")


def _get_theme_key_for_specifics(theme: str) -> str | None:
    """Retourne la clé du thème dans THEME_SPECIFICS, ou None si thème non reconnu."""
    if not theme:
        return None
    normalized = theme.strip().lower().replace(" ", "").replace("_", "")
    
    for key in THEME_SPECIFICS.keys():
        if key in normalized or normalized in key:
            return key
    return None


def _get_theme_info(theme: str) -> dict | None:
    """Récupère les infos spécifiques au thème (keywords, examples, etc)."""
    key = _get_theme_key_for_specifics(theme)
    return THEME_SPECIFICS.get(key) if key else None


def _build_theme_specific_prompt(req: GenerateRequest) -> str:
    """Construit un prompt enrichi avec contexte spécifique au thème."""
    base_prompt = _build_generation_prompt(req)
    theme_info = _get_theme_info(req.theme)
    
    if not theme_info:
        return base_prompt
    
    keywords_str = ", ".join(theme_info.get("good_questions_keywords", []))
    examples_text = "\n".join(
        f"  - {ex}" for ex in theme_info.get("examples", [])[:3]
    )
    
    enriched = (
        f"{base_prompt}\n"
        f"IMPORTANT - Theme specifique '{req.theme}':\n"
        f"Les questions DOIVENT contenir au moins l'un de ces termes techniques clés: {keywords_str}.\n"
        f"Exemples de bonnes questions pour ce theme:\n{examples_text}\n"
        f"Genere des questions au MEME NIVEAU de specificite et de profondeur, "
        f"PAS des generalisations superficielles."
    )
    return enriched


def _is_generic_response(req: GenerateRequest, questions: list[QuestionOut]) -> bool:
    """
    Vérifie si les questions générées sont trop génériques.
    Retourne True si générique, False si suffisamment spécifiques.
    """
    theme_info = _get_theme_info(req.theme)
    if not theme_info:
        return False  # Pas de données pour ce thème, assume OK
    
    keywords = theme_info.get("good_questions_keywords", [])
    if not keywords:
        return False
    
    # Collecte les contenus des questions
    all_text = " ".join(q.contenu.lower() for q in questions if q.contenu)
    
    # Compte combien de bonnes keywords on a trouvé
    keyword_hits = sum(1 for kw in keywords if kw.lower() in all_text)
    average_hits_per_question = keyword_hits / max(1, len(questions))
    
    # Seuil: minimum 0.3 hits par question en moyenne (1 hit sur 3 questions minimum)
    is_too_generic = average_hits_per_question < 0.3
    
    # Aussi check pour les termes vagues
    vague_terms = ["define", "définis", "explique", "c'est quoi", "qu'est-ce que c'est", 
                   "liste les", "enumere", "donne une liste"]
    vague_count = sum(1 for term in vague_terms if term in all_text)
    if vague_count > len(questions) / 2:  # Plus de la moitié des questions sont vagues
        return True
    
    return is_too_generic


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


def _build_external_generation_prompt(req: GenerateRequest, retry: bool = False) -> str:
    """Build external API prompt. If retry=True, uses strict theme-specific prompt."""
    if retry:
        # Mode strict pour retry: force la spécificité au thème
        base_prompt = _build_theme_specific_prompt(req)
        strict_addon = (
            "\n\nCRITICAL: La reponse precedente etait trop generique. "
            "Genere des questions TRES SPECIFIQUES et TECHNIQUES, pas des generalisations. "
            "Chaque question DOIT contenir du vocabulaire technique pointu du domaine. "
            "Evite absolument les questions vagues ou definissez... "
        )
    else:
        # Mode normal: enrichi mais pas encore strict
        base_prompt = _build_theme_specific_prompt(req)
        strict_addon = ""
    
    nombre = max(1, min(int(req.nombre or 1), 10))

    return (
        f"{base_prompt}{strict_addon} "
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


def _call_external_provider(req: GenerateRequest, retry: bool = False) -> list[QuestionOut]:
    def _call_huggingface() -> list[QuestionOut]:
        if not HF_API_URL:
            return []

        payload = {
            "inputs": _build_external_generation_prompt(req, retry=retry),
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

    def _call_groq() -> list[QuestionOut]:
        if not GROQ_API_KEY or not GROQ_API_URL:
            return []

        prompt = _build_external_generation_prompt(req, retry=retry)
        payload = {
            "model": GROQ_MODEL,
            "temperature": max(0.1, float(req.temperature or 0.7)),
            "max_tokens": 1400,
            "messages": [
                {
                    "role": "system",
                    "content": "Tu es un assistant IA expert en generation de questions d entretien. Tu dois repondre uniquement avec du JSON valide.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}",
        }

        request = urlrequest.Request(
            GROQ_API_URL,
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
            return []

        content = (
            raw.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            if isinstance(raw, dict)
            else ""
        )
        generated_text = str(content or "").strip()
        if not generated_text:
            return []

        return _parse_external_questions_response(generated_text, req)

    # Provider routing: prefer Groq for higher-quality responses, fallback to HuggingFace.
    if AI_PROVIDER in {"groq", "openai"}:
        groq_results = _call_groq()
        if groq_results:
            return groq_results
        return _call_huggingface()

    if AI_PROVIDER in {"huggingface", "hf", "external"}:
        hf_results = _call_huggingface()
        if hf_results:
            return hf_results
        return _call_groq()

    # Unknown provider: attempt both in quality-first order.
    groq_results = _call_groq()
    if groq_results:
        return groq_results
    return _call_huggingface()



def _ensure_valid_choices(question_type: str, choices: list[dict]) -> list[dict]:
    normalized_type = str(question_type or "").strip().upper()

    if normalized_type in {"VF", "VRAI_FAUX"}:
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

    if normalized_type == "QCU":
        found = False
        for c in cleaned:
            if c["correcte"] and not found:
                found = True
            else:
                c["correcte"] = False

    return cleaned


def _theme_key(theme: str) -> str:
    normalized = re.sub(r"\s+", " ", str(theme or "").lower()).strip()
    normalized = normalized.replace("é", "e").replace("è", "e").replace("ê", "e")

    if "angular" in normalized:
        return "angular"
    if "javascript" in normalized or "java script" in normalized or normalized == "js" or normalized.startswith("js "):
        return "javascript"
    if "spring" in normalized:
        return "spring"
    if "java" in normalized:
        return "java"
    if any(k in normalized for k in ["sql", "bdd", "database", "base de donne", "mysql", "postgres", "oracle", "mongodb"]):
        return "sql"
    if "python" in normalized:
        return "python"
    return "generic"


def _is_relevant_to_theme(req: GenerateRequest, questions: list[QuestionOut]) -> bool:
    key = _theme_key(req.theme)
    if key == "generic":
        return True

    signals = {
        "angular": ["angular", "component", "service", "rxjs", "typescript", "directive", "template"],
        "javascript": ["javascript", "js", "closure", "promise", "async", "await", "event loop", "prototype", "callback"],
        "java": ["java", "jvm", "jdk", "jre", "exception", "interface", "classe abstraite"],
        "sql": ["sql", "join", "index", "transaction", "requete", "database", "bdd"],
        "spring": ["spring", "spring boot", "transactional", "bean", "controller", "repository"],
        "python": ["python", "pandas", "list", "dict", "decorateur", "virtualenv"],
    }

    text_blob = " ".join(str(q.contenu or "").lower() for q in questions)
    return any(token in text_blob for token in signals.get(key, []))


def _thematic_fallback_generate(req: GenerateRequest) -> list[QuestionOut]:
    wanted_type = (req.type or "QCM").strip().upper()
    theme = (req.theme or "entretien technique").strip() or "entretien technique"
    nombre = max(1, min(int(req.nombre or 1), 10))
    key = _theme_key(theme)

    question_banks = {
        "angular": [
            "Comment optimiser le rendu d une liste Angular volumineuse avec trackBy ?",
            "Quand utiliser un Resolver plutot qu un appel API dans ngOnInit ?",
            "Comment gerer proprement les erreurs HTTP globales avec HttpInterceptor ?",
            "Quelle approche pour limiter les fuites memoire avec les subscriptions RxJS ?",
            "Comment structurer des modules Angular pour eviter les dependances circulaires ?",
        ],
        "javascript": [
            "Comment expliquer une closure JavaScript avec un exemple concret ?",
            "Quelle difference entre callback, Promise et async await dans JavaScript ?",
            "Comment fonctionne l event loop et quel impact a-t-elle sur les operations asynchrones ?",
            "Quand utiliser le prototype plutot qu une classe ES6 en JavaScript ?",
            "Comment eviter les problemes lies a this dans les fonctions et callbacks JavaScript ?",
        ],
        "java": [
            "Quand preferer une interface a une classe abstraite en Java ?",
            "Comment gerer les exceptions checked et unchecked dans un service Java ?",
            "Comment identifier un probleme de performance memoire en Java ?",
            "Quel usage pertinent de Optional dans une API Java ?",
            "Quelles pratiques SOLID appliquer dans un backend Java ?",
        ],
        "sql": [
            "Quand choisir INNER JOIN ou LEFT JOIN dans une requete SQL ?",
            "Comment indexer une table pour accelerer une recherche multi-criteres ?",
            "Comment detecter qu une requete SQL fait un scan complet de table ?",
            "Comment ecrire une requete pour retrouver les candidats avec au moins 3 entretiens ?",
            "Comment proteger une API contre les injections SQL ?",
        ],
        "spring": [
            "Quand utiliser @Transactional dans Spring Boot ?",
            "Comment separer controller, service et repository proprement ?",
            "Comment gerer les erreurs metier avec un handler global Spring ?",
            "Quelle strategie de cache adopter sans incoherence de donnees ?",
            "Comment securiser des endpoints par role dans Spring Security ?",
        ],
        "python": [
            "Quand utiliser une list comprehension plutot qu une boucle classique en Python ?",
            "Comment organiser un projet Python pour rester maintenable ?",
            "Comment gerer les dependances Python de facon fiable ?",
            "Quelles erreurs courantes eviter avec les mutables par defaut ?",
            "Comment tester proprement une fonction Python avec pytest ?",
        ],
        "generic": [
            f"Quelles bonnes pratiques appliquer pour progresser rapidement en {theme} ?",
            f"Quelles erreurs frequentes faut-il eviter sur {theme} ?",
            f"Comment evaluer objectivement un bon resultat sur {theme} ?",
            f"Quelle methode simple pour structurer un apprentissage sur {theme} ?",
            f"Comment adapter {theme} pour un niveau debutant ?",
        ],
    }

    vf_banks = {
        "angular": [
            ("En Angular, trackBy peut reduire les rerenders inutiles.", True),
            ("En Angular, toutes les subscriptions se ferment automatiquement sans exception.", False),
            ("Un resolver Angular charge les donnees avant l affichage de la route.", True),
            ("OnPush force un rerender complet a chaque event global.", False),
        ],
        "java": [
            ("Une classe abstraite ne peut pas etre instanciee directement en Java.", True),
            ("Une RuntimeException doit toujours etre declaree dans throws.", False),
            ("Une interface Java peut contenir des methodes par defaut.", True),
            ("Le garbage collector elimine totalement le risque de fuite memoire.", False),
        ],
        "sql": [
            ("LEFT JOIN peut retourner des lignes sans correspondance a droite.", True),
            ("Un index accelere absolument toutes les requetes SQL.", False),
            ("Une requete non indexee peut provoquer un scan complet.", True),
            ("Les requetes preparees sont inutiles contre les injections SQL.", False),
        ],
        "spring": [
            ("@Transactional peut garantir l atomicite d un traitement metier.", True),
            ("Un controller Spring doit contenir toute la logique metier.", False),
            ("Spring Security permet la protection par roles.", True),
            ("Le cache ne doit jamais etre invalide.", False),
        ],
        "python": [
            ("En Python, les listes sont mutables.", True),
            ("Les tuples Python sont mutables.", False),
            ("pytest permet d automatiser des tests unitaires.", True),
            ("pip freeze est inutile pour reproduire un environnement.", False),
        ],
        "generic": [
            (f"Suivre une methode progressive aide a mieux reussir en {theme}.", True),
            (f"Ignorer les bases est la meilleure facon d apprendre {theme}.", False),
            (f"La pratique reguliere renforce la maitrise de {theme}.", True),
            (f"Copier sans comprendre suffit pour maitriser {theme}.", False),
        ],
    }

    pool = list(question_banks.get(key, question_banks["generic"]))
    random.shuffle(pool)
    while len(pool) < nombre:
        pool.extend(question_banks.get(key, question_banks["generic"]))

    vf_pool = list(vf_banks.get(key, vf_banks["generic"]))
    random.shuffle(vf_pool)
    while len(vf_pool) < nombre:
        vf_pool.extend(vf_banks.get(key, vf_banks["generic"]))

    results: list[QuestionOut] = []
    for i in range(nombre):
        points = random.randint(1, 3)

        if wanted_type in {"VF", "VRAI_FAUX"}:
            statement, is_true = vf_pool[i]
            choices = [
                {"texte": "Vrai", "correcte": bool(is_true), "ordre": 1},
                {"texte": "Faux", "correcte": not bool(is_true), "ordre": 2},
            ]
            results.append(
                QuestionOut(
                    contenu=f"[{theme}] {statement}",
                    type="VRAI_FAUX",
                    points=points,
                    theme=theme,
                    choix=choices,
                )
            )
            continue

        contenu = pool[i]
        correct = "Identifier la cause racine, proposer une solution et valider avec tests."
        wrong = [
            "Appliquer un correctif sans verifier les effets de bord.",
            "Ignorer les cas limites pour gagner du temps.",
            "Reporter le probleme sans plan d action.",
        ]
        all_choices = [correct] + wrong
        random.shuffle(all_choices)
        choices = [
            {"texte": c, "correcte": c == correct, "ordre": idx + 1}
            for idx, c in enumerate(all_choices)
        ]

        if wanted_type == "QCU":
            found = False
            for c in choices:
                if c["correcte"] and not found:
                    found = True
                else:
                    c["correcte"] = False

        results.append(
            QuestionOut(
                contenu=f"[{theme}] {contenu}",
                type=wanted_type if wanted_type in {"QCM", "QCU"} else "QCM",
                points=points,
                theme=theme,
                choix=choices,
            )
        )

    return results


def _generate_job_questions(req: GenerateRequest) -> list[QuestionOut]:
    """
    Génère des questions avec logique retry pour assurer la spécificité au thème.
    Lève HTTPException 400 si le service IA ne peut pas générer des questions spécifiques.
    """
    # Première tentative: génération normale
    external_questions = _call_external_provider(req, retry=False)
    
    if external_questions:
        # Vérification: pertinent au thème?
        if _is_relevant_to_theme(req, external_questions):
            # Vérification: pas trop générique?
            if not _is_generic_response(req, external_questions):
                return external_questions
            
            # Les questions sont trop génériques, essayer avec prompt STRICT
            retry_questions = _call_external_provider(req, retry=True)
            if retry_questions and not _is_generic_response(req, retry_questions):
                return retry_questions
            
            # Après retry, toujours générique: erreur utilisateur
            raise HTTPException(
                status_code=400,
                detail="Erreur IA (?): Le service IA a renvoye une reponse trop generique apres nouvelle tentative. Veuillez preciser le theme (ex: index SQL, transactions, JOIN)."
            )
    
    raise HTTPException(
        status_code=503,
        detail="Service IA indisponible. Aucun fallback manuel n est autorise; veuillez reessayer plus tard ou preciser le theme."
    )



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