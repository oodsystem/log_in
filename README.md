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

- Docker Desktop
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/oodsystem/log_in.git
cd log_in
```

### 2. Configure Docker environment variables

Copy `.env.example` to `.env` and replace the example values:

```bash
cp .env.example .env
```

In PowerShell, use `Copy-Item .env.example .env` instead.

Required environment variables:

- `DB_PASSWORD` — PostgreSQL password
- `JWT_SECRET` — secret key used for JWT authentication
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` — optional credentials used to seed the first admin
- `REFRESH_COOKIE_SECURE` — set to `true` in HTTPS production deployments; keep `false` for local HTTP development

The backend configuration also supports `DB_URL` and `DB_USERNAME`, with defaults defined in `application.properties`.

**Never commit real passwords or JWT secrets to GitHub.**

### 3. Start the application with Docker Compose

From the project root, run:

```bash
docker compose up --build
```

The first build may take several minutes. The services are then available at:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:9090`
- PostgreSQL: `localhost:5433`

Stop the services with `Ctrl+C`, or run `docker compose down`. To also remove
the persisted database volume, run `docker compose down -v`.

### 4. Deploy on an Azure VM

This deployment runs the frontend, backend, and PostgreSQL on one Ubuntu 24.04
Azure VM. Docker restarts the containers after a VM restart, and Caddy obtains
and renews HTTPS certificates for the VM's DNS name. A single VM is not highly
available and incurs VM, disk, and network costs while running. Disable VM
auto-shutdown if you want it to remain online 24/7.

1. In the Azure portal, create an Ubuntu 24.04 VM. Assign its public IP a
   **static** allocation and configure a DNS name label on the Public IP
   resource. Record the full hostname Azure displays, such as
   `my-login-app.eastasia.cloudapp.azure.com`.
2. In the VM's Network Security Group, allow inbound TCP ports `80` and `443`
   from the internet. Restrict SSH (TCP `22`) to your own public IP. Do not
   expose ports `5432`, `9090`, or `8080`.
3. Connect to the VM over SSH. Install Docker, the Docker Compose plugin, and
   Git:

   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-v2 git
   sudo systemctl enable --now docker
   ```

4. Clone the repository on the VM:

   ```bash
   git clone https://github.com/oodsystem/log_in.git
   cd log_in
   ```

   The production deployment also requires `compose.gcp.yaml`, `Caddyfile`,
   `frontend/Dockerfile.prod`, and `frontend/nginx.conf` in the repository.
   The Compose file retains its original GCP name, but uses standard Docker
   Compose services and has no GCP dependency. If these files have not been
   pushed to GitHub, copy them from your working copy to the VM.

5. Create a private environment file on the VM:

   ```bash
   nano .env.azure
   ```

   Add these settings, replacing the example values:

   ```dotenv
   APP_DOMAIN=my-login-app.eastasia.cloudapp.azure.com
   POSTGRES_DB=log_in
   POSTGRES_USER=postgres
   DB_PASSWORD=replace-with-a-unique-random-password
   JWT_SECRET=replace-with-a-different-random-secret
   ADMIN_USERNAME=choose-an-admin-name
   ADMIN_PASSWORD=replace-with-a-unique-strong-password
   ```

   Generate separate random values for `DB_PASSWORD` and `JWT_SECRET` with
   `openssl rand -hex 32`. Set `APP_DOMAIN` to the exact Azure DNS hostname,
   without `https://`, and wait until it resolves to the VM's public IP before
   starting Caddy. Save the file, then restrict access to it:

   ```bash
   chmod 600 .env.azure
   ```

   Never commit or share `.env.azure`.

6. Build and start the production stack:

   ```bash
   sudo docker compose --env-file .env.azure -f compose.gcp.yaml up -d --build
   sudo docker compose --env-file .env.azure -f compose.gcp.yaml ps
   ```

   Open `https://my-login-app.eastasia.cloudapp.azure.com`. Check startup
   output with:

   ```bash
   sudo docker compose --env-file .env.azure -f compose.gcp.yaml logs --tail=100
   ```

The database is stored in a Docker volume, but a volume on one VM is not a
backup. Set up regular backups. This deployment keeps the services running
continuously; it does not add OTP verification to the existing
username/password sign-in flow.

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

### 5. Run without Docker (optional)

If you prefer local development, install Java 21, Node.js/pnpm, and PostgreSQL,
then run the backend and frontend separately:

```bash
cd backend
./gradlew bootRun
```

In a second terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Development

After making changes, check the frontend with:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint .
```

Run these commands from the `frontend` directory.

## License

No license has been specified yet.