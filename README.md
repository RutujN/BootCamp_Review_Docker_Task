# Bootcamp Review Hub

A modern, high-fidelity web application for **submitting, tracking, and filtering course reviews** for the **TDA Summer School '26 – Web Development Track**.

The project features:

- React + Vite frontend
- Express.js backend
- Persistent JSON database
- Standalone Docker support for both frontend and backend
- Responsive modern UI with glassmorphism and custom animations

The interface uses a warm cream-gradient design system, interactive statistics cards, curriculum-based filtering, custom notifications, rating components, and double-click delete confirmation for improved user experience.

---

# Project Structure

```text
Final_project/
├── backend/
│   ├── data/
│   │   └── reviews.json
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── hero-3d.png
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
│
└── README.md
```

---

# Features

## Interactive Curriculum Timeline

- Covers all **7 weeks** of the TDA Web Development curriculum.
- Displays weekly learning objectives and progression from React fundamentals to CI/CD deployment.

## Dynamic Review Statistics

- Calculates:
  - Average rating
  - Total reviews
  - Live star indicators
- Statistics update automatically whenever reviews change.

## Smart Filtering

Filter reviews using:

- Curriculum Week
- Focus Areas
  - Clarity
  - Support
  - Complexity
  - Pacing
  - Workload

## Curriculum Branch Explorer

Interactive comparison table that:

- Maps workload across the curriculum
- Displays weekly expectations
- Allows instant navigation to reviews for any week

## Safe Delete Confirmation

- Prevents accidental deletions
- Requires a double-click before removing a review

## Modern Responsive UI

- Warm cream gradient theme
- Glassmorphism cards
- Syne & Plus Jakarta Sans typography
- Smooth slide-up animations
- Fully responsive layout

---

# Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React, Vite |
| Backend | Express.js, Node.js |
| Storage | JSON Database |
| Web Server | Nginx |
| Containerization | Docker |

---

# Running Locally (Without Docker)

## Prerequisites

- Node.js **v18+**
- npm

---

## 1. Start the Backend

```bash
cd backend
npm install
npm start
```

Backend runs at:

```
http://localhost:5000
```

---

## 2. Start the Frontend

Open another terminal.

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

Open your browser and navigate to:

```
http://localhost:3000
```

---

# Docker Deployment

This project contains **independent Dockerfiles** for both frontend and backend.

Docker Compose is **not required**.

---

## Backend Container

### Build Image

```bash
docker build -t bootcamp-review-backend ./backend
```

### Option A — Docker Named Volume (Recommended)

```bash
docker run -d \
  -p 5000:5000 \
  -v bootcamp-reviews-data:/app/data \
  --name review-api \
  bootcamp-review-backend
```

**Advantages**

- Managed automatically by Docker
- Persistent storage
- Easy backups
- Better filesystem performance

---

### Option B — Local Bind Mount

#### Windows (PowerShell)

```powershell
docker run -d `
  -p 5000:5000 `
  -v ${PWD}/backend/data:/app/data `
  --name review-api `
  bootcamp-review-backend
```

#### macOS / Linux

```bash
docker run -d \
  -p 5000:5000 \
  -v $(pwd)/backend/data:/app/data \
  --name review-api \
  bootcamp-review-backend
```

---

## Frontend Container

### Build Image

```bash
docker build -t bootcamp-review-frontend ./frontend
```

### Run Container

```bash
docker run -d \
  -p 8080:80 \
  --name review-ui \
  bootcamp-review-frontend
```

Open:

```
http://localhost:8080
```

The frontend automatically communicates with the backend API running at:

```
http://localhost:5000
```

---

# Persistent Storage

Three storage approaches were tested.

## 1. Ephemeral Storage

Stores review files inside the container.

**Pros**

- Simple setup

**Cons**

- Data is lost once the container is removed.

---

## 2. Docker Named Volumes

```text
-v bootcamp-reviews-data:/app/data
```

**Features**

- Data survives container recreation.
- Managed entirely by Docker.
- Default review data is copied into the volume during the first run.

**Recommended for production use.**

---

## 3. Local Bind Mounts

```text
-v /host/path:/app/data
```

**Features**

- Maps your local directory into the container.
- JSON files can be edited directly from your machine.
- Ideal for development.

Since bind mounts override the container's filesystem, the backend automatically regenerates the default review database if `reviews.json` is missing.

---

# REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reviews` | Retrieve all reviews |
| POST | `/reviews` | Submit a new review |
| DELETE | `/reviews/:id` | Delete a review |

---

# Application Highlights

- Interactive curriculum dashboard
- Live review statistics
- Dynamic filtering system
- Curriculum explorer
- Double-click delete confirmation
- Responsive glassmorphism UI
- Persistent JSON database
- Docker-ready deployment

---

# Author

**Rutuj N.**