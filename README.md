# AI Task Planner

Task manager with manual CRUD plus a Groq-powered LangChain agent that can create, edit, delete, and search tasks in MongoDB using natural language.

**Stack:** FastAPI · LangChain / LangGraph · MongoDB · Groq · React (Vite) · Tailwind · Axios

## Features

- Create, edit, delete, and complete tasks from the UI
- Ask the AI to do the same operations in plain English
- Date-aware search, e.g. *“Show the tasks listed on 19 November”*

## Quick start

### 1. MongoDB

```bash
# Docker (if your user can access the Docker socket)
docker compose up -d

# Or Podman
systemctl --user start podman.socket
podman run -d --replace --name ai-task-mongo -p 27017:27017 docker.io/library/mongo:7
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set GROQ_API_KEY (https://console.groq.com/)
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/{id}` | Get task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| POST | `/api/chat` | AI natural-language command |

### Example chat body

```json
{ "message": "Show the tasks that are listed on 19 November" }
```

## Tests

```bash
cd backend
source .venv/bin/activate
pytest -q
```

## Environment

| Variable | Default | Notes |
|----------|---------|-------|
| `MONGODB_URI` | `mongodb://localhost:27017` | Mongo connection |
| `MONGODB_DB` | `ai_task_planner` | Database name |
| `GROQ_API_KEY` | — | Required for `/api/chat` |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Groq model id (must be available on your key) |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed origins |
