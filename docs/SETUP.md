# ✅ **GR PitIQ — Local Setup & Testing Guide (For Judges & Reviewers)**

*A complete technical guide to install, test, and validate the full racing simulation platform.*

---

## 🏁 **Overview**

This guide provides **step-by-step instructions** for running the GR PitIQ platform locally:

1. **Backend Setup** - Flask API with ML models
2. **Frontend Setup** - Next.js dashboard
3. **Testing** - Validate pretrained models
4. **Training** - (Optional) Train models from scratch

---

## 🟦 **System Requirements**

- **OS**: macOS, Windows, or Linux
- **Python**: 3.10 – 3.12
- **Node.js**: 18+
- **Package Managers**: `pip3`, `npm` or `pnpm`

---

## 🚀 **1. Backend Setup**

### Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # macOS/Linux
# venv\Scripts\activate     # Windows

pip3 install -r requirements.txt
```

### Configure Environment

Create `backend/.env`:

```env
FLASK_ENV=development
SECRET_KEY=your-secret-key
HOST=0.0.0.0
PORT=8000

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

SUPABASE_URL=https://wzuoyhjtgveivntpvtlx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dW95aGp0Z3ZlaXZudHB2dGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTU2MDIsImV4cCI6MjA3ODc5MTYwMn0.N37Leo9ouf5MDjFBIy5NgWNRJUUJhDeI-wRAj3X_i6Q
```

### Run Backend

```bash
python app.py
```

✅ Backend runs on: **http://localhost:8000**

---

## 🎨 **2. Frontend Setup**

### Install Dependencies

```bash
cd frontend
npm install          # or pnpm install
```

### Configure Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wzuoyhjtgveivntpvtlx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dW95aGp0Z3ZlaXZudHB2dGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTU2MDIsImV4cCI6MjA3ODc5MTYwMn0.N37Leo9ouf5MDjFBIy5NgWNRJUUJhDeI-wRAj3X_i6Q

NEXT_PUBLIC_API_URL=http://localhost:8000/api/simulation

GEMINI_API_KEY=AIzaSyB1LCptuJtzRW6bjwWgsGuckLajOfNqS1o
GROQ_API_KEY=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
DEEPSEEK_API_KEY=sk-33a5093474924f57a3c16ffeb1a423ba
```

### Run Frontend

```bash
npm run dev
```

✅ Frontend runs on: **http://localhost:3000**

---

## 🧪 **3. Testing Pretrained Models**

The repository includes **pretrained models** in `backend/model/`. Test them:

```bash
cd backend/test
bash run_all_model_tests.sh
cd ..
```

This validates all 8 models:
- Lap Time Predictor
- Driver Consistency Predictor
- Fuel Consumption Predictor
- Pit Stop Time Predictor
- Position Predictor
- Weather Impact Predictor
- Optimal Sector Predictor
- Weather Pit Strategy Predictor

Results appear in `ml_proof/` with accuracy metrics, confusion matrices, and sample predictions.

---

## 🔧 **4. Training Models from Scratch (Optional)**

To retrain all models with the full pipeline:

### Step 1: Preprocess Dataset

```bash
cd backend/preprocess
bash run_preprocessing.sh
bash run_weather_impact_preprocessing.sh
bash run_optimal_sector_preprocessing.sh
cd ..
```

### Step 2: Train All Models

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

Models are saved to `backend/model/` and can be tested using Step 3.

---

## ✅ **Verification Checklist**

| Feature | Status |
|---------|--------|
| Frontend loads on `localhost:3000` | ✅ |
| Backend API responds | ✅ |
| All 8 models load successfully | ✅ |
| Simulation runs end-to-end | ✅ |
| Real-time telemetry updates | ✅ |
| AI predictions working | ✅ |

---

## 🏆 **For Hackathon Judges**

- **Pretrained models** included in `backend/model/`
- **Test results** stored in `ml_proof/`
- **No cloud dependencies** except Supabase for data persistence
- **Complete local setup** in ~10 minutes
