#!/bin/bash
# Start the LearnLens Study Navigator

echo "🚀 Starting LearnLens Study Navigator..."
echo ""

# Change to project root
cd "$(dirname "$0")"

# Check if backend dependencies are installed
if ! /usr/local/bin/python3 -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing backend dependencies..."
    /usr/local/bin/python3 -m pip install -r requirements.txt --quiet
fi

# Start backend in background
echo "🔧 Starting backend server on http://localhost:8000..."
export PYTHONPATH="$(pwd)/backend"
cd backend
/usr/local/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
done

# Check if npm dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start frontend
echo "🌐 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ LearnLens is running!"
echo "   - Backend:  http://localhost:8000"
echo "   - Frontend: http://localhost:3000 (or 3001 if 3000 is busy)"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services..."

# Handle shutdown
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Wait for processes
wait
