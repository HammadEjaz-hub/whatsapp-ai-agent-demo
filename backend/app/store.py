"""FAQ storage backed by a local JSON file (demo only, no database)."""

import json
from pathlib import Path

from .models import Faq, FaqCreate


class FaqStore:
    def __init__(self, path: Path):
        self.path = path
        self._faqs: list[Faq] = self._load()

    def _load(self) -> list[Faq]:
        if not self.path.exists():
            return []
        data = json.loads(self.path.read_text(encoding="utf-8"))
        return [Faq(**item) for item in data]

    def _save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(
            json.dumps([f.model_dump() for f in self._faqs], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def list(self) -> list[Faq]:
        return list(self._faqs)

    def create(self, payload: FaqCreate) -> Faq:
        new_id = max((f.id for f in self._faqs), default=0) + 1
        faq = Faq(id=new_id, question=payload.question, answer=payload.answer)
        self._faqs.append(faq)
        self._save()
        return faq

    def update(self, faq_id: int, question: str | None, answer: str | None) -> Faq | None:
        for f in self._faqs:
            if f.id == faq_id:
                if question is not None:
                    f.question = question
                if answer is not None:
                    f.answer = answer
                self._save()
                return f
        return None

    def delete(self, faq_id: int) -> bool:
        for i, f in enumerate(self._faqs):
            if f.id == faq_id:
                del self._faqs[i]
                self._save()
                return True
        return False
