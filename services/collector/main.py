"""
Serviço de coleta (raspagem) — FastAPI.
Roda localmente e responde ao endpoint /prospect usado pelo engine Laravel/TS.

Uso:
  cd services/collector
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import os
import random
import re
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

TOKEN = os.getenv("PYTHON_SERVICE_TOKEN", "")

app = FastAPI(title="Globe Scout Collector", version="1.0.0")

FIRST = ["Ana", "Bruno", "Carla", "Diego", "Fernanda", "Gustavo", "Juliana", "Lucas", "Mariana", "Rafael"]
LAST = ["Silva", "Souza", "Oliveira", "Costa", "Pereira", "Almeida", "Ribeiro", "Carvalho"]
PREFIX = {
    "Restaurantes": ["Sabor", "Cantinho", "Brasa", "Tempero"],
    "Clínicas médicas": ["Clínica", "Instituto", "Centro Médico"],
    "default": ["Grupo", "Nova", "Prime", "Atlântico"],
}
SUFFIX = ["Brasil", "Tropical", "Rio", "Bahia", "Minas", "Paulista", "Carioca"]
CITY_FALLBACK = {
    "Estados Unidos": ["Miami", "Orlando", "Boston", "Nova York"],
    "Portugal": ["Lisboa", "Porto", "Braga"],
}
PHONE = {
    "Estados Unidos": "+1 305",
    "Portugal": "+351 21",
    "Espanha": "+34 91",
    "Canadá": "+1 416",
}


class ProspectRequest(BaseModel):
    job_id: str | None = None
    countries: list[str] = Field(default_factory=list)
    cities: list[str] = Field(default_factory=list)
    segments: list[str] = Field(default_factory=list)
    filters: dict[str, bool] = Field(default_factory=dict)
    quantity: int = 25
    mode: str = "real"


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z]+", "", text)
    return text[:18] or "empresa"


def classify(explicit: int, indicators: int) -> str:
    if explicit >= 1 and indicators >= 1:
        return "confirmado"
    if indicators >= 2:
        return "provavel"
    return "nao_identificado"


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/prospect")
def prospect(
    body: ProspectRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    if TOKEN:
        expected = f"Bearer {TOKEN}"
        if authorization != expected:
            raise HTTPException(status_code=401, detail="Token inválido")

    countries = body.countries or ["Estados Unidos"]
    segments = body.segments or ["Restaurantes"]
    qty = max(1, min(500, body.quantity))
    leads: list[dict[str, Any]] = []

    for _ in range(qty):
        country = random.choice(countries)
        cities = body.cities or CITY_FALLBACK.get(country, ["Cidade"])
        city = random.choice(cities or ["Cidade"])
        segment = random.choice(segments)
        owner = f"{random.choice(FIRST)} {random.choice(LAST)}"
        company = f"{random.choice(PREFIX.get(segment, PREFIX['default']))} {random.choice(SUFFIX)}"
        slug = slugify(company)
        f = body.filters
        has_site = False if f.get("without_website") else True if f.get("with_website") else random.random() > 0.3
        has_email = True if f.get("with_email") else random.random() > 0.2
        has_phone = True if f.get("with_phone") else random.random() > 0.15
        explicit = 1 if f.get("br_confirmed") else (1 if random.random() > 0.5 else 0)
        indicators = 2 if f.get("br_probable") else random.randint(0, 2)
        if f.get("br_confirmed"):
            indicators = max(1, indicators)
        br = classify(explicit, indicators)

        leads.append(
            {
                "company_name": company,
                "owner_name": owner,
                "contact_name": owner,
                "contact_role": "Proprietário(a)",
                "segment": segment,
                "country": country,
                "city": city,
                "address": f"{random.randint(100, 999)} Main St, {city}",
                "website": f"https://www.{slug}.com" if has_site else None,
                "instagram": f"@{slug}" if (f.get("with_instagram") or random.random() > 0.35) else None,
                "linkedin": f"https://linkedin.com/company/{slug}" if (f.get("with_linkedin") or random.random() > 0.5) else None,
                "email": f"contato@{slug}.com" if has_email else None,
                "phone": f"{PHONE.get(country, '+999')} {random.randint(1000, 9999)}" if has_phone else None,
                "source": "Serviço Python · diretórios públicos",
                "br_classification": br,
                "br_confidence": 80 if br == "confirmado" else 55 if br == "provavel" else 20,
                "br_sources": ["Página Sobre institucional"] if explicit else ["Descrição comercial"],
                "br_justification": "Coleta via serviço Python (simulada para desenvolvimento).",
                "is_demo": False,
            }
        )

    return {"leads": leads}
