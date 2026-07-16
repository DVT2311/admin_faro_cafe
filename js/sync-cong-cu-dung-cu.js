// Thay URL bên dưới bằng URL ứng dụng web Google Apps Script của bạn
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzialygZxzfQ6nXkflHqdXVtguEwisaDBbuCHh4e071GOJmWWM2KFuhJjm_b8MDneSe/exec?sheet=DM_CCDC";

document.addEventListener("DOMContentLoaded", function () {
    const btnSync = document.getElementById("btn-sync-sheets");
    
    if (btnSync) {
        btnSync.addEventListener("click", function () {
            // Hiệu ứng icon xoay tròn khi bấm đồng bộ
            const icon = btnSync.querySelector(".id-sync-icon");
            if (icon) icon.classList.add("fa-spin");

            fetchAndRenderData().finally(() => {
                if (icon) icon.classList.remove("fa-spin");
            });
        });
    }

    // Tự động tải dữ liệu khi vừa mở trang
    fetchAndRenderData();
});

async function fetchAndRenderData() {
    const tbody = document.getElementById("table-cong-cu-dung-cu-body");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang đồng bộ dữ liệu từ Google Sheets...</td></tr>`;

    try {
        const response = await fetch(WEB_APP_URL);
        const result = await response.json();

        if (result.success && result.data) {
            // THAY ĐỔI Ở ĐÂY: Thay vì gọi renderTableData trực tiếp, ta gọi initPagination để quản lý phân trang
            initPagination(result.data);
        } else {
            tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-500">Lỗi: ${result.message || "Không thể lấy dữ liệu"}</td></tr>`;
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-500">Không thể kết nối đến máy chủ Google Sheets!</td></tr>`;
    }
}

function renderTableData(dataList) {
    // Trỏ chính xác vào tbody dựa theo ID mới
    const tbody = document.getElementById("table-cong-cu-dung-cu-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-500">Không có dữ liệu nguyên vật liệu.</td></tr>`;
        return;
    }

    dataList.forEach((item) => {
            const tr = document.createElement("tr");
            tr.className = "hover:bg-[#FAF6F0]/60 transition-colors";

            // Đọc đúng tên thuộc tính có dấu cách từ JSON trả về
            const maCcdc = item["Mã CCDC"] || "";
            const tenCcdc = item["Tên công cụ dụng cụ"] || "";
            const giaMuaGoc = formatNumber(item["Giá mua gốc"]);
            const soLuong = formatNumber(item["Quy cách đóng gói"]); // Hoặc thay bằng trường số lượng thực tế nếu có
            const donVi = item["Đơn vị định lượng"] || "";
            const giaCost = formatNumber(item["Giá cost trên 1 đơn vị định lượng"]);

            tr.innerHTML = `
                <td class="p-3 text-center font-mono font-bold text-[#7A431D] bg-[#FAF6F0]/20">${maCcdc}</td>
                <td class="p-3 font-semibold">${tenCcdc}</td>
                <td class="p-3 text-right font-medium">${giaMuaGoc} đ</td>
                <td class="p-3 text-center">${soLuong}</td>
                <td class="p-3 text-center"><span class="px-2.5 py-1 rounded bg-[#EFEAE2] text-xs font-medium">${donVi}</span></td>
                <td class="p-3 text-right font-bold text-[#7A431D] bg-[#FAF6F0]/30">${giaCost} đ</td>
                <td class="p-3 text-center">
                    <button class="text-[#7A431D] hover:text-[#3D2513]" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square"></i></button>
                </td>
            `;

            tbody.appendChild(tr);
        });
}

// Hàm hỗ trợ định dạng số thành dạng phân tách hàng nghìn (ví dụ: 359,640)
function formatNumber(value) {
    if (value === undefined || value === null || isNaN(value)) return value || "";
    return Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
}