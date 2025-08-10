# Makefile for AgenticSpace

.PHONY: frontend backend agentspace

frontend:
	cd frontend && npm install && npm run build

backend:
	cd backend && [ ! -d .venv ] && python -m venv .venv || true
	cd backend && .venv/Scripts/python -m pip install -r requirements.txt

agentspace:
	make frontend
	make backend
	cd backend && .venv/Scripts/python -m uvicorn main:app --reload
