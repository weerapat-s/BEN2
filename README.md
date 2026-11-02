# BEN2 Maintenance — ระบบแจ้งซ่อมอุปกรณ์สื่อ (โรงเรียนเบญจมราชรังสฤษฎิ์ ๒)

เว็บ: https://ienas.site/

- **ครู/บุคลากร** (`index.html`): แจ้งซ่อม 3 ขั้นตอนจากมือถือ และดู "งานของฉัน" (เก็บรหัสงานไว้ในเครื่องผู้ใช้)
- **ช่าง** (`admin.html`): เข้าสู่ระบบด้วยรหัสผ่าน จัดการคิวงาน รับเรื่อง/ปิดงาน/ใส่โน้ต
- **Backend**: Google Apps Script + Google Sheets (`apps-script/Code.gs`) — URL ตั้งใน `config.js`
- เว็บเป็นไฟล์ static ไม่ต้อง build (GitHub Pages)

## รันในเครื่อง / โหมดสาธิต

```bash
python -m http.server 8000
```

เปิด http://localhost:8000 — ถ้า `config.js` ยังไม่ได้ใส่ `SCRIPT_URL` เว็บจะเข้า **โหมดสาธิต** (เก็บข้อมูลในเบราว์เซอร์ ไม่ส่งไปที่ใด มีแถบเตือนด้านบน) รหัสผ่านช่างในโหมดสาธิตคือ `demo`

ทดสอบ: `node --test` (ต้องใช้ Node 20+) — ครอบคลุม backend (จำลอง Google services), ฟังก์ชันช่วย, local store และ API client

## ติดตั้ง/ติดตั้งใหม่ Backend (Google Apps Script)

ใช้เมื่อตั้งระบบครั้งแรก หรือเมื่อ URL เดิมใช้ไม่ได้ (ขึ้น 404 / "โหลดข้อมูลไม่สำเร็จ")

1. เข้า https://script.google.com > **โปรเจกต์ใหม่**
2. วางโค้ดจาก `apps-script/Code.gs` ลงไฟล์ `Code.gs` (ลบโค้ดตัวอย่างออก)
3. **Project Settings > Script properties** เพิ่ม `ADMIN_PASSWORD` = รหัสผ่านช่าง (ตั้งยาก ๆ ไม่ใช้ซ้ำกับที่อื่น; ถ้าไม่ตั้ง ช่างจะล็อกอินไม่ได้)
4. เลือกฟังก์ชัน **setup** แล้วกด **Run** อนุญาตสิทธิ์ Sheets + Drive
   ระบบสร้าง Google Sheet "BEN2 Maintenance - ใบแจ้งซ่อม" และโฟลเดอร์เก็บรูปใน Drive ให้เอง (ดู URL ของชีตใน Execution log)
5. **Deploy > New deployment > Web app** — Execute as: **Me**, Who has access: **Anyone** แล้วคัดลอก URL ที่ลงท้าย `/exec`
6. ใส่ URL ใน `config.js` (`SCRIPT_URL`) แล้ว commit / push

เมื่อแก้โค้ด Apps Script ภายหลัง ต้อง **Deploy > Manage deployments > แก้ไข > New version** ใช้ URL เดิมต่อได้

### ความปลอดภัย (สรุป)

- การเปลี่ยนสถานะงานและดูรายการทั้งหมดต้องมี token จากการล็อกอิน (หมดอายุ 6 ชม.) ใส่รหัสผิด 5 ครั้งจะถูกล็อก 10 นาที
- ฝั่งครูดึงได้เฉพาะงานตามรหัสที่ตัวเองเก็บไว้ ไม่เห็นงานคนอื่น
- จำกัดการแจ้งใหม่ 30 ครั้งต่อ 10 นาที, จำกัดความยาวข้อความ, รูปไม่เกิน 4 MB, กันสูตร Google Sheets ในข้อความ
- หน้าเว็บสร้าง DOM ด้วย `textContent` ไม่ฝัง HTML จากข้อมูลผู้ใช้
- **รหัสผู้ดูแลเดิม (`Newlnwza007` / `admin123`) เคยอยู่ในโค้ดสาธารณะบน GitHub ถือว่ารั่วแล้ว อย่านำกลับมาใช้**
- ข้อจำกัด: เว็บ static ใครก็เปิดดูซอร์สหน้าเว็บได้ ความลับต้องอยู่ใน Script properties เท่านั้น

## แจ้งเตือนเข้า LINE กลุ่ม (ยังไม่เปิดใช้)

ใช้ LINE Messaging API (LINE Notify ปิดบริการแล้ว) ส่งจาก Apps Script เพื่อไม่ให้ token อยู่ในหน้าเว็บ

1. สร้าง LINE Official Account + Messaging API channel ที่ https://developers.line.biz/ แล้วออก **Channel access token (long-lived)**
2. เปิด "Allow bot to join group chats" แล้วเชิญบอทเข้ากลุ่มช่าง
3. **หา groupId**: ตั้ง Webhook URL ของ channel เป็น URL Web app, เพิ่มบรรทัดนี้ต้น `doPost` (หลัง `var d = JSON.parse(...)`) ชั่วคราว
   `if (d.events) { logLineGroupId_(d.events); return json_({ status: 'success' }); }`
   แล้วพิมพ์ข้อความในกลุ่ม 1 ครั้ง ดู `groupId` (ขึ้นต้น `C`) ใน Executions log จากนั้นลบบรรทัดนั้นออก
4. **Script properties** เพิ่ม `LINE_CHANNEL_TOKEN` และ `LINE_GROUP_ID`
5. เพิ่มไฟล์ `apps-script/LineNotify.gs` ในโปรเจกต์เดียวกัน — `Code.gs` เรียกให้เองเมื่อมีแจ้งซ่อมใหม่/ช่างอัปเดตสถานะ แล้ว Deploy เวอร์ชันใหม่

หมายเหตุ: แพ็กเกจฟรีของ LINE Official Account จำกัดจำนวนข้อความ push ต่อเดือน

## โครงสร้างไฟล์

```
index.html / js/teacher.js   แอปฝั่งครู (hash routes: #/ #/report #/mine)
admin.html / js/admin.js     แอปฝั่งช่าง
js/api.js, demo-backend.js   ตัวเรียก backend + backend จำลอง
js/util.js, store.js, ui.js  ฟังก์ชันช่วย / ข้อมูลในเครื่อง / DOM helper
styles.css                   design system
apps-script/                 Code.gs (backend), LineNotify.gs
docs/superpowers/            สเปกและแผนงานการออกแบบใหม่
```
