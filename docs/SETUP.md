# ✅ **GR PitIQ — Local Setup & Testing Guide (For Judges & Reviewers)**

*A complete technical guide to install, test, and validate the full racing simulation platform.*

---

# 🏁 **1. Overview**

This document provides a **step-by-step setup guide** for installing and running the GR PitIQ platform locally:

* Frontend (Next.js)
* Backend (Flask/FastAPI)
* 8 Machine Learning Models
* Dataset preprocessing
* Model training & testing
* Simulation execution

It includes **two modes**:

### ✔ **Option A — Pretrained Models (Quickest, 10 minutes)**

### ✔ **Option B — Full Training (Complete Pipeline, 30 minutes)**

---

# 🟦 **2. System Requirements**

### ✔ OS

* macOS, Windows, or Linux
* Works best on macOS/Linux

### ✔ Python

* Python **3.10 – 3.12**

### ✔ Node.js

* Node.js **18+**

### ✔ Package Managers

* `pip3`, `npm` or `pnpm`

---

# 🟩 **3. Folder Structure**

Your project should look like this:

```
project-root/
│
├── backend/
├── frontend/
├── dataset/
├── ml_proof/
├── docs/
│   ├── setup.md  ← THIS FILE
│   ├── architecture.md
│   ├── api_reference.md
│   ├── model_overview.md
│   ├── hackathon_report.md
│   └── innovation.md
└── README.md
```

---

# 🚀 **4. Quick Start (Option A – Pre-Trained Models)**

*Fastest method — You do NOT need to train any models.*

Total time: **~10 minutes**

---

## **Step 1 — Backend Setup (5 minutes)**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # macOS / Linux
venv\Scripts\activate       # Windows

pip3 install -r requirements.txt
cp .env.example .env
```

➡ Edit `.env` and add **Supabase** credentials and **CORS origins**.

Finally run backend:

```bash
python app.py
```

Backend runs on:

👉 `http://localhost:8000`

---

## **Step 2 — Frontend Setup (3 minutes)**

```bash
cd frontend
npm install          # or pnpm install
cp .env.example .env.local
```

➡ Edit `.env.local` with AI API keys & backend URL.

Run:

```bash
npm run dev
```

Frontend runs on:

👉 `http://localhost:3000`

---

## **Step 3 — Test the Platform (2 minutes)**

1. Open: `http://localhost:3000`
2. Create a test account
3. Go to **Simulation Setup**
4. Run a simulation
5. Observe:

   * Lap predictions
   * Fuel consumption
   * Pit stop recommendations
   * Position forecasting
   * Weather impact modeling
   * Telemetry + Race Engineer AI

**Done!**
This uses the pre-trained ML models already included.

---

# 🧠 **5. Full ML Pipeline (Option B – Train Everything)**

*For complete evaluation & research validation*
Total time: **20–30 minutes**

---

## ✔ Step 1 — Backend Setup (Same as Option A)

---

## ✔ Step 2 — Preprocess Dataset (3 minutes)

```bash
cd backend/preprocess
bash run_preprocessing.sh
bash run_weather_impact_preprocessing.sh
bash run_optimal_sector_preprocessing.sh
cd ..
```

These scripts:

* Clean CSV files
* Normalize telemetry
* Engineer features
* Split train/test
* Save into `/processed/` folders

---

## ✔ Step 3 — Train All 8 ML Models (15 minutes)

```bash
cd backend/scripts

bash run_lap_time_predictor.sh
bash run_driver_consistency_predictor.sh
bash run_fuel_consumption_predictor.sh
bash run_pit_stop_time_predictor.sh
bash run_position_predictor.sh
bash run_weather_impact_predictor.sh
bash run_optimal_sector_predictor.sh
bash run_weather_pit_strategy_predictor.sh

cd ..
```

Each model is saved into:

```
backend/model/
backend/model/metadata/
```

---

## ✔ Step 4 — Test All Models (3 minutes)

```bash
cd backend/test
bash run_all_model_tests.sh
cd ..
```

Outputs appear in:

```
ml_proof/
```

This includes:

* Accuracy
* MAE / RMSE
* ROC-AUC
* Confusion matrices
* Sample predictions
* Track-wise breakdown

---

## ✔ Step 5 — Run Backend

```bash
python app.py
```

---

## ✔ Step 6 — Frontend Setup

Same as Option A.

---

# 🔧 **6. Environment Configuration**

---

## 📌 Backend `.env`

Create: `backend/.env`

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
HOST=0.0.0.0
PORT=8000

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

SUPABASE_URL=https://wzuoyhjtgveivntpvtlx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dW95aGp0Z3ZlaXZudHB2dGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTU2MDIsImV4cCI6MjA3ODc5MTYwMn0.N37Leo9ouf5MDjFBIy5NgWNRJUUJhDeI-wRAj3X_i6Q
SUPABASE_SERVICE_ROLE_KEY=optional
```

---

## 📌 Frontend `.env.local`

Create: `frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://wzuoyhjtgveivntpvtlx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dW95aGp0Z3ZlaXZudHB2dGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTU2MDIsImV4cCI6MjA3ODc5MTYwMn0.N37Leo9ouf5MDjFBIy5NgWNRJUUJhDeI-wRAj3X_i6Q


NEXT_PUBLIC_API_URL=http://localhost:8000/api/simulation

GEMINI_API_KEY=your-key
GROQ_API_KEY=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
DEEPSEEK_API_KEY=your-key
```

---

# 📦 **7. Verification Checklist (Judges)**

| Feature                            | Status |
| ---------------------------------- | ------ |
| Frontend loads on `localhost:3000` | ✅      |
| Backend returns API JSON           | ✅      |
| Models load successfully           | ✅      |
| Simulation end-to-end working      | ✅      |
| Telemetry dashboard updates        | ✅      |
| Weather + Pit Strategy AI          | ✅      |

---

# 🏆 **8. Notes for Hackathon Judges**

* All models are **pretrained** and stored in `backend/model/`
* All tests + evidence stored in `ml_proof/` as Markdown
* Frontend and backend run independently
* Local setup requires **zero cloud services beyond Supabase**

