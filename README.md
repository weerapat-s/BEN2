# BEN2 Maintenance — ระบบแจ้งซ่อมอุปกรณ์สื่อ (โรงเรียนเบญจมราชรังสฤษฎิ์ ๒)

เว็บ: https://weerapat-s.github.io/BEN2/ — ธีมสีตามเว็บโรงเรียน https://www.ben2.ac.th/
Backend: Google Apps Script + Google Sheets (URL อยู่ใน `app.js`, โค้ดอยู่ใน `apps-script/Code.gs`)

## ติดตั้ง/ติดตั้งใหม่ Backend (Google Apps Script)

ใช้เมื่อตั้งระบบครั้งแรก หรือเมื่อ URL เดิมใช้ไม่ได้ (ขึ้น 404 / "โหลดข้อมูลไม่สำเร็จ")

1. เข้า https://script.google.com > **โปรเจกต์ใหม่**
2. วางโค้ดจาก `apps-script/Code.gs` ลงไฟล์ `Code.gs` (ลบโค้ดตัวอย่างออก)
   (ถ้าจะใช้ LINE ด้วย ให้เพิ่มไฟล์ใหม่แล้ววาง `apps-script/LineNotify.gs` — Code.gs เรียกให้เองถ้ามีไฟล์นี้)
3. เลือกฟังก์ชัน **setup** แล้วกด **Run** อนุญาตสิทธิ์ Sheets + Drive
   ระบบสร้าง Google Sheet "BEN2 Maintenance - ใบแจ้งซ่อม" และโฟลเดอร์เก็บรูปใน Drive ให้เอง (ดู URL ของชีตใน Execution log)
4. **Deploy > New deployment > Web app** — Execute as: **Me**, Who has access: **Anyone** แล้วคัดลอก URL ที่ลงท้าย `/exec`
5. ใส่ URL นั้นที่บรรทัดแรกของ `app.js` (`SCRIPT_URL`) แล้ว commit / push

เมื่อแก้โค้ด Apps Script ภายหลัง ต้อง **Deploy > Manage deployments > แก้ไข > New version** ใช้ URL เดิมต่อได้

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
