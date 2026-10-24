# 🌊 UrbanFlow: Localised Flood and Drainage Response Platform

UrbanFlow is a professional, responsive smart-city web application designed for municipal rapid response to urban flooding, choked storm-water drains, and monsoon inundations.

Built on **HTML5, CSS3, vanilla JavaScript ES modules, Node.js, Express.js, and MySQL 8.x**.

---

## 🏛️ System Capabilities & Persona Roles

UrbanFlow supports four synchronized user tiers with secure Role-Based Access Control (RBAC):

1. **🙋 Citizen**:
   * **Live Location Capturing**: One-touch GPS capture and continuous live tracking stream with high accuracy radius circle, telemetry HUD, and proximity warnings for nearby flood hazards.
   * Incident reporting wizard with visual water depth levels (*Ankle, Knee, Waist, Submerged*), blockage causes (*Drain Overflow, Silt & Solid Waste, Manhole Open, River Spill, Culvert Choke*), and photographic evidence upload.
   * Automated unique tracking code generation (e.g. `UF-2026-8491`).
   * 5-stage live status tracking timeline with crew updates and before/after verification photos.

2. **👷 Field Worker**:
   * Mobile-first touch-friendly task board.
   * Urgency tags, equipment checklists (submersible dewatering pumps, jetting trucks, excavators), and target SLA countdowns.
   * One-touch GPS driving directions to the flood hotspot.
   * Work order status progression (*Assigned $\rightarrow$ En Route $\rightarrow$ On Site $\rightarrow$ Resolved*).
   * Mandatory photographic proof upload with timestamping upon task completion.

3. **👮 Municipal Officer (Dispatcher / Ward Engineer)**:
   * **Hotspot Prioritisation Algorithm**: Calculates objective risk index (0 - 100) combining water depth, critical infrastructure proximity (hospitals, schools, metro stations), rainfall rate, and report urgency.
   * Automated spatial clustering identifying systemic drainage failures across ~500m radii.
   * Triage workspace for verifying reports, adjusting priority ratings, and issuing work orders with SLA deadlines.

4. **🏛️ Administrator**:
   * City-wide resilience KPI cards (Active Floods, Critical Hotspots, Avg Crew Dispatch, Clearance Rate).
   * Interactive **Chart.js** analytics: Ward Vulnerability Bar Chart and Drainage Blockage Categorization Doughnut.
   * Municipal ward administration with drainage capacity ratings (%).

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, Modern CSS3 | Zero bundler overhead, mobile-first responsive layout, dark municipal emergency theme. |
| **Client Logic** | Vanilla JavaScript (ES Modules) | Native `import`/`export`, reactive state store, Fetch API. |
| **Mapping Engine** | Leaflet.js + CartoDB Dark Matter | High-contrast geospatial tiles, custom pulsing radar pins, zero paid API keys needed. |
| **Data Visuals** | Chart.js 4.4 | Real-time municipal telemetry, SLA adherence, and vulnerability charts. |
| **Backend API** | Node.js + Express.js (ESM) | Clean RESTful endpoints, Multer file upload handling, centralized error handler. |
| **Database** | **MySQL 8.x** | Pure relational schema (`schema.sql`), foreign keys, transactional integrity, connection pooling via `mysql2/promise`. |
| **Authentication** | JWT + Bcrypt.js | Stateless JSON Web Tokens, RBAC authorization middleware, 10-round bcrypt hashing. |

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** v18+ installed on your machine.
* **MySQL 8.x** server running locally (or via Docker/XAMPP) on port 3306.

### 2. Configure Environment Variables
Verify or adjust your MySQL credentials in `.env`:
```ini
PORT=3000
NODE_ENV=development

# MySQL 8.x Database Credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=urbanflow_db

# JWT Security
JWT_SECRET=urbanflow_super_secret_jwt_key_2026_resilience
JWT_EXPIRES_IN=24h
```

### 3. Install Dependencies
Run from the project root (`c:\Users\nasim\OneDrive\Desktop\UrbanFlow`):
```bash
npm install
```

### 4. Initialize Database & Seed Realistic Data
Run the automated MySQL 8 initialization script:
```bash
npm run db:init
```
*This command connects to your MySQL server, creates `urbanflow_db` if it doesn't exist, executes `database/schema.sql`, and populates `database/seed.sql` with sample wards, users, active flood incidents, and work orders.*

### 5. Start the Application
```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

---

## 👥 Demo Accounts (Quick Switcher)

UrbanFlow includes an interactive **Role Switcher** bar in the top navigation allowing you to instantly switch perspectives between all four roles without typing passwords:

| Role | Demo Account Email | Default Password | Persona |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@urbanflow.gov` | `Password@123` | Commissioner Rajesh Varma |
| **Municipal Officer** | `officer.ananya@urbanflow.gov` | `Password@123` | Chief Officer Ananya Iyer |
| **Field Worker** | `crew.ramesh@urbanflow.gov` | `Password@123` | Lead Crew Member Ramesh Kumar |
| **Citizen** | `vikram.sen@example.com` | `Password@123` | Citizen Vikram Sen |

---

## 📡 REST API Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & generate JWT | Public |
| `POST` | `/api/auth/register` | Register citizen account | Public |
| `GET` | `/api/incidents` | Filtered list of flood incidents | Public |
| `POST` | `/api/incidents` | Report new incident with photo evidence | Optional Auth |
| `GET` | `/api/incidents/track/:code` | Full incident tracking history & timeline | Public |
| `PATCH`| `/api/incidents/:id/triage` | Verify report & update priority score | Officer / Admin |
| `GET` | `/api/hotspots` | Ranked hotspot queue & spatial clusters | Public / Officer |
| `GET` | `/api/tasks` | Work orders (filtered by crew or status) | JWT Auth |
| `POST` | `/api/tasks` | Dispatch work order to field personnel | Officer / Admin |
| `PATCH`| `/api/tasks/:id/status` | Advance task status & upload clearance proof | Field Worker / Officer |
| `GET` | `/api/analytics/overview`| Municipal KPI metrics and SLAs | Public / Admin |
| `GET` | `/api/analytics/charts` | Chart datasets for ward vulnerability | Public / Admin |
| `GET` | `/api/weather/current` | Real-time rainfall & storm warnings | Public |
