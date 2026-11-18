import pytest
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.database import set_client
from app.main import app


@pytest.fixture
async def client():
    mock = AsyncMongoMockClient()
    set_client(mock)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    set_client(None)
