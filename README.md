# Team Member Data Management System

A production-grade, full-stack enterprise web application designed for high-efficiency banking and corporate relationship management (RM), customer file tracking, multi-tier team role permissions, Google Sheets bi-directional synchronization, and real-time field member location monitoring.

---

## 🌟 Key Features

### 1. Role-Based Access Control (RBAC) & Data Isolation
- **Relationship Managers (RM):** Strict portfolio isolation. RMs can only see, create, and manage their assigned customer files. Delete operations are disabled for RMs.
- **System Admin:** Global oversight across all relationship managers, RM staff onboarding, account status control, temporary password resets, and comprehensive CSV/Excel reporting.
- **Team Mentor:** Senior supervisory authority. Access to the Master Database with permanent purge controls, universal team name configuration, and direct Google Spreadsheet switching.

### 2. Customer File Lifecycle Management
- 8-stage application lifecycle tracking: `Collected`, `Submitted`, `Declined`, `Return to Source`, `Approved`, `Query`, `Condition`, `STC`.
- Active card/facility tracking: `Y` (Active), `N` (Inactive), `C` (Cancelled).
- Pending document checklist (NID, Salary Certificate, Bank Statements, Trade License, TIN, BIN, etc.).
- Contact Point Verification (CPV) status, address verification, and field visit logs.

### 3. Smart Document & Picture Upload with Instant Auto-Preview
- **Status Update Picture:** Immediate image preview upon upload for process documentation.
- **CPV Picture:** Field visit and customer location photograph uploads.
- **Others:** Multi-format document attachments (JPEG, PNG, WebP, PDF) with authenticated previews, zoom controls, and file management.

### 4. Automatic GPS / Google Location Auto-Fill
- When opening a new customer file, the system automatically detects current GPS coordinates and reverse-geocodes the physical street address via Google/OpenStreetMap geolocation to populate the address field instantly.
- Manual re-detect button available for re-verifying coordinates at any time.

### 5. Real-Time Team Member Location Monitor
- Live location tracking for active field officers and team members.
- Shows current coordinates, accuracy radius, reverse-geocoded physical address, and action context (e.g. "Logged in", "Customer Office Address Auto-Fill").
- Direct "Open in Google Maps" navigation links and auto-refresh every 20 seconds.

### 6. Bi-Directional Google Sheets Synchronization
- Authoritative synchronization with Google Spreadsheet ID via Google Apps Script Web App (`/google-apps-script/Code.gs`).
- Dedicated sheets for `Customer_Files`, `RM_Mapping`, `File_Attachments`, `Audit_Logs`, and `App_Settings`.
- Mentor can change or add a Google Spreadsheet ID / URL directly from the interface.

### 7. Floating Quick Navigation
- Floating navigation button positioned at the bottom-right corner for fast multi-page navigation across mobile, tablet, and desktop viewports.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend:** Node.js, Express, TSX
- **Data Layer:** Primary transactional database with atomic disk-backed persistence (`.data/database.json`), Firestore compatibility schemas (`firebase-blueprint.json`), and security rules (`firestore.rules`)
- **Integration:** Google Apps Script Web App API (`google-apps-script/Code.gs`)
- **Export Formats:** Microsoft Excel (`.xlsx`), CSV (`.csv`)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# 1. Clone repository
git clone https://github.com/your-username/team-member-data-management-system.git
cd team-member-data-management-system

# 2. Install dependencies
npm install

# 3. Start development server (Node.js + Vite)
npm run dev
```

The application runs on `http://localhost:3000`.

### Production Build
```bash
# Compile and build frontend assets
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
├── google-apps-script/
│   └── Code.gs                  # Production Google Apps Script Web App for Sheets
├── src/
│   ├── components/
│   │   ├── common/              # Modals, clocks, viewers, floating nav
│   │   │   ├── FloatingNav.tsx  # Floating quick navigation menu
│   │   │   ├── DocumentViewerModal.tsx
│   │   │   └── DhakaClock.tsx
│   │   └── layout/              # Navbar, Sidebar
│   ├── context/                 # AuthContext & Session management
│   ├── lib/                     # Client API library
│   ├── pages/                   # Application pages (Dashboards, Files, Locations, etc.)
│   │   ├── RMDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── MentorDashboard.tsx
│   │   ├── FileEntryAndList.tsx
│   │   ├── LocationMonitorPage.tsx
│   │   ├── DatabaseManagement.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── SheetsSyncPage.tsx
│   │   └── SettingsPage.tsx
│   ├── types/                   # TypeScript interfaces
│   └── utils/                   # DateTime & Geolocation helpers
├── server/
│   ├── middleware/              # Authentication & Role guards
│   ├── routes/                  # Express REST API routes
│   ├── db.ts                    # Transactional database layer
│   └── sheetsSync.ts            # Google Sheets webhook connector
├── server.ts                    # Express entry point with Vite middleware
├── package.json
└── README.md
```

---

## 🔒 Security & Privacy

- Passwords are encrypted using salted SHA-512 with HMAC tokens.
- Passwords are strictly masked on login interfaces with no plain-text exposure.
- Strict authorization barriers prevent cross-RM data exposure.
- All actions (logins, creates, updates, exports) are recorded in the immutable `Audit_Logs`.

---

## 📄 License
Internal Corporate & Team Operational Tool. All Rights Reserved.
