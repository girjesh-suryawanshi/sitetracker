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

## Step 6: Access the Application

Your application is running on **Port 4100**.

Since you have a domain `sitetracker.haimiinfra.com`, you need to configure your **Main VPS Nginx** (Reverse Proxy) to point to this port.

**Example Host Nginx Config (Run this on your VPS, outside Docker):**
```nginx
server {
    listen 80;
    server_name sitetracker.haimiinfra.com;

    location / {
        proxy_pass http://127.0.0.1:4100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Once configured:
-   **Frontend & API:** `http://sitetracker.haimiinfra.com`
-   **Database:** Port `5435`

### Step 7: Enable HTTPS (SSL)
To make `https://sitetracker.haimiinfra.com` work, you need to install an SSL certificate on your **Main VPS Nginx**.

1.  **Install Certbot** (if not already installed):
    ```bash
    sudo apt install certbot python3-certbot-nginx
    ```
2.  **Run Certbot:**
    ```bash
    sudo certbot --nginx -d sitetracker.haimiinfra.com
    ```
3.  **Reload Nginx:**
    ```bash
    sudo systemctl reload nginx
    ```


## Troubleshooting

-   **Logs:**
    ```bash
    docker-compose logs -f backend
    docker-compose logs -f frontend
    ```
-   **Database Issues (Login/Signup Failing?)**
    1.  **Check if DB is running:**
        ```bash
        docker-compose ps
        ```
    2.  **Check Backend Logs for Errors:**
        ```bash
        docker-compose logs backend
        ```
    3.  **Re-Run Migration (Fix Missing Tables):**
        ```bash
        docker exec -it site-expense-backend npx prisma db push
        ```
    4.  **Check Data (Optional - Advanced):**
        ```bash
         
        ```
    docker-compose restart
    ```

### Step 8: Migrate Local Data to VPS (Using `.dump` file)

If you want to migrate your local data to the VPS, follow these steps.

#### 1. Export Local Data (Create .dump file)
Run this in your local terminal (Windows PowerShell).
*Note: If `pg_dump` is not recognized, you may need to use the full path, e.g., `& "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" ...`*

```powershell
pg_dump -U postgres -d site_expense_db -Fc > site_expense_db.dump
```
- `-Fc`: Creates a "Custom" format dump (compressed, efficient).
- `site_expense_db`: Your local database name.

#### 2. Upload to VPS
Use `scp` to copy the file to your server:
```powershell
scp site_expense_db.dump root@YOUR_VPS_IP:/var/www/site-expense-hub/
```

#### 3. Import on VPS
SSH into your VPS and run:

```bash
cd /var/www/site-expense-hub

# Stop the backend temporarily to prevent locks
docker-compose stop backend

# Drop existing (empty) DB and create fresh
docker exec -i site-expense-db psql -U postgres -c "DROP DATABASE IF EXISTS site_expense_db;"
docker exec -i site-expense-db psql -U postgres -c "CREATE DATABASE site_expense_db;"

# Restore using pg_restore
cat site_expense_db.dump | docker exec -i site-expense-db pg_restore -U postgres -d site_expense_db --clean --if-exists

# Restart backend
docker-compose start backend
```

Your data is now fully migrated!
