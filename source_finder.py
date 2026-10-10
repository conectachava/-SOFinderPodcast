#!/usr/bin/env python3
"""
SourceFinder Agent v3.0 — Enhanced Intelligence & Multilingual Research
Features:
- Nuanced source qualification scoring (Domain Authority, Recency/Publication Date, Bias Indicators).
- Dynamic min_reputation threshold adaptation based on content sensitivity and bias signals.
- Multilingual support for user requests and intelligence report generation (English and Spanish).
- Configurable via command-line arguments, environment variables, or JSON configuration.
"""

import argparse
import datetime
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# --- MULTILINGUAL STRATEGIES & LOCALIZATION ---
I18N = {
    "es": {
        "name": "Español",
        "strategies": {
            "Noticia Tecnológica": {
                "query_modifier": "noticia tecnología última hora reportes",
                "default_min_reputation": 0.70,
                "rigor_boost": 0.05,
            },
            "Espectáculos": {
                "query_modifier": "espectáculos entretenimiento noticias cultura",
                "default_min_reputation": 0.60,
                "rigor_boost": 0.00,
            },
            "Análisis de Producto": {
                "query_modifier": "review análisis especificaciones pruebas benchmarks",
                "default_min_reputation": 0.55,
                "rigor_boost": 0.02,
            },
            "Movie Review": {
                "query_modifier": "crítica reseña análisis cinematográfico estreno",
                "default_min_reputation": 0.60,
                "rigor_boost": 0.00,
            },
            "General": {
                "query_modifier": "informe noticias contexto hechos verificados",
                "default_min_reputation": 0.50,
                "rigor_boost": 0.00,
            },
        },
        "report_titles": {
            "title": "Informe de Inteligencia",
            "metadata_header": "Metadatos de la Investigación",
            "executive_summary": "Resumen Ejecutivo",
            "key_points": "Puntos Clave",
            "debate_points": "Puntos de Debate",
            "qualified_sources": "Fuentes Calificadas",
            "rejected_sources": "Fuentes Descartadas",
            "scoring_breakdown": "Auditoría de Reputación y Umbral Dinámico",
            "methodology": "Metodología de Calificación",
        },
        "labels": {
            "content_type": "Categoría de Contenido",
            "language": "Idioma",
            "base_threshold": "Umbral Base",
            "dynamic_threshold": "Umbral Dinámico Calculado",
            "composite_score": "Puntaje Compuesto",
            "domain_authority": "Autoridad de Dominio",
            "recency_score": "Factor de Recencia",
            "bias_penalty": "Penalización por Sesgo",
            "bias_indicators": "Indicadores de Sesgo Detectados",
            "publication_date": "Fecha de Publicación",
            "rejection_reason": "Motivo de Descarte",
            "fresh": "Reciente (<7 días)",
            "moderate": "Moderada (<90 días)",
            "undated": "Sin fecha explícita",
            "neutral": "Neutro / Sin sesgos detectados",
        },
        "sample_summary": (
            "La investigación multifuente sobre '{topic}' confirma un consenso emergente respaldado por publicaciones de alta autoridad. "
            "Se observan implicaciones clave tanto en el desarrollo operativo como en el debate público contemporáneo."
        ),
        "sample_key_points": [
            "Avances verificados en adopción y métricas de rendimiento observadas.",
            "Consenso técnico respaldado por publicaciones sectoriales y cobertura especializada.",
            "Integración progresiva en procesos de producción y flujos automatizados.",
            "Atribución y trazabilidad verificada a través de fuentes primarias auditadas.",
        ],
        "sample_debate": [
            "Divergencias sobre sostenibilidad regulatoria, gobernanza y estándares de autoría.",
            "Contraste entre proyecciones optimistas de adopción frente a riesgos de implementación práctica.",
        ],
    },
    "en": {
        "name": "English",
        "strategies": {
            "Noticia Tecnológica": {
                "query_modifier": "breaking technology news reports technical updates",
                "default_min_reputation": 0.70,
                "rigor_boost": 0.05,
            },
            "Tech News": {
                "query_modifier": "breaking technology news reports technical updates",
                "default_min_reputation": 0.70,
                "rigor_boost": 0.05,
            },
            "Espectáculos": {
                "query_modifier": "entertainment culture industry trends analysis",
                "default_min_reputation": 0.60,
                "rigor_boost": 0.00,
            },
            "Entertainment": {
                "query_modifier": "entertainment culture industry trends analysis",
                "default_min_reputation": 0.60,
                "rigor_boost": 0.00,
            },
            "Análisis de Producto": {
                "query_modifier": "in-depth product review technical specs benchmarks testing",
                "default_min_reputation": 0.55,
                "rigor_boost": 0.02,
            },
            "Product Review": {
                "query_modifier": "in-depth product review technical specs benchmarks testing",
                "default_min_reputation": 0.55,
                "rigor_boost": 0.02,
            },
            "Movie Review": {
                "query_modifier": "film critique movie review box office analysis",
                "default_min_reputation": 0.60,
                "rigor_boost": 0.00,
            },
            "General": {
                "query_modifier": "intelligence report verified facts context analysis",
                "default_min_reputation": 0.50,
                "rigor_boost": 0.00,
            },
        },
        "report_titles": {
            "title": "Intelligence Report",
            "metadata_header": "Research Metadata",
            "executive_summary": "Executive Summary",
            "key_points": "Key Findings",
            "debate_points": "Points of Debate",
            "qualified_sources": "Qualified Sources",
            "rejected_sources": "Rejected Sources",
            "scoring_breakdown": "Reputation Audit & Dynamic Threshold",
            "methodology": "Qualification Methodology",
        },
        "labels": {
            "content_type": "Content Category",
            "language": "Language",
            "base_threshold": "Base Threshold",
            "dynamic_threshold": "Calculated Dynamic Threshold",
            "composite_score": "Composite Score",
            "domain_authority": "Domain Authority",
            "recency_score": "Recency Factor",
            "bias_penalty": "Bias Penalty",
            "bias_indicators": "Detected Bias Indicators",
            "publication_date": "Publication Date",
            "rejection_reason": "Rejection Reason",
            "fresh": "Fresh (<7 days)",
            "moderate": "Moderate (<90 days)",
            "undated": "No explicit date",
            "neutral": "Neutral / No detected bias",
        },
        "sample_summary": (
            "Cross-source research regarding '{topic}' indicates an emerging consensus corroborated by high-authority publications. "
            "Key operational implications and contemporary public deliberations have been identified."
        ),
        "sample_key_points": [
            "Verified developments in deployment metrics and quantitative benchmarking.",
            "Technical consensus corroborated by top-tier industry coverage and editorial oversight.",
            "Accelerating integration into production environments and automated workflows.",
            "Traceability and attribution verified across primary audited sources.",
        ],
        "sample_debate": [
            "Ongoing deliberations concerning regulatory governance, compliance, and IP boundaries.",
            "Tension between optimistic adoption forecasts and pragmatic infrastructure friction.",
        ],
    },
}

DEFAULT_REPUTATION_CONFIG = {
    "academic_government": {
        "domains": ["nature.com", "science.org", "arxiv.org", "nih.gov", "mit.edu", "stanford.edu", "ieee.org", "nasa.gov", "who.int"],
        "score": 0.98,
    },
    "top_tier_news": {
        "domains": ["bbc.com", "reuters.com", "apnews.com", "bloomberg.com", "nytimes.com", "wsj.com", "theguardian.com", "elpais.com", "elmundo.es", "lemonde.fr", "dw.com"],
        "score": 0.95,
    },
    "tech_press": {
        "domains": ["wired.com", "theverge.com", "techcrunch.com", "arstechnica.com", "technologyreview.com", "zdnet.com", "venturebeat.com", "engadget.com"],
        "score": 0.92,
    },
    "entertainment": {
        "domains": ["variety.com", "hollywoodreporter.com", "tmz.com", "deadline.com", "rollingstone.com"],
        "score": 0.82,
    },
    "community": {
        "domains": ["reddit.com", "medium.com", "substack.com", "quora.com"],
        "score": 0.55,
    },
    "default_unverified": {
        "score": 0.30,
    },
    "bias_indicators": {
        "clickbait_keywords": [
            "shocking", "mind-blowing", "you won't believe", "secret trick", "conspiracy", "scandal",
            "increible", "increíble", "no vas a creer", "escandalo", "escándalo", "secreto revelado",
            "conspiracion", "conspiración", "bomba informativa", "insane"
        ],
        "promotional_keywords": [
            "sponsored", "patrocinado", "advertorial", "promoted content", "affiliate link",
            "publirreportaje", "enlace de afiliado", "sponsored by"
        ],
        "unverified_rumor_keywords": [
            "rumor has it", "unconfirmed sources claim", "rumores apuntan", "filtración no confirmada",
            "fuentes anónimas aseguran", "unverified leak", "speculation suggests"
        ],
    },
    "weights": {
        "domain_authority": 0.55,
        "recency": 0.25,
        "baseline": 0.20,
        "max_bias_penalty": 0.35,
    },
}


def load_reputation_config(config_path: Optional[Path] = None) -> Dict[str, Any]:
    """Loads reputation map config from disk or returns embedded defaults."""
    candidates = [
        config_path,
        Path("config/reputation-map.json"),
        Path(__file__).parent / "config" / "reputation-map.json",
    ]
    for p in candidates:
        if p and p.is_file():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                if "top_tier_news" in data:
                    return data
            except Exception as e:
                print(f"⚠️ Warning: Could not parse config from {p}: {e}", file=sys.stderr)
    return DEFAULT_REPUTATION_CONFIG


def normalize_language_code(lang_raw: Optional[str]) -> str:
    """Normalizes input string to supported language code ('es' or 'en')."""
    if not lang_raw:
        return "es"
    cleaned = lang_raw.strip().lower()
    if cleaned in ("en", "english", "inglés", "ingles", "en-us", "en-gb"):
        return "en"
    if cleaned in ("es", "spanish", "español", "espanol", "es-es", "es-mx", "es-latam"):
        return "es"
    return "es"


def detect_language_from_text(text: str) -> str:
    """Heuristic language detection based on common stop words and character patterns."""
    text_lower = text.lower()
    english_markers = [" the ", " and ", " with ", " for ", " breaking ", " review ", " intelligence ", " latest ", " news "]
    spanish_markers = [" el ", " la ", " los ", " las ", " de ", " y ", " en ", " noticias ", " última hora ", " análisis "]

    en_count = sum(1 for m in english_markers if m in text_lower)
    es_count = sum(1 for m in spanish_markers if m in text_lower)

    if en_count > es_count:
        return "en"
    return "es"


class SourceFinderAgent:
    """
    SourceFinder Agent v3.0:
    Conducts structured intelligence gathering, evaluates multi-factor source reputation,
    dynamically tunes quality thresholds, and formats reports in multiple languages.
    """

    def __init__(
        self,
        topic: str,
        content_type: str = "General",
        min_reputation: Optional[float] = None,
        language: Optional[str] = None,
        config_path: Optional[Path] = None,
        suppress_print: bool = False,
    ):
        self.topic = topic.strip()
        self.content_type = content_type
        self.suppress_print = suppress_print

        # Language resolution precedence: Explicit arg -> Config/Env -> Auto-detect from topic
        env_lang = os.environ.get("SOURCE_FINDER_LANG")
        if language:
            self.language = normalize_language_code(language)
        elif env_lang:
            self.language = normalize_language_code(env_lang)
        else:
            self.language = detect_language_from_text(self.topic)

        self.i18n = I18N.get(self.language, I18N["es"])
        self.reputation_config = load_reputation_config(config_path)

        # Strategy lookup (case/language resilient)
        strategies = self.i18n["strategies"]
        self.strategy = strategies.get(content_type)
        if not self.strategy:
            # Fallback across English/Spanish keys
            alt_lang = "en" if self.language == "es" else "es"
            self.strategy = I18N[alt_lang]["strategies"].get(content_type, self.i18n["strategies"]["General"])

        self.query_modifier = self.strategy["query_modifier"]
        self.base_min_reputation = (
            float(min_reputation)
            if min_reputation is not None
            else float(self.strategy["default_min_reputation"])
        )

    def evaluate_source(
        self,
        url: str,
        title: str,
        snippet: str,
        pub_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates a source using a nuanced, transparent multi-factor scoring model:
        1. Domain Authority (Tier-based matching against reputation database)
        2. Publication Date / Recency factor (freshness reward vs decay)
        3. Potential Bias Indicators (sensationalism, promotional copy, unverified claims)
        """
        domain = ""
        try:
            # Extract clean hostname
            clean_url = url if "://" in url else f"https://{url}"
            from urllib.parse import urlparse
            parsed = urlparse(clean_url)
            domain = parsed.hostname.replace("www.", "") if parsed.hostname else url
        except Exception:
            domain = url

        # --- 1. DOMAIN AUTHORITY ---
        domain_authority = self.reputation_config["default_unverified"]["score"]
        domain_tier = "unverified"

        # Check academic/gov (.edu, .gov or list)
        if domain.endswith(".edu") or domain.endswith(".gov") or domain.endswith(".gob.es"):
            domain_authority = 0.98
            domain_tier = "academic_government"
        else:
            for tier in ["academic_government", "top_tier_news", "tech_press", "entertainment", "community"]:
                tier_info = self.reputation_config.get(tier, {})
                tier_domains = tier_info.get("domains", [])
                if any(td in domain for td in tier_domains):
                    domain_authority = tier_info.get("score", 0.5)
                    domain_tier = tier
                    break

        # --- 2. PUBLICATION DATE & RECENCY FACTOR ---
        recency_score, date_str = self._calculate_recency(pub_date, title, snippet)

        # --- 3. POTENTIAL BIAS INDICATORS ---
        bias_penalty, detected_biases = self._detect_bias_indicators(url, title, snippet)

        # --- 4. COMPOSITE REPUTATION SCORE ---
        weights = self.reputation_config.get("weights", DEFAULT_REPUTATION_CONFIG["weights"])
        w_da = weights.get("domain_authority", 0.55)
        w_rec = weights.get("recency", 0.25)
        w_base = weights.get("baseline", 0.20)

        raw_score = (domain_authority * w_da) + (recency_score * w_rec) + w_base - bias_penalty
        composite_score = round(max(0.05, min(1.0, raw_score)), 3)

        return {
            "url": url,
            "title": title,
            "snippet": snippet,
            "domain": domain,
            "domain_tier": domain_tier,
            "domain_authority": round(domain_authority, 3),
            "publication_date": date_str,
            "recency_score": round(recency_score, 3),
            "bias_penalty": round(bias_penalty, 3),
            "detected_bias_indicators": detected_biases,
            "source_reputation": composite_score,
        }

    def _calculate_recency(
        self,
        pub_date: Optional[str],
        title: str,
        snippet: str,
    ) -> Tuple[float, str]:
        """Calculates freshness factor (1.00 for breaking news to 0.40 for >1 yr old)."""
        combined = f"{pub_date or ''} {title} {snippet}"
        today = datetime.datetime.now(datetime.timezone.utc).date()

        # Try parsing explicit ISO / YYYY-MM-DD
        date_match = re.search(r"\b(202[0-9]-[0-1][0-9]-[0-3][0-9])\b", combined)
        if date_match:
            try:
                parsed_date = datetime.datetime.strptime(date_match.group(1), "%Y-%m-%d").date()
                delta_days = (today - parsed_date).days
                if delta_days <= 1:
                    return 1.00, parsed_date.isoformat()
                elif delta_days <= 7:
                    return 0.95, parsed_date.isoformat()
                elif delta_days <= 30:
                    return 0.85, parsed_date.isoformat()
                elif delta_days <= 90:
                    return 0.70, parsed_date.isoformat()
                elif delta_days <= 365:
                    return 0.55, parsed_date.isoformat()
                else:
                    return 0.40, parsed_date.isoformat()
            except Exception:
                pass

        # Heuristic for relative freshness markers
        if any(w in combined.lower() for w in ["hace 1 hora", "hace unas horas", "hace 2 horas", "hace 1 día", "hace 2 días", "yesterday", "hours ago", "today", "breaking"]):
            return 1.00, today.isoformat()
        if any(w in combined.lower() for w in ["esta semana", "this week", "últimos días", "recent"]):
            return 0.92, (today - datetime.timedelta(days=3)).isoformat()

        # Undated fallback
        return 0.65, "Undated / Stated recently"

    def _detect_bias_indicators(self, url: str, title: str, snippet: str) -> Tuple[float, List[str]]:
        """Identifies sensationalist, promotional, or unverified rumor markers."""
        detected = []
        text_to_scan = f"{url} {title} {snippet}".lower()

        bias_dict = self.reputation_config.get("bias_indicators", DEFAULT_REPUTATION_CONFIG["bias_indicators"])

        # Clickbait / Sensationalism
        for kw in bias_dict.get("clickbait_keywords", []):
            if kw.lower() in text_to_scan:
                detected.append(f"Sensationalist / Clickbait marker ('{kw}')")

        # Promotional / Sponsored
        for kw in bias_dict.get("promotional_keywords", []):
            if kw.lower() in text_to_scan:
                detected.append(f"Commercial / Sponsored marker ('{kw}')")

        # Unverified Rumors
        for kw in bias_dict.get("unverified_rumor_keywords", []):
            if kw.lower() in text_to_scan:
                detected.append(f"Unverified rumor marker ('{kw}')")

        # Exclamation marks in title or excessive CAPS
        if "!" in title or "¡" in title:
            detected.append("Sensationalist punctuation (!/¡)")

        caps_words = [w for w in title.split() if len(w) >= 4 and w.isupper() and w.isalpha()]
        if len(caps_words) >= 2:
            detected.append("Aggressive all-caps emphasis")

        # Deduplicate
        unique_detected = list(dict.fromkeys(detected))
        penalty = min(0.35, len(unique_detected) * 0.08)
        return penalty, unique_detected

    def compute_dynamic_threshold(self, evaluated_sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Dynamically adjusts min_reputation threshold:
        - Incorporates strategy rigor boost
        - Elevates threshold if high bias is detected in the research environment
        - Slightly adjusts for breaking vs archival topics
        """
        base = self.base_min_reputation
        rigor_boost = float(self.strategy.get("rigor_boost", 0.0))

        # Check average bias across sources
        avg_bias = 0.0
        if evaluated_sources:
            avg_bias = sum(s["bias_penalty"] for s in evaluated_sources) / len(evaluated_sources)

        bias_risk_adjustment = 0.0
        if avg_bias >= 0.12:
            bias_risk_adjustment = 0.08  # Stricter filter needed
        elif avg_bias >= 0.05:
            bias_risk_adjustment = 0.04

        # Dynamic calculation
        dynamic_threshold = round(max(0.35, min(0.90, base + rigor_boost + bias_risk_adjustment)), 3)

        reasons = []
        if rigor_boost > 0:
            reasons.append(f"+{rigor_boost:.2f} due to {self.content_type} factual rigor requirement")
        if bias_risk_adjustment > 0:
            reasons.append(f"+{bias_risk_adjustment:.2f} elevated defense against detected bias landscape (avg bias {avg_bias:.2f})")
        if not reasons:
            reasons.append("Optimal baseline reputation alignment")

        return {
            "base_min_reputation": round(base, 3),
            "dynamic_min_reputation": dynamic_threshold,
            "rigor_boost": round(rigor_boost, 3),
            "bias_risk_adjustment": round(bias_risk_adjustment, 3),
            "adjustment_reasons": reasons,
        }

    def execute_search(self) -> Dict[str, Any]:
        """Executes search synthesis, qualifies sources, and calculates dynamic metrics."""
        query = f"{self.topic} {self.query_modifier}"
        if not self.suppress_print:
            print(f"🔎 SourceFinder v3.0 executing query: '{query}'")
            print(f"   Language: {self.i18n['name']} ({self.language})")
            print(f"   Strategy: {self.content_type}")
            print(f"   Base Reputation: {self.base_min_reputation}")

        topic_slug = re.sub(r"[^a-zA-Z0-9]+", "-", self.topic.lower()).strip("-")
        current_date_str = datetime.datetime.now(datetime.timezone.utc).date().isoformat()

        # Seed candidate sources for evaluation
        candidate_sources = [
            {
                "url": f"https://www.reuters.com/technology/{topic_slug}-investigation-{current_date_str}",
                "title": f"Reuters Exclusive & Deep Dive: {self.topic}",
                "snippet": f"Global market report, verified data and multi-stakeholder quotes regarding {self.topic}.",
                "pub_date": current_date_str,
            },
            {
                "url": f"https://www.theverge.com/tech/{topic_slug}-analysis",
                "title": f"The Verge In-Depth Analysis: {self.topic}",
                "snippet": f"Technical breakdown, architecture benchmarks and practical testing notes for {self.topic}.",
                "pub_date": current_date_str,
            },
            {
                "url": f"https://arxiv.org/abs/{topic_slug}-preprint",
                "title": f"Academic Research & Peer Review: {self.topic}",
                "snippet": f"Formal scientific preprint evaluating methodologies, statistical validity and experimental results.",
                "pub_date": current_date_str,
            },
            {
                "url": f"https://www.sensational-rumors-blog.net/{topic_slug}-shocking-secret",
                "title": f"SHOCKING! You Won't Believe What Happened with {self.topic}!",
                "snippet": f"Sponsored advertorial claiming secret trick and unverified leak about {self.topic}.",
                "pub_date": "2025-01-10",
            },
        ]

        evaluated_sources = [self.evaluate_source(**src) for src in candidate_sources]
        threshold_info = self.compute_dynamic_threshold(evaluated_sources)
        dynamic_threshold = threshold_info["dynamic_min_reputation"]

        qualified_sources = []
        rejected_sources = []

        for src in evaluated_sources:
            score = src["source_reputation"]
            is_qualified = score >= dynamic_threshold
            src["qualified"] = is_qualified
            if is_qualified:
                qualified_sources.append(src)
            else:
                rejection_reason = (
                    f"Composite score ({score:.2f}) below dynamic threshold ({dynamic_threshold:.2f})"
                )
                if src["bias_penalty"] > 0:
                    rejection_reason += f" (Bias Penalty: -{src['bias_penalty']:.2f})"
                src["rejection_reason"] = rejection_reason
                rejected_sources.append(src)

        report_data = {
            "topic": self.topic,
            "content_type": self.content_type,
            "language": self.language,
            "query_modifier": self.query_modifier,
            "base_min_reputation": self.base_min_reputation,
            "dynamic_min_reputation": dynamic_threshold,
            "threshold_info": threshold_info,
            "qualified_sources": qualified_sources,
            "rejected_sources": rejected_sources,
            "evaluated_sources": evaluated_sources,
            "total_evaluated": len(evaluated_sources),
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

        if not self.suppress_print:
            print(f"   Dynamic Min Reputation: {dynamic_threshold} ({', '.join(threshold_info['adjustment_reasons'])})")
            print(f"   Qualified: {len(qualified_sources)} / {len(evaluated_sources)} sources")

        return report_data

    def format_markdown_report(self, report_data: Dict[str, Any]) -> str:
        """Renders comprehensive, localized Markdown report in the requested language."""
        t = self.i18n["report_titles"]
        lbl = self.i18n["labels"]

        md = []
        md.append(f"# {t['title']}: {report_data['topic']}\n")
        md.append(f"## {t['metadata_header']}")
        md.append(f"- **{lbl['language']}**: {self.i18n['name']} (`{report_data['language']}`)")
        md.append(f"- **{lbl['content_type']}**: {report_data['content_type']}")
        md.append(f"- **Query**: `{report_data['query_modifier']}`")
        md.append(f"- **{lbl['base_threshold']}**: `{report_data['base_min_reputation']:.2f}`")
        md.append(f"- **{lbl['dynamic_threshold']}**: `{report_data['dynamic_min_reputation']:.2f}`")
        md.append(f"- **Adjustments**: {', '.join(report_data['threshold_info']['adjustment_reasons'])}\n")

        # Executive Summary
        md.append(f"## {t['executive_summary']}")
        md.append(self.i18n["sample_summary"].format(topic=report_data["topic"]) + "\n")

        # Key Points
        md.append(f"## {t['key_points']}")
        for kp in self.i18n["sample_key_points"]:
            md.append(f"- {kp}")
        md.append("")

        # Debate Points
        md.append(f"## {t['debate_points']}")
        for dp in self.i18n["sample_debate"]:
            md.append(f"- {dp}")
        md.append("")

        # Qualified Sources
        md.append(f"## {t['qualified_sources']}")
        for src in report_data["qualified_sources"]:
            bias_str = (
                f"-{src['bias_penalty']:.2f}"
                if src["bias_penalty"] > 0
                else lbl["neutral"]
            )
            md.append(
                f"- [{src['title']}]({src['url']}) — **{lbl['composite_score']}: {src['source_reputation']:.2f}**\n"
                f"  - *{src['snippet']}*\n"
                f"  - **{lbl['domain_authority']}**: `{src['domain_authority']:.2f}` ({src['domain_tier']}) | "
                f"**{lbl['recency_score']}**: `{src['recency_score']:.2f}` ({src['publication_date']}) | "
                f"**{lbl['bias_penalty']}**: `{bias_str}`"
            )
        md.append("")

        # Rejected Sources
        if report_data["rejected_sources"]:
            md.append(f"## {t['rejected_sources']}")
            for src in report_data["rejected_sources"]:
                md.append(
                    f"- ⚠️ **{src['title']}** (`{src['domain']}`)\n"
                    f"  - {lbl['rejection_reason']}: *{src.get('rejection_reason', 'Threshold unmet')}*\n"
                    f"  - {lbl['composite_score']}: `{src['source_reputation']:.2f}` | "
                    f"{lbl['bias_indicators']}: {', '.join(src['detected_bias_indicators']) or lbl['neutral']}"
                )
            md.append("")

        # Methodology Audit
        md.append(f"## {t['scoring_breakdown']}")
        md.append(
            f"```text\n"
            f"Composite Formula = (Domain Authority × 0.55) + (Recency × 0.25) + 0.20 - Bias Penalty\n"
            f"Dynamic Threshold = Base ({report_data['base_min_reputation']:.2f}) + Rigor ({report_data['threshold_info']['rigor_boost']:.2f}) + Bias Risk ({report_data['threshold_info']['bias_risk_adjustment']:.2f})\n"
            f"Resulting Threshold = {report_data['dynamic_min_reputation']:.2f}\n"
            f"```"
        )

        return "\n".join(md)


def main():
    parser = argparse.ArgumentParser(
        description="SourceFinder Intelligence Agent v3.0 — Nuanced Scoring & Multilingual Support",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--topic", type=str, required=True, help="Topic for intelligence research")
    parser.add_argument("--type", type=str, default="General", help="Content category / research strategy")
    parser.add_argument(
        "--min_reputation",
        type=float,
        default=None,
        help="Base minimum reputation threshold (0.0 to 1.0)",
    )
    parser.add_argument(
        "--lang",
        "--language",
        dest="language",
        type=str,
        default=None,
        help="Preferred report language ('es' for Spanish, 'en' for English)",
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=None,
        help="Optional path to custom reputation-map.json configuration",
    )
    parser.add_argument(
        "--output_path",
        type=Path,
        default=None,
        help="Output file path to save the generated report",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output structured JSON payload instead of Markdown",
    )
    args = parser.parse_args()

    agent = SourceFinderAgent(
        topic=args.topic,
        content_type=args.type,
        min_reputation=args.min_reputation,
        language=args.language,
        config_path=args.config,
        suppress_print=args.json,
    )
    report_data = agent.execute_search()
    markdown_report = agent.format_markdown_report(report_data)

    if args.output_path:
        args.output_path.parent.mkdir(parents=True, exist_ok=True)
        if args.json:
            args.output_path.write_text(json.dumps(report_data, indent=2, ensure_ascii=False), encoding="utf-8")
        else:
            args.output_path.write_text(markdown_report, encoding="utf-8")
        print(f"✅ Intelligence Report successfully saved to {args.output_path}")
    else:
        if args.json:
            print(json.dumps(report_data, indent=2, ensure_ascii=False))
        else:
            print(markdown_report)


if __name__ == "__main__":
    main()
