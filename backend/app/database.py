from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

_client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    global _client
    if _client is not None:
        return
    settings = get_settings()
    _client = AsyncIOMotorClient(settings.mongodb_uri)


async def close_mongo_connection() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_database() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("MongoDB client is not initialized")
    settings = get_settings()
    return _client[settings.mongodb_db]


def set_client(client: AsyncIOMotorClient) -> None:
    """Allow tests to inject a mock MongoDB client."""
    global _client
    _client = client
