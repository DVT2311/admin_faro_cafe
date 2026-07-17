/**
 * --- SYNC-COST-MENU.JS (Cập nhật chuẩn hóa theo JSON thực tế) ---
 */

const SCRIPT_URL_COST_MENU = "https://script.google.com/macros/s/AKfycbzialygZxzfQ6nXkflHqdXVtguEwisaDBbuCHh4e071GOJmWWM2KFuhJjm_b8MDneSe/exec?sheet=Cost_ThanhPham";

const ITEMS_PER_PAGE = 5; 
let currentPage = 1;
let allData = [];         
let originalData = [];    

document.addEventListener("DOMContentLoaded", function () {
    const btnSync = document.getElementById("btn-sync-sheets");
    
    if (btnSync) {
        btnSync.addEventListener("click", function () {
            const icon = btnSync.querySelector(".id-sync-icon");
            if (icon) icon.classList.add("fa-spin");

            fetchAndRenderMenuData().finally(() => {
                if (icon) icon.classList.remove("fa-spin");
            });
        });
    }

    fetchAndRenderMenuData();

    const searchInput = document.querySelector("input[type='text']");
    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            filterMenuData(e.target.value);
        });
    }
});

async function fetchAndRenderMenuData() {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="p-8 text-center text-gray-500">
                <i class="fa-solid fa-spinner fa-spin mr-2 text-[#7A431D]"></i> 
                Đang đồng bộ dữ liệu Cost Món Menu từ Google Sheets...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(SCRIPT_URL_COST_MENU);
        const result = await response.json();

        if (result.success && result.data) {
            originalData = result.data;
            allData = [...originalData];
            initPagination(allData);
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="p-8 text-center text-red-500">
                        <i class="fa-solid fa-triangle-exclamation mr-2"></i> Lỗi từ Google Sheet: ${result.message || "Không thể tải dữ liệu"}
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error("Lỗi kết nối API:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="p-8 text-center text-red-500">
                    <i class="fa-solid fa-circle-exclamation mr-2"></i> Không thể kết nối đến máy chủ Google Apps Script!
                </td>
            </tr>
        `;
    }
}

function initPagination(dataList) {
    allData = dataList;
    currentPage = 1; 
    renderPage(currentPage);
}

function renderPage(page) {
    currentPage = page;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    const pageData = allData.slice(startIndex, endIndex);
    
    renderMenuTable(pageData);
    updatePaginationInfo(startIndex + 1, Math.min(endIndex, allData.length), allData.length);
    renderPaginationControls();
}

function renderMenuTable(dataList) {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!dataList || dataList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="p-8 text-center text-gray-500">Không tìm thấy dữ liệu phù hợp.</td>
            </tr>
        `;
        return;
    }

    dataList.forEach((menu, menuIndex) => {
        const thanhPhanList = menu["thanh_phan"] || [];
        const rowSpan = thanhPhanList.length > 0 ? thanhPhanList.length : 1;
        const borderClass = menuIndex > 0 ? "border-t-2 border-[#EFEAE2]" : "";

        if (thanhPhanList.length === 0) {
            const tr = document.createElement("tr");
            tr.className = `hover:bg-[#FAF6F0]/40 transition-colors ${borderClass}`;
            tr.innerHTML = `
                <td class="p-3 text-center font-mono font-bold text-[#7A431D] bg-[#FAF6F0]/10 border-r border-[#EFEAE2]">${menu["Mã Món"] || ""}</td>
                <td class="p-3 font-bold border-r border-[#EFEAE2]">${menu["Tên Món"] || ""}</td>
                <td class="p-3 text-center font-mono text-xs text-gray-400" colspan="5">Chưa có thành phần</td>
                <td class="p-3 text-right font-bold text-[#7A431D] bg-[#FAF6F0]/30 border-l border-r border-[#EFEAE2] text-[15px]">${formatNumber(menu["Cost Món"])} đ</td>
                <td class="p-3 text-center"><button class="text-[#7A431D] hover:text-[#3D2513]" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button></td>
            `;
            tbody.appendChild(tr);
        } else {
            thanhPhanList.forEach((tp, index) => {
                const tr = document.createElement("tr");
                const subBorder = index > 0 ? "border-t border-[#EFEAE2]/60" : "";
                tr.className = `hover:bg-[#FAF6F0]/40 transition-colors ${index === 0 ? borderClass : subBorder}`;

                const maTpStr = (tp["Mã Thành Phần"] || "").toString().trim();
                let badgeClass = "bg-orange-50 text-orange-700 border-orange-200";
                if (maTpStr.toUpperCase().includes("BTP")) {
                    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                }

                let html = "";

                if (index === 0) {
                    html += `
                        <td rowspan="${rowSpan}" class="p-3 text-center font-mono font-bold text-[#7A431D] bg-[#FAF6F0]/10 border-r border-[#EFEAE2] align-middle">${menu["Mã Món"] || ""}</td>
                        <td rowspan="${rowSpan}" class="p-3 font-bold border-r border-[#EFEAE2] align-middle">${menu["Tên Món"] || ""}</td>
                    `;
                }

                html += `
                    <td class="p-3 text-center font-mono text-xs">
                        <span class="px-1.5 py-0.5 rounded ${badgeClass} text-[10px] font-medium border">${maTpStr}</span>
                    </td>
                    <td class="p-3">${tp["Tên Thành Phần"] || ""}</td>
                    <td class="p-3 text-center">${formatNumber(tp["Số lượng"])}</td>
                    <td class="p-3 text-right">${formatNumber(tp["Đơn giá"])} đ</td>
                    <td class="p-3 text-right">${formatNumber(tp["Thành tiền"])} đ</td>
                `;

                if (index === 0) {
                    html += `
                        <td rowspan="${rowSpan}" class="p-3 text-right font-bold text-[#7A431D] bg-[#FAF6F0]/30 border-l border-r border-[#EFEAE2] align-middle text-[15px]">${formatNumber(menu["Cost Món"])} đ</td>
                        <td rowspan="${rowSpan}" class="p-3 text-center align-middle"><button class="text-[#7A431D] hover:text-[#3D2513]" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button></td>
                    `;
                }

                tr.innerHTML = html;
                tbody.appendChild(tr);
            });
        }
    });
}

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

window.changePage = function(page) {
    const totalPages = Math.ceil(allData.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    renderPage(page);
}

function updatePaginationInfo(start, end, total) {
    const statsContainer = document.querySelector(".p-4.border-t.border-\\[\\#EFEAE2\\]");
    if (statsContainer) {
        const textSpan = statsContainer.querySelector("span");
        if (textSpan) {
            textSpan.textContent = `Hiển thị món ${start}-${end} / ${total} món menu`;
        }
    }
}

function filterMenuData(keyword) {
    const cleanKeyword = removeVietnameseAccents(keyword);

    if (!cleanKeyword) {
        initPagination(originalData);
        return;
    }

    const filtered = originalData.filter(menu => {
        const maMon = removeVietnameseAccents(menu["Mã Món"] || "");
        const tenMon = removeVietnameseAccents(menu["Tên Món"] || "");
        
        const matchParent = maMon.includes(cleanKeyword) || tenMon.includes(cleanKeyword);

        const thanhPhanList = menu["thanh_phan"] || [];
        const matchChild = thanhPhanList.some(tp => {
            const maTp = removeVietnameseAccents(tp["Mã Thành Phần"] || "");
            const tenTp = removeVietnameseAccents(tp["Tên Thành Phần"] || "");
            return maTp.includes(cleanKeyword) || tenTp.includes(cleanKeyword);
        });

        return matchParent || matchChild;
    });

    initPagination(filtered);
}

function removeVietnameseAccents(str) {
    if (!str) return "";
    return str.toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function formatNumber(value) {
    if (value === undefined || value === null || isNaN(value)) return value || "";
    const num = Number(value);
    return Math.round(num).toLocaleString('vi-VN');
}