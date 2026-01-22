# Chatbot Platform MVP

**One‑sentence pitch:** A multi‑tenant chatbot platform that lets teams build AI chatbots with custom prompts, streaming responses, and file uploads.

---

## Tech Stack (and what each piece does)

- **Next.js 14** — React framework for web apps.
- **FastAPI** — Python framework for fast APIs.
- **PostgreSQL** — Relational database for structured data.
- **SQLAlchemy + Alembic** — ORM and schema migration tools.
- **Clerk** — Hosted user login and session management.
- **OpenAI API** — Generates AI responses and tools.
- **Docker Compose** — Runs local services in containers.
- **pnpm** — Fast package manager for Node.

---

## Prerequisites

Install these before you start:

- **Git** (to clone the code)
- **Node.js 18+** (for the frontend)
- **pnpm** (`npm install -g pnpm`)
- **Python 3.11+** (for the backend)
- **Docker + Docker Compose** (for PostgreSQL)

---

## Installation & Setup (Step‑by‑Step)

> Each step explains **why** you run it, so the process is clear.

1. **Clone the repository** (get the code onto your machine).
   ```bash
   git clone https://github.com/arpanmx/chatbot-platform.git
   cd chatbot-platform
   ```

2. **Start PostgreSQL with Docker** (spin up the database locally).
   ```bash
   docker-compose up -d
   ```

3. **Create a Python virtual environment** (keep Python packages isolated).
   ```bash
   cd apps/api
   python -m venv venv
   source venv/bin/activate
   ```

4. **Install backend dependencies** (download the libraries the API needs).
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up backend configuration** (tell the API how to connect to services).
   ```bash
   cp .env.example .env
   ```
   Then open `apps/api/.env` and fill in the values (see **Configuration** below).

6. **Run database migrations** (create the tables in PostgreSQL).
   ```bash
   alembic upgrade head
   ```

7. **Start the backend server** (launch the API on port 8000).
   ```bash
   uvicorn main:app --reload
   ```

8. **Install frontend dependencies** (download the UI libraries).
   ```bash
   cd ../web
   pnpm install
   ```

9. **Set up frontend configuration** (tell the UI where the API and auth are).
   Create `apps/web/.env.local` and add the values shown below.

10. **Start the frontend server** (launch the UI on port 3000).
    ```bash
    pnpm dev
    ```

11. **Open the app** (confirm everything is running).
    - Visit **http://localhost:3000** in your browser.

---

## Configuration (.env files)

### Backend (`apps/api/.env`)
Copy from `apps/api/.env.example`, then replace the values:

```env
DATABASE_URL=postgresql://chatbot_user:chatbot_local_password@localhost:5432/chatbot_db
OPENAI_API_KEY=sk-your-openai-key-here
CLERK_PEM_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...your-clerk-pem-key...\n-----END PUBLIC KEY-----"
ALLOWED_ORIGINS=http://localhost:3000
```

**Where to get these values:**
- **OPENAI_API_KEY**: From your OpenAI account.
- **CLERK_PEM_PUBLIC_KEY**: From Clerk → JWT verification key (PEM format).

### Frontend (`apps/web/.env.local`)
Create this file manually:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

**Where to get these values:**
- **Clerk keys**: From your Clerk dashboard → API keys.

---

## Usage

### Start Backend
From `apps/api` (with your virtualenv active):
```bash
uvicorn main:app --reload
```

### Start Frontend
From `apps/web`:
```bash
pnpm dev
```

### Verify It Works
- Web UI: **http://localhost:3000**
- API docs: **http://localhost:8000/docs**

---

## Learn How It Works
See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for a plain‑English system overview and diagrams.
