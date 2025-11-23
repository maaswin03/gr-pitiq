# 🏎️ GR PitIQ - AI-Powered Racing Telemetry & Strategy Platform


## 📖 Project Overview

GR PitIQ is a **professional-grade racing telemetry and strategy platform** designed for sim racers who want F1-level analytics. Built for the Hack the Track by Toyota GR Racing hackathon, it combines real-time race simulation, machine learning predictions, and AI-powered strategy recommendations into a comprehensive racing dashboard.

### What Makes GR PitIQ Special?

**🎯 Real Data, Real Predictions**  
Unlike typical sim racing tools, GR PitIQ is trained on **5,000+ laps** of actual iRacing telemetry from 6 professional circuits. Every prediction—from lap times to fuel consumption—is backed by ensemble machine learning achieving up to **99.98% accuracy**.

**🤖 8 Specialized ML Models**  
Each aspect of race strategy gets its own optimized model: lap time prediction, fuel consumption, pit stop timing, weather impact, driver consistency, optimal sector times, position forecasting, and adaptive pit strategy. These models work together using StackingRegressor and VotingClassifier ensembles.

**⚡ Real-Time Everything**  
The simulation updates every **2 seconds** with live telemetry, tire degradation, fuel burn, and sector progression. The backend uses APScheduler for background jobs while Supabase provides persistent state across sessions.

**🧠 AI Race Engineer**  
Powered by Groq's ultra-fast inference (LLaMA 3.3 70B), the Pit Wall AI acts as your conversational race engineer, providing natural language insights based on real-time race data.

**🎮 Professional 3D Visualization**  
Built with React Three Fiber, the 3D track view renders your car's position in real-time at 60fps with interactive camera controls and environmental effects.

---

**📖 For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md)**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  Next.js 15 + React 19 + TypeScript + Tailwind CSS             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Dashboard │  │Simulation│  │ Pit Wall │  │  Teams   │       │
│  │   Page   │  │  Setup   │  │    AI    │  │Management│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│         │             │             │             │             │
│         └─────────────┴─────────────┴─────────────┘             │
│                           │                                     │
│                  ┌────────▼────────┐                           │
│                  │  Supabase Auth  │                           │
│                  │  (Email/Google) │                           │
│                  └─────────────────┘                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API (2s polling)
┌──────────────────────────▼──────────────────────────────────────┐
│                         Backend Layer                           │
│              Flask 3.0 + Python + APScheduler                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Simulation Engine (scheduler.py)            │   │
│  │  • Real-time state updates (2s interval)                │   │
│  │  • Tire degradation modeling                            │   │
│  │  • Fuel consumption tracking                            │   │
│  │  • Sector-by-sector progression                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────┴──────────────────────────┐         │
│  │                  ML Model Layer                    │         │
│  │  8 Ensemble Models (.pkl files)                   │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │         │
│  │  │LightGBM  │  │ XGBoost  │  │ CatBoost │        │         │
│  │  └──────────┘  └──────────┘  └──────────┘        │         │
│  │       Stacking/Voting Ensemble                    │         │
│  └───────────────────────────────────────────────────┘         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      Data Layer                                 │
│  ┌──────────────────┐        ┌──────────────────┐              │
│  │  Supabase        │        │   CSV Dataset    │              │
│  │  PostgreSQL      │        │   5,000+ laps    │              │
│  │  • Users         │        │   6 tracks       │              │
│  │  • Teams         │        │   520K points    │              │
│  │  • Simulations   │        └──────────────────┘              │
│  │  • Lap History   │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
gr-pitiq/
├── frontend/           # Next.js 15 application
├── backend/            # Flask 3.0 API server
├── dataset/            # Raw telemetry data (5,000+ laps)
├── docs/               # Documentation
└── ml_proof/           # Model test results
```
---

## 🚀 Quick Start

---

## 📊 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **3D Graphics** | React Three Fiber, Three.js |
| **UI Components** | Shadcn/ui, Lucide Icons |
| **Backend** | Flask 3.0, Python 3.10+ |
| **ML Stack** | LightGBM, XGBoost, CatBoost, Scikit-learn, Optuna |
| **Database** | Supabase PostgreSQL |
| **AI** | Groq (LLaMA 3.3 70B), Google Gemini |

---

## 🎬 Demo Workflow

1. **Sign Up** → Create account (email or Google OAuth)
2. **Dashboard** → View simulation status and predictions
3. **Start Simulation** → Configure race (track, laps, fuel, tires)
4. **3D Visualization** → Watch live race on interactive 3D track
5. **Pit Wall AI** → Ask race engineer for strategy advice
6. **Execute Pit Stop** → Make strategic pit decisions
7. **Analyze Results** → Review lap history and performance

---

## 🧪 ML Model Performance

| Model | Type | MAE | R² | F1/Accuracy |
|-------|------|-----|----|----|
| Lap Time | Regression | 0.103s | 0.9998 | - |
| Fuel Consumption | Regression | 0.115L | 0.973 | - |
| Pit Stop Time | Regression | 1.207s | - | - |
| Weather Impact | Regression | 0.015s | 0.9997 | - |
| Optimal Sector | Multi-output | 0.0088s | 0.9986 | - |
| Driver Consistency | Classification | - | - | F1 1.0, Acc 1.0 |
| Position Predictor | Classification | - | - | TBD |
| Weather Pit Strategy | Classification | - | - | TBD |

**Training Details**:
- **Data**: 5,000+ laps from iRacing
- **Tracks**: COTA, VIR, Sebring, Sonoma, Road America, Barber
- **Features**: 12+ per model (driver skill, setup, weather, track, tires, fuel)
- **Optimization**: Optuna with 50 trials per model
- **Architecture**: StackingRegressor (Ridge meta-learner) / VotingClassifier

---

## 🎯 API Endpoints

**Base URL**: `http://localhost:8000/api/simulation`

- `POST /start` - Start new simulation
- `POST /stop` - Stop simulation
- `GET /state` - Get current state
- `POST /update` - Update configuration
- `POST /pit-stop` - Execute pit stop
- `GET /predict` - Get ML predictions
- `GET /laps` - Get lap history

*See [docs/SETUP.md](docs/SETUP.md) for complete API documentation*

---

## 🔐 Environment Variables

See [docs/SETUP.md](docs/SETUP.md) for environment configuration details.

---

## 🏆 Hackathon Highlights

### Innovation
- **Ensemble ML**: 3-model stacking (LightGBM + XGBoost + CatBoost) outperforms single models
- **5K+ Training Laps**: Real iRacing telemetry from 6 professional tracks
- **Real-time 3D**: React Three Fiber for 60fps track visualization
- **Groq AI Integration**: Ultra-fast LLM inference for race strategy

### Technical Excellence
- **99.98% Accuracy**: Lap time predictions within 0.103 seconds
- **Production-Ready**: Full auth, database, API documentation
- **Scalable Architecture**: Flask Blueprints, Next.js App Router
- **Developer Experience**: TypeScript, ESLint, comprehensive docs

### Impact
- **Democratizes Professional Tools**: Brings F1-level analytics to sim racers
- **Educational**: Teaches race strategy and data science
- **Competitive Advantage**: Helps teams optimize pit strategy

---

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** - Complete installation instructions
- **[Features Guide](docs/FEATURES.md)** - All 15 pages explained
- **[Tech Stack](docs/TECH_STACK.md)** - Technology deep dive
- **[ML Models](docs/ML_MODELS.md)** - Model architecture details

---

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details

---

## 👥 Team

- **Developer**: Aswin M A
- **GitHub**: [@maaswin03](https://github.com/maaswin03)

---

## 🙏 Acknowledgments

- **iRacing** - Telemetry data source
- **Groq** - Ultra-fast AI inference
- **Supabase** - Database and authentication
- **Vercel** - Deployment platform
- **Open Source Community** - Amazing libraries and tools

---

## 🔗 Links

- **Live Demo**: https://www.grpitiq.dev
- **Video Demo**: https://youtu.be/2LKJSUoxSuc?si=Ip4VGadG8WWdRC2p
- **GitHub**: https://github.com/maaswin03/gr-pitiq

---

<div align="center">

**Built with ❤️ for Hack the Track presented by Toyota GR**

⭐ Star this repo if you find it useful!

</div>
