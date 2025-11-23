# GR PitIQ 🏁

> AI-Powered Racing Simulation & Telemetry Dashboard

## 🎯 Project Overview

**GR PitIQ** is an intelligent race engineering platform that combines real-time racing simulation with machine learning-powered strategy optimization. The system provides teams with AI-driven insights for lap times, fuel management, pit stop strategies, and weather impact analysis—enabling data-driven decision-making during races.

## 🚀 Key Features

### Real-Time Simulation
- **Live Race Simulation**: Configure and run realistic race simulations with adjustable parameters
- **Telemetry Dashboard**: Monitor live data including speed, fuel, tire age, lap times, and sector performance
- **Pit Stop Management**: Dynamic pit stop execution with tire compound changes and fuel refueling
- **Intelligent Auto-Stop**: Automatic simulation termination when critical conditions are met (out of fuel)

### AI-Powered Strategy
- **8 Machine Learning Models**: Production-ready predictive models for comprehensive race analysis
- **Smart Recommendations**: Intelligent pit strategy overrides based on real-time telemetry
- **Future Projections**: 5-lap ahead predictions accounting for tire degradation and fuel consumption
- **Weather Integration**: Real-time weather impact analysis on lap times and strategy

### Race Engineering Tools
- **AI Race Engineer**: Interactive chat interface for real-time strategy consultation
- **Strategy Optimizer**: Multi-scenario analysis for optimal race execution
- **Car Analysis**: Comparative performance analytics across different vehicles
- **Team Management**: Centralized team and driver information management

## 🏆 Innovation Highlights

1. **Hybrid Intelligence**: Combines ML predictions with rule-based overrides for safer, more reliable strategy calls
2. **Real-Time Adaptation**: Dynamic lap time adjustments based on tire wear, fuel load, and weather conditions
3. **Production-Ready Architecture**: Clean separation of concerns with scalable backend and responsive frontend
4. **Comprehensive Telemetry**: 15+ live metrics updated every 2 seconds during simulation

## 📊 Use Cases

- **Race Strategy Planning**: Optimize pit stop windows and tire strategies before race day
- **Driver Training**: Simulate various scenarios to improve decision-making skills
- **Performance Analysis**: Compare car performance across different tracks and conditions
- **Team Coordination**: Centralized platform for race engineers, drivers, and team managers

## 🔗 Documentation Structure

- **[TECH_STACK.md](./TECH_STACK.md)** - Complete technology overview and architecture
- **[ML_MODELS.md](./ML_MODELS.md)** - Detailed information about all 8 ML models
- **[FEATURES.md](./FEATURES.md)** - Comprehensive feature breakdown by page
- **[SETUP.md](./SETUP.md)** - Installation and deployment instructions
- **[API.md](./API.md)** - Backend API documentation

## 🎮 Quick Start

```bash
# Frontend
cd frontend
pnpm install
pnpm dev

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Visit `http://localhost:3000` to access the dashboard.

## 👥 Target Audience

- **Race Teams**: Professional and amateur racing teams seeking competitive advantage
- **Sim Racers**: Enthusiasts wanting realistic strategy training
- **Motorsport Engineers**: Professionals analyzing performance data
- **Racing Schools**: Educational institutions teaching race craft

## 🌟 What Makes GR PitIQ Special

Unlike traditional telemetry tools, GR PitIQ doesn't just display data—it **understands** it. Our hybrid AI system knows when to trust ML predictions and when to apply safety-critical overrides, ensuring recommendations are both accurate and race-safe.

---

**Built for the love of motorsports and the power of AI** 🏎️💨
