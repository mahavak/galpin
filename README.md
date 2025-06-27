# Galpin Performance Tracker

A science-based performance optimization web app for athletes, built with Next.js 14 and Supabase. Track training, sleep, and supplements based on Dr. Andy Galpin's research.

## Features

### 🏋️ Training Tracking
- Log workouts with type (strength/endurance/mixed/recovery)
- Track fasted state and intensity levels
- Pre/post-workout nutrition logging
- Muscle group tracking
- Performance recommendations based on training type

### 😴 Sleep Analytics
- Track sleep duration and quality
- Monitor environmental factors (CO2 levels, room temperature)
- Deep sleep and REM sleep tracking
- Sleep quality scoring (1-10)
- Evidence-based sleep optimization tips

### 🔄 Recovery Tracking
- Post-workout carbohydrate replenishment timing
- Readiness scores and subjective wellness metrics
- Recovery modality tracking (cold therapy, massage, stretching)
- Muscle soreness and energy level monitoring
- Sleep quality correlation with recovery
- Evidence-based carb timing recommendations

### 💊 Supplement Management
- Pre-loaded database of research-backed supplements
- Track dosage, timing, and frequency
- Recovery-specific supplements:
  - Tart cherry extract (480mg) - muscle soreness and sleep
  - Glutamine (5g) - immune support during heavy training
  - Curcumin - anti-inflammatory for recovery
  - Omega-3 fish oil - joint health and inflammation
  - Magnesium glycinate - sleep and muscle relaxation
  - Melatonin - sleep onset and quality
- Performance supplements:
  - Caffeine (150-400mg) - pre-workout enhancement
  - Beetroot extract - nitric oxide for endurance
  - Rhodiola - stress response without sleep disruption
  - Creatine - most researched supplement

### 📊 Performance Dashboard
- Weekly training overview
- Average sleep quality metrics
- Recovery readiness tracking
- Active supplement monitoring
- Performance score (sleep + training + recovery)
- Quick action buttons for all tracking modules
- Smart recommendations based on Dr. Galpin's insights

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd galpin
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema in `supabase/schema.sql` in your Supabase SQL editor
   - Copy your project URL and anon key

4. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase project URL and anon key

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Key Insights Implemented

Based on Dr. Andy Galpin's research:

- **Fasted Training**: Beneficial for endurance <60min, not for strength training
- **Time-Restricted Eating**: Can work but watch carb intake and fatigue
- **Carb Timing**: Critical for endurance, less so for strength (unless training same muscle group multiple times/day)
- **Sleep**: Most impactful factor for performance, CO2 >900ppm hurts quality
- **Supplements**: Whole foods first, supplements second. Common deficiencies: Magnesium & Vitamin D

## Project Structure

```
/app              - Next.js app router pages
  /dashboard      - Protected dashboard pages
  /login         - Authentication page
  /signup        - Registration page
/components      - Reusable React components
/lib             - Utilities and Supabase clients
/types           - TypeScript type definitions
/supabase        - Database schema
```

## Future Enhancements

- [ ] Mobile app with React Native
- [ ] Integration with wearable devices
- [ ] Advanced analytics and visualizations
- [ ] Team/coach features
- [ ] Nutrition meal planning
- [ ] Performance testing protocols
- [ ] Export data functionality

## License

MIT