# Enterprise QR-Based Bike Booking Management System

A production-ready, enterprise-grade booking management platform for motorcycle dealerships and rentals, built on the MERN stack with React 19, TypeScript, Vite, Tailwind CSS v4, Express, and MongoDB.

## Tech Stack Overview

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Query, Zustand, React Hook Form, Zod, Framer Motion, Recharts, Sonner.
- **Backend**: Node.js, Express, TypeScript, MongoDB, Mongoose, Socket.IO, JWT cookies, Multer, Cloudinary, Pino.
- **Architecture**: Domain-driven feature structures inside backend modules, repository pattern, service layer isolation, and shared schemas.

## Project Structure

```
├── client/          # React 19 SPA (Vite + Tailwind CSS v4 + TypeScript)
├── server/          # Express API Server (TypeScript + Domain Modules)
├── shared/          # Shared types and Zod validation schemas
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB (running locally or via docker-compose)

### Quick Start (Local Development)

1. Clone or map the workspace in your editor to:
   `C:\Users\Abhar\.gemini\antigravity\scratch\bike-booking-qr`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development environments:
   - Run server: `npm run dev:server` (Starts at port 5000)
   - Run client: `npm run dev:client` (Starts at port 5173)

### Running with Docker

Use docker-compose to launch MongoDB, Client, and Server:
```bash
docker-compose up --build
```
- Client runs on: `http://localhost`
- Server API runs on: `http://localhost:5000`
- MongoDB runs on: `mongodb://localhost:27017`
