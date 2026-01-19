# Chatbot Platform MVP

Multi-tenant AI chatbot platform with custom system prompts, real-time streaming, and file uploads.

## Features

- 🔐 Authentication with Clerk
- 🤖 OpenAI GPT-4 powered chatbots
- 💬 Real-time streaming responses (SSE)
- 📝 Custom system prompts per project
- 📁 File uploads via OpenAI Files API
- 🏢 Multi-tenant with project isolation

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- Clerk for auth
- Tailwind CSS
- Deployed on Vercel

**Backend:**
- FastAPI (Python)
- SQLAlchemy + Alembic
- PostgreSQL
- Deployed on Render

**AI:**
- OpenAI Chat Completions API
- OpenAI Files API

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- pnpm (`npm install -g pnpm`)

### Setup

1. Clone repository:
```bash
git clone https://github.com/arpanmx/chatbot-platform.git
cd chatbot-platform
```

2. Start Postgres:
```bash
docker-compose up -d
```

3. Setup backend:
```bash
cd apps/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
alembic upgrade head
uvicorn main:app --reload
```

4. Setup frontend:
```bash
cd apps/web
pnpm install
cp .env.local.example .env.local
# Edit .env.local with your keys
pnpm dev
```

5. Visit http://localhost:3000

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide.

## API Documentation

Interactive docs available at:
- Local: http://localhost:8000/docs
- Production: https://your-api.onrender.com/docs

## License

MIT
