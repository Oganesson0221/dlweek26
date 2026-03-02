# Microsoft CoursePilot - AI-Powered Learning Management Platform

Microsoft CoursePilot is an intelligent learning management system that helps students organize their coursework, track deadlines, generate quizzes, and enhance their study materials using AI. It combines academic progress tracking with AI-powered tools for document summarization, keyword extraction, and concept mapping.

## 🚀 Features

### Academic Management
- **Course Overview**: Track all your courses and assignments in one place
- **Journey Map**: Visualize your learning progress across different courses
- **Deadline Tracker**: Never miss an assignment with intelligent deadline management
- **Submission Management**: Upload and track assignment submissions
- **Progress Analytics**: Detailed analytics with traffic lights, timeline views, and course-specific metrics

### AI-Powered Tools
- **Quiz Generation**: Generate custom quizzes from uploaded PDF/PPTX files
- **Document Summarization**: AI-powered summaries of course materials
- **Keyword Extraction**: Automatically extract key concepts from documents
- **Concept Map Generation**: Create interactive concept maps from uploaded materials
- **Template Editor**: Create and export assignment templates in DOCX/PPTX formats

### Note Management
- **Clippy Notes**: Save and organize notes with subject tags
- **Chrome Extension**: Capture notes from any webpage with a browser extension
- **Search & Filter**: Quickly find notes by content or subject
- **Export/Import**: Backup and share notes as JSON

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Databases**: 
  - MongoDB (notes, summaries, keywords, concept maps)
  - SQLite (academic data via SQLModel)
- **AI Integration**: OpenAI API (GPT-4 for summaries, quizzes, concept maps)
- **File Processing**: PDF and PPTX parsing capabilities

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4
- **UI Components**: Custom components with Lucide React icons
- **Animations**: Framer Motion
- **Charts**: Recharts for analytics visualization
- **Document Generation**: docx, pptxgenjs

### Browser Extension
- **Platform**: Chrome Extension (Manifest V3)
- **Features**: Text selection capture, context menu integration, local storage

## 📋 Prerequisites

- **Node.js**: 16.x or higher
- **npm**: 8.x or higher
- **Python**: 3.11 or higher
- **MongoDB**: 4.4 or higher (local or cloud instance)
- **OpenAI API Key**: Required for AI features

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Oganesson0221/dlweek26.git
cd dlweek26
```

### 2. Backend Setup

#### Create Python Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the root directory:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=microsoft_coursepilot_db

# Application Settings
APP_NAME=Microsoft CoursePilot API
DEBUG=true
UPLOAD_DIR=backend/storage/uploads
GENERATED_DIR=backend/storage/generated
IMAGE_DIR=backend/storage/images
```

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd frontend
npm install
```

### 4. Database Setup

#### MongoDB
Ensure MongoDB is running locally or set up a cloud instance (MongoDB Atlas).

The application will automatically create the required collections:
- `summaries` - Document summaries
- `keywords` - Extracted keywords
- `concept_maps` - Generated concept maps
- `notes` - User notes

#### SQLite
The SQLite database for academic data will be created automatically on first run.

## 🚀 Running the Application

### Start Backend Server

From the root directory:

```bash
cd backend
source ../venv/bin/activate  # If not already activated
PYTHONPATH=$(pwd):$PYTHONPATH uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at:
- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will be available at:
- **Web App**: http://localhost:3000

### Production Build

#### Backend
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🌐 Chrome Extension Setup

### Installation

1. Build the extension files (they're already included in `frontend/extension/`)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `frontend/extension` folder
6. The Microsoft CoursePilot Clippy icon should appear in your toolbar

### Usage

**Method 1: Floating Button**
- Select text on any webpage
- Click the floating "Save Note" button

**Method 2: Context Menu**
- Select text and right-click
- Choose "Save to Microsoft CoursePilot Notes"

**Method 3: Extension Popup**
- Click the Clippy icon
- Select text, then click "Get Selection"
- Add subject and tags
- Click "Save Note"

See [extension/README.md](frontend/extension/README.md) for detailed documentation.

## 📁 Project Structure

```
dlweek26/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── core/                # Core configuration (CORS, logging, config)
│   │   ├── db/                  # Database connections (MongoDB, SQLite)
│   │   ├── models/              # SQLModel database models
│   │   ├── schemas/             # Pydantic schemas for API validation
│   │   ├── routers/             # API route handlers
│   │   │   ├── academic/        # Academic management endpoints
│   │   │   ├── ai/              # AI-powered tool endpoints
│   │   │   └── notes.py         # Notes management
│   │   └── services/            # Business logic and AI services
│   ├── storage/                 # File uploads and generated content
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   │   ├── OverviewPage.tsx
│   │   │   ├── JourneyMapPage.tsx
│   │   │   ├── QuizPage.tsx
│   │   │   ├── SubmissionsPage.tsx
│   │   │   ├── TrackingPage.tsx
│   │   │   ├── ConceptMapPage.tsx
│   │   │   └── NotesPage.tsx
│   │   ├── api/                 # API client functions
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Utility functions
│   ├── extension/               # Chrome browser extension
│   │   ├── manifest.json
│   │   ├── popup.html
│   │   ├── content.js
│   │   └── background.js
│   ├── public/                  # Static assets
│   └── package.json             # Node dependencies
├── .env                         # Environment variables (create this)
├── .gitignore
└── README.md                    # This file
```

## 📚 API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

### Main API Endpoints

#### Academic Management
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create a new course
- `GET /api/submissions` - Get submissions
- `POST /api/submissions` - Submit an assignment
- `GET /api/deadlines` - List deadlines
- `GET /api/progress/*` - Various progress analytics endpoints

#### AI Tools
- `POST /api/ai/quiz/generate` - Generate quiz from uploaded file
- `POST /api/ai/file/summarize` - Generate document summary
- `POST /api/ai/file/extract-keywords` - Extract keywords
- `POST /api/ai/file/generate-concept-map` - Create concept map

#### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a new note
- `DELETE /api/notes/{note_id}` - Delete a note

## 🔐 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes | - |
| `OPENAI_MODEL` | OpenAI model to use | No | `gpt-4o-mini` |
| `MONGO_URI` | MongoDB connection string | Yes | `mongodb://localhost:27017/` |
| `MONGO_DB_NAME` | MongoDB database name | Yes | `microsoft_coursepilot_db` |
| `APP_NAME` | Application name | No | `Microsoft CoursePilot API` |
| `DEBUG` | Enable debug mode | No | `false` |
| `UPLOAD_DIR` | File upload directory | No | `backend/storage/uploads` |
| `GENERATED_DIR` | Generated files directory | No | `backend/storage/generated` |
| `IMAGE_DIR` | Image storage directory | No | `backend/storage/images` |

## 🧪 Development

### Backend Development

The backend uses FastAPI with hot-reload enabled by default in development mode:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

Vite provides instant hot module replacement (HMR):

```bash
cd frontend
npm run dev
```

### Code Quality

#### Backend Linting
```bash
cd backend
flake8 app/
black app/
```

#### Frontend Linting
```bash
cd frontend
npm run lint
```

## 🐛 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

**MongoDB connection failed:**
- Ensure MongoDB is running: `brew services start mongodb-community` (macOS)
- Check your `MONGO_URI` in `.env`

**OpenAI API errors:**
- Verify your `OPENAI_API_KEY` is valid
- Check your OpenAI account has credits

### Frontend Issues

**npm install fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Missing dependencies (docx, pptxgenjs):**
```bash
cd frontend
npm install docx pptxgenjs
```

### Extension Issues

**Extension not loading:**
- Ensure all icon files exist in `frontend/extension/icons/`
- Check Chrome console for errors at `chrome://extensions/`

## 📝 License

This project is part of an academic assignment for CS course.

## 👥 Authors

- Team Members: Mahi, Nicole, Shanshan
- Organization: Oganesson0221

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- FastAPI framework
- React and Vite communities
- TailwindCSS for styling utilities

---

**Made with 💙 by the Microsoft CoursePilot Team**

For more information, visit the [API Documentation](http://localhost:8000/docs) after starting the backend server.
