# Deployment Guide: Quantex Mugen

This repository contains a Next.js frontend (root) and an Express + MongoDB backend (`/backend`).

---

## 🚀 Part 1: Deploy Backend to Render

1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in.
2. Click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository: `TarunTej1613/Quantex-Mugen`.
4. Configure the Web Service settings:
   - **Name**: `quantex-mugen-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or Starter)
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (or leave default for Render)
   - `MONGODB_URI` = `mongodb+srv://...` (Your MongoDB Atlas connection string)
   - `JWT_SECRET` = `your_strong_jwt_secret_key`
   - `CLIENT_URL` = `https://your-frontend-app.vercel.app` (Your Vercel URL once created)
   - `CLOUDINARY_CLOUD_NAME` = `your_cloudinary_cloud_name`
   - `CLOUDINARY_API_KEY` = `your_cloudinary_api_key`
   - `CLOUDINARY_API_SECRET` = `your_cloudinary_api_secret`
6. Click **Deploy Web Service**.
7. Copy your deployed Render backend URL (e.g., `https://quantex-mugen-backend.onrender.com`).

---

## ⚡ Part 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New...** &rarr; **Project**.
3. Import `TarunTej1613/Quantex-Mugen`.
4. Project Configuration:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./` (Leave as default root)
5. Expand **Environment Variables** and add:
   - `BACKEND_URL` = `https://quantex-mugen-backend.onrender.com` *(your Render backend URL without trailing slash)*
   - `NEXT_PUBLIC_APP_URL` = `https://your-frontend-app.vercel.app` *(or leave blank initially)*
   - `MONGODB_URI` = `mongodb+srv://...`
   - `JWT_SECRET` = `your_strong_jwt_secret_key`
   - `CLOUDINARY_CLOUD_NAME` = `your_cloudinary_cloud_name`
   - `CLOUDINARY_API_KEY` = `your_cloudinary_api_key`
   - `CLOUDINARY_API_SECRET` = `your_cloudinary_api_secret`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` = `your_cloudinary_cloud_name`
   - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` = `your_upload_preset`
6. Click **Deploy**.

---

## 🔗 Part 3: Final Connection

Once Vercel finishes deploying, copy your Vercel production domain (e.g., `https://quantex-mugen.vercel.app`), go to your **Render Backend Settings &rarr; Environment Variables**, update `CLIENT_URL` to that domain, and save.
