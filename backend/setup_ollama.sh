#!/bin/bash
set -e

# Check if ollama is installed
if ! command -v ollama &> /dev/null
then
    echo "Ollama not found. Installing..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "Ollama is already installed."
fi

# Check if mistral model is present
if ollama list | grep -q "mistral"; then
    echo "Mistral model is already downloaded."
else
    echo "Pulling Mistral model..."
    ollama pull mistral
fi

echo "Starting Ollama server (if not already running)..."
if pgrep -x "ollama" > /dev/null
then
    echo "Ollama server is already running."
else
    nohup ollama serve > ollama.log 2>&1 &
    echo "Ollama server started in background."
fi

echo "✅ Ollama and Mistral are ready!"
echo "If you want to see logs: tail -f backend/ollama.log" 