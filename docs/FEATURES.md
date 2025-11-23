# Features Overview

## Complete Feature Breakdown

GR PitIQ provides **15 interactive pages** with real-time racing telemetry, AI-powered strategy recommendations, and comprehensive race management tools built with Next.js 15, React 19, and TypeScript.

---

## 1. Landing Page 🏁

**Route**: `/`  
**Purpose**: Welcome page with authentication

### Key Features
- **Animated Speed Lines**: Dynamic background with Framer Motion
- **Hero Section**:
  - "Predict. Strategize. Dominate." tagline
  - Real-time racing aesthetics
  - Call-to-action buttons
  
- **Navigation**:
  - Login/Signup buttons for guests
  - Profile/Logout for authenticated users
  - GR PitIQ branding with orange accent

### Technical Highlights
- Framer Motion animations with staggered reveals
- Responsive design with Tailwind CSS
- Authentication state handling
- Dark theme with racing aesthetics

---

## 2. Dashboard 📊

**Route**: `/dashboard`  
**Purpose**: Unified race control center with live telemetry

### Key Features
- **Live Telemetry Display**:
  - Track progress visualization
  - Current lap/sector progress
  - Real-time speed (KPH)
  - Fuel level with percentage bar
  - Tire age and compound
  
- **Stats Grid**:
  - Current lap time
  - Best lap time
  - Average speed
  - Total distance
  
- **Weather Conditions Panel**:
  - Air temperature
  - Track temperature
  - Humidity
  - Wind speed
  - Rainfall percentage
  
- **Lap History Table**:
  - Lap number
  - Lap time
  - Fuel used
  - Tire age
  - Speed

### Technical Highlights
- Real-time data polling (2-second intervals via `useBackendSimulation` hook)
- Backend API integration (`/api/simulation/state`)
- Responsive grid layout
- Protected route with auth middleware
- Loading screen while checking auth

---

## 3. Simulation Setup ⚙️

**Route**: `/simulation-setup`  
**Purpose**: Configure and control race simulations in real-time

### Configuration Parameters

#### Driver Settings
- Skill level (Pro/Amateur/Aggressive/Conservative)

#### Car Setup
- Engine power (60-120%)
- Downforce level (0-100)
- Tire compound (Soft/Medium/Hard)
- Fuel load (0-50 liters)
- Car number selection

#### Track Selection
- 6 Available tracks:
  - COTA (Circuit of The Americas)
  - VIR (Virginia International Raceway)
  - Sebring
  - Sonoma
  - Road America
  - Barber Motorsports Park

#### Race Configuration
- Simulation mode (Multi-Lap/Single-Lap/Continuous)
- Lap count (1-200)
- Real-time speed (multiplier)

#### Weather Conditions
- Air temperature (15-35°C)
- Track temperature (20-55°C)
- Humidity (30-95%)
- Wind speed (0-40 km/h)
- Rainfall (0-100%)

### Smart Features
- **Live Parameter Updates**: Adjust settings during simulation without stopping
- **Pit Stop Control**: Manual pit stop trigger with auto tire/fuel refresh
- **Real-time State Management**: Backend simulation state sync
- **Pause/Resume**: Automatic pause during pit stops
- **Auto-stop Safety**: Simulation halts when fuel reaches 0
- **Visual Feedback**: Color-coded warnings (low fuel, worn tires)

### Controls
- Start/Pause/Resume/Stop buttons
- Pit Stop button (triggers automatic tire change and refuel)
- Parameter sliders with live value display
- Track dropdown with map preview

### UI/UX
- Slider inputs with live value display
- Dropdown selects for categorical choices
- Color-coded status indicators
- Animated pit stop messages
- Smooth state transitions with Framer Motion

---

## 4. Simulation (3D Viewer) 🎮

**Route**: `/simulation`  
**Purpose**: 3D visualization of race simulation

### Key Features
- **3D Track Rendering**:
  - React Three Fiber (R3F) canvas
  - Orbit controls for camera
  - Environment lighting
  
- **3D Car Model**:
  - Real-time position updates
  - Speed-based animations
  
- **HUD Overlay**:
  - Speed display
  - Current lap/sector
  - Fuel gauge
  - Tire wear visualization
  
- **Weather Effects**:
  - Visual weather overlay
  - Temperature display
  - Wind speed indicator
  
- **AI Predictions Panel**:
  - Next lap time prediction
  - Final position forecast
  - Optimal pit window
  - Risk factors

### Technical Features
- Three.js with React Three Fiber
- Real-time 3D rendering
- Framer Motion for UI animations
- Client-side simulation logic

---

## 5. Pit Wall 🏁

**Route**: `/pit-wall`  
**Purpose**: Race engineering dashboard with alerts and strategy insights

### Key Features

#### Overview Section
- Current simulation status
- Track name and lap count
- Real-time telemetry display

#### Live Alerts System
- **Critical Alerts** (Red):
  - Fuel below 20%
  - Tires over 20 laps old
  - Speed drop over 30 km/h
  
- **Warning Alerts** (Yellow):
  - Fuel below 35%
  - Tires over 15 laps old
  - Speed drop 15-30 km/h
  
- **Normal Alerts** (Blue):
  - Pit stop available
  - Weather changes
  - General updates

#### Fuel Projection
- Laps remaining calculation
- Fuel consumption rate
- Recommended pit lap

#### Tire Degradation
- Tire age tracking
- Compound display
- Wear percentage
- Replacement recommendation

#### Weather Forecast
- Current conditions
- Temperature trends
- Wind/rain impact

#### Sector Strategy
- Sector time breakdown
- Current sector tracking
- Performance analysis

#### Driver Strategy Insight
- AI-powered recommendations
- Performance trends
- Next actions

### Technical Features
- Real-time alert generation based on telemetry
- Backend state polling (2s intervals)
- Alert deduplication and timestamp tracking
- Modular component architecture
- Protected route with auth

---

## 6. Pit Wall AI 🤖

**Route**: `/pit-wall-ai`  
**Purpose**: Conversational AI race engineer powered by Groq LLMs

### Key Features

#### AI Chat Interface
- **Conversational AI**: Chat with AI race engineer about strategy
- **Context-Aware**: AI has access to current race data
- **Real-time Updates**: Race data refreshed from backend simulation
- **Model Selection**: Choose between different Groq AI models

#### Available AI Models
- **PitIQ Lightning** (`pitiq-lightning`): Fast responses, optimized for racing strategy
- **Groq LLaMA 3.3 70B**: Advanced reasoning for complex strategies
- **Groq Mixtral 8x7B**: Multi-expert model for diverse insights

#### Race Data Integration
- Current simulation state
- Lap number and position
- Fuel level and tire condition
- Weather conditions
- Lap times and telemetry

#### Smart Question Suggestions
- **Follow-up Questions**: Dynamic suggestions based on conversation context
- **Quick Prompts**: Pre-defined racing questions
- **Default Question**: "What is the optimal pit stop window for the current race conditions?"

#### Features
- Markdown-formatted responses
- Code highlighting for technical data
- Message history with timestamps
- Streaming responses (Groq API)
- Mobile-responsive chat interface
- Auto-scroll to latest message

### Technical Implementation
- Groq AI SDK integration
- React Markdown with remark-gfm
- Backend simulation hook for live race data
- Context-aware prompt engineering
- Error handling with fallback messages

---

## 7. AI Strategy 🧠

**Route**: `/ai-strategy`  
**Purpose**: ML prediction dashboard with intelligent overrides and hybrid AI

### Prediction Cards

#### 1. Pit Strategy Recommendation
- **Model Output**: Weather-based pit strategy (Low/Medium/High)
- **Intelligent Override**: 
  - Triggers "High Priority" if fuel < 10L
  - Triggers "High Priority" if tires > 15 laps old
  - Triggers "High Priority" if driver consistency = 0 and tires > 10 laps
  - Shows ⚠️ "OVERRIDE: Critical conditions detected"
- **Display**: Color-coded badge (green/yellow/red)
- **Model**: Weather Pit Strategy Predictor

#### 2. Next Lap Time Prediction
- **Model Output**: Predicted lap time in seconds
- **Intelligent Adjustment**:
  - Calculates theoretical lap time from tire age, fuel load, weather
  - If model prediction deviates > 5s from theoretical, blends:
    - 70% calculated theoretical time
    - 30% ML prediction
  - Shows ⚙️ "Adjusted: Based on current telemetry"
- **Comparison**: Shows vs. best lap
- **Model**: Lap Time Predictor (MAE: 0.103s, R²: 0.9998)

#### 3. Fuel Consumption
- **Prediction**: Liters per lap
- **Laps Remaining**: Auto-calculated from current fuel
- **Visual Gauge**: Progress bar color-coded
  - Green: >30% fuel
  - Yellow: 15-30%
  - Red: <15%
- **Warning**: "LOW FUEL" alert when critical
- **Model**: Fuel Consumption Predictor (MAE: 0.115L, R²: 0.973)

#### 4. Pit Stop Time
- **Prediction**: Expected pit stop duration (seconds)
- **Factors**: Tire change, fuel refill, crew performance
- **Display**: Time in seconds with confidence percentage
- **Model**: Pit Stop Time Predictor (MAE: 1.207s)

#### 5. Driver Consistency
- **Output**: Consistency score (0-1 scale)
- **Classification**: High/Medium/Low
- **Visual**: Consistency meter
- **Impact**: Used in pit strategy override logic
- **Model**: Driver Consistency Classifier (F1: 1.0, Accuracy: 1.0)

#### 6. Weather Impact
- **Time Delta**: +/- seconds impact on lap time
- **Current Conditions**: 
  - Air temp
  - Track temp
  - Humidity
  - Rainfall
  - Wind speed
- **Display**: Impact severity badge
- **Model**: Weather Impact Predictor (MAE: 0.015s, R²: 0.9997)

#### 7. Optimal Sector Times
- **Prediction**: Theoretical best time for each sector
  - Sector 1 time
  - Sector 2 time
  - Sector 3 time
- **Total**: Sum of optimal sectors
- **Comparison**: vs. current sector times
- **Model**: Optimal Sector Predictor (MAE: 0.0088s, R²: 0.9986)

### Hybrid Intelligence System
- **Rule-Based Overrides**: Critical safety checks override ML predictions
- **Telemetry Fusion**: Combines ML with physics-based calculations
- **Context Awareness**: Predictions adapt to current race state
- **Transparency**: Shows when and why overrides occur

### Technical Features
- Real-time backend integration
- 8 ML model predictions displayed simultaneously
- Model metadata display (MAE, R², confidence)
- Color-coded risk indicators
- Responsive card grid layout
- Loading states for predictions

---

## 8. Profile 👤

**Route**: `/profile`  
**Purpose**: User profile management and car number assignment

### Features
- **Personal Information**:
  - Full name (editable)
  - Email (from auth, display only)
  - Car number selection (dropdown)
  
- **Car Number Selection**:
  - Choose from 38 available car numbers:
  - Numbers: 2, 3, 5, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 31, 41, 46, 47, 50, 51, 55, 57, 58, 61, 67, 71, 72, 73, 78, 80, 86, 88, 89, 93, 98, 111, 113
  
- **Profile Updates**:
  - Save button to update profile
  - Success/error message feedback
  - Supabase database persistence

### Data Management
- Supabase `users` table
- Real-time profile loading
- Upsert operation (insert or update)
- User authentication check

### UI Elements
- Form inputs with labels
- Select dropdown for car numbers
- Save button with loading state
- Success/error toast messages
- Responsive layout

---

## 9. Team Management 👥

**Route**: `/team-management`  
**Purpose**: Create and manage racing teams with members

### Team Features
- **Car Number Requirement**: Must set car number in profile first
- **Team Creation**:
  - Team name (unique per car number)
  - Team description
  - Automatic user_id and car_number linkage
  
- **Team Information Display**:
  - Team name with edit capability
  - Team description
  - Creation date
  - Total members count
  
- **Member Management**:
  - Add new team members
  - Member fields:
    - Name
    - Role (e.g., Engineer, Driver, Manager)
    - Email
    - Phone
  - Edit existing members
  - Delete members
  - Member list table

### Database Schema
```typescript
teams {
  id: uuid
  user_id: uuid (FK to users)
  car_number: number
  team_name: string
  team_description: string
  created_at: timestamp
  updated_at: timestamp
}

team_members {
  id: uuid (client-side, not in DB)
  name: string
  role: string
  email: string
  phone: string
}
```

### Features
- Create/edit team information
- Add/edit/delete team members
- Validation for car number requirement
- Success/error notifications
- Responsive member table
- Edit mode toggle
- Supabase integration

---

## 10. Calendar 📅

**Route**: `/calendar`  
**Purpose**: Schedule and manage race events

### Event Management

#### Create Events
- Event name
- Track name selection
- Event date (date picker)
- Event time
- Location
- Description (optional)
- Event type:
  - Race
  - Practice
  - Qualifying
  - Test
- Status:
  - Upcoming
  - Completed
  - Cancelled

#### Calendar Views
- **Month View**: Calendar grid with events
- **Navigation**: Previous/next month buttons
- **Event List**: All events sorted by date

#### Event Operations
- Create new event
- Edit existing event
- Delete event
- View event details
- Filter by type and status

### Database Schema
```sql
race_events (
  id: uuid
  user_id: uuid
  event_name: string
  track_name: string
  event_date: date
  event_time: time
  location: string
  description: text
  event_type: enum('race', 'practice', 'qualifying', 'test')
  status: enum('upcoming', 'completed', 'cancelled')
  created_at: timestamp
)
```

### Features
- Modal form for event creation/editing
- Calendar month navigation
- Event filtering
- Success/error alerts with auto-dismiss
- Responsive design
- Real-time database sync
- Supabase integration

---

## 11. Leaderboard 🏆

**Route**: `/leaderboard`  
**Purpose**: Global lap time rankings from real iRacing telemetry data

### Data Source
- **CSV File**: `/public/raw_data.csv`
- **Real Data**: 50,000+ laps from actual iRacing sessions
- **Tracks**: All 6 supported tracks
- **Cars**: Multiple car numbers with detailed telemetry

### Leaderboard Features

#### Ranking Metrics
- **Best Lap Time**: Fastest lap per driver
- **Average Lap Time**: Consistency metric
- **Top Speed**: Maximum speed achieved
- **Average Speed**: Overall pace
- **Total Laps**: Session participation
- **Consistency**: Standard deviation of lap times

#### Filters
- **By Class**: Filter by car class
- **By Track**: Filter by specific track
- **Combined Filters**: Class + Track

#### Sorting
- Sort by any metric (ascending/descending)
- Click column headers to toggle sort
- Visual sort indicators (arrows)

#### Driver Stats Display
- Car number
- Best lap time (formatted as MM:SS.mmm)
- Average lap time
- Top speed (km/h)
- Average speed (km/h)
- Total laps completed
- Consistency score
- Manufacturer
- Car class
- Track name

### Technical Implementation
- **PapaParse**: CSV parsing library
- **Client-side Processing**: All filtering/sorting in browser
- **Dynamic Typing**: Automatic type inference from CSV
- **Responsive Table**: Mobile-friendly layout
- **Color Coding**: 
  - Top 3 positions highlighted
  - Class-based color badges

### Features
- Real-time filtering and sorting
- No backend required (static CSV)
- Fast performance with 50K+ records
- Detailed telemetry-based rankings
- Track-specific leaderboards
- Class-specific leaderboards

---

## 12. Strategy Optimizer 🎯

**Route**: `/strategy-optimizer`  
**Purpose**: Advanced race strategy optimization with AI analysis

### Optimization Engine

#### Input Parameters
- **Track Selection**: 6 tracks (COTA, VIR, Sebring, Sonoma, Road America, Barber)
- **Tire Strategy**:
  - Tire type (Soft/Medium/Hard)
  - Pit stop timing (lap number)
- **Fuel Management**:
  - Fuel load (30-50L)
- **Weather Forecast**:
  - Dry
  - Light rain
  - Heavy rain
- **Driver Settings**:
  - Driver type (Pro/Amateur/Aggressive/Conservative)
  - Aggression level (1-10)
- **Car Setup**:
  - Engine power (60-120%)
  - Downforce level (0-100)
- **Weather Conditions**:
  - Air temp (15-35°C)
  - Track temp (20-55°C)
  - Humidity (30-95%)
  - Wind speed (0-40 km/h)
  - Rainfall (0-100%)
- **Lap Configuration**:
  - Lap mode (Single/Multi/Continuous)
  - Lap count (1-200)
  - Speed multiplier

#### Optimization Results
- **Race Metrics**:
  - Fastest race time
  - Optimal pit lap
  - Risk level (Low/Medium/High)
  - Risk score (0-100)
  - Expected finish position
  
- **Performance Metrics**:
  - Expected lap time
  - Sector times (S1, S2, S3)
  - Max/avg/min speed
  - Top speed sector
  - Acceleration
  - Braking efficiency
  
- **Strategy Metrics**:
  - Tire wear curve (lap-by-lap)
  - Fuel delta
  - Lap time delta
  - Tire degradation rate
  - Fuel efficiency
  - Strategy confidence (0-100%)

### AI Insights
- **Groq AI Integration**: Generate natural language strategy insights
- **Model**: LLaMA 3.3 70B Versatile
- **Context**: Full race parameters and optimization results
- **Output**: Detailed strategy explanation and recommendations

### Visualization
- **Tire Wear Chart**: Line graph showing degradation over laps
- **Speed Analysis**: Bar chart with max/avg/min speeds
- **Risk Assessment**: Color-coded risk levels
- **Metrics Grid**: Comprehensive data display

### Technical Implementation
- Track data loaded from CSV (`/track_lap_times.csv`)
- Python-based optimization algorithm (theoretical)
- Client-side calculations
- Real-time parameter updates
- AI insights via Groq API
- Edge runtime for performance

### Features
- Interactive parameter adjustment
- One-click optimization
- AI-powered strategy insights
- Comprehensive metrics dashboard
- Multi-track support
- Weather impact modeling
- Tire degradation simulation
- Fuel consumption forecasting

---

## 13. Car Analysis 🔬

**Route**: `/car-analysis`  
**Purpose**: Deep dive car performance analysis from real telemetry data

### Data Source
- **CSV File**: `/public/raw_data.csv`
- **User's Car Number**: Loaded from profile settings
- **Comprehensive Metrics**: 50,000+ laps of real iRacing data

### Analysis Features

#### User Car Stats
- Car number (from profile)
- Total laps driven
- Best lap time
- Average lap time
- Top speed achieved
- Average speed
- Sector averages (S1, S2, S3)
- Consistency score
- Tracks driven
- Manufacturer
- Car class

#### Track Filtering
- View stats for specific tracks
- "All Tracks" combined view
- Track-specific performance comparison

#### Car Comparison
- **Select Competitor**: Choose any car number
- **Side-by-Side Comparison**:
  - Best lap times
  - Average lap times
  - Top speeds
  - Sector performance
  - Consistency comparison
  - Track-specific data

#### Performance Components

1. **Car Stats Card**:
   - Overview metrics
   - Visual statistics
   - Color-coded performance indicators

2. **Sector Analysis**:
   - S1, S2, S3 time breakdown
   - Sector-by-sector comparison
   - Identify strengths/weaknesses

3. **Car Comparison Panel**:
   - Head-to-head metrics
   - Performance delta calculations
   - Visual comparison charts

4. **Weather Impact Analysis**:
   - Average conditions during laps
   - Air/track temperature
   - Humidity effects
   - Wind speed impact

5. **Speed Analysis**:
   - Top speed
   - Average speed
   - Speed distribution
   - Acceleration metrics

### Technical Implementation
- CSV parsing with PapaParse
- Client-side data processing
- Real-time filtering and aggregation
- Requires car number in user profile
- Responsive charts and visualizations
- Supabase integration for user car number

### Features
- **Car Number Validation**: Prompts to set car number if missing
- **Multi-Track Analysis**: Aggregate or track-specific stats
- **Competitor Comparison**: Compare against any car
- **Real Telemetry**: Actual iRacing session data
- **Comprehensive Metrics**: 15+ performance indicators
- **Visual Analytics**: Charts for sector times, speeds, consistency

---

## 14. Model Insights 📈

**Route**: `/model-insights`  
**Purpose**: ML model performance monitoring and metadata display

### Available Models

1. **Lap Time Predictor** ⏱️
   - Predict lap times based on conditions
   - MAE, R² metrics
   
2. **Driver Consistency** 📊
   - Analyze driver performance consistency
   - Classification accuracy
   
3. **Fuel Consumption** ⚡
   - Forecast fuel usage per lap
   - Consumption patterns
   
4. **Weather Impact** 🌧️
   - Assess weather effects on performance
   - Time delta calculations
   
5. **Pit Stop Time** ⏲️
   - Estimate pit stop duration
   - Crew performance metrics
   
6. **Weather Pit Strategy** 🧠
   - Optimize pit strategy for weather
   - Multi-factor recommendations
   
7. **Optimal Sector** 🎯
   - Predict optimal sector times
   - 3-sector breakdown
   
8. **Position Predictor** 🏁
   - Forecast race position changes
   - Probability distributions
   
9. **Pit Strategy Alternative** 📋
   - Alternative pit strategy model
   - Risk-based recommendations

### Model Metadata Display

For each model:
- **Model Name**: Full identifier
- **Type**: Regression/Classification
- **Ensemble Type**: StackingRegressor/VotingClassifier
- **Base Models**: LightGBM, XGBoost, CatBoost
- **Meta Learner**: Ridge/Soft Voting
- **Performance Metrics**:
  - MAE (Mean Absolute Error)
  - MSE (Mean Squared Error)
  - RMSE (Root Mean Squared Error)
  - R² Score
  - F1 Score (for classifiers)
  - Accuracy
- **Feature List**: Input features used
- **Training Info**:
  - Training samples count
  - Last trained date
  - Model version
- **Status**: Loaded/Not Loaded

### Features
- **Model Selection**: Click to view different models
- **Visual Model Cards**: Icon-based navigation
- **Download Metadata**: Export as JSON
- **Comprehensive Details**: All training and performance info
- **Real-time Status**: Model availability check

### Technical Implementation
- Model metadata from `/lib/modelMetadata.ts`
- Client-side metadata management
- JSON export functionality
- Responsive grid layout
- Color-coded status indicators

---

## 15. Authentication Pages 🔐

### Login Page
**Route**: `/login`

**Features**:
- Email and password login
- Google OAuth integration (Supabase)
- "Remember me" option
- Link to signup page
- Error message display
- Redirect to dashboard on success

### Signup Page
**Route**: `/signup`

**Features**:
- Email and password registration
- Full name input
- Google OAuth signup
- Terms acceptance checkbox
- Link to login page
- Error handling
- Auto-login after successful signup

### Auth Callback
**Route**: `/auth/callback`

**Purpose**: Handle OAuth redirects from Google authentication

**Features**:
- Process OAuth tokens
- Store auth_token in localStorage
- Create user record in Supabase
- Redirect to dashboard
- Error handling for failed auth

---

## Cross-Page Features

### Authentication System
- **Supabase Auth**: Email/password and Google OAuth
- **Token Storage**: localStorage with 'auth_token' key
- **Protected Routes**: All pages except landing/login/signup require auth
- **Session Management**: Auto-redirect to login if unauthenticated
- **User Context**: Global auth state via React Context

### Real-time Backend Integration
- **useBackendSimulation Hook**: Custom hook for API communication
- **2-Second Polling**: `/api/simulation/state` endpoint
- **Auto-reconnect**: Handles connection errors
- **State Persistence**: Supabase database storage
- **User Isolation**: Simulations isolated by user_id

### Responsive Design
- **Mobile-First**: Tailwind CSS breakpoints
- **Sidebar Navigation**: 
  - Collapsible on mobile
  - Fixed on desktop
  - 15 navigation links
- **Touch-Friendly**: Large buttons and controls
- **Dark Theme**: Consistent black/orange racing aesthetics
- **Accessibility**: ARIA labels, keyboard navigation

### Performance Optimizations
- **Code Splitting**: Next.js automatic route-based splitting
- **Lazy Loading**: React.lazy for heavy components
- **Memoization**: React.memo on expensive renders
- **CSV Caching**: Client-side data caching
- **Optimistic UI**: Instant feedback before API response

### UI Components Library
- **Shadcn/ui**: Accessible component primitives
- **Custom Components**:
  - Sidebar
  - LoadingScreen
  - Alert systems
  - Telemetry displays
  - Prediction cards
- **Framer Motion**: Smooth animations and transitions
- **Lucide Icons**: Consistent iconography

### Data Management
- **Supabase Tables**:
  - `users` - User profiles and car numbers
  - `teams` - Team information
  - `race_events` - Calendar events
  - Simulation state (via backend)
- **CSV Data**:
  - `raw_data.csv` - 50K+ laps telemetry
  - `track_lap_times.csv` - Track baselines
- **localStorage**:
  - `auth_token` - User authentication
  - `hasSession` - Session flag
  - `sim_active_*` - Simulation state

---

## Technical Stack Summary

### Frontend
- **Framework**: Next.js 15 (App Router)
- **React**: 19.0
- **TypeScript**: Type-safe development
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **3D Graphics**: React Three Fiber (@react-three/fiber, @react-three/drei)
- **Charts**: Recharts (assumed from strategy optimizer)
- **Forms**: React Hook Form (inferred)
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React
- **CSV Parsing**: PapaParse
- **Markdown**: React Markdown with remark-gfm

### Backend Integration
- **API**: Flask REST API (Python)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Real-time**: Polling-based updates (2s interval)
- **AI**: Groq AI (LLaMA 3.3 70B, Mixtral 8x7B)

### ML Models
- **Ensemble Learning**: LightGBM + XGBoost + CatBoost
- **8 Predictive Models**: Lap time, fuel, pit stop, consistency, weather impact, sectors, position, pit strategy
- **Training Data**: 50,000+ laps from iRacing
- **Optimization**: Optuna hyperparameter tuning

---

**Total Pages**: 15  
**Total Features**: 150+  
**User Experience**: Production-grade racing telemetry and strategy platform  
**Data**: Real iRacing telemetry with 50,000+ laps analyzed  
**AI Integration**: Groq LLMs + 8 custom ML models  
**Status**: Fully functional for hackathon demonstration
