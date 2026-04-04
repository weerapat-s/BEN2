// นำ URL ของ Web App จาก Google Apps Script มาใส่ในเครื่องหมายคำพูดด้านล่าง
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
        submitBtn.innerText = "กำลังอัปโหลดข้อมูล... (อาจใช้เวลาสักครู่)";
        submitBtn.disabled = true;

        const fileInput = document.getElementById('imageFile');
        let base64Image = null;
        if (fileInput.files.length > 0) {
            base64Image = await getBase64(fileInput.files[0]);
        }

        // จัดเตรียมข้อมูลส่งไป Google Sheets
        const payload = {
            ticket_id: 'BEN2-' + Math.floor(Math.random() * 1000000), // สร้างรหัสสุ่ม
            reporter_name: document.getElementById('reporterName').value,
            equipment_type: document.getElementById('equipmentType').value,
            location: document.getElementById('location').value,
            issue_detail: document.getElementById('issueDetail').value,
            imageBase64: base64Image
        };

        try {
            // ใช้ text/plain เพื่อป้องกันปัญหา CORS Policy ของ Google
            const response = await fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            if (result.status === "success") {
                alert("ส่งใบแจ้งซ่อมเรียบร้อยแล้ว!");
                repairForm.reset();
                window.location.href = "dashboard.html"; // พาไปหน้าแดชบอร์ด
            } else {
                alert("เกิดข้อผิดพลาด: " + result.message);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
        } finally {
            submitBtn.innerText = "ส่งใบแจ้งซ่อม";
            submitBtn.disabled = false;
        }
    });
}

// --- 2. ระบบดึงข้อมูลมาแสดงที่ Dashboard (สำหรับหน้า dashboard.html) ---
async function loadDashboard() {
    const tableBody = document.getElementById('ticketTableBody');
    if (!tableBody) return; // ทำงานเฉพาะหน้าที่มีตารางนี้

    tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>กำลังโหลดข้อมูล...</td></tr>";

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        tableBody.innerHTML = ""; // ล้างข้อความกำลังโหลด
        
        // นำข้อมูลมาสร้างแถวในตาราง (ย้อนกลับให้รายการใหม่สุดอยู่บน)
        data.reverse().forEach(ticket => {
            const tr = document.createElement('tr');
            
            // จัดการสีของสถานะ
            let statusColor = ticket.status === 'รอรับเรื่อง' ? 'color: red;' : 'color: green;';
            
            tr.innerHTML = `
                <td>${ticket.ticket_id}</td>
                <td>${ticket.equipment_type} <br><small>(${ticket.location})</small></td>
                <td>${ticket.reporter_name}</td>
                <td style="font-weight:bold; ${statusColor}">${ticket.status}</td>
                <td>
                    ${ticket.image_url !== '-' 
                        ? `<a href="${ticket.image_url}" target="_blank" style="color: #FFD700;">ดูรูปภาพ</a>` 
                        : 'ไม่มีรูป'}
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:red;'>โหลดข้อมูลไม่สำเร็จ</td></tr>";
        console.error("Fetch Error:", error);
    }
}

// เรียกใช้ฟังก์ชันโหลดแดชบอร์ดทันทีเมื่อเปิดหน้าเว็บ
loadDashboard();