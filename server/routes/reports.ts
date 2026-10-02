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
    pendingDocFiles: filteredFiles.filter(f => f.pendingDocuments && f.pendingDocuments.length > 0),
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
      'CC-number': f.ccNumber || '',
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

    if (user.role === 'Mentor') {
      base['Entry Location'] = f.locationAddress || (f.locationLat ? `${f.locationLat}, ${f.locationLng}` : '');
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

  if (format === 'pdf') {
    const tableHeaders = ['File ID', 'CC-number', 'Customer Name', 'Company Name', 'Mobile', 'Product Type', 'Status', 'Active'];
    if (user.role !== 'RM') tableHeaders.push('RM Code');
    if (user.role === 'Mentor') tableHeaders.push('Entry Location');
    tableHeaders.push('Created At');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${filename} - PDF Report</title>
  <style>
    @page { size: landscape; margin: 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 15px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f294a; padding-bottom: 12px; margin-bottom: 15px; }
    .brand { font-size: 18px; font-weight: 800; color: #0f294a; }
    .sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .meta { text-align: right; font-size: 10px; color: #475569; }
    .kpi-row { display: flex; gap: 15px; margin-bottom: 15px; }
    .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; flex: 1; }
    .kpi-title { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .kpi-val { font-size: 16px; font-weight: 800; color: #0f294a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background-color: #0f294a; color: #ffffff; font-weight: 700; text-align: left; padding: 7px 6px; font-size: 10px; text-transform: uppercase; }
    td { padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .badge-approved { background: #dcfce7; color: #166534; }
    .badge-submitted { background: #dbeafe; color: #1e40af; }
    .badge-declined { background: #fee2e2; color: #991b1b; }
    .badge-other { background: #f1f5f9; color: #475569; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
    <div><strong>Ready to Print / Save as PDF:</strong> Use the button on the right, or press Ctrl+P (Cmd+P) and choose "Save as PDF".</div>
    <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 7px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;">Save as PDF / Print Now</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">EBL Team Member Data Management System</div>
      <div class="sub">Portfolio Activity & Customer Files Verified Report • Timezone: Asia/Dhaka</div>
    </div>
    <div class="meta">
      <div><strong>Generated By:</strong> ${user.name} (${user.role}${user.rmCode ? ` • RM ${user.rmCode}` : ''})</div>
      <div><strong>Date:</strong> ${formatDhakaDateTime(new Date().toISOString())}</div>
      <div><strong>Total Records:</strong> ${rows.length} files</div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi">
      <div class="kpi-title">Total Filtered Files</div>
      <div class="kpi-val">${rows.length}</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Approved Files</div>
      <div class="kpi-val">${rows.filter(r => r['Application Status'] === 'Approved').length}</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Submitted Applications</div>
      <div class="kpi-val">${rows.filter(r => r['Application Status'] === 'Submitted').length}</div>
    </div>
    <div class="kpi">
      <div class="kpi-title">Active Cards (Y)</div>
      <div class="kpi-val">${rows.filter(r => r['Active Status'] === 'Y').length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        ${tableHeaders.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.map(r => `
        <tr>
          <td style="font-family: monospace; font-weight: 700;">${r['File ID']}</td>
          <td style="font-family: monospace;">${r['CC-number'] || '—'}</td>
          <td style="font-weight: 600;">${r['Customer Name']}</td>
          <td>${r['Company Name']}</td>
          <td>${r['Mobile Number']}</td>
          <td>${r['Product Type']}</td>
          <td>
            <span class="badge ${
              r['Application Status'] === 'Approved' ? 'badge-approved' : 
              r['Application Status'] === 'Submitted' ? 'badge-submitted' : 
              r['Application Status'] === 'Declined' ? 'badge-declined' : 'badge-other'
            }">
              ${r['Application Status']}
            </span>
          </td>
          <td style="text-align: center; font-weight: 700;">${r['Active Status']}</td>
          ${user.role !== 'RM' ? `<td>${r['RM Code']}</td>` : ''}
          ${user.role === 'Mentor' ? `<td style="font-size: 9px;">${r['Entry Location'] || '—'}</td>` : ''}
          <td>${r['Created Date (Dhaka)']}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <script>
    // Auto prompt print dialog after load
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(htmlContent);
  }

  // Default CSV
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  return res.send(csv);
});

export default router;
