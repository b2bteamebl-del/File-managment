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
 * 4. Run `initSpreadsheetStructure()` once to create/verify all 5 sheets and headers
 * 5. Click "Deploy" > "New deployment"
 * 6. Select type: "Web app"
 * 7. Set:
 *    - Description: RM Team Sync Service
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (Authorized via shared SECRET_TOKEN)
 * 8. Copy the Web App URL and paste it into the App Settings -> Google Sheets Sync panel!
 */

// Shared secret token configured in App Settings to prevent unauthorized execution
var DEFAULT_SECRET_TOKEN = "RM_TEAM_SYNC_2026_SECURE_TOKEN_#99";

var SPREADSHEET_ID = "1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI";

var SHEETS = {
  RM_MAPPING: "RM_Mapping",
  CUSTOMER_FILES: "Customer_Files",
  FILE_ATTACHMENTS: "File_Attachments",
  AUDIT_LOGS: "Audit_Logs",
  APP_SETTINGS: "App_Settings"
};

var HEADERS = {
  RM_MAPPING: ["RM_CODE", "RM_NAME", "MOBILE", "EMAIL", "OFFICE_ADDRESS", "ACCOUNT_STATUS", "CREATED_AT", "LAST_LOGIN", "AUTH_UID"],
  CUSTOMER_FILES: ["FILE_ID", "CUSTOMER_NAME", "COMPANY_NAME", "OFFICE_ADDRESS", "MOBILE", "ALT_MOBILE", "EMAIL", "PRODUCT_TYPE", "APPLICATION_STATUS", "ACTIVE_STATUS", "RM_CODE", "PENDING_DOCUMENTS", "REMARKS", "CPV_STATUS", "CPV_DATE", "CPV_ADDRESS", "CPV_REMARKS", "CREATED_AT", "UPDATED_AT", "CREATED_BY", "UPDATED_BY", "SUBMITTED_AT", "APPROVED_AT", "DELETED"],
  FILE_ATTACHMENTS: ["ATTACHMENT_ID", "FILE_ID", "CATEGORY", "FILE_NAME", "FILE_TYPE", "STORAGE_PATH", "UPLOADED_BY", "UPLOADED_AT"],
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
 * Initializes or verifies the 5 sheets without deleting any existing data.
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
      // Check if header row exists
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
 * HTTP GET Test Handler
 */
function doGet(e) {
  var ss = getSpreadsheet();
  var info = {
    status: "online",
    name: "RM File Management Sync Service",
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    sheets: ss.getSheets().map(function(s) {
      return { name: s.getName(), rows: s.getLastRow() };
    }),
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(info))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTTP POST Secure Sync Handler
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); // 30 sec lock to avoid race conditions

  try {
    var raw = e.postData.contents;
    var payload = JSON.parse(raw);

    // Validate token
    var providedToken = payload.token || (e.parameter && e.parameter.token);
    if (!providedToken || providedToken !== DEFAULT_SECRET_TOKEN) {
      return sendResponse({ success: false, error: "Unauthorized: Invalid secret token" });
    }

    var action = payload.action;
    var ss = getSpreadsheet();

    if (action === "initSheets") {
      var log = initSpreadsheetStructure();
      return sendResponse({ success: true, message: "Sheets verified/initialized", log: log });
    }

    if (action === "syncCustomerFile") {
      var file = payload.data;
      var res = upsertCustomerFile(ss, file);
      return sendResponse(res);
    }

    if (action === "deleteCustomerFile") {
      var fileId = payload.fileId;
      var res = markFileDeleted(ss, fileId);
      return sendResponse(res);
    }

    if (action === "syncRM") {
      var rm = payload.data;
      var res = upsertRM(ss, rm);
      return sendResponse(res);
    }

    if (action === "logAudit") {
      var logEntry = payload.data;
      var res = appendAudit(ss, logEntry);
      return sendResponse(res);
    }

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

      return sendResponse({
        success: true,
        message: "Batch sync completed",
        filesSynced: updatedFiles,
        rmsSynced: updatedRMs,
        syncedAt: new Date().toISOString()
      });
    }

    return sendResponse({ success: false, error: "Unknown action: " + action });

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
    f.cpvStatus || "",
    f.cpvDate || "",
    f.cpvAddress || "",
    f.cpvRemarks || "",
    f.createdAt || "",
    f.updatedAt || "",
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
  if (!sheet) return { success: false, error: "Sheet not found" };

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var fileIds = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < fileIds.length; i++) {
      if (String(fileIds[i][0]).trim() === String(fileId).trim()) {
        var rowIndex = i + 2;
        sheet.getRange(rowIndex, 24).setValue("Y"); // DELETED col
        sheet.getRange(rowIndex, 19).setValue(new Date().toISOString()); // UPDATED_AT col
        return { success: true, action: "soft_deleted", rowIndex: rowIndex };
      }
    }
  }
  return { success: false, error: "File ID not found: " + fileId };
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
    rm.authUid || ""
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
