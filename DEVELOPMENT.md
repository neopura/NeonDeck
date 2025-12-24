# Developer Guide - NeonDeck

## 🚀 Environment Setup (Docker)

The easiest way to develop on this project is using Docker and Docker Compose.

### Prerequisites
1.  **Docker** and **Docker Compose** installed.
2.  **Python 3.11+** (for local backend development).
3.  **Node.js 18+** (for local frontend development).

### How to Start
Run the following command in the root directory:

```bash
docker-compose up -d
```

This will spin up:
1.  **Backend**: FastAPI on port 8000.
2.  **Frontend**: React on port 3000.
3.  **Database**: PostgreSQL on port 5432.
4.  **Cache**: Redis on port 6379.

## 🛠️ Manual Development

### Backend
1.  Navigate to `/backend`.
2.  Install dependencies: `pip install -r requirements.txt`.
3.  Run the app: `uvicorn main:app --reload`.

### Frontend
1.  Navigate to `/frontend`.
2.  Install dependencies: `npm install`.
3.  Run the app: `npm run dev`.

## 🧪 Testing
We use standard testing tools:
- **Backend**: `pytest`
- **Frontend**: `vitest` or `jest`

## 📂 Project Structure
- `backend/`: FastAPI source code, database models, and scanner logic.
- `frontend/`: React source code, components, and styling.
- `database/`: SQL scripts for database initialization.
- `docker-compose.yml`: Local development stack.
