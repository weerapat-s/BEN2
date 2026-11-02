/**
 * BEN2 Maintenance — backend (Google Apps Script Web app)
 *
 * API (ตรงกับที่ app.js เรียกอยู่):
 *   GET                      -> JSON array ของใบแจ้งซ่อมทั้งหมด (เก่า -> ใหม่)
 *   POST {action:"create"}   -> บันทึกใบแจ้งซ่อมใหม่ (+ รูป base64 ไปเก็บใน Drive)
 *   POST {action:"update"}   -> เปลี่ยนสถานะ / ข้อความจากช่าง
 *
 * ตั้งค่าครั้งแรก: เลือกฟังก์ชัน setup แล้วกด Run (จะขออนุญาต Sheets + Drive)
 * ระบบสร้าง Google Sheet และโฟลเดอร์รูปให้เอง ดู URL ใน Execution log
 */

var HEADERS = ['timestamp', 'ticket_id', 'reporter_name', 'equipment_type', 'location',
               'issue_detail', 'image_url', 'status', 'admin_note', 'updated_at'];
var SHEET_NAME = 'Tickets';
var STATUSES = ['รอรับเรื่อง', 'กำลังดำเนินการ', 'เสร็จสิ้น'];
var MAX_TEXT = 2000;

/* ---------- Setup ---------- */

function setup() {
  var sheet = getSheet_();
  getImageFolder_();
  console.log('Sheet: ' + sheet.getParent().getUrl());
}

function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ss;
  var id = props.getProperty('SHEET_ID');
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('BEN2 Maintenance - ใบแจ้งซ่อม');
    props.setProperty('SHEET_ID', ss.getId());
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getImageFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('IMAGE_FOLDER_ID');
  if (id) return DriveApp.getFolderById(id);
  var folder = DriveApp.createFolder('BEN2 Maintenance - รูปแจ้งซ่อม');
  props.setProperty('IMAGE_FOLDER_ID', folder.getId());
  return folder;
}

/* ---------- HTTP ---------- */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  try {
    return json_(listTickets_());
  } catch (err) {
    return json_({ status: 'error', message: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var d = JSON.parse(e.postData.contents);
    if (d.action === 'create') return json_(createTicket_(d));
    if (d.action === 'update') return json_(updateTicket_(d));
    return json_({ status: 'error', message: 'unknown action' });
  } catch (err) {
    console.error(err);
    return json_({ status: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Tickets ---------- */

function clean_(v) {
  return String(v == null ? '' : v).trim().slice(0, MAX_TEXT);
}

function listTickets_() {
  var sheet = getSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return rows.map(function (r) {
    return {
      timestamp: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      ticket_id: r[1],
      reporter_name: r[2],
      equipment_type: r[3],
      location: r[4],
      issue_detail: r[5],
      image_url: r[6] || '-',
      status: r[7],
      admin_note: r[8] || '-'
    };
  });
}

function findRow_(sheet, ticketId) {
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var ids = sheet.getRange(2, 2, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === ticketId) return i + 2;
  }
  return -1;
}

function newTicketId_(sheet, wanted) {
  var id = clean_(wanted);
  if (!/^BEN2-\d{1,6}$/.test(id) || findRow_(sheet, id) !== -1) {
    do {
      id = 'BEN2-' + Math.floor(1000 + Math.random() * 9000);
    } while (findRow_(sheet, id) !== -1);
  }
  return id;
}

function saveImage_(dataUrl, ticketId) {
  var m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) return '-';
  var ext = m[1].split('/')[1].replace('jpeg', 'jpg');
  var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], ticketId + '.' + ext);
  var file = getImageFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

function createTicket_(d) {
  var name = clean_(d.reporter_name), type = clean_(d.equipment_type),
      place = clean_(d.location), detail = clean_(d.issue_detail);
  if (!name || !type || !place || !detail) {
    return { status: 'error', message: 'กรอกข้อมูลไม่ครบ' };
  }
  var sheet = getSheet_();
  var ticketId = newTicketId_(sheet, d.ticket_id);
  var imageUrl = saveImage_(d.imageBase64, ticketId);
  var now = new Date();
  sheet.appendRow([now, ticketId, name, type, place, detail, imageUrl, STATUSES[0], '', now]);

  if (typeof notifyNewTicket === 'function') {
    notifyNewTicket({ ticket_id: ticketId, reporter_name: name, equipment_type: type,
                      location: place, issue_detail: detail }, imageUrl);
  }
  return { status: 'success', ticket_id: ticketId };
}

function updateTicket_(d) {
  var status = clean_(d.status);
  if (STATUSES.indexOf(status) === -1) {
    return { status: 'error', message: 'สถานะไม่ถูกต้อง' };
  }
  var sheet = getSheet_();
  var row = findRow_(sheet, clean_(d.ticket_id));
  if (row === -1) return { status: 'error', message: 'ไม่พบรหัสงานนี้' };
  var note = clean_(d.admin_note);
  sheet.getRange(row, 8, 1, 3).setValues([[status, note, new Date()]]);

  if (typeof notifyTicketUpdate === 'function') {
    notifyTicketUpdate({ ticket_id: clean_(d.ticket_id), status: status, admin_note: note });
  }
  return { status: 'success' };
}
