# Login and Registration App

A full-stack web application with user registration and login functionality, built using React, TypeScript, Spring Boot, and PostgreSQL.

## Features

- User registration
- User login
- Frontend built with React and TypeScript
- Backend built with Java and Spring Boot
- PostgreSQL database integration
- JWT-based authentication

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- pnpm

**Backend**
- Java
- Spring Boot
- Gradle

**Database**
- PostgreSQL

## Project Structure

```text
log_in/
├── backend/    # Spring Boot backend
├── frontend/   # React + TypeScript frontend
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and pnpm
- Java JDK 21
- PostgreSQL
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/oodsystem/log_in.git
cd log_in
```

### 2. Configure the database

Create a PostgreSQL database named `log_in`.

Configure your database connection and required environment variables in the backend environment.

Required environment variables:

- `DB_PASSWORD` — PostgreSQL password
- `JWT_SECRET` — secret key used for JWT authentication

The backend configuration also supports `DB_URL` and `DB_USERNAME`, with defaults defined in `application.properties`.

**Never commit real passwords or JWT secrets to GitHub.**

### 3. Run the backend

From the project root, open Git Bash and run:

```bash
cd backend
./gradlew bootRun
```

Make sure the required environment variables are set in the terminal before starting the backend.

### 4. Run the frontend

Open a second terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

Open the local URL printed by Vite in your terminal, usually `http://localhost:5173`.

## Development

After making changes, check the frontend with:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint .
```

Run these commands from the `frontend` directory.

## License

No license has been specified yet.