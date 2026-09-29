import { Router, Response } from 'express';
import * as XLSX from 'xlsx';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { KPICounts, CustomerFile, TimeRangeFilter } from '../../src/types/index.js';
import { isDateInPeriod, formatDhakaDateTime } from '../../src/utils/dateTime.js';

const router = Router();
router.use(requireAuth);

function calculateKPIs(files: CustomerFile[]): KPICounts {
  const kpis: KPICounts = {
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
    cancelledCardsC: 0,
  };

  files.forEach(f => {
    switch (f.applicationStatus) {
      case 'Collected': kpis.collected++; break;
      case 'Submitted': kpis.submitted++; break;
      case 'Approved': kpis.approved++; break;
      case 'Declined': kpis.declined++; break;
      case 'Query': kpis.query++; break;
      case 'Return to Source': kpis.returnToSource++; break;
      case 'Condition': kpis.condition++; break;
      case 'STC': kpis.stc++; break;
    }

    if (f.activeStatus === 'Y') kpis.activeCardsY++;
    else if (f.activeStatus === 'N') kpis.inactiveCardsN++;
    else if (f.activeStatus === 'C') kpis.cancelledCardsC++;

    if (f.pendingDocuments && f.pendingDocuments.length > 0) {
      kpis.pendingDocuments++;
    }
  });

  return kpis;
}

// Get Dashboard Summary & Charts
router.get('/summary', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { period = 'All Time', rmCode } = req.query as { period?: TimeRangeFilter; rmCode?: string };
  const settings = db.getSettings();
  const weekStart = settings.reportingWeekStart || 'Saturday';

  let allFiles = db.getCustomerFiles(false);

  // RM Isolation
  if (user.role === 'RM') {
    const userRmCode = user.rmCode || user.username;
    allFiles = allFiles.filter(f => f.rmCode === userRmCode);
  } else if (rmCode && rmCode !== 'all') {
    allFiles = allFiles.filter(f => f.rmCode === rmCode);
  }

  // Filter by reporting period (Dhaka time)
  const filteredFiles = allFiles.filter(f => isDateInPeriod(f.createdAt, period, weekStart));

  const kpis = calculateKPIs(filteredFiles);

  // Status Distribution
  const statusDistribution: Record<string, number> = {};
  filteredFiles.forEach(f => {
    statusDistribution[f.applicationStatus] = (statusDistribution[f.applicationStatus] || 0) + 1;
  });

  // Product Distribution
  const productDistribution: Record<string, number> = {};
  filteredFiles.forEach(f => {
    productDistribution[f.productType] = (productDistribution[f.productType] || 0) + 1;
  });

  // Pending Documents count
  const pendingDocCounts: Record<string, number> = {};
  filteredFiles.forEach(f => {
    if (f.pendingDocuments) {
      f.pendingDocuments.forEach(doc => {
        pendingDocCounts[doc] = (pendingDocCounts[doc] || 0) + 1;
      });
    }
  });

  // RM-wise Performance Table (For Admin & Mentor)
  let rmPerformance: any[] = [];
  if (user.role !== 'RM') {
    const rmUsers = db.getUsers().filter(u => u.role === 'RM');
    rmPerformance = rmUsers.map(u => {
      const code = u.rmCode || u.username;
      const rmsFiles = filteredFiles.filter(f => f.rmCode === code);
      const rmKpis = calculateKPIs(rmsFiles);
      return {
        rmCode: code,
        rmName: u.name,
        mobile: u.mobile,
        status: u.status,
        ...rmKpis,
      };
    });
  }

  return res.json({
    period,
    kpis,
    statusDistribution,
    productDistribution,
    pendingDocCounts,
    rmPerformance,
    totalRecords: filteredFiles.length,
  });
});

// Export files to CSV or Excel (.xlsx)
router.get('/export', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { format = 'csv', period = 'All Time', rmCode, productType, applicationStatus } = req.query as Record<string, string>;
  const settings = db.getSettings();
  const weekStart = settings.reportingWeekStart || 'Saturday';

  let files = db.getCustomerFiles(false);

  // STRICT RM ISOLATION: RM can never export other RMs' records
  if (user.role === 'RM') {
    const userRmCode = user.rmCode || user.username;
    files = files.filter(f => f.rmCode === userRmCode);
  } else if (rmCode && rmCode !== 'all') {
    files = files.filter(f => f.rmCode === rmCode);
  }

  if (period && period !== 'All Time') {
    files = files.filter(f => isDateInPeriod(f.createdAt, period as any, weekStart));
  }
  if (productType && productType !== 'all') {
    files = files.filter(f => f.productType === productType);
  }
  if (applicationStatus && applicationStatus !== 'all') {
    files = files.filter(f => f.applicationStatus === applicationStatus);
  }

  // Shape exported data (sanitized, excluding passwords/tokens)
  const rows = files.map(f => {
    const base: Record<string, any> = {
      'File ID': f.fileId,
      'Customer Name': f.customerName,
      'Company Name': f.companyName,
      'Mobile Number': f.mobile,
      'Alt Mobile': f.altMobile || '',
      'Email': f.email || '',
      'Office Address': f.officeAddress,
      'Product Type': f.productType,
      'Application Status': f.applicationStatus,
      'Active Status': f.activeStatus,
    };

    if (user.role !== 'RM') {
      base['RM Code'] = f.rmCode;
      base['RM Name'] = f.rmName || '';
    }

    base['Pending Documents'] = (f.pendingDocuments || []).join('; ');
    base['CPV Status'] = f.cpvStatus;
    base['CPV Date'] = f.cpvDate || '';
    base['CPV Address'] = f.cpvAddress || '';
    base['Remarks'] = f.remarks || '';
    base['Created Date (Dhaka)'] = formatDhakaDateTime(f.createdAt);
    base['Submitted Date'] = f.submittedAt ? formatDhakaDateTime(f.submittedAt) : '';
    base['Approved Date'] = f.approvedAt ? formatDhakaDateTime(f.approvedAt) : '';

    return base;
  });

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    rmCode: user.rmCode,
    action: 'EXPORT',
    details: `Exported ${rows.length} records in format ${format.toUpperCase()}`,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `Team_RM_Report_${user.username}_${timestamp}`;

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer_Files');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  }

  // Default CSV
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  return res.send(csv);
});

export default router;
