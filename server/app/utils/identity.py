"""Utility helpers for normalizing user documents across the API."""

from __future__ import annotations

from typing import Any, Dict

try:
    from bson import ObjectId  # type: ignore
except ImportError:  # pragma: no cover - bson available in runtime
    ObjectId = None  # type: ignore


def normalize_user_document(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Return a normalized copy of a MongoDB user document.

    The portal historically stored user identifiers under several keys
    (``_id``, ``id``, ``user_id``). This helper ensures every consumer sees
    consistent fields while preserving the original ``_id`` ObjectId for
    database operations. The function never mutates the input document.
    """

    if not user_doc:
        return user_doc

    normalized = dict(user_doc)

    mongo_id = normalized.get("_id")
    mongo_id_str = str(mongo_id) if mongo_id is not None else None

    explicit_id = normalized.get("user_id") or normalized.get("id")
    explicit_id = str(explicit_id) if explicit_id is not None else None

    public_id = explicit_id or mongo_id_str

    # Preserve original ObjectId for repository calls
    normalized["mongo_id"] = mongo_id
    normalized["_id"] = mongo_id

    if public_id:
        normalized["id"] = public_id
        normalized["user_id"] = public_id
    else:
        normalized.setdefault("id", None)
        normalized.setdefault("user_id", None)

    first_name = normalized.get("first_name", "").strip()
    last_name = normalized.get("last_name", "").strip()
    full_name = f"{first_name} {last_name}".strip()

    if not full_name:
        full_name = normalized.get("full_name") or normalized.get("email") or "User"

    normalized["full_name"] = full_name
    normalized.setdefault("role", "citizen")
    normalized["is_admin"] = bool(normalized.get("is_admin") or normalized.get("role") == "admin")

    return normalized
