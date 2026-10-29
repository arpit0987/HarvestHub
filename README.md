# 🌾 HarvestHub — Farm Management & Crop Planning

**HarvestHub** is a comprehensive, production-grade Full-Stack Farm Management and Crop Planning platform. Designed for modern commercial farm managers, agronomists, and machinery operators, it streamlines field modeling, multi-year crop rotations with biological rule validation, work order scheduling with input consumption ledgers, cost-versus-yield financial analytics, and heavy machinery preventive maintenance tracking.

---

## 🌟 Key Functional Modules

### 1. 🔄 Multi-Year Crop Rotation Matrix & Agronomic Rules Engine
- **Multi-Year Interactive Matrix (2023 - 2027)** across all fields and seasons.
- **Agronomic Rule Engine (`server/src/rules/rotationEngine.js`)**:
  - **Pest & Pathogen Break Cycle**: Detects consecutive monocultures (e.g. Corn following Corn, continuous grass families) to warn against Western Corn Rootworm, White Mold, and Fusarium head blight.
  - **Nitrogen Budgeting & Synergies**: Detects symbiotic legume-to-heavy-feeder sequences (e.g., Soybeans/Field Peas preceding Corn) and calculates synthetic N reduction credits (35-50 lbs N/ac).
  - **Root Architecture Alternation**: Analyzes root depth diversity (deep taproots vs. fibrous root systems) to optimize subsoil water scavenging and soil compaction relief.
  - **Cover Crop Armor**: Rewards incorporation of winter cover crops (Crimson Clover, Winter Rye) for erosion prevention.
  - **0 - 100% Rotation Health Score**: Provides instant actionable recommendations.

### 2. 🗺️ Field & Soil Management
- 8 pre-seeded commercial farm plots totaling **980+ acres** (Silt Loam, Alluvial Flat, Clay Loam, Black Chernozem).
- Soil metrics tracking: pH level, Organic Matter %, Drainage & Irrigation (Center Pivot, Subsurface Drip, Rainfed).
- Modal profiles showing historical crop sequences, recent operations, and yield performance.

### 3. 🚜 Field Operations & Input Consumption Tracking
- Comprehensive work orders: **Tillage, Planting, Fertilization, Chemical Spraying, Irrigation, Drone Scouting, and Harvesting**.
- Real-time **Input Ledger**: Logs applied quantities and calculates direct costs for Seed bags, N-P-K liquid fertilizers, herbicides/surfactants, equipment diesel fuel, and technician labor.
- Weather prerequisites and agricultural feasibility constraints.

### 4. 📈 Cost & Yield Financial Analytics (P&L)
- Multi-year harvest ledger tracking gross yield, yield per acre, moisture percentage, and quality grade (US No. 1, No. 2, Dairy Supreme).
- Financial metrics: Gross Revenue, Direct Input Expenses, Net Profit ($), and Operating Margin (%).
- Interactive visual charts:
  - Annual Revenue vs Expenses vs Net Profit.
  - Net Profit by Crop variety.
  - Input Expense Distribution (Seed vs Fertilizer vs Chemical vs Fuel vs Labor).
  - Actual Yield per acre vs Target Benchmarks.
- **One-click CSV Export**: Export the full financial and harvest ledger for accounting and farm tax reporting.

### 5. 🔧 Machinery & Preventive Maintenance Scheduling Hub
- Heavy machinery registry: High-horsepower Tractors (John Deere 8R, New Holland T7), Combines (Case IH 8250), Boom Sprayers (Hagie STS12), Planters (Kinze 16-row), Tillage implements, and Center Pivots.
- **Live Operating Hour Meters** & service threshold calculations:
  - `Active`: Operating within interval.
  - `Due Soon`: Within 25 operating hours of service.
  - `Overdue`: Hours exceeded, flagging urgent alerts.
- **Log Hours Workflow**: Update hour meters and fuel levels with automatic status updates.
- **Complete Service Workflow**: Log service tickets, record parts and fluids replaced, and automatically reset next service intervals.

### 6. 🌦️ Weather & Sprayability Intelligence
- Real-time agricultural weather telemetry: Ambient temperature, wind speed/direction, 4-inch soil temperature, soil moisture percentage, and 5-day fieldwork forecast.
- **Sprayability Index**: Warns against wind drift or rapid evaporation.

---

## 🏗️ Architecture & Tech Stack

```
                                  +------------------------------------+
                                  |         HarvestHub Client          |
                                  | (Modern SPA, Responsive UI, Charts)|
                                  +------------------+-----------------+
                                                     |
                                                     | REST API / JSON
                                                     v
                                  +------------------------------------+
                                  |         Express API Server         |
                                  | (Port 5000 / Modular Controllers)  |
                                  +------------------+-----------------+
                                                     |
            +--------------------+-------------------+--------------------+--------------------+
            |                    |                   |                    |                    |
            v                    v                   v                    v                    v
     [Field & Soil]       [Crop Rotation]     [Field Operations]   [Cost & Yield P&L]   [Equipment Maint]
     - 8 Plots/Fields     - Multi-year Matrix - Work orders        - Input cost ledger  - Engine hour meters
     - Soil profiles      - Agronomic Rules   - Inputs consumed    - Harvest yields     - Interval alerts
     - Irrigation & GPS   - Pest/N validation - Status lifecycle   - Margin & ROI charts- Service tickets
                                                     |
                                                     v
                                  +------------------------------------+
                                  |     Relational Database (SQLite)   |
                                  | Tables: fields, crops, rotations,  |
                                  | operations, inputs, yields, costs, |
                                  | equipment, maintenance_logs        |
                                  +------------------------------------+
```

- **Backend**: Node.js v24 + Express 4.x.
- **Database**: Native `node:sqlite` (SQLite 3 relational engine with WAL mode and foreign key constraints). Zero external database installation or daemon required.
- **Frontend**: Clean Modern Single-Page Application (HTML5, responsive CSS Grid/Flexbox design system, Canvas/Chart.js visualizations, accessible modals, and toast alerts).
- **Test Suite**: Automated integration and rule engine test suite using Node's native test runner (`node:test`).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v20+ or v24+)
- npm

### 2. Installation
```bash
# Install dependencies
npm install
```

### 3. Database Seeding
Populate the database with pre-configured fields, crops, 4-year rotation histories, operations, equipment, and financial records:
```bash
npm run seed
```

### 4. Running the Application
```bash
# Start server and serve client (Runs on http://localhost:3000)
npm start

# Or with live reload in development mode
npm run dev
```

Visit **http://localhost:5000** in your web browser.

### 5. Running Automated Tests
```bash
npm test
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check & system status |
| `/api/weather` | `GET` | Agricultural weather & sprayability index |
| `/api/fields` | `GET`, `POST` | List all fields or create a new field |
| `/api/fields/:id` | `GET`, `PUT`, `DELETE` | Field details, soil metrics, and operation history |
| `/api/crops` | `GET`, `POST` | Crop catalog with botanical families & agronomic specs |
| `/api/rotations` | `GET`, `POST` | Multi-year rotation records; upsert crop assignments |
| `/api/rotations/evaluate/:fieldId` | `GET` | Run Agronomic Rules Engine on a field's sequence |
| `/api/rotations/evaluate-simulated` | `POST` | What-if simulation of test crop sequences |
| `/api/operations` | `GET`, `POST` | List operations or schedule a new work order |
| `/api/operations/:id` | `GET`, `PUT`, `DELETE` | Operation details; update status to Completed |
| `/api/operations/:id/inputs` | `POST` | Add seed, fertilizer, chemical, fuel input item |
| `/api/equipment` | `GET`, `POST` | Machinery fleet with live computed maintenance status |
| `/api/equipment/:id` | `GET`, `DELETE` | Machine details, service tasks, and history logs |
| `/api/equipment/:id/log-hours` | `POST` | Log operating hours and update status |
| `/api/equipment/:id/service` | `POST` | Log completed service and reset target hours |
| `/api/analytics/kpis` | `GET` | High-level farm KPIs (acreage, margin %, alerts) |
| `/api/analytics/pnl` | `GET` | Multi-year Profit & Loss and yield records |
| `/api/analytics/inputs-breakdown` | `GET` | Distribution of expenditures across categories |
| `/api/analytics/yields` | `GET` | Crop harvest yields vs benchmark targets |
