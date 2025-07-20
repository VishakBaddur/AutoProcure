#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting AutoProcure backend on Render..."

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Install Ollama if not already installed
if ! command -v ollama &> /dev/null; then
    log "📦 Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    export PATH=$PATH:/usr/local/bin
else
    log "✅ Ollama already installed"
fi

# Verify Ollama installation
if ! command -v ollama &> /dev/null; then
    log "❌ Ollama installation failed"
    exit 1
fi

log "🔧 Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready with timeout
log "⏳ Waiting for Ollama to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        log "✅ Ollama server is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log "❌ Ollama server failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Check if Mistral model exists, if not download it
log "🤖 Checking Mistral model..."
if ! ollama list | grep -q "mistral"; then
    log "📥 Downloading Mistral model..."
    if ollama pull mistral; then
        log "✅ Mistral model downloaded successfully"
    else
        log "⚠️ Mistral model download failed, continuing with fallback"
    fi
else
    log "✅ Mistral model already available"
fi

# Verify model is working
log "🧪 Testing Ollama with a simple prompt..."
if echo "Hello" | ollama run mistral >/dev/null 2>&1; then
    log "✅ Ollama is working correctly"
else
    log "⚠️ Ollama test failed, but continuing..."
fi

# Wait a bit more for everything to be ready
sleep 3

log "🎯 Starting FastAPI application..."
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT 