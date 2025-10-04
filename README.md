# PowerFone (Complete v3)

This package contains a full-stack e-commerce demo for PowerFone (powerbanks).

Quick local run (Docker Compose):

1. Copy env files if you want to override defaults (backend/.env.example -> backend/.env)
2. Run:
   docker-compose up --build
3. Frontend: http://localhost:3000
   Backend API: http://localhost:5000

Deploy:
- Push the repo to GitHub then create Render Web Service for backend (root directory: backend)
- Create Postgres in Render and set DB_URL in backend environment variables
- Deploy frontend on Vercel (root directory: frontend), set REACT_APP_BACKEND_URL to your backend URL
