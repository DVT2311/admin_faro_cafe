// Thêm tham số ?sheet=DM_NguyenVatLieu vào cuối URL để lấy đúng dữ liệu nguyên vật liệu
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzialygZxzfQ6nXkflHqdXVtguEwisaDBbuCHh4e071GOJmWWM2KFuhJjm_b8MDneSe/exec?sheet=DM_NguyenVatLieu";

document.addEventListener("DOMContentLoaded", function () {
    const btnSync = document.getElementById("btn-sync-sheets");
    
    if (btnSync) {
        btnSync.addEventListener("click", function () {
            const icon = btnSync.querySelector(".id-sync-icon");
            if (icon) icon.classList.add("fa-spin");

            fetchAndRenderData().finally(() => {
                if (icon) icon.classList.remove("fa-spin");
            });
        });
    }

    fetchAndRenderData();
});

async function fetchAndRenderData() {
    const tbody = document.getElementById("table-nguyen-vat-lieu-body");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang đồng bộ dữ liệu từ Google Sheets...</td></tr>`;

    try {
        const response = await fetch(WEB_APP_URL);
        const result = await response.json();

        if (result.success && result.data) {
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
    const tbody = document.getElementById("table-nguyen-vat-lieu-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (dataList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-500">Không có dữ liệu nguyên vật liệu.</td></tr>`;
        return;
    }

    dataList.forEach((item) => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-[#FAF6F0]/60 transition-colors";

        // Đọc đúng các trường dữ liệu của Nguyên Vật Liệu (hỗ trợ cả key tiếng Việt có dấu/không dấu)
        const maNvl = item["Mã NVL"] || item.ma_nvl || "";
        const tenNvl = item["Tên Nguyên Vật Liệu"] || item.ten_nguyen_vat_lieu || "";
        const giaMuaGoc = formatNumber(item["Giá mua gốc"] || item.gia_mua_goc);
        const quyCach = formatNumber(item["Quy cách đóng gói"] || item.quy_cach_dong_goi);
        const donVi = item["Đơn vị định lượng"] || item.don_vi_dinh_luong || "";
        const giaCost = formatNumber(item["Giá cost trên 1 đơn vị định lượng"] || item.gia_cost_tren_1_don_vi_dinh_luong);

        tr.innerHTML = `
            <td class="p-3 text-center font-mono font-bold text-[#7A431D] bg-[#FAF6F0]/20">${maNvl}</td>
            <td class="p-3 font-semibold">${tenNvl}</td>
            <td class="p-3 text-right font-medium">${giaMuaGoc} đ</td>
            <td class="p-3 text-center">${quyCach}</td>
            <td class="p-3 text-center"><span class="px-2.5 py-1 rounded bg-[#EFEAE2] text-xs font-medium">${donVi}</span></td>
            <td class="p-3 text-right font-bold text-[#7A431D] bg-[#FAF6F0]/30">${giaCost} đ</td>
            <td class="p-3 text-center">
                <button class="text-[#7A431D] hover:text-[#3D2513]" title="Chỉnh sửa"><i class="fa-solid fa-pen-to-square"></i></button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// Hàm hỗ trợ định dạng số nguyên
function formatNumber(value) {
    if (value === undefined || value === null || isNaN(value)) return value || "";
    return Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
}