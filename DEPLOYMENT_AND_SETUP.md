# RM File Management & Performance Dashboard
## Production Setup, Security, & Deployment Guide

This documentation provides complete deployment steps, security configurations, Google Sheets integration details, and verification workflows for the **RM File Management & Performance Dashboard**.

---

### 1. System Architecture Overview

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend:** Full-Stack Node.js Express server (`server.ts`) running on port 3000 with private document storage, salted SHA-512 authentication, session encryption, and role-based access control.
- **Database:** Primary transactional database with atomic disk-backed persistence (`.data/database.json`), Firestore compatibility schemas (`firebase-blueprint.json`), and hardened Firestore security rules (`firestore.rules`).
- **Google Sheets Integration:** Synchronizes operational metadata to Google Spreadsheet ID: `1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI` via Google Apps Script (`google-apps-script/Code.gs`).
- **Storage:** Private document storage for customer NIDs, salary certificates, bank statements, and CPV photographs with authenticated previews and 10 MB per-file limits (`storage.rules`).

---

### 2. Initial Bootstrap Accounts

| Role | Username / RM Code | Initial Password | Security Policy |
| :--- | :--- | :--- | :--- |
| **Admin** | `Admin0` | `#123456A` | Forced password change on first login. Full management permissions. |
| **Mentor** | `12345` | `12345` | Forced password change on first login. Highest operational authority. |
| **RM (Sample 1)** | `104393` | `104393` | Assigned to Tanvir Ahmed. Isolated to RM 104393 records only. |
| **RM (Sample 2)** | `105210` | `105210` | Assigned to Nusrat Jahan. Isolated to RM 105210 records only. |

*Passwords are hashed with individual cryptographic salts and never stored or returned in plaintext.*

---

### 3. Google Sheets Integration Guide

Target Spreadsheet:
**https://docs.google.com/spreadsheets/d/1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI**

#### Step 1: Open Google Apps Script
1. Open the spreadsheet in your browser.
2. In the top menu, navigate to **Extensions > Apps Script**.
3. Replace the existing content in `Code.gs` with the code in `google-apps-script/Code.gs`.

#### Step 2: Initialize Spreadsheet Structure
1. In the Apps Script toolbar, select the function **`initSpreadsheetStructure`** from the function dropdown.
2. Click **Run**.
3. Grant authorization if prompted by Google.
4. This creates or verifies the 5 sheets with corporate navy headers without deleting any existing data:
   - `RM_Mapping`
   - `Customer_Files`
   - `File_Attachments`
   - `Audit_Logs`
   - `App_Settings`

#### Step 3: Deploy as Web App
1. Click **Deploy > New deployment**.
2. Select type **Web app**.
3. Configure:
   - **Description:** RM Team Sync Service
   - **Execute as:** `Me` (your account)
   - **Who has access:** `Anyone` (Protected by shared secret token `RM_TEAM_SYNC_2026_SECURE_TOKEN_#99`)
4. Click **Deploy** and copy the **Web app URL** (e.g. `https://script.google.com/macros/s/AKfy.../exec`).

#### Step 4: Configure App Settings
1. Log in to the application as `Admin0` or `12345`.
2. Go to **Google Sheets Sync** in the sidebar.
3. Paste the URL into the **Google Apps Script Deployed Web App URL** input.
4. Click **Save Configuration**, then click **Test Connection**.
5. Click **Sync All Data to Sheets Now** to perform an immediate sync!

---

### 4. How to Create and Activate New RM Accounts

1. Log in as **Admin** (`Admin0`) or **Mentor** (`12345`).
2. Go to **RM Mapping & Accounts** in the sidebar.
3. Click **Add New RM**:
   - Provide the unique 6-digit RM Code (e.g. `108990`).
   - Enter Officer Name, Mobile, and Email.
   - Enter an optional initial password, or leave blank to auto-generate `Ebl#108990`.
4. Click **Create RM Account**.
5. The system displays a one-time dialog with the temporary password.
6. The new RM can now immediately log in using their RM code and the temporary password. The system will prompt them to set their private password upon first sign-in.

---

### 5. Role-Based Access Control & Verification

To verify that RM users cannot access each other's records:

1. **Test RM 104393:**
   - Log in using RM Code `104393`.
   - Notice the dashboard shows only Tanvir Ahmed's KPIs and records.
   - The customer file list displays only files where `rmCode === "104393"`.
   - Attempting to query another RM's records is rejected at the server level with HTTP `403 Forbidden`.
   - RM cannot delete any records.

2. **Test RM 105210:**
   - Log in using RM Code `105210`.
   - Verify that Tanvir Ahmed's customer files (e.g. `RM-2026-00101`, `00102`) do NOT appear in the list, search results, or export downloads.
   - Only Nusrat Jahan's files (e.g. `RM-2026-00104`, `00105`) appear.

3. **Test Admin (`Admin0`):**
   - Access to global KPIs, RM-wise comparative tables, RM Mapping, settings, and Google Sheets sync.
   - Soft-delete capability.

4. **Test Mentor (`12345`):**
   - Dedicated Mentor Command Center.
   - Permanent delete privileges with dedicated audit logs.
