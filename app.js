// นำ URL ของ Web App จาก Google Apps Script (ตอน Deploy เป็น Anyone) มาใส่ในเครื่องหมายคำพูดด้านล่าง
export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzgm-hwW_uccWNHkz9y850ACF0pdDlp-NV8LW7gmxWMMvBBS2zLzl4VWbbiE9UVU68frw/exec";

// --- ฟังก์ชันช่วยเหลือ: แปลงรูปภาพเป็น Base64 ---
export function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// === 1. ฟังก์ชันส่งข้อมูลใบแจ้งซ่อมใหม่ ===
export async function submitTicket(ticketData, imageFile) {
    try {
        let base64Image = null;
        if (imageFile) {
            base64Image = await getBase64(imageFile);
        }

        const payload = {
            action: "create",
            ticket_id: 'BEN2-' + Math.floor(Math.random() * 1000000),
            reporter_name: ticketData.reporter_name,
            equipment_type: ticketData.equipment_type,
            location: ticketData.location,
            issue_detail: ticketData.issue_detail,
            imageBase64: base64Image
        };

        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        return result.status === "success";
    } catch (error) {
        console.error("Error submitting ticket:", error);
        return false;
    }
}

// === 2. ฟังก์ชันดึงข้อมูลรายการแจ้งซ่อมทั้งหมด ===
export async function fetchTickets() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();

        if (data.status === "success") {
            // ระบบ Google Sheets คืนค่าเป็น Array Objects
            return data.data;
        } else {
            console.error("Error API:", data.message);
            return [];
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        return [];
    }
}

// === 3. ฟังก์ชันอัปเดตสถานะงานซ่อม (สำหรับ Admin) ===
export async function updateTicketStatus(id, status, comment) {
    try {
        const payload = {
            action: "update",
            ticket_id: id,
            status: status,
            comment: comment || ''
        };

        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        return result.status === "success";
    } catch (error) {
        console.error("Error updating ticket:", error);
        return false;
    }
}