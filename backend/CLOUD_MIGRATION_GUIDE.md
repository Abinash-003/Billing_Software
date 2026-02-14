# ☁️ Cloud Database Migration Guide (Backend)

Your Render deployment is failing because it cannot connect to your local computer's database (`localhost`). You must migrate to a cloud-hosted MySQL database.

## ✅ Step 1: Create a Cloud MySQL Database

Since Render relies on PostgreSQL by default, you need an external MySQL provider.
**Recommended Options:**
1.  **[Railway](https://railway.app/)** (Highly Recommended - Easiest setup, free trial available)
2.  **[Aiven](https://aiven.io/)** (Free Tier available for MySQL)
3.  **[PlanetScale](https://planetscale.com/)**

### 🔹 1. Using Railway (Easiest):
1.  Sign up at [railway.app](https://railway.app/).
2.  Click **New Project** -> **Provision MySQL**.
3.  Once created, click on the **MySQL** card -> **Connect** tab.
4.  Copy the variables provided:
    - **MYSQLHOST** -> `DB_HOST`
    - **MYSQLPORT** -> `DB_PORT`
    - **MYSQLUSER** -> `DB_USER`
    - **MYSQLPASSWORD** -> `DB_PASSWORD`
    - **MYSQLDATABASE** -> `DB_NAME`

### 🔹 2. Using Aiven (Alternative):
1.  Sign up at [console.aiven.io](https://console.aiven.io/).
2.  Create a new **MySQL** service.
3.  Choose the **Free Plan** (if available).
4.  Copy details from "Overview": `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

---

## ✅ Step 2: Import Your Local Data

I have already created a backup of your local data in `backend/backup.sql`.
You need to import this file into your new Cloud Database.

### Option A: Using Command Line (e.g. Git Bash)
Run this command (replace values with your Cloud DB details):
```bash
mysql -h YOUR_CLOUD_HOST -P YOUR_CLOUD_PORT -u YOUR_CLOUD_USER -p YOUR_CLOUD_DB_NAME < backup.sql
```

### Option B: Using GUI Tool (DBeaver / Workbench)
1.  Connect to your new Cloud Database in DBeaver/Workbench.
2.  Right-click the database -> **Tools** -> **Restore Database**.
3.  Select the `backup.sql` file from your backend folder.
4.  Run the restore.

---

## ✅ Step 3: Configure Render Environment Variables

1.  Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2.  Select your Backend Service.
3.  Go to **Environment**.
4.  Add/Update these variables:

| Variable | Value (Example) |
| :--- | :--- |
| `DB_HOST` | `mysql-3242-aiven.net` |
| `DB_PORT` | `12345` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | `(your-cloud-password)` |
| `DB_NAME` | `defaultdb` |
| `DB_SSL` | `true` |

> **⚠️ IMPORTANT:** Set `DB_SSL` to `true`. I have updated the code to handle secure connections automatically when this is set.

---

## ✅ Step 4: Deploy & Test

1.  Trigger a new deployment on Render (or push a commit).
2.  Check the logs in Render. You should see:
    ```
    ✅ Connected to MySQL Server
    ```
3.  Verify your API: `https://your-app.onrender.com/health` should return `{"status":"OK", ...}`.

---

## 🛠️ Need to Backup Again?
If you make changes locally and want to push data again, run:
```bash
npm run backup-db
```
This will update `backup.sql`.
