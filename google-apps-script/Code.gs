/**
 * =========================================================================
 * RM File Management & Performance Dashboard
 * Google Apps Script Backend for Spreadsheet Integration
 * 
 * Target Spreadsheet ID: 1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI
 * =========================================================================
 * 
 * INSTRUCTIONS TO DEPLOY:
 * 1. Open Google Sheets (https://docs.google.com/spreadsheets/d/1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI)
 * 2. Click "Extensions" > "Apps Script"
 * 3. Replace all content in Code.gs with this file
 * 4. Click "Deploy" > "New deployment"
 * 5. Select type: "Web app"
 * 6. Set:
 *    - Description: RM Team Automatic Sync Service
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone"
 * 7. Copy the Web App URL and paste it into App Settings or Sheets Sync panel!
 * 
 * AUTO-SYNC:
 * Whenever any customer file or RM record is created, updated, or deleted
 * in the application, it is AUTOMATICALLY synced to this Google Spreadsheet
 * immediately in real-time. Manual sync is never required!
 */

var DEFAULT_SECRET_TOKEN = "EBL_RM_SYNC_2026_SECURE_TOKEN_#99";
var SPREADSHEET_ID = "1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI";

var SHEETS = {
  RM_MAPPING: "RM_Mapping",
  CUSTOMER_FILES: "Customer_Files",
  FILE_ATTACHMENTS: "File_Attachments",
  AUDIT_LOGS: "Audit_Logs",
  APP_SETTINGS: "App_Settings"
};

var HEADERS = {
  RM_MAPPING: ["RM_CODE", "RM_NAME", "MOBILE", "EMAIL", "OFFICE_ADDRESS", "ACCOUNT_STATUS", "CREATED_AT", "LAST_LOGIN", "AUTH_UID", "ROLE", "THEME", "PREFERENCES"],
  CUSTOMER_FILES: ["FILE_ID", "CC_NUMBER", "CUSTOMER_NAME", "COMPANY_NAME", "OFFICE_ADDRESS", "MOBILE", "ALT_MOBILE", "EMAIL", "PRODUCT_TYPE", "APPLICATION_STATUS", "ACTIVE_STATUS", "RM_CODE", "PENDING_DOCUMENTS", "REMARKS", "LOCATION_ADDRESS", "CPV_STATUS", "CPV_DATE", "CPV_ADDRESS", "CPV_REMARKS", "CREATED_AT", "UPDATED_AT", "CREATED_BY", "UPDATED_BY", "SUBMITTED_AT", "APPROVED_AT", "DELETED"],
  FILE_ATTACHMENTS: ["ATTACHMENT_ID", "FILE_ID", "CATEGORY", "FILE_NAME", "FILE_TYPE", "FILE_SIZE", "UPLOADED_BY", "UPLOADED_AT"],
  AUDIT_LOGS: ["LOG_ID", "USER_ID", "ROLE", "ACTION", "FILE_ID", "RM_CODE", "TIMESTAMP", "DETAILS"],
  APP_SETTINGS: ["SETTING_KEY", "SETTING_VALUE", "UPDATED_BY", "UPDATED_AT"]
};

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/**
 * Initializes or verifies the 5 sheets without deleting existing data.
 */
function initSpreadsheetStructure() {
  var ss = getSpreadsheet();
  var sheetNames = Object.keys(SHEETS);
  var results = [];

  sheetNames.forEach(function(key) {
    var sheetName = SHEETS[key];
    var sheet = ss.getSheetByName(sheetName);
    var headers = HEADERS[key];

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      formatHeaderRow(sheet, headers.length);
      results.push("Created sheet: " + sheetName);
    } else {
      var lastRow = sheet.getLastRow();
      if (lastRow === 0) {
        sheet.appendRow(headers);
        formatHeaderRow(sheet, headers.length);
        results.push("Added headers to empty sheet: " + sheetName);
      } else {
        results.push("Sheet already exists with data: " + sheetName + " (" + lastRow + " rows)");
      }
    }
  });

  return results;
}

function formatHeaderRow(sheet, colCount) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setBackground("#0F294A"); // Corporate Navy Blue
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

/**
 * Unified request handler for both GET and POST requests.
 */
function processSyncAction(action, payload, token) {
  var ss = getSpreadsheet();

  // Validate Token (allow default or configured token)
  if (token && token !== DEFAULT_SECRET_TOKEN && token !== "RM_TEAM_SYNC_2026_SECURE_TOKEN_#99") {
    return { success: false, error: "Unauthorized: Invalid secret token" };
  }

  if (action === "initSheets" || action === "createTabs") {
    var log = initSpreadsheetStructure();
    var currentSheets = ss.getSheets().map(function(s) {
      return { name: s.getName(), rows: s.getLastRow() };
    });
    return {
      success: true,
      message: "All 5 Tabs and styled header rows successfully initialized!",
      log: log,
      sheets: currentSheets,
      timestamp: new Date().toISOString()
    };
  }

  // 1. Automatic Real-Time Customer File Create / Update
  if (action === "syncCustomerFile") {
    var file = payload.data || payload;
    return upsertCustomerFile(ss, file);
  }

  // 2. Automatic Real-Time Customer File Delete
  if (action === "deleteCustomerFile") {
    var fileId = payload.fileId;
    return markFileDeleted(ss, fileId);
  }

  // 3. Automatic Real-Time RM Mapping Profile Sync
  if (action === "syncRM") {
    var rm = payload.data || payload;
    return upsertRM(ss, rm);
  }

  // 4. Automatic Real-Time File Attachment Sync
  if (action === "syncAttachment") {
    var att = payload.data || payload;
    return upsertAttachment(ss, att);
  }

  // 5. Automatic Audit Log Entry
  if (action === "logAudit") {
    var logEntry = payload.data || payload;
    return appendAudit(ss, logEntry);
  }

  // 6. Automatic App Settings Sync
  if (action === "syncSettings") {
    var settingsData = payload.data || payload;
    return upsertSettings(ss, settingsData);
  }

  // 7. Batch Synchronization
  if (action === "batchSync") {
    var files = payload.files || [];
    var rms = payload.rms || [];
    var updatedFiles = 0;
    var updatedRMs = 0;

    files.forEach(function(f) {
      upsertCustomerFile(ss, f);
      updatedFiles++;
    });

    rms.forEach(function(r) {
      upsertRM(ss, r);
      updatedRMs++;
    });

    return {
      success: true,
      message: "Batch sync completed successfully",
      filesSynced: updatedFiles,
      rmsSynced: updatedRMs,
      syncedAt: new Date().toISOString()
    };
  }

  return { success: false, error: "Unknown action: " + action };
}

/**
 * HTTP GET Handler (Supports both health-checks and GET-based action dispatch)
 */
function doGet(e) {
  var params = (e && e.parameter) || {};
  var action = params.action || "";

  if (action) {
    var token = params.token || "";
    var payload = {};
    if (params.data) {
      try { payload = JSON.parse(params.data); } catch (err) { payload = { data: params.data }; }
    } else {
      payload = params;
    }
    var result = processSyncAction(action, payload, token);
    return sendResponse(result);
  }

  // Default health info
  var ss = getSpreadsheet();
  var info = {
    status: "online",
    name: "RM File Management Automatic Sync Service",
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    sheets: ss.getSheets().map(function(s) {
      return { name: s.getName(), rows: s.getLastRow() };
    }),
    autoSync: "Real-Time Auto Sync Enabled",
    timestamp: new Date().toISOString()
  };
  return sendResponse(info);
}

/**
 * HTTP POST Handler (Primary high-performance endpoint with LockService)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var raw = (e && e.postData && e.postData.contents) || "{}";
    var payload = {};
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      payload = (e && e.parameter) || {};
    }

    var token = payload.token || (e && e.parameter && e.parameter.token) || "";
    var action = payload.action || (e && e.parameter && e.parameter.action) || "";

    var result = processSyncAction(action, payload, token);
    return sendResponse(result);

  } catch (err) {
    return sendResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function sendResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Upsert customer file into Customer_Files sheet using FILE_ID as primary key.
 */
function upsertCustomerFile(ss, f) {
  var sheet = ss.getSheetByName(SHEETS.CUSTOMER_FILES);
  if (!sheet) {
    initSpreadsheetStructure();
    sheet = ss.getSheetByName(SHEETS.CUSTOMER_FILES);
  }

  var pendingDocs = Array.isArray(f.pendingDocuments) ? f.pendingDocuments.join(", ") : (f.pendingDocuments || "");
  var rowData = [
    f.fileId || "",
    f.ccNumber || "",
    f.customerName || "",
    f.companyName || "",
    f.officeAddress || "",
    f.mobile || "",
    f.altMobile || "",
    f.email || "",
    f.productType || "",
    f.applicationStatus || "",
    f.activeStatus || "",
    f.rmCode || "",
    pendingDocs,
    f.remarks || "",
    f.locationAddress || "",
    f.cpvStatus || "",
    f.cpvDate || "",
    f.cpvAddress || "",
    f.cpvRemarks || "",
    f.createdAt || "",
    f.updatedAt || new Date().toISOString(),
    f.createdBy || "",
    f.updatedBy || "",
    f.submittedAt || "",
    f.approvedAt || "",
    f.isDeleted ? "Y" : "N"
  ];

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var fileIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < fileIds.length; i++) {
      if (String(fileIds[i][0]).trim() === String(f.fileId).trim()) {
        var rowIndex = i + 2;
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
        return { success: true, action: "updated", rowIndex: rowIndex, fileId: f.fileId };
      }
    }
  }

  // Not found: append new row
  sheet.appendRow(rowData);
  return { success: true, action: "inserted", rowIndex: sheet.getLastRow(), fileId: f.fileId };
}

function markFileDeleted(ss, fileId) {
  var sheet = ss.getSheetByName(SHEETS.CUSTOMER_FILES);
  if (!sheet) return { success: false, error: "Customer_Files sheet not found" };

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var fileIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < fileIds.length; i++) {
      if (String(fileIds[i][0]).trim() === String(fileId).trim()) {
        var rowIndex = i + 2;
        sheet.getRange(rowIndex, 26).setValue("Y"); // DELETED column (26th col)
        sheet.getRange(rowIndex, 21).setValue(new Date().toISOString()); // UPDATED_AT
        return { success: true, action: "marked_deleted", rowIndex: rowIndex, fileId: fileId };
      }
    }
  }
  return { success: false, error: "File ID not found in sheet: " + fileId };
}

function upsertRM(ss, rm) {
  var sheet = ss.getSheetByName(SHEETS.RM_MAPPING);
  if (!sheet) {
    initSpreadsheetStructure();
    sheet = ss.getSheetByName(SHEETS.RM_MAPPING);
  }

  var rowData = [
    rm.rmCode || "",
    rm.rmName || "",
    rm.mobile || "",
    rm.email || "",
    rm.officeAddress || "",
    rm.accountStatus || "Active",
    rm.createdAt || new Date().toISOString(),
    rm.lastLogin || "",
    rm.authUid || "",
    rm.role || "RM",
    rm.theme || "navy",
    rm.preferences || ""
  ];

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var rmCodes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < rmCodes.length; i++) {
      if (String(rmCodes[i][0]).trim() === String(rm.rmCode).trim()) {
        var rowIndex = i + 2;
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
        return { success: true, action: "updated", rmCode: rm.rmCode };
      }
    }
  }

  sheet.appendRow(rowData);
  return { success: true, action: "inserted", rmCode: rm.rmCode };
}

function upsertSettings(ss, settingsData) {
  var sheet = ss.getSheetByName(SHEETS.APP_SETTINGS);
  if (!sheet) {
    initSpreadsheetStructure();
    sheet = ss.getSheetByName(SHEETS.APP_SETTINGS);
  }

  var now = new Date().toISOString();
  var updatedBy = settingsData.updatedBy || "System";
  var keys = Object.keys(settingsData);
  var lastRow = sheet.getLastRow();
  var existingMap = {};

  if (lastRow > 1) {
    var existingKeys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < existingKeys.length; i++) {
      existingMap[String(existingKeys[i][0]).trim()] = i + 2;
    }
  }

  keys.forEach(function(key) {
    if (key === "updatedBy") return;
    var val = typeof settingsData[key] === "object" ? JSON.stringify(settingsData[key]) : String(settingsData[key]);
    if (existingMap[key]) {
      sheet.getRange(existingMap[key], 1, 1, 4).setValues([[key, val, updatedBy, now]]);
    } else {
      sheet.appendRow([key, val, updatedBy, now]);
    }
  });

  return { success: true, message: "Settings synced to App_Settings sheet" };
}

function upsertAttachment(ss, att) {
  var sheet = ss.getSheetByName(SHEETS.FILE_ATTACHMENTS);
  if (!sheet) {
    initSpreadsheetStructure();
    sheet = ss.getSheetByName(SHEETS.FILE_ATTACHMENTS);
  }

  var rowData = [
    att.id || "",
    att.fileId || "",
    att.category || "",
    att.fileName || "",
    att.fileType || "",
    att.fileSize || 0,
    att.uploadedBy || "",
    att.uploadedAt || new Date().toISOString()
  ];

  sheet.appendRow(rowData);
  return { success: true, action: "attachment_logged" };
}

function appendAudit(ss, log) {
  var sheet = ss.getSheetByName(SHEETS.AUDIT_LOGS);
  if (!sheet) return { success: false, error: "Audit sheet missing" };

  var rowData = [
    log.id || ("LOG-" + new Date().getTime()),
    log.userId || "",
    log.role || "",
    log.action || "",
    log.fileId || "",
    log.rmCode || "",
    log.timestamp || new Date().toISOString(),
    log.details || ""
  ];

  sheet.appendRow(rowData);
  return { success: true, action: "audit_appended" };
}
