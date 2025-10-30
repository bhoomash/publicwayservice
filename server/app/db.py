from datetime import datetime
from pymongo import ASCENDING, DESCENDING, MongoClient

from .config import DB_NAME, MONGO_URI

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
otp_collection = db["otp_codes"]
complaints_collection = db["complaints"]
admin_notes_collection = db["admin_notes"]

def get_database():
    """Get database instance"""
    return db


def _build_duplicate_email(base_email: str, suffix: int) -> str:
    if "@" in base_email:
        local, domain = base_email.split("@", 1)
        return f"{local}+dup{suffix}@{domain}"
    return f"{base_email}__dup{suffix}"


def _deduplicate_user_emails() -> None:
    duplicate_cursor = users_collection.aggregate(
        [
            {"$group": {"_id": "$email", "ids": {"$push": "$_id"}, "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}, "_id": {"$ne": None}}},
        ]
    )

    for entry in duplicate_cursor:
        base_email = entry["_id"]
        if not base_email:
            continue
        ids = entry["ids"]
        user_docs = list(users_collection.find({"_id": {"$in": ids}}))
        user_docs.sort(key=lambda doc: doc.get("created_at") or datetime.min)

        keeper = user_docs[0]
        for index, doc in enumerate(user_docs[1:], start=1):
            new_email = _build_duplicate_email(base_email, index)

            # Ensure we pick an email that does not already exist
            while users_collection.find_one({"email": new_email}):
                index += 1
                new_email = _build_duplicate_email(base_email, index)

            users_collection.update_one(
                {"_id": doc["_id"]},
                {
                    "$set": {
                        "email": new_email,
                        "duplicate_email_of": str(keeper["_id"]),
                        "updated_at": datetime.utcnow(),
                    }
                },
            )


def ensure_indexes() -> None:
    try:
        _deduplicate_user_emails()

        users_collection.create_index("email", unique=True, name="email_unique")
        users_collection.create_index("role", name="role_idx")
        users_collection.create_index("created_at", name="user_created_idx")

        complaints_collection.create_index("id", name="complaint_id_idx")
        complaints_collection.create_index("user_id", name="complaint_user_idx")
        complaints_collection.create_index("status", name="complaint_status_idx")
        complaints_collection.create_index([("submitted_date", DESCENDING), ("created_at", DESCENDING)], name="complaint_date_idx")
        complaints_collection.create_index("category", name="complaint_category_idx")

        otp_collection.create_index("email", name="otp_email_idx")
        otp_collection.create_index("expires_at", expireAfterSeconds=0, name="otp_expiry_idx")
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"Database index creation warning: {exc}")


ensure_indexes()