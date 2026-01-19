# Architecture Overview

## System Design

### High-Level Architecture
```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser   │────────▶│   Next.js    │────────▶│   FastAPI    │
│  (Client)   │  HTTPS  │  (Vercel)    │  HTTPS  │  (Render)    │
└─────────────┘         └──────────────┘         └──────────────┘
                               │                         │
                               │                         │
                        ┌──────▼──────┐          ┌──────▼──────┐
                        │    Clerk    │          │  Postgres   │
                        │    (Auth)   │          │  (Render)   │
                        └─────────────┘          └─────────────┘
                                                         │
                                                  ┌──────▼──────┐
                                                  │   OpenAI    │
                                                  │     API     │
                                                  └─────────────┘
```

### Components

**Frontend (Next.js)**
- Server-rendered React pages
- Clerk middleware for auth protection
- SSE client for streaming responses
- Optimistic UI updates

**Backend (FastAPI)**
- JWT verification via Clerk PEM key
- Multi-tenant data isolation
- OpenAI API proxy (key never exposed to client)
- SQLAlchemy ORM with Alembic migrations

**Database (PostgreSQL)**
- Projects, Prompts, Conversations, Messages, Files
- Row-level security via user_id filtering
- Cascading deletes for data consistency

### Data Flow: Chat Request

1. User sends message via frontend
2. Next.js gets Clerk JWT, calls `/chat` with bearer token
3. FastAPI verifies JWT, extracts user_id
4. Backend checks conversation ownership
5. Fetches active system prompt + conversation history
6. Calls OpenAI streaming API
7. Streams tokens via SSE to browser
8. Browser renders tokens in real-time
9. After stream completes, saves user + assistant messages to DB

### Security

- **Authentication**: Clerk manages user sessions, backend verifies JWT signatures
- **Authorization**: Every query filters by user_id from token
- **Secrets**: OpenAI key only in backend, never exposed to client
- **CORS**: Whitelist only production frontend origin

### Scalability Considerations

**Current MVP Limitations:**
- Single Render instance (no horizontal scaling)
- Free tier Postgres (limited connections)
- No caching layer
- No rate limiting per user

**Future Improvements:**
- Add Redis for session/response caching
- Implement per-user rate limits
- Move to paid Render/RDS for connection pooling
- Add CDN for static assets
- Implement WebSocket for bidirectional chat

## Data Model
```sql
projects
  - id (PK)
  - user_id (indexed)
  - name
  - created_at, updated_at

prompts
  - id (PK)
  - project_id (FK → projects)
  - name, content
  - is_active (only one per project)

conversations
  - id (PK)
  - project_id (FK → projects)
  - title

messages
  - id (PK)
  - conversation_id (FK → conversations)
  - role (user|assistant)
  - content

file_metadata
  - id (PK)
  - project_id (FK → projects)
  - user_id (indexed)
  - openai_file_id (unique)
  - filename, size_bytes
```

## Deployment Pipeline

1. **Code Push**: Git push to GitHub main branch
2. **Vercel**: Auto-deploys frontend on push
3. **Render**: Auto-deploys backend on push
4. **Migrations**: Run via start command on each deploy
5. **Health Checks**: Render monitors `/health` endpoint

## Monitoring & Observability

- **Logs**: Render dashboard (backend), Vercel dashboard (frontend)
- **Errors**: FastAPI exception handlers, Next.js error boundaries
- **Metrics**: Render provides CPU/memory/request metrics
- **Alerts**: (Not implemented in MVP) - consider Sentry integration
