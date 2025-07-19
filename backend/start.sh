#!/bin/bash

echo "🚀 Starting AutoProcure Backend..."

# Start Ollama in background
echo "📦 Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to start
echo "⏳ Waiting for Ollama to initialize..."
sleep 10

# Check if Ollama is running
if ! kill -0 $OLLAMA_PID 2>/dev/null; then
    echo "❌ Ollama failed to start"
    exit 1
fi

echo "✅ Ollama server started successfully"

# Start FastAPI application
echo "🌐 Starting FastAPI application..."
echo "🔧 Using port: $PORT"
echo "🔧 Using host: 0.0.0.0"

# Start uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --log-level info 