# Use Python 3.11 slim image
FROM python:3.11-slim

# Add build argument to force cache busting
ARG BUILD_DATE=2024-01-01
ENV BUILD_DATE=${BUILD_DATE}

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

# Expose port
EXPOSE 8000

# Start Ollama and then start FastAPI (model download will be added later)
CMD ollama serve & sleep 5 && uvicorn app.main:app --host 0.0.0.0 --port $PORT 