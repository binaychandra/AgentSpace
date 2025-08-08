# Makefile for AgenticSpace

.PHONY: frontend backend agentspace

frontend:
	cd frontend && npm install && npm run build

backend:
	cd backend && ".venv\Scripts\activate" && uv add fastapi uvicorn

agentspace:
	make frontend
	make backend
	cd backend && ".venv\Scripts\activate" && ".venv\Scripts\python.exe" -m uvicorn main:app --reload
