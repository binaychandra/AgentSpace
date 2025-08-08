# Minimal FastAPI + React Example

## Backend (FastAPI)
- Located in `backend/main.py`
- Serves React build using `app.mount` and `FileResponse`
- Run with: `uvicorn main:app --reload` from the `backend` folder

## Frontend (React)
- Located in `frontend/`
- Minimal React app in `App.js`, entry in `index.js`, HTML in `index.html`
- Install dependencies and build:
  1. `cd frontend`
  2. `npm install`
  3. `npm run build`

## How it works
- Build React app: output goes to `frontend/build`
- FastAPI serves static files from `frontend/build/static` and `index.html` at root
- Visit `http://localhost:8000` to see the React app served by FastAPI

---
This setup demonstrates FastAPI's `app.mount` for serving a React frontend.
