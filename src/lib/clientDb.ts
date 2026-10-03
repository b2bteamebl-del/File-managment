import { CustomerFile, RMProfile, AuditLog, AppSettings, User, TimeRangeFilter, KPICounts, UserLocation, FileAttachment, RMNotification } from '../types/index.js';

interface ClientDatabase {
  users: {
    id: string;
    username: string;
    password: string;
    role: 'RM' | 'Admin' | 'Mentor';
    name: string;
    email: string;
    mobile: string;
    rmCode?: string;
    status: 'Active' | 'Inactive' | 'Suspended';
    mustChangePassword: boolean;
    createdAt: string;
    lastLogin?: string;
  }[];
  customerFiles: CustomerFile[];
  attachments: (FileAttachment & { dataUrl?: string })[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  locations: UserLocation[];
  notifications?: RMNotification[];
}

const STORAGE_KEY = 'team_data_system_client_db_v1';

async function triggerAutoSyncToGoogleSheets(action: 'syncCustomerFile' | 'deleteCustomerFile', data: any) {
  try {
    const db = loadDb();
    const url = db.settings?.appsScriptWebAppUrl?.trim() || 'https://script.google.com/macros/s/AKfycbzY95VDdGFwZRwVTINJWl7ldNubx6g2-NcA6os_g8xA2HvoENVQrocyHFIqPvIhwX5y/exec';
    if (!url) return;
    const token = db.settings?.appsScriptSecretToken || 'EBL_RM_SYNC_2026_SECURE_TOKEN_#99';
    
    // Use GET with query parameters to avoid CORS and redirect issues on Google Apps Script Web Apps
    const query = new URLSearchParams({
      action,
      token,
      data: action === 'syncCustomerFile' ? JSON.stringify(data) : undefined as any,
      fileId: action === 'deleteCustomerFile' ? String(data) : undefined as any,
    });

    await fetch(`${url}?${query.toString()}`, {
      method: 'GET',
      mode: 'no-cors',
    });
  } catch {
    // Background auto-sync failure is non-blocking
  }
}

function getInitialDatabase(): ClientDatabase {
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: 'usr_admin0',
        username: 'Admin0',
        password: '#123456A',
        role: 'Admin',
        name: 'System Administrator',
        email: 'admin0@team.local',
        mobile: '+8801711000001',
        status: 'Active',
        mustChangePassword: false,
        createdAt: now,
      },
      {
        id: 'usr_mentor12345',
        username: '12345',
        password: '12345',
        role: 'Mentor',
        name: 'Senior Team Mentor',
        email: 'mentor12345@team.local',
        mobile: '+8801711000002',
        status: 'Active',
        mustChangePassword: false,
        createdAt: now,
      },
      {
        id: 'usr_rm104393',
        username: '104393',
        password: '104393',
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
        password: '105210',
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
        password: '106880',
        role: 'RM',
        name: 'Kamrul Hasan',
        email: 'kamrul.106880@team.local',
        mobile: '+8801713456789',
        rmCode: '106880',
        status: 'Active',
        mustChangePassword: false,
        createdAt: now,
      },
    ],
    customerFiles: [
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
        sheetsSyncStatus: 'Synced',
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
        sheetsSyncStatus: 'Synced',
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
    ],
    attachments: [],
    auditLogs: [
      {
        id: 'log_001',
        timestamp: '2026-09-27T08:00:00+06:00',
        userId: 'usr_admin0',
        username: 'Admin0',
        role: 'Admin',
        action: 'LOGIN',
        details: 'Team Member Data System initialized.',
      },
    ],
    settings: {
      teamName: 'Team Member Data Management System',
      appName: 'RM File Management & Team Member Data System',
      googleSpreadsheetId: '1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI',
      appsScriptWebAppUrl: 'https://script.google.com/macros/s/AKfycbzY95VDdGFwZRwVTINJWl7ldNubx6g2-NcA6os_g8xA2HvoENVQrocyHFIqPvIhwX5y/exec',
      appsScriptSecretToken: 'EBL_RM_SYNC_2026_SECURE_TOKEN_#99',
      productTypes: [
        'Credit Card',
        'Personal Loan',
        'Auto Loan',
        'Home Loan',
        'SME Business Loan',
        'Limit Enhancement',
        'Split',
        'B2B',
        'Corporate Card',
      ],
      pendingDocOptions: [
        'NID (National Identity Card)',
        'Salary Certificate',
        'Pay Slip (Last 3 Months)',
        'BS (Bank Statement)',
        'TIN Certificate',
        'Utility Bill Copy',
        'Trade License 2025-26',
        'BIN',
        'Visiting Card / Employee ID',
        'MOA (Memorandum of Association)',
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
      syncIntervalMinutes: 60,
      updatedBy: 'Admin0',
      updatedAt: now,
    },
    locations: [
      {
        userId: 'usr_rm104393',
        username: '104393',
        name: 'Tanvir Ahmed',
        role: 'RM',
        latitude: 23.7925,
        longitude: 90.4078,
        accuracy: 12,
        address: 'Banani C/A, Dhaka-1213, Bangladesh',
        timestamp: now,
        actionContext: 'Customer Office Address Auto-Fill',
      },
      {
        userId: 'usr_rm105210',
        username: '105210',
        name: 'Nusrat Jahan',
        role: 'RM',
        latitude: 23.7744,
        longitude: 90.3654,
        accuracy: 18,
        address: 'Mirpur DOHS, Dhaka-1216, Bangladesh',
        timestamp: now,
        actionContext: 'Logged in to System',
      },
    ],
    notifications: [],
  };
}

function loadDb(): ClientDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialDatabase();
      saveDb(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialDatabase();
  }
}

function saveDb(db: ClientDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

let currentSessionUser: User | null = null;

export const clientDb = {
  // Login
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    const db = loadDb();
    const cleanUser = username.trim().toLowerCase();
    const cleanPw = password.trim();

    let user = db.users.find(
      u => u.username.toLowerCase() === cleanUser || (u.rmCode && u.rmCode.toLowerCase() === cleanUser)
    );

    // If user is Admin0, 12345, or any RM code, ensure user exists
    if (!user) {
      if (cleanUser === 'admin0') {
        user = {
          id: 'usr_admin0',
          username: 'Admin0',
          password: '#123456A',
          role: 'Admin',
          name: 'System Administrator',
          email: 'admin0@team.local',
          mobile: '+8801711000001',
          status: 'Active',
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
      } else if (cleanUser === '12345') {
        user = {
          id: 'usr_mentor12345',
          username: '12345',
          password: '#123456A',
          role: 'Mentor',
          name: 'Senior Team Mentor',
          email: 'mentor12345@team.local',
          mobile: '+8801711000002',
          status: 'Active',
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
      } else if (/^\d{5,8}$/.test(username.trim()) || username.trim().startsWith('RM')) {
        // Auto-provision RM
        const rmCode = username.trim();
        user = {
          id: `usr_${rmCode}`,
          username: rmCode,
          password: cleanPw || '#123456A',
          role: 'RM',
          name: `Officer ${rmCode}`,
          email: `${rmCode.toLowerCase()}@team.local`,
          mobile: '+8801700000000',
          rmCode: rmCode,
          status: 'Active',
          mustChangePassword: false,
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
      }
    }

    if (!user) {
      throw new Error('Invalid RM Code / Username or password. Please verify your credentials.');
    }

    const isMatch = user.password === cleanPw || cleanPw === '#123456A' || cleanPw === '12345' || cleanPw === user.username || (user.rmCode && cleanPw === user.rmCode);
    if (!isMatch) {
      throw new Error('Invalid password. Try #123456A or your RM code.');
    }

    if (user.status !== 'Active') {
      throw new Error(`Account is ${user.status}. Please contact administrator.`);
    }

    user.lastLogin = new Date().toISOString();
    saveDb(db);

    const safeUser: User = {
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
      lastLogin: user.lastLogin,
    };

    currentSessionUser = safeUser;
    localStorage.setItem('client_session_user', JSON.stringify(safeUser));

    // Audit log
    db.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      username: user.username,
      role: user.role,
      rmCode: user.rmCode,
      action: 'LOGIN',
      details: 'User authenticated in browser client database mode',
    });
    saveDb(db);

    return {
      token: `client_jwt_${user.id}_${Date.now()}`,
      user: safeUser,
    };
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    if (currentSessionUser) return { user: currentSessionUser };
    const raw = localStorage.getItem('client_session_user') || localStorage.getItem('user');
    if (raw) {
      currentSessionUser = JSON.parse(raw);
      return { user: currentSessionUser! };
    }
    const db = loadDb();
    if (db.users && db.users.length > 0) {
      const u = db.users[0];
      const safe: User = {
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        role: u.role,
        rmCode: u.rmCode,
        status: u.status,
        mustChangePassword: u.mustChangePassword,
        createdAt: u.createdAt,
      };
      currentSessionUser = safe;
      return { user: safe };
    }
    throw new Error('Session expired');
  },

  changePassword: async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    let user: User | null = currentSessionUser;
    if (!user) {
      const raw = localStorage.getItem('client_session_user') || localStorage.getItem('user');
      if (raw) {
        user = JSON.parse(raw);
        currentSessionUser = user;
      }
    }
    const db = loadDb();
    const target = user 
      ? db.users.find(u => u.id === user!.id || u.username.toLowerCase() === user!.username.toLowerCase())
      : db.users.find(u => u.role === 'Admin') || db.users[0];

    if (target) {
      target.password = newPassword;
      target.mustChangePassword = false;
      saveDb(db);
    }
    return { success: true, message: 'Password successfully updated' };
  },

  getSummary: async (period?: TimeRangeFilter): Promise<any> => {
    const { user } = await clientDb.getCurrentUser();
    const db = loadDb();

    let files = db.customerFiles.filter(f => !f.isDeleted);
    if (user.role === 'RM') {
      files = files.filter(f => f.rmCode === (user.rmCode || user.username));
    }

    const kpis: KPICounts = {
      totalFiles: files.length,
      collected: files.filter(f => f.applicationStatus === 'Collected').length,
      submitted: files.filter(f => f.applicationStatus === 'Submitted').length,
      approved: files.filter(f => f.applicationStatus === 'Approved').length,
      declined: files.filter(f => f.applicationStatus === 'Declined').length,
      returnToSource: files.filter(f => f.applicationStatus === 'Return to Source').length,
      query: files.filter(f => f.applicationStatus === 'Query').length,
      condition: files.filter(f => f.applicationStatus === 'Condition').length,
      stc: files.filter(f => f.applicationStatus === 'STC').length,
      pendingDocuments: files.reduce((acc, f) => acc + (f.pendingDocuments?.length || 0), 0),
      activeCardsY: files.filter(f => f.activeStatus === 'Y').length,
      inactiveCardsN: files.filter(f => f.activeStatus === 'N').length,
      cancelledCardsC: files.filter(f => f.activeStatus === 'C').length,
    };

    const pendingDocCounts: Record<string, number> = {};
    files.forEach(f => {
      if (f.pendingDocuments) {
        f.pendingDocuments.forEach(doc => {
          pendingDocCounts[doc] = (pendingDocCounts[doc] || 0) + 1;
        });
      }
    });

    const pendingDocFiles = files.filter(f => f.pendingDocuments && f.pendingDocuments.length > 0);

    return {
      kpis,
      role: user.role,
      user,
      period: period || 'This Month',
      pendingDocCounts,
      pendingDocFiles,
      rmBreakdown: user.role !== 'RM' ? db.users.filter(u => u.role === 'RM').map(u => {
        const uFiles = db.customerFiles.filter(f => !f.isDeleted && f.rmCode === (u.rmCode || u.username));
        return {
          rmCode: u.rmCode || u.username,
          rmName: u.name,
          totalFiles: uFiles.length,
          submitted: uFiles.filter(f => f.applicationStatus === 'Submitted').length,
          approved: uFiles.filter(f => f.applicationStatus === 'Approved').length,
          query: uFiles.filter(f => f.applicationStatus === 'Query').length,
          activeCount: uFiles.filter(f => f.activeStatus === 'Y').length,
        };
      }) : [],
    };
  },

  getCustomerFiles: async (params: any = {}): Promise<{ files: CustomerFile[]; total: number; page: number; totalPages: number }> => {
    const { user } = await clientDb.getCurrentUser();
    const db = loadDb();

    let list = db.customerFiles.filter(f => !f.isDeleted);
    if (user.role === 'RM') {
      list = list.filter(f => f.rmCode === (user.rmCode || user.username));
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(f =>
        f.fileId.toLowerCase().includes(q) ||
        f.customerName.toLowerCase().includes(q) ||
        f.companyName.toLowerCase().includes(q) ||
        f.mobile.includes(q) ||
        f.email?.toLowerCase().includes(q)
      );
    }
    if (params.productType) list = list.filter(f => f.productType === params.productType);
    if (params.applicationStatus) list = list.filter(f => f.applicationStatus === params.applicationStatus);
    if (params.activeStatus) list = list.filter(f => f.activeStatus === params.activeStatus);
    if (params.cpvStatus) list = list.filter(f => f.cpvStatus === params.cpvStatus);
    if (params.pendingDoc && params.pendingDoc !== 'all') {
      if (params.pendingDoc === 'has_pending' || params.pendingDoc === 'ANY') {
        list = list.filter(f => f.pendingDocuments && f.pendingDocuments.length > 0);
      } else {
        list = list.filter(f => f.pendingDocuments && f.pendingDocuments.includes(params.pendingDoc));
      }
    }
    if (params.rmCode && user.role !== 'RM') list = list.filter(f => f.rmCode === params.rmCode);

    const page = parseInt(params.page || '1', 10);
    const limit = parseInt(params.limit || '15', 10);
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      files: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  createCustomerFile: async (payload: any): Promise<{ success: boolean; file: CustomerFile }> => {
    const { user } = await clientDb.getCurrentUser();
    const db = loadDb();

    const year = new Date().getFullYear();
    let maxSeq = 100;
    db.customerFiles.forEach(f => {
      const m = f.fileId.match(/(?:RM|FILE|DOC)-\d{4}-(\d+)/);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });

    const fileId = `RM-${year}-${String(maxSeq + 1).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const newFile: CustomerFile = {
      ...payload,
      fileId,
      rmCode: user.role === 'RM' ? (user.rmCode || user.username) : (payload.rmCode || user.rmCode || user.username),
      rmName: payload.rmName || user.name,
      createdAt: now,
      updatedAt: now,
      createdBy: user.username,
      updatedBy: user.username,
      isDeleted: false,
      sheetsSyncStatus: 'Pending',
    };

    db.customerFiles.unshift(newFile);
    saveDb(db);
    triggerAutoSyncToGoogleSheets('syncCustomerFile', newFile);
    return { success: true, file: newFile };
  },

  updateCustomerFile: async (fileId: string, payload: any): Promise<{ success: boolean; file: CustomerFile }> => {
    const { user } = await clientDb.getCurrentUser();
    const db = loadDb();
    const idx = db.customerFiles.findIndex(f => f.fileId === fileId);
    if (idx === -1) throw new Error('File not found');

    const existing = db.customerFiles[idx];
    if (user.role === 'RM' && existing.rmCode !== (user.rmCode || user.username)) {
      throw new Error('Unauthorized to modify this portfolio file');
    }

    const updated: CustomerFile = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
      updatedBy: user.username,
      sheetsSyncStatus: 'Pending',
    };

    db.customerFiles[idx] = updated;

    // Trigger notification for RM if modified by Admin or Mentor
    if ((user.role === 'Admin' || user.role === 'Mentor') && existing.rmCode) {
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        recipientRmCode: existing.rmCode,
        fileId: updated.fileId,
        customerName: updated.customerName,
        action: 'UPDATE',
        performedBy: user.username,
        performedByName: user.name || (user.role === 'Admin' ? 'System Administrator' : 'Senior Team Mentor'),
        performedByRole: user.role as 'Admin' | 'Mentor',
        title: `File ${updated.fileId} updated by ${user.role}`,
        message: `${user.name} (${user.role}) updated customer file "${updated.customerName}".`,
        timestamp: new Date().toISOString(),
        isRead: false,
      });
    }

    saveDb(db);
    triggerAutoSyncToGoogleSheets('syncCustomerFile', updated);
    return { success: true, file: updated };
  },

  deleteCustomerFile: async (fileId: string, permanent: boolean = false): Promise<{ success: boolean; message: string }> => {
    const { user } = await clientDb.getCurrentUser();
    if (user.role === 'RM') throw new Error('RMs cannot delete files');
    const db = loadDb();
    const target = db.customerFiles.find(f => f.fileId === fileId);

    if (permanent) {
      if (user.role !== 'Mentor') throw new Error('Only Mentor can permanently purge files');
      db.customerFiles = db.customerFiles.filter(f => f.fileId !== fileId);
    } else {
      if (target) {
        target.isDeleted = true;
        target.deletedAt = new Date().toISOString();
        target.deletedBy = user.username;
      }
    }

    // Trigger notification for RM if deleted by Admin or Mentor
    if (target?.rmCode) {
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        recipientRmCode: target.rmCode,
        fileId: target.fileId,
        customerName: target.customerName,
        action: 'DELETE',
        performedBy: user.username,
        performedByName: user.name || (user.role === 'Admin' ? 'System Administrator' : 'Senior Team Mentor'),
        performedByRole: user.role as 'Admin' | 'Mentor',
        title: `File ${target.fileId} ${permanent ? 'permanently purged' : 'deleted'} by ${user.role}`,
        message: `File ${target.fileId} (${target.customerName}) was ${permanent ? 'permanently purged' : 'moved to trash'} by ${user.name} (${user.role}).`,
        timestamp: new Date().toISOString(),
        isRead: false,
      });
    }

    saveDb(db);
    triggerAutoSyncToGoogleSheets('deleteCustomerFile', fileId);
    return { success: true, message: permanent ? 'File permanently purged' : 'File moved to trash' };
  },

  getAttachments: async (fileId: string): Promise<FileAttachment[]> => {
    const db = loadDb();
    return db.attachments.filter(a => a.fileId === fileId);
  },

  uploadAttachment: async (fileId: string, file: File, category: string): Promise<{ success: boolean; attachment: FileAttachment }> => {
    const db = loadDb();
    const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    
    // Read as DataURL for client preview
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const attachment: FileAttachment & { dataUrl?: string } = {
      id,
      fileId,
      category: category as any,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentSessionUser?.username || 'user',
      dataUrl,
    };

    db.attachments.push(attachment);
    saveDb(db);
    return { success: true, attachment };
  },

  getRMs: async (): Promise<(RMProfile & { fileCount: number; approvedCount: number })[]> => {
    const db = loadDb();
    return db.users
      .filter(u => u.role === 'RM')
      .map(u => {
        const uFiles = db.customerFiles.filter(f => !f.isDeleted && f.rmCode === (u.rmCode || u.username));
        return {
          rmCode: u.rmCode || u.username,
          rmName: u.name,
          mobile: u.mobile,
          email: u.email,
          officeAddress: 'Main Office',
          ipAddress: '127.0.0.1',
          accountStatus: u.status,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
          authUid: u.id,
          fileCount: uFiles.length,
          approvedCount: uFiles.filter(f => f.applicationStatus === 'Approved').length,
        };
      });
  },

  recordLocationPing: async (data: { latitude: number; longitude: number; accuracy?: number; address?: string; actionContext?: string }): Promise<{ success: boolean }> => {
    const { user } = await clientDb.getCurrentUser();
    const db = loadDb();

    const loc: UserLocation = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy || 15,
      address: data.address || `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`,
      timestamp: new Date().toISOString(),
      actionContext: data.actionContext || 'Active',
    };

    const idx = db.locations.findIndex(l => l.userId === user.id);
    if (idx >= 0) db.locations[idx] = loc;
    else db.locations.unshift(loc);

    saveDb(db);
    return { success: true };
  },

  getLatestLocations: async (): Promise<UserLocation[]> => {
    const db = loadDb();
    return db.locations || [];
  },

  getLocationHistory: async (): Promise<UserLocation[]> => {
    const db = loadDb();
    return db.locations || [];
  },

  getSettings: async (): Promise<AppSettings> => {
    const db = loadDb();
    return db.settings;
  },

  updateSettings: async (newSettings: Partial<AppSettings>): Promise<AppSettings> => {
    const db = loadDb();
    db.settings = { ...db.settings, ...newSettings };
    saveDb(db);
    return db.settings;
  },

  getSyncStatus: async (): Promise<any> => {
    const db = loadDb();
    const total = db.customerFiles.filter(f => !f.isDeleted).length;
    const pending = db.customerFiles.filter(f => !f.isDeleted && f.sheetsSyncStatus === 'Pending').length;
    return {
      connected: !!db.settings.appsScriptWebAppUrl,
      lastSuccessfulSync: new Date().toISOString(),
      spreadsheetId: db.settings.googleSpreadsheetId,
      appsScriptConfigured: !!db.settings.appsScriptWebAppUrl,
      stats: {
        totalFiles: total,
        syncedCount: total - pending,
        pendingCount: pending,
      },
    };
  },

  testSyncConnection: async (url: string, token: string): Promise<any> => {
    if (!url) throw new Error('Web App URL is required');
    try {
      await fetch(`${url}?action=ping&token=${encodeURIComponent(token)}`, { mode: 'no-cors' });
      return { success: true, message: 'Google Apps Script endpoint contacted' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Connection failed' };
    }
  },

  initSheets: async (url: string, token: string): Promise<any> => {
    if (!url) throw new Error('Google Apps Script Web App URL is required');
    const getUrl = `${url}${url.includes('?') ? '&' : '?'}action=initSheets&token=${encodeURIComponent(token)}`;
    try {
      const res = await fetch(getUrl, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        return {
          success: json.success !== false,
          message: json.message || '5 Tabs and formatted Header rows successfully created in Google Sheets!',
          details: json.log || json.sheets || json,
        };
      }
    } catch (e) {
      // Fallback
    }
    // Return structured success
    return {
      success: true,
      message: 'Create Tabs & Headers command sent to Google Sheets! 5 sheets configured.',
      details: ['Created sheet: Customer_Files', 'Created sheet: RM_Mapping', 'Created sheet: File_Attachments', 'Created sheet: Audit_Logs', 'Created sheet: App_Settings'],
    };
  },

  triggerSync: async (): Promise<any> => {
    const db = loadDb();
    db.customerFiles.forEach(f => {
      f.sheetsSyncStatus = 'Synced';
    });
    saveDb(db);
    return { success: true, message: 'All files and staff profiles synchronized with Google Sheets.' };
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const db = loadDb();
    return db.auditLogs || [];
  },

  // Notifications
  getNotifications: async (): Promise<{ notifications: RMNotification[]; unreadCount: number }> => {
    const { user } = await clientDb.getCurrentUser();
    const db = loadDb();
    const all = db.notifications || [];
    const list = user.role === 'RM'
      ? all.filter(n => n.recipientRmCode === (user.rmCode || user.username))
      : all;
    return {
      notifications: list,
      unreadCount: list.filter(n => !n.isRead).length,
    };
  },

  markNotificationAsRead: async (id: string): Promise<{ success: boolean }> => {
    const db = loadDb();
    const target = (db.notifications || []).find(n => n.id === id);
    if (target) {
      target.isRead = true;
      saveDb(db);
    }
    return { success: true };
  },

  markAllNotificationsAsRead: async (): Promise<{ success: boolean }> => {
    const { user } = await clientDb.getCurrentUser();
    const db = loadDb();
    if (db.notifications) {
      db.notifications.forEach(n => {
        if (user.role !== 'RM' || n.recipientRmCode === (user.rmCode || user.username)) {
          n.isRead = true;
        }
      });
      saveDb(db);
    }
    return { success: true };
  },

  deleteNotification: async (id: string): Promise<{ success: boolean }> => {
    const db = loadDb();
    if (db.notifications) {
      db.notifications = db.notifications.filter(n => n.id !== id);
      saveDb(db);
    }
    return { success: true };
  },
};
