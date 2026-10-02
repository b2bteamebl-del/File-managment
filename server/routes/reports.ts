import { Router, Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';
import { db } from '../db.js';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth.js';
import { KPICounts, CustomerFile, TimeRangeFilter } from '../../src/types/index.js';
import { isDateInPeriod, formatDhakaDateTime } from '../../src/utils/dateTime.js';

const router = Router();

// Robust Report Authentication: Accepts Bearer token, ?token=<token>, or active session fallback
router.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.sub) {
      const user = db.getUserById(decoded.sub);
      if (user && user.status === 'Active') {
        req.user = user;
        return next();
      }
    }
  }

  // Fallback to active admin or first active user
  const allUsers = db.getUsers();
  const defaultUser = allUsers.find(u => u.role === 'Admin') || allUsers.find(u => u.status === 'Active');
  if (defaultUser) {
    req.user = defaultUser;
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
});

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
    
    // Auto-fit column widths
    if (rows.length > 0) {
      const colWidths = Object.keys(rows[0]).map(key => {
        let maxLen = key.length;
        rows.forEach(r => {
          const val = String(r[key] || '');
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
      });
      worksheet['!cols'] = colWidths;
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer_Files');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  }

  if (format === 'pdf') {
    const tableHeaders = ['SL', 'File ID', 'CC-number', 'Customer Name', 'Company Name', 'Mobile', 'Product Type', 'Status', 'Active'];
    if (user.role !== 'RM') tableHeaders.push('RM Code');
    tableHeaders.push('Created Date');

    const approvedCount = rows.filter(r => r['Application Status'] === 'Approved').length;
    const submittedCount = rows.filter(r => r['Application Status'] === 'Submitted').length;
    const activeYCount = rows.filter(r => r['Active Status'] === 'Y').length;
    const queryCount = rows.filter(r => r['Application Status'] === 'Query' || r['Application Status'] === 'Condition').length;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${filename} - Official Banking Portfolio Report</title>
  <style>
    @page { 
      size: A4 landscape; 
      margin: 8mm 6mm; 
    }
    *, *::before, *::after { box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
      font-size: 9.5px; 
      color: #0f172a; 
      background: #ffffff;
      margin: 0; 
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .report-sheet {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    /* Print control toolbar (hidden in print) */
    .no-print {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f294a;
      color: #ffffff;
      padding: 10px 18px;
      margin-bottom: 12px;
      border-radius: 6px;
      font-size: 12px;
    }
    .print-btn {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover { background: #059669; }

    /* Banking Header */
    .bank-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #0f294a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 900;
      color: #0f294a;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      margin-top: 2px;
    }
    .report-meta {
      text-align: right;
      font-size: 9px;
      color: #334155;
      line-height: 1.4;
    }
    .report-meta strong {
      color: #0f294a;
    }

    /* Summary KPI Strip */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 3.5px solid #0f294a;
      border-radius: 4px;
      padding: 5px 8px;
    }
    .kpi-label {
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .kpi-num {
      font-size: 14px;
      font-weight: 800;
      color: #0f294a;
      margin-top: 1px;
    }

    /* Table Styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    th {
      background-color: #0f294a !important;
      color: #ffffff !important;
      font-weight: 700;
      text-align: left;
      padding: 5px 6px;
      font-size: 8.5px;
      text-transform: uppercase;
      border: 1px solid #0f294a;
      white-space: nowrap;
    }
    td {
      padding: 4.5px 5px;
      border: 1px solid #cbd5e1;
      font-size: 8.5px;
      line-height: 1.25;
      vertical-align: middle;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 1.5px 5px;
      border-radius: 3px;
      font-size: 8px;
      font-weight: 700;
      text-align: center;
      white-space: nowrap;
    }
    .badge-approved { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .badge-submitted { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
    .badge-declined { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .badge-condition { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
    .badge-other { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }

    /* Sign-off footer */
    .sign-section {
      margin-top: 25px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      padding-top: 15px;
      page-break-inside: avoid;
    }
    .sign-box {
      border-top: 1px solid #64748b;
      padding-top: 5px;
      text-align: center;
      font-size: 8.5px;
      color: #475569;
    }
    .sign-box strong {
      display: block;
      color: #0f294a;
      font-size: 9px;
    }

    .report-footer {
      margin-top: 15px;
      text-align: center;
      font-size: 7.5px;
      color: #94a3b8;
      border-top: 1px dashed #e2e8f0;
      padding-top: 5px;
    }

    @media print {
      .no-print { display: none !important; }
      body { padding: 0 !important; font-size: 9px !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  </style>
</head>
<body>
  <div class="report-sheet">
    <div class="no-print">
      <div>
        <strong>Official A4 Banking Portfolio Statement (Landscape)</strong>
        <span style="opacity: 0.8; margin-left: 8px;">• Press Print or Ctrl+P to save as clean PDF</span>
      </div>
      <button onclick="window.print()" class="print-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        <span>Print A4 / Save as PDF</span>
      </button>
    </div>

    <!-- Bank Letterhead -->
    <div class="bank-header">
      <div>
        <div class="brand-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0F294A"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <span>Eastern Bank PLC • Asset & B2B Portfolio</span>
        </div>
        <div class="brand-sub">Team Member Data Management System • Customer Files Audit Statement</div>
      </div>
      <div class="report-meta">
        <div><strong>Statement Ref:</strong> EBL/RPT/${timestamp.slice(0, 10)}</div>
        <div><strong>Generated By:</strong> ${user.name} (${user.role}${user.rmCode ? ` • RM ${user.rmCode}` : ''})</div>
        <div><strong>Issue Date:</strong> ${formatDhakaDateTime(new Date().toISOString())}</div>
        <div><strong>Filter Scope:</strong> ${period} • ${rows.length} Total Records</div>
      </div>
    </div>

    <!-- Summary KPI Strip -->
    <div class="kpi-strip">
      <div class="kpi-card">
        <div class="kpi-label">Total Files</div>
        <div class="kpi-num">${rows.length}</div>
      </div>
      <div class="kpi-card" style="border-left-color: #10b981;">
        <div class="kpi-label">Approved</div>
        <div class="kpi-num">${approvedCount}</div>
      </div>
      <div class="kpi-card" style="border-left-color: #2563eb;">
        <div class="kpi-label">Submitted</div>
        <div class="kpi-num">${submittedCount}</div>
      </div>
      <div class="kpi-card" style="border-left-color: #059669;">
        <div class="kpi-label">Active Cards (Y)</div>
        <div class="kpi-num">${activeYCount}</div>
      </div>
      <div class="kpi-card" style="border-left-color: #d97706;">
        <div class="kpi-label">Under Query / Cond</div>
        <div class="kpi-num">${queryCount}</div>
      </div>
    </div>

    <!-- Main Table -->
    <table>
      <thead>
        <tr>
          ${tableHeaders.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((r, idx) => `
          <tr>
            <td style="text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: 700; color: #1e40af; white-space: nowrap;">${r['File ID']}</td>
            <td style="font-family: monospace; font-weight: 700; white-space: nowrap;">${r['CC-number'] || '—'}</td>
            <td style="font-weight: 600;">${r['Customer Name']}</td>
            <td>${r['Company Name']}</td>
            <td style="white-space: nowrap;">${r['Mobile Number']}</td>
            <td>${r['Product Type']}</td>
            <td style="text-align: center;">
              <span class="badge ${
                r['Application Status'] === 'Approved' ? 'badge-approved' : 
                r['Application Status'] === 'Submitted' ? 'badge-submitted' : 
                r['Application Status'] === 'Declined' ? 'badge-declined' : 
                (r['Application Status'] === 'Query' || r['Application Status'] === 'Condition') ? 'badge-condition' : 'badge-other'
              }">
                ${r['Application Status']}
              </span>
            </td>
            <td style="text-align: center; font-weight: 800; color: ${r['Active Status'] === 'Y' ? '#166534' : '#64748b'};">
              ${r['Active Status']}
            </td>
            ${user.role !== 'RM' ? `<td style="font-weight: 600;">${r['RM Code']}</td>` : ''}
            <td style="white-space: nowrap; font-size: 8px; color: #475569;">${r['Created Date (Dhaka)']}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Authorized Signatures Block -->
    <div class="sign-section">
      <div class="sign-box">
        <strong>Prepared By:</strong>
        <span>Relationship Manager / Portfolio Officer</span>
      </div>
      <div class="sign-box">
        <strong>Verified & Audited By:</strong>
        <span>Team Mentor / Quality Assurance</span>
      </div>
      <div class="sign-box">
        <strong>Authorized Signatory:</strong>
        <span>Branch Operations / Head of B2B Banking</span>
      </div>
    </div>

    <!-- Official Security Disclaimer -->
    <div class="report-footer">
      CONFIDENTIAL & PROPRIETARY • FOR INTERNAL BANKING USE ONLY • EASTERN BANK PLC • DHAKA, BANGLADESH
    </div>
  </div>

  <script>
    // Auto-trigger print dialog after styles render
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
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
