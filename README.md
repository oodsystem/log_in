# Login and Registration App

A full-stack web application with user registration and login functionality, built using React, TypeScript, Spring Boot, and PostgreSQL.

## Features

- User registration
- User login
- Frontend built with React and TypeScript
- Backend built with Java and Spring Boot
- PostgreSQL database integration
- JWT-based authentication
- Role-based access for admins, managers, delivery personnel, and customers
- Delivery requests, assignment, availability, and completion

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
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` — optional credentials used to seed the first admin
- `REFRESH_COOKIE_SECURE` — set to `true` in HTTPS production deployments; keep `false` for local HTTP development

The backend configuration also supports `DB_URL` and `DB_USERNAME`, with defaults defined in `application.properties`.

**Never commit real passwords or JWT secrets to GitHub.**

### 3. Run the backend

From the project root, open Git Bash and run:

```bash
cd backend
./gradlew bootRun
```

Make sure the required environment variables are set in the terminal before starting the backend.

The API issues a short-lived access token in the login response. The long-lived refresh
token is stored only in an HttpOnly cookie and only its SHA-256 hash is stored in the
database. The frontend keeps the access token in memory rather than localStorage.

### Main API areas

- `POST /api/auth/register`, `/login`, `/refresh`, and `/logout`
- Admin: `GET /api/admin/users`, role assignment, and user blocking
- Customer: create/list personal delivery requests and follow their status
- Delivery personnel: set availability, view assigned requests, and mark requests delivered
- Manager: search delivery requests, view order details, and assign available delivery personnel

New registrations have the `PENDING` role and cannot log in until an admin assigns
`CUSTOMER`, `DELIVERY_GUY`, or `MANAGER`.

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