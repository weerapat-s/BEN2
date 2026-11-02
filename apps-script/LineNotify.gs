/**
 * แจ้งเตือนเข้า LINE กลุ่ม ผ่าน LINE Messaging API (push message)
 * (LINE Notify ปิดบริการแล้วตั้งแต่ 31 มี.ค. 2025 จึงต้องใช้ Messaging API แทน)
 *
 * วิธีใช้: สร้างไฟล์ใหม่ใน Apps Script project เดิม วางโค้ดนี้ทั้งไฟล์
 * แล้วตั้งค่า Project Settings > Script properties:
 *   LINE_CHANNEL_TOKEN = Channel access token (long-lived) ของ LINE Official Account
 *   LINE_GROUP_ID      = groupId ของกลุ่ม (ขึ้นต้นด้วย C...) ดู README ข้อ 3
 */

function notifyLine_(text) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('LINE_CHANNEL_TOKEN');
  var to = props.getProperty('LINE_GROUP_ID');
  if (!token || !to) return; // ยังไม่ตั้งค่า ก็ข้ามไป ไม่ให้ระบบแจ้งซ่อมพัง
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + token },
      payload: JSON.stringify({ to: to, messages: [{ type: 'text', text: text }] }),
      muteHttpExceptions: true
    });
  } catch (err) {
    console.error('LINE notify failed: ' + err);
  }
}

/** เรียกหลังบันทึกใบแจ้งซ่อมใหม่ลงชีต; d = payload ที่เว็บส่งมา (JSON.parse(e.postData.contents)) */
function notifyNewTicket(d, imageUrl) {
  notifyLine_(
    '🔧 มีแจ้งซ่อมใหม่ ' + d.ticket_id + '\n' +
    '👤 ผู้แจ้ง: ' + d.reporter_name + '\n' +
    '🖥 อุปกรณ์: ' + d.equipment_type + '\n' +
    '📍 สถานที่: ' + d.location + '\n' +
    '📝 อาการ: ' + d.issue_detail +
    (imageUrl && imageUrl !== '-' ? '\n🖼 รูป: ' + imageUrl : '')
  );
}

/** เรียกหลังช่างอัปเดตสถานะ; d = payload (action: "update") */
function notifyTicketUpdate(d) {
  notifyLine_(
    '🔄 อัปเดตงานซ่อม ' + d.ticket_id + '\n' +
    'สถานะ: ' + d.status +
    (d.admin_note ? '\n💬 ช่าง: ' + d.admin_note : '')
  );
}

/**
 * Webhook สำหรับหา groupId: Deploy เป็น Web app เดิมอยู่แล้ว ให้ตั้ง Webhook URL ใน LINE Developers
 * เป็น URL เดียวกัน แล้วเพิ่มบอทเข้ากลุ่มและพิมพ์ข้อความ 1 ครั้ง
 * ใน doPost ให้เพิ่มบรรทัดนี้ไว้บนสุด (ก่อน action ปกติ) เพื่อจับ groupId:
 *   var ev = JSON.parse(e.postData.contents).events;
 *   if (ev && ev.length) { logLineGroupId_(ev); return ContentService.createTextOutput('ok'); }
 * จากนั้นดูค่าที่ Executions log แล้วนำไปใส่ LINE_GROUP_ID
 */
function logLineGroupId_(events) {
  events.forEach(function (ev) {
    if (ev.source && ev.source.groupId) console.log('groupId = ' + ev.source.groupId);
  });
}
