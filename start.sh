#!/usr/bin/env bash
# Install dependencies
pip install -r requirements.txt

# Start the application
cd backend
uvicorn app.main:app --host 0.0.0.0 --port $PORT
