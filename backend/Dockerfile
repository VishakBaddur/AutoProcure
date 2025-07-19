# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies including curl for Ollama installation
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Download Mistral model during build (this takes time but ensures it's available)
RUN ollama pull mistral

# Expose port
EXPOSE 8000

# Start Ollama in background and then start the FastAPI app
CMD ollama serve & sleep 10 && uvicorn app.main:app --host 0.0.0.0 --port 8000 