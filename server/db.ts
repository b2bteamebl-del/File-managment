import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CustomerFile, FileAttachment, RMProfile, AuditLog, AppSettings, UserRole, UserLocation, RMNotification, SMSLog } from '../src/types/index.js';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

export interface UserRecord {
  id: string;
  username: string; // RM code (e.g. "104393") or "Admin0" or "12345"
  passwordHash: string;
  salt: string;
  role: UserRole;
  name: string;
  email: string;
  mobile: string;
  rmCode?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  mustChangePassword: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface StoredAttachment extends FileAttachment {
  diskFileName: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  customerFiles: CustomerFile[];
  attachments: StoredAttachment[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  userLocations?: UserLocation[];
  notifications?: RMNotification[];
  smsLogs?: SMSLog[];
}

// Password hashing helper
export function hashPassword(password: string, salt: string = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

// Seed initial database
function createInitialDatabase(): DatabaseSchema {
  const adminPass = hashPassword('#123456A');
  const mentorPass = hashPassword('12345');
  const rm1Pass = hashPassword('104393');
  const rm2Pass = hashPassword('105210');
  const rm3Pass = hashPassword('106880');

  const now = new Date().toISOString();

  const users: UserRecord[] = [
    {
      id: 'usr_admin0',
      username: 'Admin0',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      role: 'Admin',
      name: 'System Administrator',
      email: 'admin0@team.local',
      mobile: '+8801711000001',
      status: 'Active',
      mustChangePassword: true, // Requires change on first login as per spec
      createdAt: now,
    },
    {
      id: 'usr_mentor12345',
      username: '12345',
      passwordHash: mentorPass.hash,
      salt: mentorPass.salt,
      role: 'Mentor',
      name: 'Senior Team Mentor',
      email: 'mentor12345@team.local',
      mobile: '+8801711000002',
      status: 'Active',
      mustChangePassword: true, // Requires change on first login as per spec
      createdAt: now,
    },
    {
      id: 'usr_rm104393',
      username: '104393',
      passwordHash: rm1Pass.hash,
      salt: rm1Pass.salt,
      role: 'RM',
      name: 'Tanvir Ahmed',
      email: 'tanvir.104393@team.local',
      mobile: '+8801819234567',
      rmCode: '104393',
      status: 'Active',
      mustChangePassword: false,
      createdAt: now,
    },
    {
      id: 'usr_rm105210',
      username: '105210',
      passwordHash: rm2Pass.hash,
      salt: rm2Pass.salt,
      role: 'RM',
      name: 'Nusrat Jahan',
      email: 'nusrat.105210@team.local',
      mobile: '+8801912876543',
      rmCode: '105210',
      status: 'Active',
      mustChangePassword: false,
      createdAt: now,
    },
    {
      id: 'usr_rm106880',
      username: '106880',
      passwordHash: rm3Pass.hash,
      salt: rm3Pass.salt,
      role: 'RM',
      name: 'Kamrul Hasan',
      email: 'kamrul.106880@team.local',
      mobile: '+8801713456789',
      rmCode: '106880',
      status: 'Active',
      mustChangePassword: false,
      createdAt: now,
    },
  ];

  const defaultFiles: CustomerFile[] = [
    {
      fileId: 'RM-2026-00101',
      customerName: 'Shahidul Alam',
      companyName: 'Beximco Pharmaceuticals Ltd',
      officeAddress: '17 Dhanmondi R/A, Road 2, Dhaka-1205',
      mobile: '01711223344',
      altMobile: '01811223344',
      email: 'shahidul.alam@beximco.com',
      rmCode: '104393',
      rmName: 'Tanvir Ahmed',
      productType: 'Credit Card',
      applicationStatus: 'Approved',
      activeStatus: 'Y',
      pendingDocuments: [],
      remarks: 'Customer has verified income of BDT 185,000/mo. Clean CIB report.',
      cpvStatus: 'Completed',
      cpvDate: '2026-09-20',
      cpvAddress: '17 Dhanmondi R/A, Road 2, Dhaka-1205',
      cpvRemarks: 'Office verified in person. Customer is Senior GM.',
      cpvLastUpdatedBy: '104393',
      createdAt: '2026-09-18T10:30:00+06:00',
      updatedAt: '2026-09-22T14:15:00+06:00',
      createdBy: '104393',
      updatedBy: '104393',
      submittedAt: '2026-09-19T11:00:00+06:00',
      approvedAt: '2026-09-22T14:15:00+06:00',
      isDeleted: false,
      sheetsSyncStatus: 'Pending',
    },
    {
      fileId: 'RM-2026-00102',
      customerName: 'Shahidul Alam',
      companyName: 'Beximco Pharmaceuticals Ltd',
      officeAddress: '17 Dhanmondi R/A, Road 2, Dhaka-1205',
      mobile: '01711223344',
      altMobile: '01811223344',
      email: 'shahidul.alam@beximco.com',
      rmCode: '104393',
      rmName: 'Tanvir Ahmed',
      productType: 'Credit Card',
      applicationStatus: 'Approved',
      activeStatus: 'Y',
      pendingDocuments: [],
      remarks: 'Customer has verified income of BDT 185,000/mo. Clean CIB report.',
      cpvStatus: 'Completed',
      cpvDate: '2026-09-20',
      cpvAddress: '17 Dhanmondi R/A, Road 2, Dhaka-1205',
      cpvRemarks: 'Office verified in person. Customer is Senior GM.',
      cpvLastUpdatedBy: '104393',
      createdAt: '2026-09-18T10:30:00+06:00',
      updatedAt: '2026-09-22T14:15:00+06:00',
      createdBy: '104393',
      updatedBy: '104393',
      submittedAt: '2026-09-19T11:00:00+06:00',
      approvedAt: '2026-09-22T14:15:00+06:00',
      isDeleted: false,
      sheetsSyncStatus: 'Pending',
    },
    {
      fileId: 'RM-2026-00102',
      customerName: 'Farhana Akhter',
      companyName: 'Square Textiles Division',
      officeAddress: 'Square Centre, 48 Mohakhali C/A, Dhaka-1212',
      mobile: '01819334455',
      email: 'farhana.akhter@squaregroup.com',
      rmCode: '104393',
      rmName: 'Tanvir Ahmed',
      productType: 'Corporate Card',
      applicationStatus: 'Submitted',
      activeStatus: 'N',
      pendingDocuments: ['Salary Certificate', 'BS (Bank Statement)'],
      remarks: 'Application submitted to operations. Waiting for original bank statement.',
      cpvStatus: 'Pending',
      createdAt: '2026-09-24T09:00:00+06:00',
      updatedAt: '2026-09-24T09:30:00+06:00',
      createdBy: '104393',
      updatedBy: '104393',
      submittedAt: '2026-09-24T09:30:00+06:00',
      isDeleted: false,
      sheetsSyncStatus: 'Pending',
    },
    {
      fileId: 'RM-2026-00103',
      customerName: 'Mehedi Hasan Chowdhury',
      companyName: 'Apex Footwear Ltd',
      officeAddress: 'House 6, Road 137, Gulshan-1, Dhaka-1212',
      mobile: '01912556677',
      rmCode: '104393',
      rmName: 'Tanvir Ahmed',
      productType: 'B2B',
      applicationStatus: 'Query',
      activeStatus: 'N',
      pendingDocuments: ['BIN', 'Trade License 2025-26'],
      remarks: 'Credit query raised: Updated Trade License renewal copy required.',
      cpvStatus: 'Completed',
      cpvDate: '2026-09-21',
      cpvAddress: 'House 6, Road 137, Gulshan-1, Dhaka-1212',
      cpvRemarks: 'Business outlet confirmed.',
      createdAt: '2026-09-21T11:45:00+06:00',
      updatedAt: '2026-09-23T16:20:00+06:00',
      createdBy: '104393',
      updatedBy: 'Admin0',
      submittedAt: '2026-09-21T15:00:00+06:00',
      isDeleted: false,
      sheetsSyncStatus: 'Pending',
    },
    {
      fileId: 'RM-2026-00104',
      customerName: 'Rafiqul Islam',
      companyName: 'Akij Food & Beverage Ltd',
      officeAddress: 'Akij House, 198 Bir Uttam Mir Shawkat Sarak, Tejgaon, Dhaka',
      mobile: '01715889900',
      rmCode: '105210',
      rmName: 'Nusrat Jahan',
      productType: 'Limit Enhancement',
      applicationStatus: 'Approved',
      activeStatus: 'Y',
      pendingDocuments: [],
      remarks: 'Limit enhanced from 300K to 600K BDT based on excellent credit turnover.',
      cpvStatus: 'Not Required',
      createdAt: '2026-09-15T14:10:00+06:00',
      updatedAt: '2026-09-18T10:00:00+06:00',
      createdBy: '105210',
      updatedBy: '105210',
      submittedAt: '2026-09-15T16:00:00+06:00',
      approvedAt: '2026-09-18T10:00:00+06:00',
      isDeleted: false,
      sheetsSyncStatus: 'Pending',
    },
    {
      fileId: 'RM-2026-00105',
      customerName: 'Anowar Hossain',
      companyName: 'Walton Hi-Tech Industries PLC',
      officeAddress: 'Plot 1088, Block I, Sabrina Sobhan Road, Bashundhara R/A, Dhaka',
      mobile: '01611778899',
      rmCode: '105210',
      rmName: 'Nusrat Jahan',
      productType: 'Credit Card',
      applicationStatus: 'Condition',
      activeStatus: 'N',
      pendingDocuments: ['Salary Certificate'],
      remarks: 'Approved subject to lien on DPS or official salary certificate submission.',
      cpvStatus: 'Completed',
      cpvDate: '2026-09-23',
      cpvAddress: 'Bashundhara R/A, Dhaka',
      cpvRemarks: 'Residence & Office confirmed.',
      createdAt: '2026-09-22T09:30:00+06:00',
      updatedAt: '2026-09-25T11:00:00+06:00',
      createdBy: '105210',
      updatedBy: '105210',
      submittedAt: '2026-09-22T14:00:00+06:00',
      isDeleted: false,
      sheetsSyncStatus: 'Pending',
    },
    {
      fileId: 'RM-2026-00106',
      customerName: 'Syed Tariqul Bashar',
      companyName: 'Pran-RFL Centre',
      officeAddress: '105 Middle Badda, Dhaka-1212',
      mobile: '01817112233',
      rmCode: '106880',
      rmName: 'Kamrul Hasan',
      productType: 'Split',
      applicationStatus: 'STC',
      activeStatus: 'N',
      pendingDocuments: ['Card Copy'],
      remarks: 'Primary credit card split application processed.',
      cpvStatus: 'Not Required',
      createdAt: '2026-09-25T11:15:00+06:00',
      updatedAt: '2026-09-25T11:15:00+06:00',
      createdBy: '106880',
      updatedBy: '106880',
      submittedAt: '2026-09-25T11:15:00+06:00',
      isDeleted: false,
      sheetsSyncStatus: 'Pending',
    }
  ];

  const defaultSettings: AppSettings = {
    appName: 'RM File Management & Team Member Data System',
    teamName: 'Core Business Team',
    productTypes: ['Credit Card', 'B2B', 'Corporate Card', 'Split', 'Limit Enhancement'],
    pendingDocOptions: [
      'NID',
      'TIN',
      'Office ID',
      'Salary Certificate',
      'BS (Bank Statement)',
      'BIN',
      'Trade License 2024-25',
      'Trade License 2025-26',
      'Trade License 2026-27',
      'Loan Certificate',
      'Card Statement (Month)',
      'Card Copy',
    ],
    applicationStatuses: [
      'Collected',
      'Submitted',
      'Declined',
      'Return to Source',
      'Approved',
      'Query',
      'Condition',
      'STC',
    ],
    reportingWeekStart: 'Saturday',
    googleSpreadsheetId: '1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI',
    appsScriptWebAppUrl: '',
    appsScriptSecretToken: 'RM_TEAM_SYNC_2026_SECURE_TOKEN_#99',
    syncIntervalMinutes: 5,
    lastSyncStatus: 'Idle',
    updatedBy: 'System',
    updatedAt: now,
  };

  const initialAudit: AuditLog[] = [
    {
      id: 'log_boot_001',
      userId: 'usr_admin0',
      username: 'Admin0',
      role: 'Admin',
      action: 'LOGIN',
      timestamp: now,
      details: 'System initialized with secure role-based partitions and initial bootstrap accounts.',
    }
  ];

  return {
    users,
    customerFiles: defaultFiles,
    attachments: [],
    auditLogs: initialAudit,
    settings: defaultSettings,
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.customerFiles && parsed.settings) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading db.json, generating defaults:', e);
    }
    const initial = createInitialDatabase();
    this.saveDatabase(initial);
    return initial;
  }

  private saveDatabase(dataToSave: DatabaseSchema = this.data) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Error persisting database to disk:', e);
    }
  }

  // Users & Auth
  public getUsers(): UserRecord[] {
    return this.data.users;
  }

  public getUserByUsername(username: string): UserRecord | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByRmCode(rmCode: string): UserRecord | undefined {
    return this.data.users.find(u => u.rmCode === rmCode);
  }

  public updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.saveDatabase();
    return this.data.users[idx];
  }

  public createUser(user: UserRecord): UserRecord {
    this.data.users.push(user);
    this.saveDatabase();
    return user;
  }

  // Customer Files
  public getCustomerFiles(includeDeleted: boolean = false): CustomerFile[] {
    if (includeDeleted) return this.data.customerFiles;
    return this.data.customerFiles.filter(f => !f.isDeleted);
  }

  public getCustomerFileById(fileId: string): CustomerFile | undefined {
    return this.data.customerFiles.find(f => f.fileId === fileId);
  }

  public createCustomerFile(file: CustomerFile): CustomerFile {
    this.data.customerFiles.unshift(file);
    this.saveDatabase();
    return file;
  }

  public updateCustomerFile(fileId: string, updates: Partial<CustomerFile>): CustomerFile | undefined {
    const idx = this.data.customerFiles.findIndex(f => f.fileId === fileId);
    if (idx === -1) return undefined;
    const existing = this.data.customerFiles[idx];
    // Preserve original fileId and createdAt
    this.data.customerFiles[idx] = {
      ...existing,
      ...updates,
      fileId: existing.fileId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data.customerFiles[idx];
  }

  public softDeleteCustomerFile(fileId: string, deletedBy: string): boolean {
    const idx = this.data.customerFiles.findIndex(f => f.fileId === fileId);
    if (idx === -1) return false;
    this.data.customerFiles[idx].isDeleted = true;
    this.data.customerFiles[idx].deletedAt = new Date().toISOString();
    this.data.customerFiles[idx].deletedBy = deletedBy;
    this.data.customerFiles[idx].updatedAt = new Date().toISOString();
    this.saveDatabase();
    return true;
  }

  public permanentDeleteCustomerFile(fileId: string): boolean {
    const idx = this.data.customerFiles.findIndex(f => f.fileId === fileId);
    if (idx === -1) return false;
    this.data.customerFiles.splice(idx, 1);
    this.saveDatabase();
    return true;
  }

  // Attachments
  public addAttachment(attachment: StoredAttachment): StoredAttachment {
    this.data.attachments.push(attachment);
    this.saveDatabase();
    return attachment;
  }

  public getAttachmentsByFileId(fileId: string): StoredAttachment[] {
    return this.data.attachments.filter(a => a.fileId === fileId);
  }

  public getAttachmentById(id: string): StoredAttachment | undefined {
    return this.data.attachments.find(a => a.id === id);
  }

  public deleteAttachment(id: string): boolean {
    const idx = this.data.attachments.findIndex(a => a.id === id);
    if (idx === -1) return false;
    const item = this.data.attachments[idx];
    try {
      const filePath = path.join(ATTACHMENTS_DIR, item.diskFileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.error('Error removing file from disk:', e);
    }
    this.data.attachments.splice(idx, 1);
    this.saveDatabase();
    return true;
  }

  // Settings
  public getSettings(): AppSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...updates, updatedAt: new Date().toISOString() };
    this.saveDatabase();
    return this.data.settings;
  }

  // Location Monitoring
  public recordUserLocation(loc: UserLocation): UserLocation {
    if (!this.data.userLocations) {
      this.data.userLocations = [];
    }
    this.data.userLocations.unshift(loc);
    // Keep last 500 location pings
    if (this.data.userLocations.length > 500) {
      this.data.userLocations.pop();
    }
    this.saveDatabase();
    return loc;
  }

  public getLatestUserLocations(): UserLocation[] {
    if (!this.data.userLocations) return [];
    const map = new Map<string, UserLocation>();
    for (const loc of this.data.userLocations) {
      const key = loc.rmCode || loc.username;
      if (!map.has(key)) {
        map.set(key, loc);
      }
    }
    return Array.from(map.values());
  }

  public getAllUserLocations(): UserLocation[] {
    return this.data.userLocations || [];
  }

  // Audit Logs
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
    // Keep last 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs.pop();
    }
    this.saveDatabase();
    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // Notifications for RMs
  public addNotification(entry: Omit<RMNotification, 'id' | 'timestamp' | 'isRead'>): RMNotification {
    if (!this.data.notifications) {
      this.data.notifications = [];
    }
    const notif: RMNotification = {
      ...entry,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    this.data.notifications.unshift(notif);
    // Keep last 300 notifications
    if (this.data.notifications.length > 300) {
      this.data.notifications.pop();
    }
    this.saveDatabase();
    return notif;
  }

  public getNotificationsForUser(rmCodeOrRole: string, isElevated: boolean = false): RMNotification[] {
    if (!this.data.notifications) return [];
    if (isElevated) {
      return this.data.notifications;
    }
    return this.data.notifications.filter(n => n.recipientRmCode === rmCodeOrRole);
  }

  public markNotificationAsRead(id: string): boolean {
    if (!this.data.notifications) return false;
    const target = this.data.notifications.find(n => n.id === id);
    if (target) {
      target.isRead = true;
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(rmCodeOrRole: string, isElevated: boolean = false): boolean {
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

  public deleteNotification(id: string): boolean {
    if (!this.data.notifications) return false;
    const initialLen = this.data.notifications.length;
    this.data.notifications = this.data.notifications.filter(n => n.id !== id);
    if (this.data.notifications.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // Mobile SMS Dispatch Logging
  public addSmsLog(entry: Omit<SMSLog, 'id' | 'timestamp'>): SMSLog {
    if (!this.data.smsLogs) {
      this.data.smsLogs = [];
    }
    const log: SMSLog = {
      ...entry,
      id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.smsLogs.unshift(log);
    // Keep last 300 logs
    if (this.data.smsLogs.length > 300) {
      this.data.smsLogs.pop();
    }
    this.saveDatabase();
    return log;
  }

  public getSmsLogs(rmCode?: string): SMSLog[] {
    if (!this.data.smsLogs) return [];
    if (rmCode && rmCode !== 'all') {
      return this.data.smsLogs.filter(s => s.recipientRmCode === rmCode);
    }
    return this.data.smsLogs;
  }
}

export const db = new DatabaseManager();
export { ATTACHMENTS_DIR };
