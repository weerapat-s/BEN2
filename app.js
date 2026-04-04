const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzgm-hwW_uccWNHkz9y850ACF0pdDlp-NV8LW7gmxWMMvBBS2zLzl4VWbbiE9UVU68frw/exec";

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error);
    });
}

// 🔒 ระบบป้องกันหน้า Admin (รหัสผ่านคือ 1234)
if (window.location.pathname.includes('admin.html')) {
    const password = prompt("กรุณาใส่รหัสผ่านช่างเพื่อเข้าสู่ระบบ (ค่าเริ่มต้น: 1234):");
    if (password !== "1234") {
        alert("รหัสผ่านไม่ถูกต้อง!");
        window.location.href = "index.html";
    } else {
        loadAdminDashboard(); // ถ้ารหัสถูก โหลดข้อมูลเลย
    }
}

// --- 1. หน้าแจ้งซ่อม (index.html) ---
const repairForm = document.getElementById('repairForm');
if (repairForm) {
    repairForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitBtn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังส่งข้อมูล...';
        submitBtn.disabled = true;

        const fileInput = document.getElementById('imageFile');
        let base64Image = null;
        if (fileInput.files.length > 0) base64Image = await getBase64(fileInput.files[0]);

        const payload = {
            action: "create", // บอกสคริปต์ว่านี่คือการสร้างใหม่
            ticket_id: 'BEN2-' + Math.floor(Math.random() * 10000),
            reporter_name: document.getElementById('reporterName').value,
            equipment_type: document.getElementById('equipmentType').value,
            location: document.getElementById('location').value,
            issue_detail: document.getElementById('issueDetail').value,
            imageBase64: base64Image
        };

        try {
            const response = await fetch(SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (result.status === "success") {
                alert("ส่งใบแจ้งซ่อมเรียบร้อยแล้ว!");
                repairForm.reset();
                window.location.href = "dashboard.html";
            } else alert("Error: " + result.message);
        } catch (error) { alert("ติดต่อเซิร์ฟเวอร์ไม่ได้"); }
        finally { submitBtn.innerHTML = originalBtnText; submitBtn.disabled = false; }
    });
}

// --- 2. หน้าติดตามสถานะ (dashboard.html) ---
async function loadDashboard() {
    const tableBody = document.getElementById('ticketTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>กำลังโหลด...</td></tr>";

    try {
        const response = await fetch(SCRIPT_URL); const data = await response.json();
        tableBody.innerHTML = "";
        if (data.length === 0) return tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>ยังไม่มีข้อมูล</td></tr>";

        data.reverse().forEach(ticket => {
            const tr = document.createElement('tr');
            let statusColor = ticket.status === 'รอรับเรื่อง' ? '#ff6b6b' : (ticket.status === 'กำลังดำเนินการ' ? '#feca57' : '#1dd1a1');

            // ส่วนแสดงกล่องข้อความจากช่าง (ถ้ามีข้อความ)
            let adminNoteHtml = (ticket.admin_note && ticket.admin_note !== '-')
                ? `<div style="margin-top:0.8rem; font-size:0.85rem; color:#fff; background:rgba(255,215,0,0.2); padding:0.5rem; border-radius:5px; border-left: 3px solid #FFD700;">
                    <i class="fas fa-comment-dots"></i> <b>ช่างตอบกลับ:</b> ${ticket.admin_note}
                   </div>`
                : '';

            tr.innerHTML = `
                <td>${ticket.ticket_id}</td>
                <td>${ticket.equipment_type} <br><small>(${ticket.location})</small></td>
                <td>${ticket.reporter_name}</td>
                <td>
                    <span style="font-weight:bold; color:${statusColor};">${ticket.status}</span>
                    ${adminNoteHtml}
                </td>
                <td>${ticket.image_url !== '-' ? `<a href="${ticket.image_url}" target="_blank" style="color:var(--accent);">ดูรูป</a>` : '-'}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) { tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>โหลดข้อมูลไม่สำเร็จ</td></tr>"; }
}
if (document.getElementById('ticketTableBody')) loadDashboard();

// --- 3. หน้าของช่าง (admin.html) ---
async function loadAdminDashboard() {
    const adminTableBody = document.getElementById('adminTableBody');
    if (!adminTableBody) return;

    try {
        const response = await fetch(SCRIPT_URL); const data = await response.json();
        adminTableBody.innerHTML = "";

        data.reverse().forEach(ticket => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${ticket.ticket_id}</b><br><small>${ticket.reporter_name}</small></td>
                <td>${ticket.issue_detail}<br><small style="color:var(--accent);">${ticket.location}</small></td>
                <td>
                    <select id="status_${ticket.ticket_id}">
                        <option value="รอรับเรื่อง" ${ticket.status === 'รอรับเรื่อง' ? 'selected' : ''}>รอรับเรื่อง</option>
                        <option value="กำลังดำเนินการ" ${ticket.status === 'กำลังดำเนินการ' ? 'selected' : ''}>กำลังดำเนินการ</option>
                        <option value="เสร็จสิ้น" ${ticket.status === 'เสร็จสิ้น' ? 'selected' : ''}>เสร็จสิ้น</option>
                    </select>
                </td>
                <td>
                    <input type="text" id="note_${ticket.ticket_id}" value="${ticket.admin_note !== '-' ? ticket.admin_note : ''}" placeholder="พิมพ์ข้อความที่นี่...">
                </td>
                <td>
                    <button onclick="updateTicket('${ticket.ticket_id}')" class="btn btn-primary" style="padding:0.5rem; font-size:0.9rem;">บันทึก</button>
                </td>
            `;
            adminTableBody.appendChild(tr);
        });
    } catch (error) { adminTableBody.innerHTML = "<tr><td colspan='5'>โหลดข้อมูลไม่สำเร็จ</td></tr>"; }
}

// ฟังก์ชันเวลากดปุ่ม "บันทึก" ในหน้าช่าง
window.updateTicket = async function (ticket_id) {
    const status = document.getElementById(`status_${ticket_id}`).value;
    const note = document.getElementById(`note_${ticket_id}`).value;

    const payload = { action: "update", ticket_id: ticket_id, status: status, admin_note: note };

    try {
        const response = await fetch(SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (result.status === "success") { alert("อัปเดตงานซ่อมสำเร็จ!"); }
        else { alert("Error: " + result.message); }
    } catch (error) { alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"); }
};