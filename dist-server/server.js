// server/app.ts
import express from "express";
import path4 from "path";
import fs4 from "fs";
import { createServer as createViteServer } from "vite";

// server/routes/auth.ts
import { Router } from "express";

// server/db.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
var DATA_DIR = path.resolve(process.cwd(), ".data");
var DB_FILE = path.join(DATA_DIR, "database.json");
var ATTACHMENTS_DIR = path.join(DATA_DIR, "attachments");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 1e4, 64, "sha512").toString("hex");
  return { hash, salt };
}
function verifyPassword(password, hash, salt) {
  const testHash = crypto.pbkdf2Sync(password, salt, 1e4, 64, "sha512").toString("hex");
  return testHash === hash;
}
function createInitialDatabase() {
  const adminPass = hashPassword("#123456A");
  const mentorPass = hashPassword("12345");
  const rm1Pass = hashPassword("104393");
  const rm2Pass = hashPassword("105210");
  const rm3Pass = hashPassword("106880");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const users = [
    {
      id: "usr_admin0",
      username: "Admin0",
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      role: "Admin",
      name: "System Administrator",
      email: "admin0@team.local",
      mobile: "+8801711000001",
      status: "Active",
      mustChangePassword: true,
      // Requires change on first login as per spec
      createdAt: now
    },
    {
      id: "usr_mentor12345",
      username: "12345",
      passwordHash: mentorPass.hash,
      salt: mentorPass.salt,
      role: "Mentor",
      name: "Senior Team Mentor",
      email: "mentor12345@team.local",
      mobile: "+8801711000002",
      status: "Active",
      mustChangePassword: true,
      // Requires change on first login as per spec
      createdAt: now
    },
    {
      id: "usr_rm104393",
      username: "104393",
      passwordHash: rm1Pass.hash,
      salt: rm1Pass.salt,
      role: "RM",
      name: "Tanvir Ahmed",
      email: "tanvir.104393@team.local",
      mobile: "+8801819234567",
      rmCode: "104393",
      status: "Active",
      mustChangePassword: false,
      createdAt: now
    },
    {
      id: "usr_rm105210",
      username: "105210",
      passwordHash: rm2Pass.hash,
      salt: rm2Pass.salt,
      role: "RM",
      name: "Nusrat Jahan",
      email: "nusrat.105210@team.local",
      mobile: "+8801912876543",
      rmCode: "105210",
      status: "Active",
      mustChangePassword: false,
      createdAt: now
    },
    {
      id: "usr_rm106880",
      username: "106880",
      passwordHash: rm3Pass.hash,
      salt: rm3Pass.salt,
      role: "RM",
      name: "Kamrul Hasan",
      email: "kamrul.106880@team.local",
      mobile: "+8801713456789",
      rmCode: "106880",
      status: "Active",
      mustChangePassword: false,
      createdAt: now
    }
  ];
  const defaultFiles = [
    {
      fileId: "RM-2026-00101",
      customerName: "Shahidul Alam",
      companyName: "Beximco Pharmaceuticals Ltd",
      officeAddress: "17 Dhanmondi R/A, Road 2, Dhaka-1205",
      mobile: "01711223344",
      altMobile: "01811223344",
      email: "shahidul.alam@beximco.com",
      rmCode: "104393",
      rmName: "Tanvir Ahmed",
      productType: "Credit Card",
      applicationStatus: "Approved",
      activeStatus: "Y",
      pendingDocuments: [],
      remarks: "Customer has verified income of BDT 185,000/mo. Clean CIB report.",
      cpvStatus: "Completed",
      cpvDate: "2026-09-20",
      cpvAddress: "17 Dhanmondi R/A, Road 2, Dhaka-1205",
      cpvRemarks: "Office verified in person. Customer is Senior GM.",
      cpvLastUpdatedBy: "104393",
      createdAt: "2026-09-18T10:30:00+06:00",
      updatedAt: "2026-09-22T14:15:00+06:00",
      createdBy: "104393",
      updatedBy: "104393",
      submittedAt: "2026-09-19T11:00:00+06:00",
      approvedAt: "2026-09-22T14:15:00+06:00",
      isDeleted: false,
      sheetsSyncStatus: "Pending"
    },
    {
      fileId: "RM-2026-00102",
      customerName: "Shahidul Alam",
      companyName: "Beximco Pharmaceuticals Ltd",
      officeAddress: "17 Dhanmondi R/A, Road 2, Dhaka-1205",
      mobile: "01711223344",
      altMobile: "01811223344",
      email: "shahidul.alam@beximco.com",
      rmCode: "104393",
      rmName: "Tanvir Ahmed",
      productType: "Credit Card",
      applicationStatus: "Approved",
      activeStatus: "Y",
      pendingDocuments: [],
      remarks: "Customer has verified income of BDT 185,000/mo. Clean CIB report.",
      cpvStatus: "Completed",
      cpvDate: "2026-09-20",
      cpvAddress: "17 Dhanmondi R/A, Road 2, Dhaka-1205",
      cpvRemarks: "Office verified in person. Customer is Senior GM.",
      cpvLastUpdatedBy: "104393",
      createdAt: "2026-09-18T10:30:00+06:00",
      updatedAt: "2026-09-22T14:15:00+06:00",
      createdBy: "104393",
      updatedBy: "104393",
      submittedAt: "2026-09-19T11:00:00+06:00",
      approvedAt: "2026-09-22T14:15:00+06:00",
      isDeleted: false,
      sheetsSyncStatus: "Pending"
    },
    {
      fileId: "RM-2026-00102",
      customerName: "Farhana Akhter",
      companyName: "Square Textiles Division",
      officeAddress: "Square Centre, 48 Mohakhali C/A, Dhaka-1212",
      mobile: "01819334455",
      email: "farhana.akhter@squaregroup.com",
      rmCode: "104393",
      rmName: "Tanvir Ahmed",
      productType: "Corporate Card",
      applicationStatus: "Submitted",
      activeStatus: "N",
      pendingDocuments: ["Salary Certificate", "BS (Bank Statement)"],
      remarks: "Application submitted to operations. Waiting for original bank statement.",
      cpvStatus: "Pending",
      createdAt: "2026-09-24T09:00:00+06:00",
      updatedAt: "2026-09-24T09:30:00+06:00",
      createdBy: "104393",
      updatedBy: "104393",
      submittedAt: "2026-09-24T09:30:00+06:00",
      isDeleted: false,
      sheetsSyncStatus: "Pending"
    },
    {
      fileId: "RM-2026-00103",
      customerName: "Mehedi Hasan Chowdhury",
      companyName: "Apex Footwear Ltd",
      officeAddress: "House 6, Road 137, Gulshan-1, Dhaka-1212",
      mobile: "01912556677",
      rmCode: "104393",
      rmName: "Tanvir Ahmed",
      productType: "B2B",
      applicationStatus: "Query",
      activeStatus: "N",
      pendingDocuments: ["BIN", "Trade License 2025-26"],
      remarks: "Credit query raised: Updated Trade License renewal copy required.",
      cpvStatus: "Completed",
      cpvDate: "2026-09-21",
      cpvAddress: "House 6, Road 137, Gulshan-1, Dhaka-1212",
      cpvRemarks: "Business outlet confirmed.",
      createdAt: "2026-09-21T11:45:00+06:00",
      updatedAt: "2026-09-23T16:20:00+06:00",
      createdBy: "104393",
      updatedBy: "Admin0",
      submittedAt: "2026-09-21T15:00:00+06:00",
      isDeleted: false,
      sheetsSyncStatus: "Pending"
    },
    {
      fileId: "RM-2026-00104",
      customerName: "Rafiqul Islam",
      companyName: "Akij Food & Beverage Ltd",
      officeAddress: "Akij House, 198 Bir Uttam Mir Shawkat Sarak, Tejgaon, Dhaka",
      mobile: "01715889900",
      rmCode: "105210",
      rmName: "Nusrat Jahan",
      productType: "Limit Enhancement",
      applicationStatus: "Approved",
      activeStatus: "Y",
      pendingDocuments: [],
      remarks: "Limit enhanced from 300K to 600K BDT based on excellent credit turnover.",
      cpvStatus: "Not Required",
      createdAt: "2026-09-15T14:10:00+06:00",
      updatedAt: "2026-09-18T10:00:00+06:00",
      createdBy: "105210",
      updatedBy: "105210",
      submittedAt: "2026-09-15T16:00:00+06:00",
      approvedAt: "2026-09-18T10:00:00+06:00",
      isDeleted: false,
      sheetsSyncStatus: "Pending"
    },
    {
      fileId: "RM-2026-00105",
      customerName: "Anowar Hossain",
      companyName: "Walton Hi-Tech Industries PLC",
      officeAddress: "Plot 1088, Block I, Sabrina Sobhan Road, Bashundhara R/A, Dhaka",
      mobile: "01611778899",
      rmCode: "105210",
      rmName: "Nusrat Jahan",
      productType: "Credit Card",
      applicationStatus: "Condition",
      activeStatus: "N",
      pendingDocuments: ["Salary Certificate"],
      remarks: "Approved subject to lien on DPS or official salary certificate submission.",
      cpvStatus: "Completed",
      cpvDate: "2026-09-23",
      cpvAddress: "Bashundhara R/A, Dhaka",
      cpvRemarks: "Residence & Office confirmed.",
      createdAt: "2026-09-22T09:30:00+06:00",
      updatedAt: "2026-09-25T11:00:00+06:00",
      createdBy: "105210",
      updatedBy: "105210",
      submittedAt: "2026-09-22T14:00:00+06:00",
      isDeleted: false,
      sheetsSyncStatus: "Pending"
    },
    {
      fileId: "RM-2026-00106",
      customerName: "Syed Tariqul Bashar",
      companyName: "Pran-RFL Centre",
      officeAddress: "105 Middle Badda, Dhaka-1212",
      mobile: "01817112233",
      rmCode: "106880",
      rmName: "Kamrul Hasan",
      productType: "Split",
      applicationStatus: "STC",
      activeStatus: "N",
      pendingDocuments: ["Card Copy"],
      remarks: "Primary credit card split application processed.",
      cpvStatus: "Not Required",
      createdAt: "2026-09-25T11:15:00+06:00",
      updatedAt: "2026-09-25T11:15:00+06:00",
      createdBy: "106880",
      updatedBy: "106880",
      submittedAt: "2026-09-25T11:15:00+06:00",
      isDeleted: false,
      sheetsSyncStatus: "Pending"
    }
  ];
  const defaultSettings = {
    appName: "RM File Management & Team Member Data System",
    teamName: "Core Business Team",
    productTypes: ["Credit Card", "B2B", "Corporate Card", "Split", "Limit Enhancement"],
    pendingDocOptions: [
      "NID",
      "TIN",
      "Office ID",
      "Salary Certificate",
      "BS (Bank Statement)",
      "BIN",
      "Trade License 2024-25",
      "Trade License 2025-26",
      "Trade License 2026-27",
      "Loan Certificate",
      "Card Statement (Month)",
      "Card Copy"
    ],
    applicationStatuses: [
      "Collected",
      "Submitted",
      "Declined",
      "Return to Source",
      "Approved",
      "Query",
      "Condition",
      "STC"
    ],
    reportingWeekStart: "Saturday",
    googleSpreadsheetId: "1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI",
    appsScriptWebAppUrl: "https://script.google.com/macros/s/AKfycby3wqRoiAtJx9ujAln9n8mFkmFTN1K0ncgQGpYeDMsx4OPcBaCbK78sHhnvvqqs6aue/exec",
    appsScriptSecretToken: "RM_TEAM_SYNC_2026_SECURE_TOKEN_#99",
    syncIntervalMinutes: 5,
    lastSyncStatus: "Idle",
    updatedBy: "System",
    updatedAt: now
  };
  const initialAudit = [
    {
      id: "log_boot_001",
      userId: "usr_admin0",
      username: "Admin0",
      role: "Admin",
      action: "LOGIN",
      timestamp: now,
      details: "System initialized with secure role-based partitions and initial bootstrap accounts."
    }
  ];
  return {
    users,
    customerFiles: defaultFiles,
    attachments: [],
    auditLogs: initialAudit,
    settings: defaultSettings
  };
}
var DatabaseManager = class {
  constructor() {
    this.data = this.loadDatabase();
  }
  loadDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.customerFiles && parsed.settings) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading db.json, generating defaults:", e);
    }
    const initial = createInitialDatabase();
    this.saveDatabase(initial);
    return initial;
  }
  saveDatabase(dataToSave = this.data) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), "utf-8");
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error("Error persisting database to disk:", e);
    }
  }
  // Users & Auth
  getUsers() {
    return this.data.users;
  }
  getUserByUsername(username) {
    return this.data.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  }
  getUserById(id) {
    return this.data.users.find((u) => u.id === id);
  }
  getUserByRmCode(rmCode) {
    return this.data.users.find((u) => u.rmCode === rmCode);
  }
  updateUser(id, updates) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return void 0;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.saveDatabase();
    return this.data.users[idx];
  }
  createUser(user) {
    this.data.users.push(user);
    this.saveDatabase();
    return user;
  }
  // Customer Files
  getCustomerFiles(includeDeleted = false) {
    if (includeDeleted) return this.data.customerFiles;
    return this.data.customerFiles.filter((f) => !f.isDeleted);
  }
  getCustomerFileById(fileId) {
    return this.data.customerFiles.find((f) => f.fileId === fileId);
  }
  createCustomerFile(file) {
    this.data.customerFiles.unshift(file);
    this.saveDatabase();
    return file;
  }
  updateCustomerFile(fileId, updates) {
    const idx = this.data.customerFiles.findIndex((f) => f.fileId === fileId);
    if (idx === -1) return void 0;
    const existing = this.data.customerFiles[idx];
    this.data.customerFiles[idx] = {
      ...existing,
      ...updates,
      fileId: existing.fileId,
      createdAt: existing.createdAt,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.saveDatabase();
    return this.data.customerFiles[idx];
  }
  softDeleteCustomerFile(fileId, deletedBy) {
    const idx = this.data.customerFiles.findIndex((f) => f.fileId === fileId);
    if (idx === -1) return false;
    this.data.customerFiles[idx].isDeleted = true;
    this.data.customerFiles[idx].deletedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.data.customerFiles[idx].deletedBy = deletedBy;
    this.data.customerFiles[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.saveDatabase();
    return true;
  }
  permanentDeleteCustomerFile(fileId) {
    const idx = this.data.customerFiles.findIndex((f) => f.fileId === fileId);
    if (idx === -1) return false;
    this.data.customerFiles.splice(idx, 1);
    this.saveDatabase();
    return true;
  }
  // Attachments
  addAttachment(attachment) {
    this.data.attachments.push(attachment);
    this.saveDatabase();
    return attachment;
  }
  getAttachmentsByFileId(fileId) {
    return this.data.attachments.filter((a) => a.fileId === fileId);
  }
  getAttachmentById(id) {
    return this.data.attachments.find((a) => a.id === id);
  }
  deleteAttachment(id) {
    const idx = this.data.attachments.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    const item = this.data.attachments[idx];
    try {
      const filePath = path.join(ATTACHMENTS_DIR, item.diskFileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error("Error removing file from disk:", e);
    }
    this.data.attachments.splice(idx, 1);
    this.saveDatabase();
    return true;
  }
  // Settings
  getSettings() {
    return this.data.settings;
  }
  updateSettings(updates) {
    this.data.settings = { ...this.data.settings, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.saveDatabase();
    return this.data.settings;
  }
  // Location Monitoring
  recordUserLocation(loc) {
    if (!this.data.userLocations) {
      this.data.userLocations = [];
    }
    this.data.userLocations.unshift(loc);
    if (this.data.userLocations.length > 500) {
      this.data.userLocations.pop();
    }
    this.saveDatabase();
    return loc;
  }
  getLatestUserLocations() {
    if (!this.data.userLocations) return [];
    const map = /* @__PURE__ */ new Map();
    for (const loc of this.data.userLocations) {
      const key = loc.rmCode || loc.username;
      if (!map.has(key)) {
        map.set(key, loc);
      }
    }
    return Array.from(map.values());
  }
  getAllUserLocations() {
    return this.data.userLocations || [];
  }
  // Audit Logs
  addAuditLog(entry) {
    const log = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 1e3) {
      this.data.auditLogs.pop();
    }
    this.saveDatabase();
    return log;
  }
  getAuditLogs() {
    return this.data.auditLogs;
  }
  // Notifications for RMs
  addNotification(entry) {
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    const notif = {
      ...entry,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      isRead: false
    };
    this.data.notifications.unshift(notif);
    if (this.data.notifications.length > 300) {
      this.data.notifications.pop();
    }
    this.saveDatabase();
    return notif;
  }
  getNotificationsForUser(rmCodeOrRole, isElevated = false) {
    if (!this.data.notifications) return [];
    if (isElevated) {
      return this.data.notifications;
    }
    return this.data.notifications.filter((n) => n.recipientRmCode === rmCodeOrRole);
  }
  markNotificationAsRead(id) {
    if (!this.data.notifications) return false;
    const target = this.data.notifications.find((n) => n.id === id);
    if (target) {
      target.isRead = true;
      this.saveDatabase();
      return true;
    }
    return false;
  }
  markAllNotificationsAsRead(rmCodeOrRole, isElevated = false) {
    if (!this.data.notifications) return false;
    let changed = false;
    for (const n of this.data.notifications) {
      if (isElevated || n.recipientRmCode === rmCodeOrRole) {
        if (!n.isRead) {
          n.isRead = true;
          changed = true;
        }
      }
    }
    if (changed) {
      this.saveDatabase();
    }
    return true;
  }
  deleteNotification(id) {
    if (!this.data.notifications) return false;
    const initialLen = this.data.notifications.length;
    this.data.notifications = this.data.notifications.filter((n) => n.id !== id);
    if (this.data.notifications.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }
  // Mobile SMS Dispatch Logging
  addSmsLog(entry) {
    if (!this.data.smsLogs) {
      this.data.smsLogs = [];
    }
    const log = {
      ...entry,
      id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.smsLogs.unshift(log);
    if (this.data.smsLogs.length > 300) {
      this.data.smsLogs.pop();
    }
    this.saveDatabase();
    return log;
  }
  getSmsLogs(rmCode) {
    if (!this.data.smsLogs) return [];
    if (rmCode && rmCode !== "all") {
      return this.data.smsLogs.filter((s) => s.recipientRmCode === rmCode);
    }
    return this.data.smsLogs;
  }
};
var db = new DatabaseManager();

// server/middleware/auth.ts
import crypto2 from "crypto";
var TOKEN_SECRET = process.env.SESSION_SECRET || "TEAM_MEMBER_SYSTEM_SECRET_KEY_2026_DHAKA";
function generateToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    rmCode: user.rmCode,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1e3
    // 24 hours
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto2.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}
function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    const expected = crypto2.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64url");
    if (signature !== expected) return null;
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (decoded.exp && Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Unauthorized: Session expired or invalid" });
  }
  const user = db.getUserById(decoded.sub);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: User record not found" });
  }
  if (user.status !== "Active") {
    return res.status(403).json({ error: `Account is ${user.status}. Please contact bank administrator.` });
  }
  req.user = user;
  next();
}
function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient privileges for this operation" });
    }
    next();
  };
}
function requireAdminOrMentor(req, res, next) {
  return requireRoles(["Admin", "Mentor"])(req, res, next);
}

// server/routes/auth.ts
var router = Router();
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const user = db.getUserByUsername(String(username).trim());
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  if (user.status !== "Active") {
    return res.status(403).json({ error: `Account is ${user.status}. Please contact bank administrator.` });
  }
  const isValid = verifyPassword(String(password), user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.updateUser(user.id, { lastLogin: now });
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: user.rmCode,
    action: "LOGIN",
    details: `User ${user.username} (${user.role}) logged in successfully`
  });
  const token = generateToken(user);
  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      rmCode: user.rmCode,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      lastLogin: now
    }
  });
});
router.get("/me", requireAuth, (req, res) => {
  const user = req.user;
  return res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      rmCode: user.rmCode,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
});
router.post("/change-password", requireAuth, (req, res) => {
  const user = req.user;
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters long" });
  }
  if (!user.mustChangePassword) {
    if (!currentPassword || !verifyPassword(currentPassword, user.passwordHash, user.salt)) {
      return res.status(400).json({ error: "Current password does not match" });
    }
  }
  const { hash, salt } = hashPassword(newPassword);
  db.updateUser(user.id, {
    passwordHash: hash,
    salt,
    mustChangePassword: false
  });
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: user.rmCode,
    action: "PASSWORD_CHANGE",
    details: `User ${user.username} successfully updated their password`
  });
  return res.json({ success: true, message: "Password updated successfully" });
});
var auth_default = router;

// server/routes/files.ts
import { Router as Router2 } from "express";
import fs2 from "fs";
import path2 from "path";
import crypto3 from "crypto";

// server/sheetsSync.ts
var SheetsSyncService = class {
  static {
    this.workerRunning = false;
  }
  static {
    this.syncIntervalTimer = null;
  }
  /**
   * Helper to perform authenticated request to Google Apps Script Web App
   * Handles POST with redirect: 'follow', plus GET fallback.
   */
  static async postToAppsScript(action, payload) {
    const settings = db.getSettings();
    const url = settings.appsScriptWebAppUrl?.trim() || process.env.APPS_SCRIPT_URL?.trim() || process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
    const token = settings.appsScriptSecretToken || "EBL_RM_SYNC_2026_SECURE_TOKEN_#99";
    if (!url) {
      throw new Error("Google Apps Script Web App URL is not configured. Please paste your deployed Web App URL in App Settings or Google Sheets panel.");
    }
    const body = {
      action,
      token,
      spreadsheetId: settings.googleSpreadsheetId || "1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI",
      ...payload
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25e3);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain"
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        redirect: "follow"
      });
      clearTimeout(timeout);
      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        if (text.includes('"success":true') || text.includes("success")) {
          json = { success: true, message: "Google Sheets operation accepted" };
        } else {
          json = { success: false, error: text.slice(0, 150) };
        }
      }
      return json;
    } catch (err) {
      clearTimeout(timeout);
      try {
        const queryParams = new URLSearchParams({
          action,
          token,
          data: JSON.stringify(payload.data || payload)
        });
        const getUrl = `${url}${url.includes("?") ? "&" : "?"}${queryParams.toString()}`;
        const getRes = await fetch(getUrl, {
          method: "GET",
          headers: { "Accept": "application/json" },
          redirect: "follow"
        });
        const getText = await getRes.text();
        return JSON.parse(getText);
      } catch {
        throw err;
      }
    }
  }
  /**
   * Test connection to Apps Script
   */
  static async testConnection(url, token) {
    const settings = db.getSettings();
    const targetUrl = url || settings.appsScriptWebAppUrl?.trim();
    const targetToken = token || settings.appsScriptSecretToken || "EBL_RM_SYNC_2026_SECURE_TOKEN_#99";
    if (!targetUrl) {
      return {
        success: false,
        message: "No Google Apps Script Web App URL provided."
      };
    }
    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
        redirect: "follow"
      });
      if (!response.ok) {
        return {
          success: false,
          message: `Endpoint returned HTTP ${response.status}`,
          error: response.statusText
        };
      }
      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { info: text };
      }
      return {
        success: true,
        message: `Successfully connected to Google Spreadsheet: ${data.spreadsheetName || settings.googleSpreadsheetId}`,
        details: data,
        syncedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (err) {
      return {
        success: false,
        message: "Failed to contact Apps Script endpoint",
        error: err.message
      };
    }
  }
  /**
   * Automatically create all 5 tabs and styled header rows in the Google Sheet
   */
  static async initSheets(url, token) {
    const settings = db.getSettings();
    const targetUrl = url || settings.appsScriptWebAppUrl?.trim();
    const targetToken = token || settings.appsScriptSecretToken || "EBL_RM_SYNC_2026_SECURE_TOKEN_#99";
    if (!targetUrl) {
      return {
        success: false,
        message: "No Apps Script Web App URL provided."
      };
    }
    try {
      const getUrl = `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}action=initSheets&token=${encodeURIComponent(targetToken)}`;
      const response = await fetch(getUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
        redirect: "follow"
      });
      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
      return {
        success: data.success !== false,
        message: data.message || "All 5 Sheets & headers successfully initialized in Google Sheets!",
        details: data.log || data.sheets || data,
        syncedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (err) {
      return {
        success: false,
        message: "Failed to initialize sheets",
        error: err.message
      };
    }
  }
  /**
   * AUTOMATIC REAL-TIME SYNC: Sync a single customer file immediately on create or update
   */
  static async syncFile(file) {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      db.updateCustomerFile(file.fileId, { sheetsSyncStatus: "Pending" });
      return {
        success: false,
        message: "Apps Script URL not configured yet. File queued for automatic sync."
      };
    }
    try {
      const res = await this.postToAppsScript("syncCustomerFile", { data: file });
      if (res.success) {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        db.updateCustomerFile(file.fileId, {
          sheetsSyncStatus: "Synced",
          sheetsSyncedAt: now
        });
        db.updateSettings({
          lastSyncStatus: "Success",
          lastSuccessfulSync: now
        });
        return {
          success: true,
          message: `Auto-synced file ${file.fileId} to Google Sheets (${res.action || "updated"})`,
          syncedAt: now
        };
      } else {
        throw new Error(res.error || "Apps Script sync returned error");
      }
    } catch (err) {
      db.updateCustomerFile(file.fileId, {
        sheetsSyncStatus: "Pending"
        // keep pending for auto-retry
      });
      console.warn(`[Auto-Sync] Notice: Background sync for file ${file.fileId} will auto-retry (${err.message})`);
      return {
        success: false,
        message: `Sync queued for file ${file.fileId}`,
        error: err.message
      };
    }
  }
  /**
   * AUTOMATIC REAL-TIME SYNC: Delete file in Google Sheets immediately
   */
  static async deleteFile(fileId) {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return { success: false, message: "Apps Script URL not set." };
    }
    try {
      const res = await this.postToAppsScript("deleteCustomerFile", { fileId });
      return {
        success: res.success,
        message: res.success ? `Auto-updated delete flag for file ${fileId} in Google Sheets` : res.error
      };
    } catch (err) {
      return {
        success: false,
        message: `Error updating delete flag for ${fileId} in Google Sheets`,
        error: err.message
      };
    }
  }
  /**
   * AUTOMATIC REAL-TIME SYNC: Sync RM profile immediately
   */
  static async syncRM(rm) {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return { success: false, message: "Apps Script URL not set." };
    }
    try {
      const res = await this.postToAppsScript("syncRM", { data: rm });
      return {
        success: res.success,
        message: res.success ? `Auto-synced RM ${rm.rmCode} to Google Sheets` : res.error
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to auto-sync RM ${rm.rmCode}`,
        error: err.message
      };
    }
  }
  /**
   * AUTOMATIC REAL-TIME SYNC: Sync Attachment record to File_Attachments sheet
   */
  static async syncAttachment(att) {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return { success: false, message: "Apps Script URL not set." };
    }
    try {
      const res = await this.postToAppsScript("syncAttachment", { data: att });
      return {
        success: res.success,
        message: res.success ? `Auto-synced attachment ${att.fileName} to Google Sheets` : res.error
      };
    } catch (err) {
      return {
        success: false,
        message: `Failed to sync attachment to Google Sheets`,
        error: err.message
      };
    }
  }
  /**
   * Batch synchronize all files and RM records
   */
  static async batchSyncAll() {
    const settings = db.getSettings();
    if (!settings.appsScriptWebAppUrl) {
      return {
        success: false,
        message: "Google Apps Script Web App URL is not configured. Please paste your deployed Web App URL in App Settings or Sheets Sync panel."
      };
    }
    db.updateSettings({
      lastSyncStatus: "InProgress",
      lastSyncAttempt: (/* @__PURE__ */ new Date()).toISOString()
    });
    try {
      const allFiles = db.getCustomerFiles(true);
      const allUsers = db.getUsers().filter((u) => u.role === "RM");
      const rms = allUsers.map((u) => ({
        rmCode: u.rmCode || u.username,
        rmName: u.name,
        mobile: u.mobile,
        email: u.email,
        officeAddress: "Main Office",
        accountStatus: u.status,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        authUid: u.id
      }));
      const res = await this.postToAppsScript("batchSync", {
        files: allFiles,
        rms
      });
      if (res.success) {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        allFiles.forEach((f) => {
          db.updateCustomerFile(f.fileId, {
            sheetsSyncStatus: "Synced",
            sheetsSyncedAt: now
          });
        });
        db.updateSettings({
          lastSyncStatus: "Success",
          lastSuccessfulSync: now,
          lastSyncError: void 0
        });
        return {
          success: true,
          message: `Synchronized ${allFiles.length} files and ${rms.length} RMs automatically to Google Sheets`,
          details: res,
          syncedAt: now
        };
      } else {
        throw new Error(res.error || "Apps Script reported sync error");
      }
    } catch (err) {
      db.updateSettings({
        lastSyncStatus: "Error",
        lastSyncError: err.message
      });
      return {
        success: false,
        message: "Batch sync failed",
        error: err.message
      };
    }
  }
  /**
   * Automatic Background Worker:
   * Periodically checks for any unsynced or pending files and synchronizes them to Google Sheets automatically!
   */
  static startAutoSyncWorker(intervalMs = 3e4) {
    if (this.workerRunning) return;
    this.workerRunning = true;
    this.syncIntervalTimer = setInterval(async () => {
      const settings = db.getSettings();
      if (!settings.appsScriptWebAppUrl) return;
      const pendingFiles = db.getCustomerFiles(true).filter(
        (f) => f.sheetsSyncStatus === "Pending" || f.sheetsSyncStatus === "Failed"
      );
      if (pendingFiles.length > 0) {
        console.log(`[Auto-Sync Worker] Automatically synchronizing ${pendingFiles.length} pending files to Google Sheets...`);
        for (const file of pendingFiles.slice(0, 10)) {
          try {
            await this.syncFile(file);
          } catch {
          }
        }
      }
    }, intervalMs);
  }
};

// server/smsService.ts
var SMSService = class {
  /**
   * Dispatch an SMS notification to the RM's mobile number
   */
  static async sendRMAlertSMS(params) {
    const { recipientRmCode, fileId, customerName, action, performedByName, performedByRole, details } = params;
    const rmUser = db.getUserByRmCode(recipientRmCode) || db.getUserByUsername(recipientRmCode);
    const recipientMobile = rmUser?.mobile || "+8801711000000";
    const recipientName = rmUser?.name || `RM ${recipientRmCode}`;
    const smsMessage = action === "DELETE" ? `[EBL ALERT] RM ${recipientRmCode}: Your file ${fileId} (${customerName}) has been deleted by ${performedByRole} (${performedByName}).` : `[EBL ALERT] RM ${recipientRmCode}: File ${fileId} (${customerName}) updated by ${performedByRole} (${performedByName}). ${details.substring(0, 60)}`;
    const settings = db.getSettings();
    let status = "Delivered";
    let gateway = "BANGLADESH_MOBILE_SMS";
    if (settings.smsGatewayUrl && settings.smsGatewayUrl.trim().startsWith("http")) {
      try {
        gateway = new URL(settings.smsGatewayUrl).hostname || "CUSTOM_GATEWAY";
        await fetch(settings.smsGatewayUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipientMobile,
            message: smsMessage,
            senderId: settings.smsSenderId || "EBL_TEAM"
          })
        });
        status = "Delivered";
      } catch (e) {
        console.error("External SMS Gateway dispatch error:", e);
        status = "Sent";
      }
    }
    const log = db.addSmsLog({
      recipientMobile,
      recipientRmCode,
      recipientName,
      fileId,
      message: smsMessage,
      status,
      gateway
    });
    return log;
  }
};

// server/routes/files.ts
var router2 = Router2();
function generateFileId() {
  const all = db.getCustomerFiles(true);
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  let maxSeq = 100;
  all.forEach((f) => {
    const match = f.fileId.match(/(?:RM|FILE|DOC)-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  const nextSeq = String(maxSeq + 1).padStart(5, "0");
  return `RM-${year}-${nextSeq}`;
}
router2.get("/", requireAuth, (req, res) => {
  const user = req.user;
  const {
    search,
    productType,
    applicationStatus,
    activeStatus,
    cpvStatus,
    pendingDoc,
    startDate,
    endDate,
    rmCode,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = "1",
    limit = "50",
    includeDeleted = "false"
  } = req.query;
  let files = db.getCustomerFiles(includeDeleted === "true" && user.role !== "RM");
  if (user.role === "RM") {
    const userRmCode = user.rmCode || user.username;
    files = files.filter((f) => f.rmCode === userRmCode);
  } else if (rmCode && rmCode !== "all") {
    files = files.filter((f) => f.rmCode === rmCode);
  }
  if (productType && productType !== "all") {
    files = files.filter((f) => f.productType === productType);
  }
  if (applicationStatus && applicationStatus !== "all") {
    files = files.filter((f) => f.applicationStatus === applicationStatus);
  }
  if (activeStatus && activeStatus !== "all") {
    files = files.filter((f) => f.activeStatus === activeStatus);
  }
  if (cpvStatus && cpvStatus !== "all") {
    files = files.filter((f) => f.cpvStatus === cpvStatus);
  }
  if (pendingDoc && pendingDoc !== "all") {
    if (pendingDoc === "has_pending" || pendingDoc === "ANY") {
      files = files.filter((f) => f.pendingDocuments && f.pendingDocuments.length > 0);
    } else {
      files = files.filter((f) => f.pendingDocuments && f.pendingDocuments.includes(pendingDoc));
    }
  }
  if (startDate) {
    const start = new Date(startDate).getTime();
    files = files.filter((f) => new Date(f.createdAt).getTime() >= start);
  }
  if (endDate) {
    const end = new Date(endDate).getTime();
    files = files.filter((f) => new Date(f.createdAt).getTime() <= end);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    files = files.filter((f) => {
      return f.customerName?.toLowerCase().includes(q) || f.ccNumber?.toLowerCase().includes(q) || f.mobile?.toLowerCase().includes(q) || f.companyName?.toLowerCase().includes(q) || f.fileId?.toLowerCase().includes(q) || f.officeAddress?.toLowerCase().includes(q) || f.productType?.toLowerCase().includes(q) || f.applicationStatus?.toLowerCase().includes(q) || user.role !== "RM" && f.rmCode?.toLowerCase().includes(q);
    });
  }
  files.sort((a, b) => {
    let valA = a[sortBy] || "";
    let valB = b[sortBy] || "";
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  const isMentor = user.role === "Mentor";
  const enriched = files.map((f) => {
    const atts = db.getAttachmentsByFileId(f.fileId);
    const item = {
      ...f,
      attachments: atts.map((a) => ({
        id: a.id,
        fileId: a.fileId,
        category: a.category,
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
        uploadedBy: a.uploadedBy,
        uploadedAt: a.uploadedAt
      }))
    };
    if (!isMentor) {
      delete item.locationLat;
      delete item.locationLng;
      delete item.locationAddress;
      delete item.locationCapturedAt;
    }
    return item;
  });
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit, 10) || 50);
  const total = enriched.length;
  const paginated = enriched.slice((pageNum - 1) * pageSize, pageNum * pageSize);
  return res.json({
    data: paginated,
    pagination: {
      total,
      page: pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  });
});
router2.get("/:fileId", requireAuth, (req, res) => {
  const user = req.user;
  const file = db.getCustomerFileById(req.params.fileId);
  if (!file) {
    return res.status(404).json({ error: "Customer file not found" });
  }
  if (user.role === "RM" && file.rmCode !== (user.rmCode || user.username)) {
    return res.status(403).json({ error: "Forbidden: You can only view your own customer records" });
  }
  const atts = db.getAttachmentsByFileId(file.fileId);
  const result = {
    ...file,
    attachments: atts.map((a) => ({
      id: a.id,
      fileId: a.fileId,
      category: a.category,
      fileName: a.fileName,
      fileType: a.fileType,
      fileSize: a.fileSize,
      uploadedBy: a.uploadedBy,
      uploadedAt: a.uploadedAt
    }))
  };
  if (user.role !== "Mentor") {
    delete result.locationLat;
    delete result.locationLng;
    delete result.locationAddress;
    delete result.locationCapturedAt;
  }
  return res.json(result);
});
router2.post("/", requireAuth, async (req, res) => {
  const user = req.user;
  const body = req.body;
  if (!body.customerName || !body.companyName || !body.officeAddress || !body.mobile || !body.productType || !body.applicationStatus) {
    return res.status(400).json({ error: "Please provide all required fields" });
  }
  let assignedRmCode = user.role === "RM" ? user.rmCode || user.username : body.rmCode;
  if (!assignedRmCode) {
    assignedRmCode = user.username;
  }
  const rmUser = db.getUserByRmCode(assignedRmCode) || db.getUserByUsername(assignedRmCode);
  const rmName = rmUser ? rmUser.name : `RM ${assignedRmCode}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const fileId = body.fileId || generateFileId();
  const lat = typeof body.locationLat === "number" ? body.locationLat : body.locationLat ? parseFloat(body.locationLat) : void 0;
  const lng = typeof body.locationLng === "number" ? body.locationLng : body.locationLng ? parseFloat(body.locationLng) : void 0;
  const newFile = {
    fileId,
    ccNumber: body.ccNumber ? String(body.ccNumber).trim() : void 0,
    customerName: String(body.customerName).trim(),
    companyName: String(body.companyName).trim(),
    officeAddress: String(body.officeAddress).trim(),
    mobile: String(body.mobile).trim(),
    altMobile: body.altMobile ? String(body.altMobile).trim() : void 0,
    email: body.email ? String(body.email).trim() : void 0,
    rmCode: assignedRmCode,
    rmName,
    productType: body.productType,
    applicationStatus: body.applicationStatus,
    activeStatus: body.activeStatus || "N",
    pendingDocuments: Array.isArray(body.pendingDocuments) ? body.pendingDocuments : [],
    remarks: body.remarks || "",
    // Entry location tracking (stored in database, visible ONLY to Mentor)
    locationAddress: body.locationAddress ? String(body.locationAddress).trim() : void 0,
    locationLat: lat,
    locationLng: lng,
    locationCapturedAt: lat || body.locationAddress ? now : void 0,
    // CPV
    cpvStatus: body.cpvStatus || "Pending",
    cpvDate: body.cpvDate || void 0,
    cpvAddress: body.cpvAddress || void 0,
    cpvRemarks: body.cpvRemarks || void 0,
    cpvLastUpdatedBy: user.username,
    createdAt: now,
    updatedAt: now,
    createdBy: user.username,
    updatedBy: user.username,
    submittedAt: body.applicationStatus === "Submitted" ? now : void 0,
    approvedAt: body.applicationStatus === "Approved" ? now : void 0,
    isDeleted: false,
    sheetsSyncStatus: "Pending"
  };
  const created = db.createCustomerFile(newFile);
  if (lat && lng) {
    db.recordUserLocation({
      userId: user.id,
      username: user.username,
      rmCode: assignedRmCode,
      name: user.name,
      role: user.role,
      latitude: lat,
      longitude: lng,
      address: newFile.locationAddress || "Field Entry Location",
      timestamp: now,
      actionContext: `Created file ${newFile.fileId} (${newFile.customerName})`
    });
  }
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: "CREATE",
    fileId: created.fileId,
    rmCode: assignedRmCode,
    details: `Created customer file ${created.fileId} for ${created.customerName} (${created.productType})`
  });
  SheetsSyncService.syncFile(created).catch((e) => console.error("Background Sheets Sync failed:", e));
  return res.status(201).json(created);
});
router2.put("/:fileId", requireAuth, async (req, res) => {
  const user = req.user;
  const fileId = req.params.fileId;
  const existing = db.getCustomerFileById(fileId);
  if (!existing) {
    return res.status(404).json({ error: "Customer file not found" });
  }
  if (user.role === "RM") {
    const userRmCode = user.rmCode || user.username;
    if (existing.rmCode !== userRmCode) {
      return res.status(403).json({ error: "Forbidden: You can only edit your own customer files" });
    }
  }
  const body = req.body;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let submittedAt = existing.submittedAt;
  if (body.applicationStatus === "Submitted" && existing.applicationStatus !== "Submitted" && !submittedAt) {
    submittedAt = now;
  }
  let approvedAt = existing.approvedAt;
  if (body.applicationStatus === "Approved" && existing.applicationStatus !== "Approved" && !approvedAt) {
    approvedAt = now;
  }
  const updates = {
    customerName: body.customerName !== void 0 ? String(body.customerName).trim() : existing.customerName,
    ccNumber: body.ccNumber !== void 0 ? String(body.ccNumber).trim() : existing.ccNumber,
    companyName: body.companyName !== void 0 ? String(body.companyName).trim() : existing.companyName,
    officeAddress: body.officeAddress !== void 0 ? String(body.officeAddress).trim() : existing.officeAddress,
    mobile: body.mobile !== void 0 ? String(body.mobile).trim() : existing.mobile,
    altMobile: body.altMobile !== void 0 ? String(body.altMobile).trim() : existing.altMobile,
    email: body.email !== void 0 ? String(body.email).trim() : existing.email,
    productType: body.productType || existing.productType,
    applicationStatus: body.applicationStatus || existing.applicationStatus,
    activeStatus: body.activeStatus || existing.activeStatus,
    pendingDocuments: Array.isArray(body.pendingDocuments) ? body.pendingDocuments : existing.pendingDocuments,
    remarks: body.remarks !== void 0 ? body.remarks : existing.remarks,
    // CPV updates
    cpvStatus: body.cpvStatus || existing.cpvStatus,
    cpvDate: body.cpvDate !== void 0 ? body.cpvDate : existing.cpvDate,
    cpvAddress: body.cpvAddress !== void 0 ? body.cpvAddress : existing.cpvAddress,
    cpvRemarks: body.cpvRemarks !== void 0 ? body.cpvRemarks : existing.cpvRemarks,
    cpvLastUpdatedBy: user.username,
    submittedAt,
    approvedAt,
    updatedBy: user.username,
    updatedAt: now
  };
  if (user.role !== "RM" && body.rmCode && body.rmCode !== existing.rmCode) {
    updates.rmCode = body.rmCode;
    const rmUser = db.getUserByRmCode(body.rmCode) || db.getUserByUsername(body.rmCode);
    updates.rmName = rmUser ? rmUser.name : `RM ${body.rmCode}`;
  }
  const updated = db.updateCustomerFile(fileId, updates);
  if (!updated) {
    return res.status(500).json({ error: "Failed to update customer file" });
  }
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: "UPDATE",
    fileId: updated.fileId,
    rmCode: updated.rmCode,
    details: `Updated file ${updated.fileId}. Status: ${updated.applicationStatus}, Active: ${updated.activeStatus}`
  });
  if ((user.role === "Admin" || user.role === "Mentor") && existing.rmCode) {
    const changes = [];
    if (existing.applicationStatus !== updated.applicationStatus) {
      changes.push(`Status changed from "${existing.applicationStatus}" to "${updated.applicationStatus}"`);
    }
    if (existing.activeStatus !== updated.activeStatus) {
      changes.push(`Active card changed from "${existing.activeStatus}" to "${updated.activeStatus}"`);
    }
    if (existing.remarks !== updated.remarks && updated.remarks) {
      changes.push(`Remarks: "${updated.remarks.substring(0, 60)}"`);
    }
    if (JSON.stringify(existing.pendingDocuments || []) !== JSON.stringify(updated.pendingDocuments || [])) {
      changes.push(`Pending documents: ${updated.pendingDocuments?.length || 0} docs`);
    }
    const changeSummary = changes.length > 0 ? changes.join(" \u2022 ") : "Portfolio file details updated by supervisor.";
    db.addNotification({
      recipientRmCode: existing.rmCode,
      fileId: updated.fileId,
      customerName: updated.customerName,
      action: "UPDATE",
      performedBy: user.username,
      performedByName: user.name || (user.role === "Admin" ? "System Administrator" : "Senior Team Mentor"),
      performedByRole: user.role,
      title: `TAT ID: ${updated.fileId} \u2022 File Changed`,
      message: `File: "${updated.customerName}" | Change: ${changeSummary}`,
      metadata: {
        oldValue: existing.applicationStatus,
        newValue: updated.applicationStatus
      }
    });
    SMSService.sendRMAlertSMS({
      recipientRmCode: existing.rmCode,
      fileId: updated.fileId,
      customerName: updated.customerName,
      action: "UPDATE",
      performedByName: user.name || (user.role === "Admin" ? "System Administrator" : "Senior Team Mentor"),
      performedByRole: user.role,
      details: `TAT ID: ${updated.fileId} | File: ${updated.customerName} | Changed: ${changeSummary}`
    }).catch((e) => console.error("SMS Alert dispatch failed:", e));
  }
  SheetsSyncService.syncFile(updated).catch((e) => console.error("Background Sheets Sync failed:", e));
  const resUpdated = { ...updated };
  if (user.role !== "Mentor") {
    delete resUpdated.locationLat;
    delete resUpdated.locationLng;
    delete resUpdated.locationAddress;
    delete resUpdated.locationCapturedAt;
  }
  return res.json(resUpdated);
});
router2.delete("/:fileId", requireAuth, async (req, res) => {
  const user = req.user;
  const fileId = req.params.fileId;
  if (user.role === "RM") {
    return res.status(403).json({ error: "Forbidden: RM users are not authorized to delete customer records" });
  }
  const existing = db.getCustomerFileById(fileId);
  if (!existing) {
    return res.status(404).json({ error: "Customer file not found" });
  }
  const isPermanent = req.query.permanent === "true" && user.role === "Mentor";
  if (isPermanent) {
    db.permanentDeleteCustomerFile(fileId);
    db.addAuditLog({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: "DELETE",
      fileId,
      rmCode: existing.rmCode,
      details: `PERMANENTLY deleted file ${fileId} (${existing.customerName}) by Mentor`
    });
  } else {
    db.softDeleteCustomerFile(fileId, user.username);
    db.addAuditLog({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: "DELETE",
      fileId,
      rmCode: existing.rmCode,
      details: `Soft-deleted file ${fileId} (${existing.customerName})`
    });
  }
  if (existing.rmCode) {
    db.addNotification({
      recipientRmCode: existing.rmCode,
      fileId: existing.fileId,
      customerName: existing.customerName,
      action: "DELETE",
      performedBy: user.username,
      performedByName: user.name || (user.role === "Admin" ? "System Administrator" : "Senior Team Mentor"),
      performedByRole: user.role,
      title: `TAT ID: ${existing.fileId} \u2022 File Deleted`,
      message: `File: "${existing.customerName}" | Change: File removed from portfolio by ${user.role} (${user.name})`,
      metadata: {
        isPermanentDelete: isPermanent
      }
    });
    SMSService.sendRMAlertSMS({
      recipientRmCode: existing.rmCode,
      fileId: existing.fileId,
      customerName: existing.customerName,
      action: "DELETE",
      performedByName: user.name || (user.role === "Admin" ? "System Administrator" : "Senior Team Mentor"),
      performedByRole: user.role,
      details: `TAT ID: ${existing.fileId} | File: ${existing.customerName} | Action: File Deleted from Portfolio`
    }).catch((e) => console.error("SMS Alert dispatch failed:", e));
  }
  SheetsSyncService.deleteFile(fileId).catch((e) => console.error("Background Sheets delete sync failed:", e));
  return res.json({ success: true, message: `File ${fileId} deleted successfully` });
});
router2.post("/:fileId/attachments", requireAuth, (req, res) => {
  const user = req.user;
  const fileId = req.params.fileId;
  const file = db.getCustomerFileById(fileId);
  if (!file) {
    return res.status(404).json({ error: "Customer file not found" });
  }
  if (user.role === "RM" && file.rmCode !== (user.rmCode || user.username)) {
    return res.status(403).json({ error: "Forbidden: Cannot upload documents to another RM\u2019s file" });
  }
  const { fileName, fileType, dataUrl, category = "Customer Document" } = req.body;
  if (!dataUrl || !fileName) {
    return res.status(400).json({ error: "File data and filename are required" });
  }
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > 10 * 1024 * 1024) {
    return res.status(400).json({ error: "File size exceeds maximum limit of 10 MB" });
  }
  const allowedMime = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const mime = fileType || (dataUrl.match(/^data:([^;]+);/)?.[1] || "application/octet-stream");
  if (!allowedMime.includes(mime)) {
    return res.status(400).json({ error: "Unsupported file type. Please upload PDF, JPG, PNG, or WEBP." });
  }
  const attachmentId = `att_${Date.now()}_${crypto3.randomBytes(4).toString("hex")}`;
  const ext = path2.extname(fileName) || (mime === "application/pdf" ? ".pdf" : ".jpg");
  const diskFileName = `${attachmentId}${ext}`;
  const diskPath = path2.join(ATTACHMENTS_DIR, diskFileName);
  fs2.writeFileSync(diskPath, buffer);
  const attachment = {
    id: attachmentId,
    fileId,
    category,
    fileName,
    fileType: mime,
    fileSize: buffer.length,
    diskFileName,
    storagePath: diskPath,
    uploadedBy: user.username,
    uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.addAttachment(attachment);
  SheetsSyncService.syncAttachment(attachment).catch((e) => console.error("Attachment sheets sync error:", e));
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: "UPDATE",
    fileId,
    rmCode: file.rmCode,
    details: `Uploaded attachment: ${fileName} (${category}) for file ${fileId}`
  });
  return res.status(201).json({
    id: attachment.id,
    fileId: attachment.fileId,
    category: attachment.category,
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    fileSize: attachment.fileSize,
    uploadedBy: attachment.uploadedBy,
    uploadedAt: attachment.uploadedAt
  });
});
router2.get("/attachments/:id/preview", requireAuth, (req, res) => {
  const user = req.user;
  const attachment = db.getAttachmentById(req.params.id);
  if (!attachment) {
    return res.status(404).json({ error: "Attachment not found" });
  }
  const file = db.getCustomerFileById(attachment.fileId);
  if (file && user.role === "RM" && file.rmCode !== (user.rmCode || user.username)) {
    return res.status(403).json({ error: "Forbidden: Access denied to private document" });
  }
  const diskPath = path2.join(ATTACHMENTS_DIR, attachment.diskFileName);
  if (!fs2.existsSync(diskPath)) {
    return res.status(404).json({ error: "Attachment file missing from storage" });
  }
  res.setHeader("Content-Type", attachment.fileType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(attachment.fileName)}"`);
  res.setHeader("Cache-Control", "private, max-age=300");
  const stream = fs2.createReadStream(diskPath);
  return stream.pipe(res);
});
router2.get("/attachments/:id/download", requireAuth, (req, res) => {
  const user = req.user;
  const attachment = db.getAttachmentById(req.params.id);
  if (!attachment) {
    return res.status(404).json({ error: "Attachment not found" });
  }
  const file = db.getCustomerFileById(attachment.fileId);
  if (file && user.role === "RM" && file.rmCode !== (user.rmCode || user.username)) {
    return res.status(403).json({ error: "Forbidden: Access denied" });
  }
  const diskPath = path2.join(ATTACHMENTS_DIR, attachment.diskFileName);
  if (!fs2.existsSync(diskPath)) {
    return res.status(404).json({ error: "Attachment file missing" });
  }
  return res.download(diskPath, attachment.fileName);
});
router2.delete("/attachments/:id", requireAuth, (req, res) => {
  const user = req.user;
  const attachment = db.getAttachmentById(req.params.id);
  if (!attachment) {
    return res.status(404).json({ error: "Attachment not found" });
  }
  const file = db.getCustomerFileById(attachment.fileId);
  if (file && user.role === "RM" && file.rmCode !== (user.rmCode || user.username)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  db.deleteAttachment(attachment.id);
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: "UPDATE",
    fileId: attachment.fileId,
    rmCode: file?.rmCode,
    details: `Deleted attachment: ${attachment.fileName} from file ${attachment.fileId}`
  });
  return res.json({ success: true, message: "Attachment deleted successfully" });
});
var files_default = router2;

// server/routes/rms.ts
import { Router as Router3 } from "express";
import crypto4 from "crypto";
var router3 = Router3();
router3.use(requireAuth);
router3.use(requireAdminOrMentor);
router3.get("/", (req, res) => {
  const users = db.getUsers().filter((u) => u.role === "RM");
  const files = db.getCustomerFiles(false);
  const list = users.map((u) => {
    const rmCode = u.rmCode || u.username;
    const rmFiles = files.filter((f) => f.rmCode === rmCode);
    const approvedFiles = rmFiles.filter((f) => f.applicationStatus === "Approved");
    return {
      rmCode,
      rmName: u.name,
      mobile: u.mobile,
      email: u.email,
      officeAddress: "Main Office",
      ipAddress: "127.0.0.1",
      accountStatus: u.status,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      authUid: u.id,
      fileCount: rmFiles.length,
      approvedCount: approvedFiles.length
    };
  });
  return res.json(list);
});
router3.post("/", async (req, res) => {
  const user = req.user;
  const { rmCode, rmName, mobile, email, officeAddress = "Main Office", initialPassword } = req.body;
  if (!rmCode || !rmName || !mobile || !email) {
    return res.status(400).json({ error: "RM Code, RM Name, Mobile, and Email are required" });
  }
  const cleanRmCode = String(rmCode).trim();
  if (db.getUserByUsername(cleanRmCode) || db.getUserByRmCode(cleanRmCode)) {
    return res.status(400).json({ error: `RM Code ${cleanRmCode} already exists. Each RM Code must be unique.` });
  }
  const tempPass = initialPassword && String(initialPassword).length >= 6 ? String(initialPassword) : `Ebl#${cleanRmCode}`;
  const { hash, salt } = hashPassword(tempPass);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newRMUser = {
    id: `usr_rm_${cleanRmCode}_${crypto4.randomBytes(3).toString("hex")}`,
    username: cleanRmCode,
    passwordHash: hash,
    salt,
    role: "RM",
    name: String(rmName).trim(),
    mobile: String(mobile).trim(),
    email: String(email).trim(),
    rmCode: cleanRmCode,
    status: "Active",
    mustChangePassword: true,
    // Force change on first login
    createdAt: now
  };
  db.createUser(newRMUser);
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: cleanRmCode,
    action: "CREATE",
    details: `Created new RM Account ${cleanRmCode} (${newRMUser.name}). Status: Active. Temporary password issued.`
  });
  const rmProfile = {
    rmCode: cleanRmCode,
    rmName: newRMUser.name,
    mobile: newRMUser.mobile,
    email: newRMUser.email,
    officeAddress,
    accountStatus: "Active",
    createdAt: now,
    authUid: newRMUser.id
  };
  SheetsSyncService.syncRM(rmProfile).catch((e) => console.error("Failed to sync new RM to sheets:", e));
  return res.status(201).json({
    message: "RM Account successfully created",
    rmProfile,
    temporaryPassword: tempPass
  });
});
router3.put("/:rmCode", (req, res) => {
  const user = req.user;
  const targetRmCode = req.params.rmCode;
  const targetUser = db.getUserByRmCode(targetRmCode) || db.getUserByUsername(targetRmCode);
  if (!targetUser) {
    return res.status(404).json({ error: "RM account not found" });
  }
  const { rmName, mobile, email } = req.body;
  const updated = db.updateUser(targetUser.id, {
    name: rmName ? String(rmName).trim() : targetUser.name,
    mobile: mobile ? String(mobile).trim() : targetUser.mobile,
    email: email ? String(email).trim() : targetUser.email
  });
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: targetRmCode,
    action: "UPDATE",
    details: `Updated RM information for ${targetRmCode}`
  });
  SheetsSyncService.syncRM({
    rmCode: targetRmCode,
    rmName: updated ? updated.name : targetUser.name,
    mobile: updated ? updated.mobile : targetUser.mobile,
    email: updated ? updated.email : targetUser.email,
    officeAddress: "Main Office",
    accountStatus: targetUser.status,
    createdAt: targetUser.createdAt,
    lastLogin: targetUser.lastLogin,
    authUid: targetUser.id
  }).catch((e) => console.error("Failed to auto-sync updated RM to sheets:", e));
  return res.json({ success: true, user: updated });
});
router3.patch("/:rmCode/status", (req, res) => {
  const user = req.user;
  const targetRmCode = req.params.rmCode;
  const targetUser = db.getUserByRmCode(targetRmCode) || db.getUserByUsername(targetRmCode);
  if (!targetUser) {
    return res.status(404).json({ error: "RM account not found" });
  }
  const { status } = req.body;
  if (!["Active", "Inactive", "Suspended"].includes(status)) {
    return res.status(400).json({ error: "Status must be Active, Inactive, or Suspended" });
  }
  db.updateUser(targetUser.id, { status });
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: targetRmCode,
    action: "RM_STATUS_CHANGE",
    details: `Changed RM ${targetRmCode} status from ${targetUser.status} to ${status}`
  });
  SheetsSyncService.syncRM({
    rmCode: targetRmCode,
    rmName: targetUser.name,
    mobile: targetUser.mobile,
    email: targetUser.email,
    officeAddress: "Main Office",
    accountStatus: status,
    createdAt: targetUser.createdAt,
    lastLogin: targetUser.lastLogin,
    authUid: targetUser.id
  }).catch((e) => console.error("Failed to sync status change to sheets:", e));
  return res.json({ success: true, message: `RM ${targetRmCode} status updated to ${status}` });
});
router3.post("/:rmCode/reset-password", (req, res) => {
  const user = req.user;
  const targetRmCode = req.params.rmCode;
  const targetUser = db.getUserByRmCode(targetRmCode) || db.getUserByUsername(targetRmCode);
  if (!targetUser) {
    return res.status(404).json({ error: "RM account not found" });
  }
  const { newPassword } = req.body;
  const tempPass = newPassword && String(newPassword).length >= 6 ? String(newPassword) : `Ebl#${crypto4.randomBytes(3).toString("hex")}!`;
  const { hash, salt } = hashPassword(tempPass);
  db.updateUser(targetUser.id, {
    passwordHash: hash,
    salt,
    mustChangePassword: true
    // Force password change on next login
  });
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: targetRmCode,
    action: "PASSWORD_CHANGE",
    details: `Admin/Mentor reset password for RM ${targetRmCode}`
  });
  return res.json({
    success: true,
    message: `Password reset successfully for RM ${targetRmCode}. Temporary password issued.`,
    temporaryPassword: tempPass
  });
});
var rms_default = router3;

// server/routes/reports.ts
import { Router as Router4 } from "express";
import * as XLSX from "xlsx";

// src/utils/dateTime.ts
var DHAKA_TIMEZONE = "Asia/Dhaka";
function formatDhakaDateTime(dateInput) {
  if (!dateInput) return "\u2014";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "\u2014";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: DHAKA_TIMEZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).format(d);
  } catch {
    return String(dateInput);
  }
}
function getDhakaDateParts(date = /* @__PURE__ */ new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || "";
  const weekdayStr = getPart("weekday");
  const daysMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: parseInt(getPart("year"), 10),
    month: parseInt(getPart("month"), 10),
    // 1-12
    day: parseInt(getPart("day"), 10),
    dayOfWeek: daysMap[weekdayStr] ?? date.getDay(),
    hour: parseInt(getPart("hour"), 10) || 0,
    minute: parseInt(getPart("minute"), 10) || 0
  };
}
function getPeriodRange(period, weekStartDay = "Saturday") {
  const now = /* @__PURE__ */ new Date();
  const dhaka = getDhakaDateParts(now);
  const createDhakaDayStart = (year, month, day) => {
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return /* @__PURE__ */ new Date(`${year}-${m}-${d}T00:00:00+06:00`);
  };
  const createDhakaDayEnd = (year, month, day) => {
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return /* @__PURE__ */ new Date(`${year}-${m}-${d}T23:59:59.999+06:00`);
  };
  if (period === "All Time" || period === "Custom") {
    return { start: null, end: null };
  }
  if (period === "Today") {
    return {
      start: createDhakaDayStart(dhaka.year, dhaka.month, dhaka.day),
      end: createDhakaDayEnd(dhaka.year, dhaka.month, dhaka.day)
    };
  }
  if (period === "This Month") {
    const lastDayOfMonth = new Date(Date.UTC(dhaka.year, dhaka.month, 0)).getUTCDate();
    return {
      start: createDhakaDayStart(dhaka.year, dhaka.month, 1),
      end: createDhakaDayEnd(dhaka.year, dhaka.month, lastDayOfMonth)
    };
  }
  if (period === "Last Month") {
    let prevYear = dhaka.year;
    let prevMonth = dhaka.month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const lastDayOfPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
    return {
      start: createDhakaDayStart(prevYear, prevMonth, 1),
      end: createDhakaDayEnd(prevYear, prevMonth, lastDayOfPrevMonth)
    };
  }
  const startDayNum = weekStartDay === "Saturday" ? 6 : weekStartDay === "Sunday" ? 0 : 1;
  const currentDayOfWeek = dhaka.dayOfWeek;
  let daysSinceStart = (currentDayOfWeek - startDayNum + 7) % 7;
  const todayStart = createDhakaDayStart(dhaka.year, dhaka.month, dhaka.day);
  if (period === "This Week") {
    const weekStartDate = new Date(todayStart.getTime() - daysSinceStart * 24 * 60 * 60 * 1e3);
    const weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1e3 - 1);
    return { start: weekStartDate, end: weekEndDate };
  }
  if (period === "Last Week") {
    const lastWeekEndDate = new Date(todayStart.getTime() - daysSinceStart * 24 * 60 * 60 * 1e3 - 1);
    const lastWeekStartDate = new Date(lastWeekEndDate.getTime() - 7 * 24 * 60 * 60 * 1e3 + 1);
    return { start: lastWeekStartDate, end: lastWeekEndDate };
  }
  return { start: null, end: null };
}
function isDateInPeriod(dateInput, period, weekStartDay = "Saturday") {
  if (!dateInput) return false;
  if (period === "All Time" || period === "Custom") return true;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;
  const { start, end } = getPeriodRange(period, weekStartDay);
  if (!start || !end) return true;
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}

// server/routes/reports.ts
var router4 = Router4();
router4.use(requireAuth);
function calculateKPIs(files) {
  const kpis = {
    totalFiles: files.length,
    collected: 0,
    submitted: 0,
    approved: 0,
    declined: 0,
    query: 0,
    returnToSource: 0,
    condition: 0,
    stc: 0,
    pendingDocuments: 0,
    activeCardsY: 0,
    inactiveCardsN: 0,
    cancelledCardsC: 0
  };
  files.forEach((f) => {
    switch (f.applicationStatus) {
      case "Collected":
        kpis.collected++;
        break;
      case "Submitted":
        kpis.submitted++;
        break;
      case "Approved":
        kpis.approved++;
        break;
      case "Declined":
        kpis.declined++;
        break;
      case "Query":
        kpis.query++;
        break;
      case "Return to Source":
        kpis.returnToSource++;
        break;
      case "Condition":
        kpis.condition++;
        break;
      case "STC":
        kpis.stc++;
        break;
    }
    if (f.activeStatus === "Y") kpis.activeCardsY++;
    else if (f.activeStatus === "N") kpis.inactiveCardsN++;
    else if (f.activeStatus === "C") kpis.cancelledCardsC++;
    if (f.pendingDocuments && f.pendingDocuments.length > 0) {
      kpis.pendingDocuments++;
    }
  });
  return kpis;
}
router4.get("/summary", (req, res) => {
  const user = req.user;
  const { period = "All Time", rmCode } = req.query;
  const settings = db.getSettings();
  const weekStart = settings.reportingWeekStart || "Saturday";
  let allFiles = db.getCustomerFiles(false);
  if (user.role === "RM") {
    const userRmCode = user.rmCode || user.username;
    allFiles = allFiles.filter((f) => f.rmCode === userRmCode);
  } else if (rmCode && rmCode !== "all") {
    allFiles = allFiles.filter((f) => f.rmCode === rmCode);
  }
  const filteredFiles = allFiles.filter((f) => isDateInPeriod(f.createdAt, period, weekStart));
  const kpis = calculateKPIs(filteredFiles);
  const statusDistribution = {};
  filteredFiles.forEach((f) => {
    statusDistribution[f.applicationStatus] = (statusDistribution[f.applicationStatus] || 0) + 1;
  });
  const productDistribution = {};
  filteredFiles.forEach((f) => {
    productDistribution[f.productType] = (productDistribution[f.productType] || 0) + 1;
  });
  const pendingDocCounts = {};
  filteredFiles.forEach((f) => {
    if (f.pendingDocuments) {
      f.pendingDocuments.forEach((doc) => {
        pendingDocCounts[doc] = (pendingDocCounts[doc] || 0) + 1;
      });
    }
  });
  let rmPerformance = [];
  if (user.role !== "RM") {
    const rmUsers = db.getUsers().filter((u) => u.role === "RM");
    rmPerformance = rmUsers.map((u) => {
      const code = u.rmCode || u.username;
      const rmsFiles = filteredFiles.filter((f) => f.rmCode === code);
      const rmKpis = calculateKPIs(rmsFiles);
      return {
        rmCode: code,
        rmName: u.name,
        mobile: u.mobile,
        status: u.status,
        ...rmKpis
      };
    });
  }
  return res.json({
    period,
    kpis,
    statusDistribution,
    productDistribution,
    pendingDocCounts,
    pendingDocFiles: filteredFiles.filter((f) => f.pendingDocuments && f.pendingDocuments.length > 0),
    rmPerformance,
    totalRecords: filteredFiles.length
  });
});
router4.get("/export", (req, res) => {
  const user = req.user;
  const { format = "csv", period = "All Time", rmCode, productType, applicationStatus } = req.query;
  const settings = db.getSettings();
  const weekStart = settings.reportingWeekStart || "Saturday";
  let files = db.getCustomerFiles(false);
  if (user.role === "RM") {
    const userRmCode = user.rmCode || user.username;
    files = files.filter((f) => f.rmCode === userRmCode);
  } else if (rmCode && rmCode !== "all") {
    files = files.filter((f) => f.rmCode === rmCode);
  }
  if (period && period !== "All Time") {
    files = files.filter((f) => isDateInPeriod(f.createdAt, period, weekStart));
  }
  if (productType && productType !== "all") {
    files = files.filter((f) => f.productType === productType);
  }
  if (applicationStatus && applicationStatus !== "all") {
    files = files.filter((f) => f.applicationStatus === applicationStatus);
  }
  const rows = files.map((f) => {
    const base = {
      "File ID": f.fileId,
      "CC-number": f.ccNumber || "",
      "Customer Name": f.customerName,
      "Company Name": f.companyName,
      "Mobile Number": f.mobile,
      "Alt Mobile": f.altMobile || "",
      "Email": f.email || "",
      "Office Address": f.officeAddress,
      "Product Type": f.productType,
      "Application Status": f.applicationStatus,
      "Active Status": f.activeStatus
    };
    if (user.role !== "RM") {
      base["RM Code"] = f.rmCode;
      base["RM Name"] = f.rmName || "";
    }
    if (user.role === "Mentor") {
      base["Entry Location"] = f.locationAddress || (f.locationLat ? `${f.locationLat}, ${f.locationLng}` : "");
    }
    base["Pending Documents"] = (f.pendingDocuments || []).join("; ");
    base["CPV Status"] = f.cpvStatus;
    base["CPV Date"] = f.cpvDate || "";
    base["CPV Address"] = f.cpvAddress || "";
    base["Remarks"] = f.remarks || "";
    base["Created Date (Dhaka)"] = formatDhakaDateTime(f.createdAt);
    base["Submitted Date"] = f.submittedAt ? formatDhakaDateTime(f.submittedAt) : "";
    base["Approved Date"] = f.approvedAt ? formatDhakaDateTime(f.approvedAt) : "";
    return base;
  });
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: user.rmCode,
    action: "EXPORT",
    details: `Exported ${rows.length} records in format ${format.toUpperCase()}`
  });
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const filename = `Team_RM_Report_${user.username}_${timestamp}`;
  if (format === "xlsx") {
    const worksheet2 = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet2, "Customer_Files");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.send(buffer);
  }
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  return res.send(csv);
});
var reports_default = router4;

// server/routes/settings.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.use(requireAuth);
router5.get("/", (req, res) => {
  const settings = db.getSettings();
  if (req.user?.role === "RM") {
    const { appsScriptSecretToken, ...safeSettings } = settings;
    return res.json(safeSettings);
  }
  return res.json(settings);
});
router5.put("/", requireAdminOrMentor, (req, res) => {
  const user = req.user;
  const body = req.body;
  const updates = {
    updatedBy: user.username
  };
  if (body.appName && typeof body.appName === "string") {
    updates.appName = String(body.appName).trim();
  }
  if (body.teamName && typeof body.teamName === "string") {
    updates.teamName = String(body.teamName).trim();
  }
  if (body.googleSpreadsheetId && typeof body.googleSpreadsheetId === "string") {
    let rawSheet = String(body.googleSpreadsheetId).trim();
    const urlMatch = rawSheet.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      updates.googleSpreadsheetId = urlMatch[1];
    } else {
      updates.googleSpreadsheetId = rawSheet;
    }
  }
  if (Array.isArray(body.productTypes)) updates.productTypes = body.productTypes;
  if (Array.isArray(body.pendingDocOptions)) updates.pendingDocOptions = body.pendingDocOptions;
  if (Array.isArray(body.applicationStatuses)) updates.applicationStatuses = body.applicationStatuses;
  if (["Saturday", "Sunday", "Monday"].includes(body.reportingWeekStart)) {
    updates.reportingWeekStart = body.reportingWeekStart;
  }
  if (body.appsScriptWebAppUrl !== void 0) {
    updates.appsScriptWebAppUrl = String(body.appsScriptWebAppUrl).trim();
  }
  if (body.appsScriptSecretToken !== void 0) {
    updates.appsScriptSecretToken = String(body.appsScriptSecretToken).trim();
  }
  if (body.syncIntervalMinutes && typeof body.syncIntervalMinutes === "number") {
    updates.syncIntervalMinutes = body.syncIntervalMinutes;
  }
  const updated = db.updateSettings(updates);
  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: "UPDATE",
    details: `Updated application settings and dropdown configurations`
  });
  return res.json(updated);
});
var settings_default = router5;

// server/routes/sync.ts
import { Router as Router6 } from "express";
import fs3 from "fs";
import path3 from "path";
var router6 = Router6();
router6.use(requireAuth);
router6.use(requireAdminOrMentor);
router6.get("/status", (req, res) => {
  const settings = db.getSettings();
  const allFiles = db.getCustomerFiles(true);
  const syncedCount = allFiles.filter((f) => f.sheetsSyncStatus === "Synced").length;
  const pendingCount = allFiles.filter((f) => f.sheetsSyncStatus === "Pending" || !f.sheetsSyncStatus).length;
  const failedCount = allFiles.filter((f) => f.sheetsSyncStatus === "Failed").length;
  return res.json({
    spreadsheetId: settings.googleSpreadsheetId,
    appsScriptConfigured: Boolean(settings.appsScriptWebAppUrl),
    lastSyncStatus: settings.lastSyncStatus,
    lastSuccessfulSync: settings.lastSuccessfulSync,
    lastSyncAttempt: settings.lastSyncAttempt,
    lastSyncError: settings.lastSyncError,
    stats: {
      totalFiles: allFiles.length,
      syncedCount,
      pendingCount,
      failedCount
    }
  });
});
router6.post("/test", async (req, res) => {
  const { url, token } = req.body;
  const result = await SheetsSyncService.testConnection(url, token);
  return res.json(result);
});
router6.post("/init-sheets", async (req, res) => {
  const { url, token } = req.body;
  const result = await SheetsSyncService.initSheets(url, token);
  return res.json(result);
});
router6.post("/trigger", async (req, res) => {
  const result = await SheetsSyncService.batchSyncAll();
  return res.json(result);
});
router6.get("/script-code", (req, res) => {
  const codePath = path3.resolve(process.cwd(), "google-apps-script/Code.gs");
  if (fs3.existsSync(codePath)) {
    const code = fs3.readFileSync(codePath, "utf8");
    return res.json({ code });
  }
  return res.status(404).json({ error: "Code.gs file not found" });
});
var sync_default = router6;

// server/routes/audit.ts
import { Router as Router7 } from "express";
var router7 = Router7();
router7.use(requireAuth);
router7.use(requireAdminOrMentor);
router7.get("/", (req, res) => {
  const { action, username, limit = "100" } = req.query;
  let logs = db.getAuditLogs();
  if (action && action !== "all") {
    logs = logs.filter((l) => l.action === action);
  }
  if (username) {
    logs = logs.filter((l) => l.username.toLowerCase().includes(username.toLowerCase()));
  }
  const max = Math.min(500, parseInt(limit, 10) || 100);
  return res.json(logs.slice(0, max));
});
var audit_default = router7;

// server/routes/locations.ts
import { Router as Router8 } from "express";
var router8 = Router8();
router8.use(requireAuth);
router8.post("/ping", (req, res) => {
  const user = req.user;
  const { latitude, longitude, accuracy, address, actionContext = "General Check-In" } = req.body;
  if (latitude === void 0 || longitude === void 0) {
    return res.status(400).json({ error: "Latitude and Longitude are required" });
  }
  const loc = {
    userId: user.id,
    username: user.username,
    rmCode: user.rmCode || user.username,
    name: user.name,
    role: user.role,
    latitude: Number(latitude),
    longitude: Number(longitude),
    accuracy: accuracy ? Number(accuracy) : void 0,
    address: address ? String(address).trim() : void 0,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    actionContext
  };
  const recorded = db.recordUserLocation(loc);
  return res.json({ success: true, location: recorded });
});
router8.get("/latest", requireRoles(["Mentor"]), (req, res) => {
  const latestLocations = db.getLatestUserLocations();
  return res.json(latestLocations);
});
router8.get("/history", requireRoles(["Mentor"]), (req, res) => {
  const allLocations = db.getAllUserLocations();
  return res.json(allLocations);
});
var locations_default = router8;

// server/routes/notifications.ts
import { Router as Router9 } from "express";
var router9 = Router9();
router9.get("/", requireAuth, (req, res) => {
  const user = req.user;
  const isElevated = user.role !== "RM";
  const rmCode = user.rmCode || user.username;
  const notifications = db.getNotificationsForUser(rmCode, isElevated);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return res.json({
    notifications,
    unreadCount
  });
});
router9.patch("/:id/read", requireAuth, (req, res) => {
  const { id } = req.params;
  const success = db.markNotificationAsRead(id);
  return res.json({ success });
});
router9.patch("/read-all", requireAuth, (req, res) => {
  const user = req.user;
  const isElevated = user.role !== "RM";
  const rmCode = user.rmCode || user.username;
  const success = db.markAllNotificationsAsRead(rmCode, isElevated);
  return res.json({ success });
});
router9.delete("/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const success = db.deleteNotification(id);
  return res.json({ success });
});
var notifications_default = router9;

// server/routes/sms.ts
import { Router as Router10 } from "express";
var router10 = Router10();
router10.get("/logs", requireAuth, (req, res) => {
  const user = req.user;
  const rmCode = user.role === "RM" ? user.rmCode || user.username : void 0;
  const logs = db.getSmsLogs(rmCode);
  return res.json(logs);
});
router10.post("/test", requireAuth, async (req, res) => {
  const user = req.user;
  const targetRm = user.rmCode || user.username;
  const log = await SMSService.sendRMAlertSMS({
    recipientRmCode: targetRm,
    fileId: "TEST-FILE-001",
    customerName: "Test Customer (Mobile Alert Verification)",
    action: "UPDATE",
    performedByName: user.name,
    performedByRole: user.role,
    details: "This is a test mobile SMS notification alert sound and vibration verification."
  });
  return res.json({
    success: true,
    message: `Test SMS dispatched to ${log.recipientMobile} via ${log.gateway}`,
    log
  });
});
var sms_default = router10;

// server/app.ts
function getPort() {
  const portIdx = process.argv.indexOf("--port");
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    return parseInt(process.argv[portIdx + 1], 10);
  }
  return parseInt(process.env.PORT || "3000", 10);
}
function getHost() {
  const hostIdx = process.argv.indexOf("--host");
  if (hostIdx !== -1 && process.argv[hostIdx + 1]) {
    return process.argv[hostIdx + 1];
  }
  return "0.0.0.0";
}
async function startServer() {
  const app = express();
  const PORT = getPort();
  const HOST = getHost();
  const distIndexPath = path4.resolve(process.cwd(), "dist/index.html");
  const isProduction = process.env.NODE_ENV === "production" || fs4.existsSync(distIndexPath);
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));
  app.use("/api/auth", auth_default);
  app.use("/api/files", files_default);
  app.use("/api/rms", rms_default);
  app.use("/api/reports", reports_default);
  app.use("/api/settings", settings_default);
  app.use("/api/sync", sync_default);
  app.use("/api/audit-logs", audit_default);
  app.use("/api/locations", locations_default);
  app.use("/api/notifications", notifications_default);
  app.use("/api/sms", sms_default);
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      app: "RM File Management & Team Member Data System",
      time: (/* @__PURE__ */ new Date()).toISOString(),
      timezone: "Asia/Dhaka"
    });
  });
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path4.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path4.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, HOST, () => {
    console.log(`[Team Data System] Server running on http://${HOST}:${PORT}`);
    console.log(`[Team Data System] Timezone active: Asia/Dhaka`);
    console.log(`[Team Data System] Connected Spreadsheet ID: 1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI`);
    SheetsSyncService.startAutoSyncWorker(25e3);
    console.log(`[Team Data System] Real-time Google Sheets Auto-Sync Engine active`);
  });
}
startServer().catch((err) => {
  console.error("[Team Data System] Fatal startup error:", err);
  process.exit(1);
});
export {
  startServer
};
