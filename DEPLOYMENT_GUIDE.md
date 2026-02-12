# Deployment Guide for Hostinger VPS (Docker)

This guide will help you deploy the Site Expense Hub application to your Hostinger VPS using Docker and Docker Compose.

## Prerequisites

1.  **Hostinger VPS** with a Linux OS (Ubuntu 20.04/22.04 recommended).
2.  **SSH Access** to your VPS.
3.  **Git** installed on VPS.
4.  **Docker** & **Docker Compose** installed on VPS.

---

## Step 1: Prepare the VPS

SSH into your VPS:
```bash
ssh root@your_vps_ip
```

Update system and install Git/Docker (if not already installed):
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git docker.io docker-compose -y
# Enable Docker
sudo systemctl enable --now docker
```

## Step 2: Clone the Repository

Navigate to your desired folder (e.g., `/var/www`):
```bash
cd /var/www
git clone <your-repo-url> site-expense-hub
cd site-expense-hub
```

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory:
```bash
nano .env
```

Paste the following configuration (Adjust passwords!):

```env
# Database Credentials
DB_USER=postgres
DB_PASSWORD=secure_password_here
DB_NAME=site_expense_db

# Backend Secrets
JWT_SECRET=generate_a_secure_random_string_here
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

## Step 4: Deploy using Docker Compose

Build and start the containers:
```bash
docker-compose up -d --build
```

-   `-d`: Detached mode (runs in background).
-   `--build`: Forces rebuilding of images.

Check status:
```bash
docker-compose ps
```

You should see 3 containers running (`site-expense-db`, `site-expense-backend`, `site-expense-frontend`).

## Step 5: Database Setup

The first time you deploy, the database will be empty. You need to apply your schema structure.

Exec into the backend container to run Prisma commands:
```bash
docker exec -it site-expense-backend npx prisma db push
```

## Step 6: Access the Application

Your application will be running on port **4100**.

-   **Frontend:** `http://your_vps_ip:4100`
-   **API:** `http://your_vps_ip:4100/api/...` (Proxied internally)
-   **Database:** Port `5435` (e.g., connect via DBeaver at `your_vps_ip:5435`)

## Troubleshooting

-   **Logs:**
    ```bash
    docker-compose logs -f backend
    docker-compose logs -f frontend
    ```
-   **Restarting:**
    ```bash
    docker-compose restart
    ```
