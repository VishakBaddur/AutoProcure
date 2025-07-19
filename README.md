# AutoProcure - AI-Powered Vendor Quote Analysis

An AI-native B2B SaaS platform that helps procurement teams automatically analyze vendor quotes, compare pricing, and get AI-powered recommendations.

## 🚀 Features

- **File Upload**: Support for PDF and Excel quote files
- **Real AI Analysis**: Extract structured data using Ollama/Mistral or OpenAI
- **Persistent Storage**: Save quotes to Supabase PostgreSQL database
- **Quote History**: View and manage previously analyzed quotes
- **Analytics Dashboard**: Track total quotes, value, and delivery times
- **Side-by-Side Comparison**: Compare multiple vendor quotes
- **Smart Recommendations**: AI-powered vendor selection suggestions
- **Slack Integration**: Automatic alerts with analysis results
- **Modern UI**: Clean, professional interface built with Next.js and shadcn/ui
- **User Authentication**: Secure user accounts with Supabase Auth (email/password)
- **Quote History**: Persistent storage of all analyzed quotes with user-specific access
- **Analytics Dashboard**: Track procurement metrics and vendor performance
- **Slack Integration**: Real-time alerts for new quotes and recommendations

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python), pdfplumber, openpyxl, asyncpg
- **AI**: Ollama/Mistral (local) + OpenAI GPT-4 (cloud) ready
- **Database**: Supabase (PostgreSQL) with connection pooling
- **Authentication**: Supabase Auth with JWT tokens
- **Notifications**: Slack webhooks
- **Deployment**: Vercel (frontend) + Render/Supabase (backend)

## 📦 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git
- Supabase account
- (Optional) OpenAI API key for GPT-4
- (Optional) Slack webhook URL

### 1. Clone and Setup
```bash
git clone <your-repo>
cd AutoProcure
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. AI Setup
```bash
cd backend
source venv/bin/activate
python setup_ai.py
```

This will:
- Install Ollama (local AI server)
- Download Mistral model (~4GB)
- Create `.env` file with AI configuration
- Test the setup

### 4. Database Setup (NEW!)
```bash
cd backend
source venv/bin/activate
python setup_supabase.py
```

This will:
- Guide you through Supabase setup
- Create database tables automatically
- Test the connection
- Enable persistent quote storage

### 5. Frontend Setup
```bash
cd frontend
npm install
```

### 6. Environment Variables
The setup scripts create `.env` files, but you can customize them:

**Backend (.env):**
```env
# AI Configuration
AI_PROVIDER=ollama  # Options: ollama, openai
AI_MODEL=mistral    # For Ollama: mistral, llama2, codellama | For OpenAI: gpt-4, gpt-3.5-turbo
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Slack Integration (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Supabase Auth Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 7. Run Development Servers

**Start Ollama (in a new terminal):**
```bash
ollama serve
```

**Backend:**
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see the application!

## 🤖 AI Configuration

### Local AI (Ollama + Mistral) - Recommended for MVP
- **Free**: No API costs
- **Fast**: Local processing
- **Private**: Data stays on your machine
- **Setup**: Run `python setup_ai.py` in backend folder

### Cloud AI (OpenAI GPT-4) - For Production
- **More powerful**: Better extraction accuracy
- **Cost**: ~$0.03 per analysis
- **Setup**: Set `AI_PROVIDER=openai` and `OPENAI_API_KEY` in `.env`

### Switching AI Providers
```bash
# For local AI
AI_PROVIDER=ollama
AI_MODEL=mistral

# For cloud AI
AI_PROVIDER=openai
AI_MODEL=gpt-4
```

## 🗃️ Database Setup

### Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Project Settings > Database
4. Copy connection string
5. Run `python setup_supabase.py` to configure

### Database Schema
- **users**: User accounts (ready for auth)
- **quotes**: Quote metadata and analysis results
- **quote_items**: Individual line items from quotes
- **Indexes**: Optimized for performance

## 📁 Project Structure

```
AutoProcure/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   │   ├── page.tsx     # Main upload page
│   │   │   └── history/     # Quote history page
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   └── package.json
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py          # Main API routes
│   │   ├── models.py        # Pydantic models
│   │   ├── ai_processor.py  # AI integration
│   │   ├── database.py      # Database operations
│   │   └── slack.py         # Slack integration
│   ├── setup_ai.py          # AI setup script
│   ├── setup_supabase.py    # Database setup script
│   ├── requirements.txt
│   └── venv/
└── README.md
```

## 🔧 API Endpoints

- `GET /` - Health check
- `POST /upload` - Upload and analyze quote files
- `GET /quotes` - Get quote history
- `GET /quotes/{id}` - Get specific quote details
- `GET /analytics` - Get analytics data
- `GET /health` - Service health status
- `GET /ai-status` - AI provider status

## 📊 Data Schema

### Quote Analysis Result
```json
{
  "quotes": [
    {
      "vendorName": "ABC Supplies",
      "items": [
        {
          "sku": "ITEM1234",
          "description": "Industrial Screws - 50mm",
          "quantity": 1000,
          "unitPrice": 0.45,
          "deliveryTime": "7 days",
          "total": 450
        }
      ],
      "terms": {
        "payment": "Net 30",
        "warranty": "1 year"
      }
    }
  ],
  "comparison": {
    "totalCost": 450,
    "deliveryTime": "7 days",
    "vendorCount": 1
  },
  "recommendation": "Vendor ABC Supplies offers competitive pricing with 7 days delivery.",
  "quote_id": "uuid-of-saved-quote"
}
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repo
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard

### Database (Supabase)
- Database is automatically created when you run the setup script
- Tables are created on first connection
- No additional deployment needed

## 🔮 Next Steps

- [x] ✅ Real AI Integration (Ollama/Mistral + OpenAI)
- [x] ✅ Supabase Database Integration
- [x] ✅ User Authentication
- [ ] Add multi-vendor comparison UI
- [ ] Create email alert system
- [ ] Add advanced analytics and reporting
- [ ] Implement real-time collaboration features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email support@autoprocure.com or create an issue in this repository.

---

**Built with ❤️ for procurement teams everywhere** 