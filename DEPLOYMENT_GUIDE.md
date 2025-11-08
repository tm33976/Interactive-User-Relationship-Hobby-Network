# Deployment Guide (Render)

This guide explains how to deploy both the backend and frontend from this single "monorepo" to **Render**.

### Step 1: Push to GitHub/GitLab

1.  Create a new, private repository on GitHub or GitLab.
2.  Push your entire project (including the `backend` and `frontend` folders) to this repository.

### Step 2: Deploy the Backend (Node.js Server)

1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect the repository you just created.
4.  Fill in the settings:
    * **Name:** `cybernauts-backend` (or any name)
    * **Root Directory:** `backend`
    * **Environment:** `Node`
    * **Build Command:** `npm install --production=false && npm run build && npm prune --production`
    * **Start Command:** `npm run start`
5.  Click **Advanced Settings** and add your **Environment Variables**:
    * **Key:** `MONGO_URI`, **Value:** (Your MongoDB Atlas string)
    * **Key:** `NODE_ENV`, **Value:** `production`
6.  Click **Create Web Service**. Once it's live, copy its `.onrender.com` URL.

### Step 3: Deploy the Frontend (React App)

1.  Go back to the Render Dashboard.
2.  Click **New +** and select **Static Site**.
3.  Connect the *same* repository again.
4.  Fill in the settings:
    * **Name:** `cybernauts-frontend`
    * **Root Directory:** `frontend`
    * **Build Command:** `npm install --production=false && npm run build && npm prune --production`
    * **Publish Directory:** `dist`
5.  Add your **Environment Variable**:
    * **Key:** `VITE_API_URL`
    * **Value:** (Your live backend URL)
6.  Click **Create Static Site**. Once it's live, copy your new frontend URL.

### Step 4: Connect Backend to Frontend (CORS)

1.  Go back to your **backend's** settings on Render.
2.  Go to the **"Environment"** tab.
3.  Add one more environment variable:
    * **Key:** `FRONTEND_URL`
    * **Value:** (Your new live frontend URL)
4.  Click **"Save Changes"**. This restarts the backend.

Your application is now fully deployed.