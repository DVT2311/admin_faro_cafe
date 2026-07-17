// Thay URL bên dưới bằng URL ứng dụng web Google Apps Script của bạn (với sheet=DM_HBT)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzialygZxzfQ6nXkflHqdXVtguEwisaDBbuCHh4e071GOJmWWM2KFuhJjm_b8MDneSe/exec?sheet=DM_HBT";

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
    const tbody = document.getElementById("table-hang-ban-thang-body");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang đồng bộ dữ liệu từ Google Sheets...</td></tr>`;

    try {
        const response = await fetch(WEB_APP_URL);
        const result = await response.json();

        if (result.success && result.data) {
            // Đẩy dữ liệu vào hệ thống phân trang chung
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
    // Trỏ chính xác vào tbody của Hàng Bán Thẳng
    const tbody = document.getElementById("table-hang-ban-thang-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!dataList || dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-500">Không có dữ liệu hàng bán thẳng.</td></tr>`;
        return;
    }

    dataList.forEach((item) => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-[#FAF6F0]/60 transition-colors";

        // Khớp tuyệt đối với tên cột trên Google Sheets (DM_HBT), có vét cạn dự phòng
        const maHbt = item["Mã HBT"] || item["Mã hbt"] || item.ma_hbt || item.maHBT || "";
        const tenMatHang = item["Tên hàng bán thẳng"] || item["Tên Hàng Bán Thẳng"] || item.ten_hang_ban_thang || "";
        const giaMuaGoc = formatNumber(item["Giá mua gốc"] || item["Giá Mua Gốc"] || item.gia_mua_goc);
        const quyCach = formatNumber(item["Quy cách đóng gói"] || item["Quy Cách Đóng Gói"] || item.quy_cach);
        const donVi = item["Đơn vị định lượng"] || item["Đơn Vị Định Lượng"] || item.don_vi_dinh_luong || "";
        const giaCost = formatNumber(item["Giá cost trên 1 đơn vị định lượng"] || item["Giá Cost Trên 1 Đơn Vị Định Lượng"] || item.gia_cost);

        tr.innerHTML = `
            <td class="p-3 text-center font-mono font-bold text-[#7A431D] bg-[#FAF6F0]/20">${maHbt}</td>
            <td class="p-3 font-semibold">${tenMatHang}</td>
            <td class="p-3 text-right font-medium">${giaMuaGoc} đ</td>
            <td class="p-3 text-center">${quyCach}</td>
            <td class="p-3 text-center"><span class="px-2.5 py-1 rounded bg-[#EFEAE2] text-xs font-medium">${donVi}</span></td>
            <td class="p-3 text-right font-bold text-[#7A431D] bg-[#FAF6F0]/30">${giaCost} đ</td>
            <td class="p-3 text-center">
                <button class="text-[#7A431D] hover:text-[#2A1A10]" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square"></i></button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Hàm hỗ trợ định dạng số thành dạng phân tách hàng nghìn (ví dụ: 235,636)
function formatNumber(value) {
    if (value === undefined || value === null || isNaN(value)) return value || "";
    return Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
}