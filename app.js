// กำหนด URL ของ Google Apps Script ที่ได้รับมาล่าสุด
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzgm-hwW_uccWNHkz9y850ACF0pdDlp-NV8LW7gmxWMMvBBS2zLzl4VWbbiE9UVU68frw/exec";

// --- ฟังก์ชันช่วยเหลือ: แปลงรูปภาพเป็น Base64 ---
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// --- 1. ระบบส่งใบแจ้งซ่อม (สำหรับหน้า index.html) ---
const repairForm = document.getElementById('repairForm');
if (repairForm) {
    repairForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // ป้องกันหน้าเว็บโหลดซ้ำ
        
        const submitBtn = document.getElementById('submitBtn');
        const originalBtnText = submitBtn.innerHTML;
        
        // เปลี่ยนข้อความปุ่มเพื่อบอกผู้ใช้ว่ากำลังประมวลผล
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังส่งข้อมูล... (อาจใช้เวลาสักครู่)';
        submitBtn.disabled = true;

        const fileInput = document.getElementById('imageFile');
        let base64Image = null;
        
        // ถ้ามีการแนบรูปภาพ ให้แปลงไฟล์เป็นข้อความ (Base64)
        if (fileInput.files.length > 0) {
            try {
                base64Image = await getBase64(fileInput.files[0]);
            } catch (error) {
                console.error("Error converting image:", error);
                alert("เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ กรุณาลองใหม่");
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                return;
            }
        }

        // จัดเตรียมแพ็กเกจข้อมูลส่งไป Google Sheets
        const payload = {
            ticket_id: 'BEN2-' + Math.floor(Math.random() * 1000000), // สร้างรหัสซ่อมแบบสุ่ม
            reporter_name: document.getElementById('reporterName').value,
            equipment_type: document.getElementById('equipmentType').value,
            location: document.getElementById('location').value,
            issue_detail: document.getElementById('issueDetail').value,
            imageBase64: base64Image
        };

        try {
            // ใช้เทคนิค text/plain เพื่อป้องกันการบล็อกของเบราว์เซอร์ (CORS Policy)
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (result.status === "success") {
                alert("ส่งข้อมูลใบแจ้งซ่อมเรียบร้อยแล้ว!");
                repairForm.reset(); // ล้างข้อมูลในฟอร์มให้ว่างเปล่า
                
                // หากต้องการให้พาส่งหน้า Dashboard อัตโนมัติหลังแจ้งซ่อมเสร็จ ให้ลบเครื่องหมาย // ด้านล่างออก
                // window.location.href = "dashboard.html"; 
            } else {
                alert("เกิดข้อผิดพลาดในการบันทึก: " + result.message);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
        } finally {
            // คืนค่าปุ่มกลับมาเหมือนเดิมให้กดได้อีก
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// --- 2. ระบบดึงข้อมูลมาแสดงที่ Dashboard (สำหรับหน้า dashboard.html) ---
async function loadDashboard() {
    const tableBody = document.getElementById('ticketTableBody');
    if (!tableBody) return; // ถ้าไม่ได้อยู่หน้า Dashboard จะหยุดทำงานฟังก์ชันนี้

    tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding: 2rem;'>กำลังโหลดข้อมูล... <i class='fas fa-spinner fa-spin'></i></td></tr>";

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        tableBody.innerHTML = ""; // ล้างข้อความ 'กำลังโหลด' ออก
        
        // เช็คว่ามีข้อมูลในตารางหรือไม่
        if (data.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding: 2rem;'>ยังไม่มีข้อมูลการแจ้งซ่อมในระบบ</td></tr>";
            return;
        }

        // นำข้อมูลมาสร้างแถวตาราง (ใช้ reverse() เพื่อให้รายการแจ้งซ่อมล่าสุดอยู่บนสุด)
        data.reverse().forEach(ticket => {
            const tr = document.createElement('tr');
            
            // ตั้งค่าสีตัวอักษรตามสถานะงาน
            let statusColor = ticket.status === 'รอรับเรื่อง' ? '#ff6b6b' : (ticket.status === 'กำลังดำเนินการ' ? '#feca57' : '#1dd1a1');
            
            tr.innerHTML = `
                <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">${ticket.ticket_id}</td>
                <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">${ticket.equipment_type} <br><small style="color: var(--text-muted);">(${ticket.location})</small></td>
                <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">${ticket.reporter_name}</td>
                <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight:bold; color: ${statusColor};">${ticket.status}</td>
                <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    ${ticket.image_url && ticket.image_url !== '-' 
                        ? `<a href="${ticket.image_url}" target="_blank" style="color: var(--accent); text-decoration: none;"><i class="fas fa-image"></i> ดูรูปภาพ</a>` 
                        : '<span style="color: #666;">-</span>'}
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#ff6b6b; padding: 2rem;'>ดึงข้อมูลไม่สำเร็จ กรุณารีเฟรชหน้าเว็บอีกครั้ง</td></tr>";
        console.error("Dashboard Load Error:", error);
    }
}

// เรียกใช้ฟังก์ชันโหลดแดชบอร์ดทันทีเมื่อเปิดหน้าเว็บ
loadDashboard();