# Technology Stack

## Frontend Architecture

### Core Framework
- **Next.js 15** (App Router)
  - React 19 with Server Components
  - TypeScript for type safety
  - Fast Refresh for development
  - Server-side rendering (SSR) and static generation

### UI & Styling
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Modern icon library
- **Shadcn/ui** - Accessible component primitives built on Radix UI
  - Select components
  - Dialog modals
  - Dropdown menus
  - Alert dialogs
  - Form controls

### 3D Graphics
- **React Three Fiber (@react-three/fiber)** - React renderer for Three.js
- **@react-three/drei** - Helpers for R3F (OrbitControls, Camera, Environment)
- **Three.js** - 3D graphics library for track/car visualization

### State Management & Data
- **React Hooks** (useState, useEffect, useCallback, useRef)
- **React Context API** - Global auth state
- **Custom Hooks**:
  - `useBackendSimulation` - Real-time simulation state management with polling
  - `useAuth` - Authentication context provider
- **Polling Strategy**: 2-second intervals for live telemetry updates
- **PapaParse** - CSV parsing for telemetry data (50,000+ laps)
- **React Markdown** - Markdown rendering for AI responses
- **remark-gfm** - GitHub Flavored Markdown support

### Authentication
- **Supabase Auth** - User authentication and session management
  - Email/password authentication
  - Google OAuth integration
  - JWT token management
- **Local Storage** - Persistent session tokens (`auth_token`)
- **Protected Routes** - Client-side auth checks with redirects
- **Auth Context** - Global authentication state provider

### Typography
- **Google Fonts**:
  - Rajdhani (primary - racing aesthetic)
  - Orbitron (headings - technical feel)
  - Geist Sans & Mono (code/data display)

## Backend Architecture

### Core Framework
- **Python 3.10+**
- **Flask 3.0** - Lightweight web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Flask-Limiter** - Rate limiting for API endpoints
- **Blueprint Architecture** - Modular route organization

### Machine Learning Stack

#### Ensemble Learning Framework
- **LightGBM** - Gradient boosting (fast, efficient)
- **XGBoost** - Extreme gradient boosting (accurate)
- **CatBoost** - Categorical boosting (handles categories well)

#### ML Libraries
- **Scikit-learn** - Ensemble methods and meta-learners
  - `StackingRegressor` - Regression tasks with Ridge meta-learner
  - `VotingClassifier` - Classification with soft voting
  - Model evaluation metrics (MAE, MSE, RMSE, R², F1, Accuracy)
- **Optuna** - Hyperparameter optimization (50 trials per model)
- **Pandas** - Data manipulation and preprocessing
- **NumPy** - Numerical computations
- **Joblib** - Model serialization and parallel processing

#### 8 ML Models
1. **Lap Time Predictor** - StackingRegressor (MAE: 0.103s, R²: 0.9998)
2. **Fuel Consumption Predictor** - StackingRegressor (MAE: 0.115L, R²: 0.973)
3. **Pit Stop Time Predictor** - XGBoost best (MAE: 1.207s)
4. **Driver Consistency** - VotingClassifier (F1: 1.0, Accuracy: 1.0)
5. **Weather Impact Predictor** - StackingRegressor (MAE: 0.015s, R²: 0.9997)
6. **Optimal Sector Predictor** - Multi-output ensemble (MAE: 0.0088s, R²: 0.9986)
7. **Position Predictor** - Ensemble classification
8. **Weather Pit Strategy** - Ensemble classification

#### Training Data
- **50,000+ laps** from real iRacing telemetry
- **6 tracks**: COTA, VIR, Sebring, Sonoma, Road America, Barber
- **Features**: 12+ per model (driver skill, car setup, weather, track, tires, fuel)
- **Preprocessing**: Feature engineering, normalization, encoding

### AI Integration
- **Groq AI SDK** - Ultra-fast LLM inference
- **Available Models**:
  - LLaMA 3.3 70B Versatile - Advanced reasoning
  - Mixtral 8x7B Instruct - Multi-expert insights
  - Custom PitIQ Lightning - Racing-optimized responses
- **Use Cases**:
  - Conversational race engineer (Pit Wall AI page)
  - Strategy insights and recommendations
  - Natural language explanations of predictions

### Data Processing
- **CSV Processing** - Track data and telemetry storage
- **Real-time Calculations**:
  - Lap time simulation with sector tracking
  - Fuel consumption tracking (liters per lap)
  - Tire degradation modeling (age-based wear)
  - Weather impact analysis (temperature, rain, wind)
  - Position prediction
  - Pit strategy optimization

### API Layer
- **RESTful API** design with Flask Blueprints
- **JSON** data interchange format
- **Session Management** - Supabase-persisted simulation state
- **Multi-user Support** - User-specific simulation isolation by `user_id`
- **Endpoints**:
  - `/api/simulation/start` - Start simulation
  - `/api/simulation/stop` - Stop simulation
  - `/api/simulation/update` - Update config in real-time
  - `/api/simulation/state` - Get current state (polled every 2s)
  - `/api/simulation/pit-stop` - Execute pit stop
  - `/api/simulation/resume` - Resume after pit
  - `/api/simulation/laps` - Get lap history
  - `/api/simulation/predict` - Get ML predictions
  - `/api/simulation/optimize-strategy` - Strategy optimization
  - `/api/model-metadata/*` - Model information

## Database

### Supabase (PostgreSQL)
- **Users Table** - User profiles and car numbers
- **Teams Table** - Team information and members
- **Team Members Table** - Individual team member records
- **Race Events Table** - Calendar and event scheduling

### Schema Design
```sql
users (
  id: uuid PRIMARY KEY,
  email: string,
  full_name: string,
  car_number: integer
)

teams (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users,
  car_number: integer,
  team_name: string,
  team_description: text
)

team_members (
  id: uuid PRIMARY KEY,
  team_id: uuid REFERENCES teams,
  member_name: string,
  role: string
)

race_events (
  id: uuid PRIMARY KEY,
  user_id: uuid REFERENCES users,
  event_name: string,
  track_name: string,
  event_date: date,
  event_time: time,
  event_type: enum,
  status: enum
)
```

## Development Tools

### Package Management
- **pnpm** - Fast, disk-efficient package manager (frontend)
- **pip** - Python package installer (backend)

### Code Quality
- **TypeScript** - Static type checking
- **ESLint** - Code linting and formatting rules
- **Next.js TypeScript plugin** - Framework-specific type checking

### Build Tools
- **Next.js Built-in Compiler** - Fast refresh and optimized builds
- **PostCSS** - CSS processing and optimization
- **Tailwind JIT** - Just-in-time compilation for minimal CSS

## Infrastructure

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/simulation
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-key>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>

# Backend (.env)
FLASK_ENV=development
FLASK_APP=app.py
PORT=8000
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Deployment Ready
- **Next.js Static Export** - Optimized production builds
- **Flask Production Server** - Gunicorn/uWSGI compatible
- **Environment-based Configuration** - Dev/staging/prod separation

## Data Flow Architecture

```
User Interface (Next.js)
    ↓
Authentication Layer (Supabase)
    ↓
Frontend State Management (React Hooks)
    ↓
API Communication (Fetch/REST)
    ↓
Backend Flask Server
    ↓
ML Models (Scikit-learn)
    ↓
Telemetry Calculation Engine
    ↓
Response JSON → Frontend Update
```

## Performance Optimizations

1. **Frontend**:
   - React 19 concurrent features (useTransition, Suspense)
   - Code splitting and lazy loading
   - Image optimization with Next.js Image
   - 2-second polling for live state (GET `/api/simulation/state`)
   - Real-time lap updates without page refresh
   - 3D track rendering with React Three Fiber (60fps)

2. **Backend**:
   - Supabase-persisted simulation state (survives server restarts)
   - Pre-trained ML models (no training in production)
   - Efficient CSV parsing with Pandas (50K+ laps)
   - Joblib model caching and serialization
   - Flask Blueprint architecture for modularity

3. **Network**:
   - Minimal JSON payload sizes
   - RESTful API design
   - CORS configuration for localhost development
   - Graceful error handling with detailed messages

## Security Considerations

- **Authentication**: Supabase JWT tokens (stored in localStorage as `auth_token`)
- **OAuth**: Google OAuth 2.0 integration for social login
- **Authorization**: User-specific data isolation (queries filtered by `user_id`)
- **Input Validation**: TypeScript type checking + backend parameter validation
- **CORS**: Configured for frontend origin (http://localhost:3000 in dev)
- **Environment Variables**: Sensitive credentials not committed to repo
- **API Keys**: Supabase Row-Level Security (RLS) policies enforced

## Browser Support

- **Chrome/Edge** (latest) - Primary development target
- **Firefox** (latest) - Full support
- **Safari** (latest) - Full support including WebGL for 3D
- **Mobile**: Responsive design for iOS Safari and Chrome Mobile
- **WebGL Required**: For 3D track visualization (React Three Fiber)

## Development Environment

### System Requirements
- **Node.js**: 18+ (for Next.js 15 and React 19)
- **Python**: 3.10+ (for Flask, scikit-learn, LightGBM, XGBoost, CatBoost)
- **OS**: macOS, Linux, Windows (WSL recommended for Windows)
- **RAM**: 4GB minimum, 8GB recommended (for ML model training)
- **Storage**: 2GB for node_modules, Python packages, and CSV datasets

### Setup Commands
```bash
# Frontend
cd frontend
pnpm install
pnpm dev  # Starts on http://localhost:3000

# Backend
cd backend
pip install -r requirements.txt
python app.py  # Starts on http://localhost:8000
```

### Required Dependencies
**Frontend** (package.json):
- next@15, react@19, react-dom@19
- @supabase/supabase-js
- @react-three/fiber, @react-three/drei, three
- tailwindcss, shadcn/ui components
- papaparse, react-markdown, remark-gfm
- groq-sdk

**Backend** (requirements.txt):
- flask==3.0, flask-cors
- scikit-learn, lightgbm, xgboost, catboost
- optuna, pandas, numpy, joblib
- supabase (Python client)

---

**Tech Stack Summary**: Modern full-stack racing telemetry platform with Next.js 15, React 19, Flask 3.0, ensemble ML (LightGBM + XGBoost + CatBoost), Supabase PostgreSQL, and Groq AI integration. Optimized for real-time race simulation with 50,000+ laps of training data and production-ready authentication.
