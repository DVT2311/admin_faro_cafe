/**
 * --- SYNC-BAN-THANH-PHAM.JS ---
 * Xử lý đồng bộ, fetch dữ liệu từ Google Apps Script Web App, render bảng Bán Thành Phẩm và Phân trang
 */

const SCRIPT_URL_BTP = "https://script.google.com/macros/s/AKfycbzialygZxzfQ6nXkflHqdXVtguEwisaDBbuCHh4e071GOJmWWM2KFuhJjm_b8MDneSe/exec?sheet=Recipe_BTP";

// --- CẤU HÌNH PHÂN TRANG ---
const ITEMS_PER_PAGE = 5; // Số lượng Bán Thành Phẩm (BTP cha) hiển thị trên mỗi trang
let currentPage = 1;
let allData = []; // Mảng chứa toàn bộ dữ liệu BTP tải về từ API

document.addEventListener("DOMContentLoaded", function () {
    const btnSync = document.getElementById("btn-sync-sheets");
    
    if (btnSync) {
        btnSync.addEventListener("click", function () {
            const icon = btnSync.querySelector(".id-sync-icon");
            if (icon) icon.classList.add("fa-spin");

            fetchAndRenderBtpData().finally(() => {
                if (icon) icon.classList.remove("fa-spin");
            });
        });
    }

    // Tự động tải dữ liệu khi trang vừa mở
    fetchAndRenderBtpData();
});

/**
 * Gọi API lấy dữ liệu và khởi tạo phân trang
 */
async function fetchAndRenderBtpData() {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    // Hiển thị trạng thái đang tải
    tbody.innerHTML = `
        <tr>
            <td colspan="10" class="p-8 text-center text-gray-500">
                <i class="fa-solid fa-spinner fa-spin mr-2 text-[#7A431D]"></i> 
                Đang đồng bộ dữ liệu Recipe_BTP từ Google Sheets...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(SCRIPT_URL_BTP);
        const result = await response.json();

        if (result.success && result.data) {
            allData = result.data;
            initPagination(allData);
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="p-8 text-center text-red-500">
                        <i class="fa-solid fa-triangle-exclamation mr-2"></i> Lỗi từ Google Sheet: ${result.message || "Không thể tải dữ liệu"}
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error("Lỗi kết nối API:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="p-8 text-center text-red-500">
                    <i class="fa-solid fa-circle-exclamation mr-2"></i> Không thể kết nối đến máy chủ Google Apps Script! Vui lòng kiểm tra lại mạng hoặc URL.
                </td>
            </tr>
        `;
    }
}

/**
 * Khởi tạo phân trang từ mảng dữ liệu tổng
 */
function initPagination(dataList) {
    allData = dataList;
    currentPage = 1; 
    renderPage(currentPage);
}

/**
 * Render dữ liệu của trang hiện tại ra bảng
 */
function renderPage(page) {
    currentPage = page;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    // Cắt mảng theo số lượng BTP cấu hình trên 1 trang
    const pageData = allData.slice(startIndex, endIndex);
    
    // Render HTML giao diện bảng
    renderBtpTable(pageData);
    
    // Tính tổng số lượng thành phần con hoặc số BTP để hiển thị text thống kê linh hoạt
    updatePaginationInfo(startIndex + 1, Math.min(endIndex, allData.length), allData.length);
    
    // Render các nút bấm chuyển trang
    renderPaginationControls();
}

/**
 * Đổ dữ liệu vào bảng HTML, xử lý rowspan theo số lượng thành phần con
 */
function renderBtpTable(dataList) {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!dataList || dataList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="p-8 text-center text-gray-500">Không có dữ liệu bán thành phẩm nào.</td>
            </tr>
        `;
        return;
    }

    dataList.forEach((btp, btpIndex) => {
        const rawThanhPhan = btp["thanh_phan"] || [];
        const thanhPhanList = rawThanhPhan.filter(tp => {
            const maNvl = (tp["Mã NVL thành phần"] || "").toString().trim();
            const tenNvl = (tp["Tên NVL"] || "").toString().trim();
            return maNvl !== "" || tenNvl !== "";
        });

        const rowSpan = thanhPhanList.length > 0 ? thanhPhanList.length : 1;
        const borderClass = btpIndex > 0 ? "border-t-2 border-[#EFEAE2]" : "";

        if (thanhPhanList.length === 0) {
            const tr = document.createElement("tr");
            tr.className = `hover:bg-[#FAF6F0]/40 transition-colors ${borderClass}`;
            tr.innerHTML = `
                <td class="p-3 text-center font-mono font-bold text-[#7A431D] bg-[#FAF6F0]/10 border-r border-[#EFEAE2]">${btp["Mã BTP"] || ""}</td>
                <td class="p-3 font-bold border-r border-[#EFEAE2]">${btp["Tên BTP"] || ""}</td>
                <td class="p-3 text-center font-mono text-xs text-gray-400" colspan="5">Chưa có thành phần</td>
                <td class="p-3 text-center font-medium bg-[#FAF6F0]/10 border-l border-r border-[#EFEAE2]">${formatNumber(btp["Khối lượng thành phẩm"])}</td>
                <td class="p-3 text-right font-bold text-[#7A431D] bg-[#FAF6F0]/30 border-r border-[#EFEAE2]">${formatNumber(btp["Cost BTP"])} đ</td>
                <td class="p-3 text-center"><button class="text-[#7A431D] hover:text-[#2A1A10]" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button></td>
            `;
            tbody.appendChild(tr);
        } else {
            thanhPhanList.forEach((tp, index) => {
                const tr = document.createElement("tr");
                const subBorder = index > 0 ? "border-t border-[#EFEAE2]/60" : "";
                tr.className = `hover:bg-[#FAF6F0]/40 transition-colors ${index === 0 ? borderClass : subBorder}`;

                let html = "";

                if (index === 0) {
                    html += `
                        <td rowspan="${rowSpan}" class="p-3 text-center font-mono font-bold text-[#7A431D] bg-[#FAF6F0]/10 border-r border-[#EFEAE2] align-middle">${btp["Mã BTP"] || ""}</td>
                        <td rowspan="${rowSpan}" class="p-3 font-bold border-r border-[#EFEAE2] align-middle">${btp["Tên BTP"] || ""}</td>
                    `;
                }

                html += `
                    <td class="p-3 text-center font-mono text-xs">${tp["Mã NVL thành phần"] || ""}</td>
                    <td class="p-3">${tp["Tên NVL"] || ""}</td>
                    <td class="p-3 text-right">${formatNumber(tp["Đơn giá NVL"])} đ</td>
                    <td class="p-3 text-center">${formatNumber(tp["Khối lượng sử dụng"])}</td>
                    <td class="p-3 text-right">${formatNumber(tp["Thành tiền"])} đ</td>
                `;

                if (index === 0) {
                    html += `
                        <td rowspan="${rowSpan}" class="p-3 text-center font-medium bg-[#FAF6F0]/10 border-l border-r border-[#EFEAE2] align-middle">${formatNumber(btp["Khối lượng thành phẩm"])}</td>
                        <td rowspan="${rowSpan}" class="p-3 text-right font-bold text-[#7A431D] bg-[#FAF6F0]/30 border-r border-[#EFEAE2] align-middle">${formatNumber(btp["Cost BTP"])} đ</td>
                        <td rowspan="${rowSpan}" class="p-3 text-center align-middle"><button class="text-[#7A431D] hover:text-[#2A1A10]" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button></td>
                    `;
                }

                tr.innerHTML = html;
                tbody.appendChild(tr);
            });
        }
    });
}

/**
 * Tạo các nút chuyển trang tự động dựa trên tổng số BTP
 */
function renderPaginationControls() {
    const totalPages = Math.ceil(allData.length / ITEMS_PER_PAGE);
    const paginationContainer = document.querySelector(".flex.items-center.space-x-1"); 
    
    if (!paginationContainer) return;
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = `
        <button onclick="changePage(${currentPage - 1})" class="px-2.5 py-1 border border-[#EFEAE2] rounded text-xs bg-white text-[#3D2513]/50 hover:bg-[#FAF6F0] ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            <i class="fa-solid fa-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="px-3 py-1 border border-[#7A431D] bg-[#7A431D] text-white rounded text-xs font-bold">${i}</button>`;
        } else {
            html += `<button onclick="changePage(${i})" class="px-3 py-1 border border-[#EFEAE2] bg-white text-[#3D2513]/70 rounded text-xs hover:bg-[#FAF6F0]">${i}</button>`;
        }
    }

    html += `
        <button onclick="changePage(${currentPage + 1})" class="px-2.5 py-1 border border-[#EFEAE2] rounded text-xs bg-white text-[#3D2513]/50 hover:bg-[#FAF6F0] ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
            <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;

    paginationContainer.innerHTML = html;
}

/**
 * Hàm chuyển trang khi click vào nút (gắn vào window để gọi từ HTML onclick)
 */
window.changePage = function(page) {
    const totalPages = Math.ceil(allData.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    renderPage(page);
}

/**
 * Cập nhật dòng chữ thống kê ở footer bảng
 */
function updatePaginationInfo(start, end, total) {
    const infoSpan = document.querySelector(".p-4.border-t.border-\\[\\#EFEAE2\\] span");
    if (infoSpan) {
        infoSpan.textContent = `Hiển thị nhóm BTP ${start}-${end} / ${total} bán thành phẩm`;
    }
}

/**
 * Hàm định dạng số tiền, số lượng kiểu Việt Nam
 */
function formatNumber(value) {
    if (value === undefined || value === null || isNaN(value)) return value || "";
    const num = Number(value);
    return Math.round(num).toLocaleString('vi-VN');
}


/**
 * --- BỔ SUNG TÍNH NĂNG TÌM KIẾM CHO BÁN THÀNH PHẨM ---
 */

// Hàm loại bỏ dấu tiếng Việt để tìm kiếm không dấu chính xác
function removeVietnameseAccents(str) {
    if (!str) return "";
    return str.toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/**
 * Hàm tìm kiếm/lọc dữ liệu BTP dựa trên từ khóa nhập vào ô input search
 * @param {string} keyword - Từ khóa người dùng nhập
 */
function filterBtpData(keyword) {
    const cleanKeyword = removeVietnameseAccents(keyword);

    if (!cleanKeyword) {
        // Nếu ô tìm kiếm trống, hiển thị lại toàn bộ dữ liệu ban đầu
        initPagination(window.originalData || allData);
        return;
    }

    // Nếu chưa lưu mảng gốc, lưu lại bản sao của toàn bộ dữ liệu lần đầu tải về
    if (!window.originalData) {
        window.originalData = [...allData];
    }

    const filteredData = window.originalData.filter(btp => {
        // Lấy thông tin mã và tên BTP cha
        const maBtp = removeVietnameseAccents(btp["Mã BTP"] || "");
        const tenBtp = removeVietnameseAccents(btp["Tên BTP"] || "");

        // Kiểm tra xem từ khóa có khớp với BTP cha không
        const matchParent = maBtp.includes(cleanKeyword) || tenBtp.includes(cleanKeyword);

        // Kiểm tra xem từ khóa có khớp với bất kỳ thành phần con nào không (Mã NVL hoặc Tên NVL)
        const thanhPhanList = btp["thanh_phan"] || [];
        const matchChild = thanhPhanList.some(tp => {
            const maNvl = removeVietnameseAccents(tp["Mã NVL thành phần"] || "");
            const tenNvl = removeVietnameseAccents(tp["Tên NVL"] || "");
            return maNvl.includes(cleanKeyword) || tenNvl.includes(cleanKeyword);
        });

        // Giữ lại item nếu khớp ở cha hoặc khớp ở bất kỳ thành phần con nào
        return matchParent || matchChild;
    });

    // Reset lại phân trang với danh sách đã lọc
    initPagination(filteredData);
}

// Lắng nghe sự kiện gõ phím vào ô input tìm kiếm trên giao diện
document.addEventListener("DOMContentLoaded", function () {
    // Thay đổi selector bên dưới theo đúng class hoặc id ô input tìm kiếm thực tế của bạn
    const searchInput = document.querySelector("input[type='text'], input[placeholder*='tìm kiếm'], input[placeholder*='Tìm']");
    
    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            filterBtpData(e.target.value);
        });
    }
});

