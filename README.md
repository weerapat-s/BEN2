# BEN2 Maintenance — ระบบแจ้งซ่อมอุปกรณ์สื่อ (โรงเรียนเบญจมราชรังสฤษฎิ์ ๒)

เว็บ: https://weerapat-s.github.io/BEN2/ — ธีมสีตามเว็บโรงเรียน https://www.ben2.ac.th/
Backend: Google Apps Script + Google Sheets (URL อยู่ใน `app.js`)

## แจ้งเตือนเข้า LINE กลุ่ม

เว็บแจ้งซ่อมเรียก Apps Script อยู่แล้ว จึงให้ Apps Script เป็นตัวส่ง LINE (ไม่ใส่ token ไว้ในหน้าเว็บ)

1. **สร้าง LINE Official Account + Messaging API** ที่ https://developers.line.biz/ (Provider > Messaging API channel)
   แล้วออก **Channel access token (long-lived)**
2. ตั้งค่าบอทให้ **เข้ากลุ่มได้** (Official Account Manager > Settings > Response settings > เปิด "Allow bot to join group chats") แล้วเชิญบอทเข้ากลุ่มช่างของโรงเรียน
3. **หา groupId**: ตั้ง Webhook URL ของ channel เป็น URL Web app ของ Apps Script, ใส่โค้ดจับ event ตามคอมเมนต์ท้าย `apps-script/LineNotify.gs`, พิมพ์ข้อความในกลุ่ม 1 ครั้ง แล้วดู `groupId` (ขึ้นต้น `C`) ใน Executions log
4. ใน Apps Script: **Project Settings > Script properties** เพิ่ม `LINE_CHANNEL_TOKEN` และ `LINE_GROUP_ID`
5. เพิ่มไฟล์ `apps-script/LineNotify.gs` เข้า Apps Script project แล้วเรียกใน `doPost`:
   ```js
   // หลังบันทึกแถวใหม่ลงชีตสำเร็จ (action === "create")
   notifyNewTicket(data, imageUrl);   // imageUrl = ลิงก์รูปที่เก็บใน Drive ('-' ถ้าไม่มี)
   // หลังอัปเดตสถานะสำเร็จ (action === "update")
   notifyTicketUpdate(data);
   ```
6. **Deploy > Manage deployments > แก้ไข > New version** (ใช้ URL เดิม ไม่ต้องแก้ `app.js`)

หมายเหตุ: แพ็กเกจฟรีของ LINE Official Account จำกัดจำนวนข้อความ push ต่อเดือน ตรวจสอบโควตาในแผนที่ใช้
