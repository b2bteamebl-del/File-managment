export type UserRole = 'RM' | 'Admin' | 'Mentor';

export interface UserPreferences {
  fontSize?: 'normal' | 'medium' | 'large';
  language?: 'en' | 'bn';
  fontFamily?: 'inter' | 'roboto' | 'poppins' | 'siliguri';
  themeColor?: string;
  profilePicture?: string;
}

export interface User {
  id: string;
  username: string; // RM code (e.g. "104393") or "Admin0" or "12345"
  role: UserRole;
  name: string;
  email?: string;
  mobile?: string;
  rmCode?: string; // Set for RM users, optional for Admin/Mentor
  status: 'Active' | 'Inactive' | 'Suspended';
  mustChangePassword?: boolean;
  createdAt: string;
  lastLogin?: string;
  preferences?: UserPreferences;
}

export type ApplicationStatus =
  | 'Collected'
  | 'Submitted'
  | 'Declined'
  | 'Return to Source'
  | 'Approved'
  | 'Query'
  | 'Condition'
  | 'STC';

export type ActiveStatus = 'Y' | 'N' | 'C';

export type CPVStatus = 'Pending' | 'Completed' | 'Failed' | 'Not Required';

export interface FileAttachment {
  id: string;
  fileId: string;
  category: 'Status Update Picture' | 'CPV Picture' | 'Others' | 'Customer Document' | 'Supporting Document';
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl?: string; // Protected/base64 data on server, served via authenticated endpoint
  storagePath?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CustomerFile {
  fileId: string; // Unique auto-generated key e.g. "RM-2026-00101"
  customerName: string;
  companyName: string;
  officeAddress: string;
  mobile: string;
  altMobile?: string;
  email?: string;
  rmCode: string; // Read-only for RM, assigned RM Code
  rmName?: string;
  productType: string; // e.g. "Credit Card", "B2B", "Corporate Card", "Split", "Limit Enhancement"
  ccNumber?: string; // CC-number (Credit Card Number / Account Number)
  applicationStatus: ApplicationStatus;
  activeStatus: ActiveStatus;
  pendingDocuments: string[]; // e.g. ["NID", "Salary Certificate"]
  remarks?: string;

  // Location tracking at entry (visible ONLY to Mentor)
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  locationCapturedAt?: string;

  // CPV fields
  cpvStatus: CPVStatus;
  cpvDate?: string;
  cpvAddress?: string;
  cpvRemarks?: string;
  cpvPhotoAttachmentId?: string;
  cpvDocAttachmentId?: string;
  cpvLastUpdatedBy?: string;

  attachments?: FileAttachment[];

  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  submittedAt?: string;
  approvedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;

  // Sync state
  sheetsSyncStatus?: 'Synced' | 'Pending' | 'Failed';
  sheetsSyncedAt?: string;
}

export interface RMProfile {
  rmCode: string;
  rmName: string;
  mobile: string;
  email: string;
  officeAddress: string;
  ipAddress?: string;
  accountStatus: 'Active' | 'Inactive' | 'Suspended';
  createdAt: string;
  lastLogin?: string;
  authUid?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'EXPORT' | 'RM_STATUS_CHANGE' | 'SHEETS_SYNC' | 'UPDATE_PREFERENCES';
  fileId?: string;
  rmCode?: string;
  timestamp: string; // ISO Asia/Dhaka formatted
  details: string;
  ipAddress?: string;
}

export interface UserLocation {
  userId: string;
  username: string;
  rmCode?: string;
  name: string;
  role: UserRole;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  timestamp: string; // ISO Asia/Dhaka formatted
  actionContext?: string;
}

export interface AppSettings {
  appName: string; // Universal app name (configured by Mentor)
  teamName: string; // Universal team name (configured by Mentor)
  productTypes: string[];
  pendingDocOptions: string[];
  applicationStatuses: string[];
  reportingWeekStart: 'Saturday' | 'Sunday' | 'Monday'; // Default: Saturday
  googleSpreadsheetId: string;
  appsScriptWebAppUrl: string;
  appsScriptSecretToken: string;
  syncIntervalMinutes: number;
  lastSuccessfulSync?: string;
  lastSyncAttempt?: string;
  lastSyncStatus?: 'Idle' | 'InProgress' | 'Success' | 'Error';
  lastSyncError?: string;
  enableMobileSmsAlerts?: boolean;
  smsGatewayUrl?: string;
  smsSenderId?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface SMSLog {
  id: string;
  recipientMobile: string;
  recipientRmCode: string;
  recipientName: string;
  fileId?: string;
  message: string;
  status: 'Delivered' | 'Sent' | 'Failed';
  gateway: string;
  timestamp: string;
}

export interface KPICounts {
  totalFiles: number;
  collected: number;
  submitted: number;
  approved: number;
  declined: number;
  query: number;
  returnToSource: number;
  condition: number;
  stc: number;
  pendingDocuments: number;
  activeCardsY: number;
  inactiveCardsN: number;
  cancelledCardsC: number;
}

export type TimeRangeFilter = 'Today' | 'This Week' | 'Last Week' | 'This Month' | 'Last Month' | 'All Time' | 'Custom';

export interface RMNotification {
  id: string;
  recipientRmCode: string; // RM code (e.g. "104393")
  fileId: string;
  customerName: string;
  action: 'UPDATE' | 'DELETE' | 'RESTORE' | 'STATUS_CHANGE';
  performedBy: string; // e.g. "Admin0" or "12345"
  performedByName: string; // e.g. "System Administrator"
  performedByRole: 'Admin' | 'Mentor';
  title: string;
  message: string;
  timestamp: string; // ISO Asia/Dhaka
  isRead: boolean;
  metadata?: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    isPermanentDelete?: boolean;
  };
}

