import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db, ATTACHMENTS_DIR, StoredAttachment } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { CustomerFile, FileAttachment } from '../../src/types/index.js';
import { SheetsSyncService } from '../sheetsSync.js';

const router = Router();

// Helper to generate next unique File ID
function generateFileId(): string {
  const all = db.getCustomerFiles(true);
  const year = new Date().getFullYear();
  let maxSeq = 100;
  all.forEach(f => {
    const match = f.fileId.match(/(?:RM|FILE|DOC)-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  const nextSeq = String(maxSeq + 1).padStart(5, '0');
  return `RM-${year}-${nextSeq}`;
}

// List / Search Customer Files
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
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
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    limit = '50',
    includeDeleted = 'false',
  } = req.query as Record<string, string>;

  let files = db.getCustomerFiles(includeDeleted === 'true' && user.role !== 'RM');

  // STRICT RM ISOLATION
  if (user.role === 'RM') {
    const userRmCode = user.rmCode || user.username;
    files = files.filter(f => f.rmCode === userRmCode);
  } else if (rmCode && rmCode !== 'all') {
    files = files.filter(f => f.rmCode === rmCode);
  }

  // Filters
  if (productType && productType !== 'all') {
    files = files.filter(f => f.productType === productType);
  }
  if (applicationStatus && applicationStatus !== 'all') {
    files = files.filter(f => f.applicationStatus === applicationStatus);
  }
  if (activeStatus && activeStatus !== 'all') {
    files = files.filter(f => f.activeStatus === activeStatus);
  }
  if (cpvStatus && cpvStatus !== 'all') {
    files = files.filter(f => f.cpvStatus === cpvStatus);
  }
  if (pendingDoc && pendingDoc !== 'all') {
    files = files.filter(f => f.pendingDocuments && f.pendingDocuments.includes(pendingDoc));
  }
  if (startDate) {
    const start = new Date(startDate).getTime();
    files = files.filter(f => new Date(f.createdAt).getTime() >= start);
  }
  if (endDate) {
    const end = new Date(endDate).getTime();
    files = files.filter(f => new Date(f.createdAt).getTime() <= end);
  }

  // Multi-field search
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    files = files.filter(f => {
      return (
        f.customerName?.toLowerCase().includes(q) ||
        f.mobile?.toLowerCase().includes(q) ||
        f.companyName?.toLowerCase().includes(q) ||
        f.fileId?.toLowerCase().includes(q) ||
        f.officeAddress?.toLowerCase().includes(q) ||
        f.productType?.toLowerCase().includes(q) ||
        f.applicationStatus?.toLowerCase().includes(q) ||
        (user.role !== 'RM' && f.rmCode?.toLowerCase().includes(q))
      );
    });
  }

  // Sorting
  files.sort((a, b) => {
    let valA = (a as any)[sortBy] || '';
    let valB = (b as any)[sortBy] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Attachments count
  const enriched = files.map(f => {
    const atts = db.getAttachmentsByFileId(f.fileId);
    return {
      ...f,
      attachments: atts.map(a => ({
        id: a.id,
        fileId: a.fileId,
        category: a.category,
        fileName: a.fileName,
        fileType: a.fileType,
        fileSize: a.fileSize,
        uploadedBy: a.uploadedBy,
        uploadedAt: a.uploadedAt,
      })),
    };
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
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// Single Customer File
router.get('/:fileId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const file = db.getCustomerFileById(req.params.fileId);

  if (!file) {
    return res.status(404).json({ error: 'Customer file not found' });
  }

  // RM Isolation
  if (user.role === 'RM' && file.rmCode !== (user.rmCode || user.username)) {
    return res.status(403).json({ error: 'Forbidden: You can only view your own customer records' });
  }

  const atts = db.getAttachmentsByFileId(file.fileId);
  return res.json({
    ...file,
    attachments: atts.map(a => ({
      id: a.id,
      fileId: a.fileId,
      category: a.category,
      fileName: a.fileName,
      fileType: a.fileType,
      fileSize: a.fileSize,
      uploadedBy: a.uploadedBy,
      uploadedAt: a.uploadedAt,
    })),
  });
});

// Create Customer File
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const body = req.body;

  // Validate required fields
  if (!body.customerName || !body.companyName || !body.officeAddress || !body.mobile || !body.productType || !body.applicationStatus) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  // RM code assignment
  let assignedRmCode = user.role === 'RM' ? (user.rmCode || user.username) : body.rmCode;
  if (!assignedRmCode) {
    assignedRmCode = user.username;
  }

  // Look up RM name
  const rmUser = db.getUserByRmCode(assignedRmCode) || db.getUserByUsername(assignedRmCode);
  const rmName = rmUser ? rmUser.name : `RM ${assignedRmCode}`;

  const now = new Date().toISOString();
  const fileId = body.fileId || generateFileId();

  const newFile: CustomerFile = {
    fileId,
    customerName: String(body.customerName).trim(),
    companyName: String(body.companyName).trim(),
    officeAddress: String(body.officeAddress).trim(),
    mobile: String(body.mobile).trim(),
    altMobile: body.altMobile ? String(body.altMobile).trim() : undefined,
    email: body.email ? String(body.email).trim() : undefined,
    rmCode: assignedRmCode,
    rmName,
    productType: body.productType,
    applicationStatus: body.applicationStatus,
    activeStatus: body.activeStatus || 'N',
    pendingDocuments: Array.isArray(body.pendingDocuments) ? body.pendingDocuments : [],
    remarks: body.remarks || '',

    // CPV
    cpvStatus: body.cpvStatus || 'Pending',
    cpvDate: body.cpvDate || undefined,
    cpvAddress: body.cpvAddress || undefined,
    cpvRemarks: body.cpvRemarks || undefined,
    cpvLastUpdatedBy: user.username,

    createdAt: now,
    updatedAt: now,
    createdBy: user.username,
    updatedBy: user.username,
    submittedAt: body.applicationStatus === 'Submitted' ? now : undefined,
    approvedAt: body.applicationStatus === 'Approved' ? now : undefined,
    isDeleted: false,
    sheetsSyncStatus: 'Pending',
  };

  const created = db.createCustomerFile(newFile);

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: 'CREATE',
    fileId: created.fileId,
    rmCode: assignedRmCode,
    details: `Created customer file ${created.fileId} for ${created.customerName} (${created.productType})`,
  });

  // Async Google Sheets sync
  SheetsSyncService.syncFile(created).catch(e => console.error('Background Sheets Sync failed:', e));

  return res.status(201).json(created);
});

// Update Customer File
router.put('/:fileId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const fileId = req.params.fileId;
  const existing = db.getCustomerFileById(fileId);

  if (!existing) {
    return res.status(404).json({ error: 'Customer file not found' });
  }

  // RM Isolation
  if (user.role === 'RM') {
    const userRmCode = user.rmCode || user.username;
    if (existing.rmCode !== userRmCode) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own customer files' });
    }
  }

  const body = req.body;
  const now = new Date().toISOString();

  // Status transitions tracking
  let submittedAt = existing.submittedAt;
  if (body.applicationStatus === 'Submitted' && existing.applicationStatus !== 'Submitted' && !submittedAt) {
    submittedAt = now;
  }
  let approvedAt = existing.approvedAt;
  if (body.applicationStatus === 'Approved' && existing.applicationStatus !== 'Approved' && !approvedAt) {
    approvedAt = now;
  }

  const updates: Partial<CustomerFile> = {
    customerName: body.customerName !== undefined ? String(body.customerName).trim() : existing.customerName,
    companyName: body.companyName !== undefined ? String(body.companyName).trim() : existing.companyName,
    officeAddress: body.officeAddress !== undefined ? String(body.officeAddress).trim() : existing.officeAddress,
    mobile: body.mobile !== undefined ? String(body.mobile).trim() : existing.mobile,
    altMobile: body.altMobile !== undefined ? String(body.altMobile).trim() : existing.altMobile,
    email: body.email !== undefined ? String(body.email).trim() : existing.email,
    productType: body.productType || existing.productType,
    applicationStatus: body.applicationStatus || existing.applicationStatus,
    activeStatus: body.activeStatus || existing.activeStatus,
    pendingDocuments: Array.isArray(body.pendingDocuments) ? body.pendingDocuments : existing.pendingDocuments,
    remarks: body.remarks !== undefined ? body.remarks : existing.remarks,

    // CPV updates
    cpvStatus: body.cpvStatus || existing.cpvStatus,
    cpvDate: body.cpvDate !== undefined ? body.cpvDate : existing.cpvDate,
    cpvAddress: body.cpvAddress !== undefined ? body.cpvAddress : existing.cpvAddress,
    cpvRemarks: body.cpvRemarks !== undefined ? body.cpvRemarks : existing.cpvRemarks,
    cpvLastUpdatedBy: user.username,

    submittedAt,
    approvedAt,
    updatedBy: user.username,
    updatedAt: now,
  };

  // Only Admin & Mentor can change RM Code
  if (user.role !== 'RM' && body.rmCode && body.rmCode !== existing.rmCode) {
    updates.rmCode = body.rmCode;
    const rmUser = db.getUserByRmCode(body.rmCode) || db.getUserByUsername(body.rmCode);
    updates.rmName = rmUser ? rmUser.name : `RM ${body.rmCode}`;
  }

  const updated = db.updateCustomerFile(fileId, updates);
  if (!updated) {
    return res.status(500).json({ error: 'Failed to update customer file' });
  }

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: 'UPDATE',
    fileId: updated.fileId,
    rmCode: updated.rmCode,
    details: `Updated file ${updated.fileId}. Status: ${updated.applicationStatus}, Active: ${updated.activeStatus}`,
  });

  SheetsSyncService.syncFile(updated).catch(e => console.error('Background Sheets Sync failed:', e));

  return res.json(updated);
});

// Delete Customer File
router.delete('/:fileId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const fileId = req.params.fileId;

  // RM cannot delete records
  if (user.role === 'RM') {
    return res.status(403).json({ error: 'Forbidden: RM users are not authorized to delete customer records' });
  }

  const existing = db.getCustomerFileById(fileId);
  if (!existing) {
    return res.status(404).json({ error: 'Customer file not found' });
  }

  const isPermanent = req.query.permanent === 'true' && user.role === 'Mentor';

  if (isPermanent) {
    db.permanentDeleteCustomerFile(fileId);
    db.addAuditLog({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'DELETE',
      fileId,
      rmCode: existing.rmCode,
      details: `PERMANENTLY deleted file ${fileId} (${existing.customerName}) by Mentor`,
    });
  } else {
    db.softDeleteCustomerFile(fileId, user.username);
    db.addAuditLog({
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'DELETE',
      fileId,
      rmCode: existing.rmCode,
      details: `Soft-deleted file ${fileId} (${existing.customerName})`,
    });
  }

  SheetsSyncService.deleteFile(fileId).catch(e => console.error('Background Sheets delete sync failed:', e));

  return res.json({ success: true, message: `File ${fileId} deleted successfully` });
});

// File Attachments Upload (Base64 dataURL / multipart payload)
router.post('/:fileId/attachments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const fileId = req.params.fileId;
  const file = db.getCustomerFileById(fileId);

  if (!file) {
    return res.status(404).json({ error: 'Customer file not found' });
  }

  if (user.role === 'RM' && file.rmCode !== (user.rmCode || user.username)) {
    return res.status(403).json({ error: 'Forbidden: Cannot upload documents to another RM’s file' });
  }

  const { fileName, fileType, dataUrl, category = 'Customer Document' } = req.body;

  if (!dataUrl || !fileName) {
    return res.status(400).json({ error: 'File data and filename are required' });
  }

  // Size limit validation (10MB)
  const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'File size exceeds maximum limit of 10 MB' });
  }

  // Allowed file types: PDF, JPG, JPEG, PNG, WEBP
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const mime = fileType || (dataUrl.match(/^data:([^;]+);/)?.[1] || 'application/octet-stream');
  if (!allowedMime.includes(mime)) {
    return res.status(400).json({ error: 'Unsupported file type. Please upload PDF, JPG, PNG, or WEBP.' });
  }

  const attachmentId = `att_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const ext = path.extname(fileName) || (mime === 'application/pdf' ? '.pdf' : '.jpg');
  const diskFileName = `${attachmentId}${ext}`;
  const diskPath = path.join(ATTACHMENTS_DIR, diskFileName);

  fs.writeFileSync(diskPath, buffer);

  const attachment: StoredAttachment = {
    id: attachmentId,
    fileId,
    category,
    fileName,
    fileType: mime,
    fileSize: buffer.length,
    diskFileName,
    storagePath: diskPath,
    uploadedBy: user.username,
    uploadedAt: new Date().toISOString(),
  };

  db.addAttachment(attachment);

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: 'UPDATE',
    fileId,
    rmCode: file.rmCode,
    details: `Uploaded attachment: ${fileName} (${category}) for file ${fileId}`,
  });

  return res.status(201).json({
    id: attachment.id,
    fileId: attachment.fileId,
    category: attachment.category,
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    fileSize: attachment.fileSize,
    uploadedBy: attachment.uploadedBy,
    uploadedAt: attachment.uploadedAt,
  });
});

// Secure Attachment Preview (Time-limited / Auth protected)
router.get('/attachments/:id/preview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const attachment = db.getAttachmentById(req.params.id);

  if (!attachment) {
    return res.status(404).json({ error: 'Attachment not found' });
  }

  const file = db.getCustomerFileById(attachment.fileId);
  if (file && user.role === 'RM' && file.rmCode !== (user.rmCode || user.username)) {
    return res.status(403).json({ error: 'Forbidden: Access denied to private document' });
  }

  const diskPath = path.join(ATTACHMENTS_DIR, attachment.diskFileName);
  if (!fs.existsSync(diskPath)) {
    return res.status(404).json({ error: 'Attachment file missing from storage' });
  }

  res.setHeader('Content-Type', attachment.fileType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.fileName)}"`);
  res.setHeader('Cache-Control', 'private, max-age=300'); // Private short cache
  const stream = fs.createReadStream(diskPath);
  return stream.pipe(res);
});

// Secure Attachment Download
router.get('/attachments/:id/download', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const attachment = db.getAttachmentById(req.params.id);

  if (!attachment) {
    return res.status(404).json({ error: 'Attachment not found' });
  }

  const file = db.getCustomerFileById(attachment.fileId);
  if (file && user.role === 'RM' && file.rmCode !== (user.rmCode || user.username)) {
    return res.status(403).json({ error: 'Forbidden: Access denied' });
  }

  const diskPath = path.join(ATTACHMENTS_DIR, attachment.diskFileName);
  if (!fs.existsSync(diskPath)) {
    return res.status(404).json({ error: 'Attachment file missing' });
  }

  return res.download(diskPath, attachment.fileName);
});

// Delete Attachment
router.delete('/attachments/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const attachment = db.getAttachmentById(req.params.id);

  if (!attachment) {
    return res.status(404).json({ error: 'Attachment not found' });
  }

  const file = db.getCustomerFileById(attachment.fileId);
  if (file && user.role === 'RM' && file.rmCode !== (user.rmCode || user.username)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.deleteAttachment(attachment.id);

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: 'UPDATE',
    fileId: attachment.fileId,
    rmCode: file?.rmCode,
    details: `Deleted attachment: ${attachment.fileName} from file ${attachment.fileId}`,
  });

  return res.json({ success: true, message: 'Attachment deleted successfully' });
});

export default router;
