#!/bin/bash

echo "🚀 Starting AutoProcure backend on Render..."

# Install Ollama if not already installed
if ! command -v ollama &> /dev/null; then
    echo "📦 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Start Ollama server
echo "🔧 Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to be ready..."
sleep 10

# Check if Mistral model exists, if not download it
echo "🤖 Checking Mistral model..."
if ! ollama list | grep -q "mistral"; then
    echo "📥 Downloading Mistral model..."
    ollama pull mistral
else
    echo "✅ Mistral model already available"
fi

# Wait a bit more for everything to be ready
sleep 5

echo "🎯 Starting FastAPI application..."
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT 