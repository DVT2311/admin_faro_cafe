// ĐƯỜNG DẪN API GOOGLE APPS SCRIPT CỦA BẠN
const API_URL = "https://script.google.com/macros/s/AKfycbzialygZxzfQ6nXkflHqdXVtguEwisaDBbuCHh4e071GOJmWWM2KFuhJjm_b8MDneSe/exec?sheet=Bao_Cao_Chi_Nhanh";

let globalMenuData = []; // Lưu trữ dữ liệu gốc lấy từ API

// --- CẤU HÌNH PHÂN TRANG ---
let currentPage = 1;
let rowsPerPage = 10; // Số lượng món hiển thị trên mỗi trang

// Hàm định dạng tiền tệ VNĐ
function formatCurrency(amount) {
    if (isNaN(amount) || amount === null) return "0 đ";
    return Math.round(Number(amount)).toLocaleString('vi-VN') + " đ";
}

// Hàm chuyển đổi chuỗi tiền tệ về kiểu số
function parseNumber(val) {
    if (!val) return 0;
    if (typeof val === 'number') return Math.round(val);
    let cleanStr = val.toString().replace(/[^\d]/g, '');
    return cleanStr === '' ? 0 : Math.round(parseFloat(cleanStr));
}

// --- HÀM CHUẨN HÓA CHUỖI TÌM KIẾM (KHÔNG DẤU, KHÔNG HOA THƯỜNG, BỎ KHOẢNG TRẮNG) ---
function removeAccents(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Xóa dấu tiếng Việt
        .replace(/[đĐ]/g, 'd')            // Đổi đ thành d
        .replace(/\s+/g, '')             // Xóa tất cả dấu cách để tìm kiếm linh hoạt
        .trim();
}

// 1. TẢI DỮ LIỆU TỪ GOOGLE SHEET KHI LOAD TRANG
async function fetchBranchReportData() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        if (result.success && result.data) {
            globalMenuData = result.data;
            renderAllViews(); // Render dữ liệu lên bảng
            showSyncNotification("Đồng bộ dữ liệu thành công!", "success");
        }
    } catch (error) {
        console.error("Lỗi khi đồng bộ Google Sheet:", error);
        showSyncNotification("Lỗi kết nối Google Sheet!", "error");
    }
}

// Hiệu ứng thông báo khi bấm nút đồng bộ
function showSyncNotification(message, type) {
    const btnSync = document.getElementById('btn-sync-sheets');
    if (!btnSync) return;
    const icon = btnSync.querySelector('.id-sync-icon');
    if (icon) {
        icon.classList.add('fa-spin');
        setTimeout(() => { icon.classList.remove('fa-spin'); }, 1000);
    }
}

// Gắn sự kiện click cho nút Đồng bộ Google Sheet
const btnSyncSheets = document.getElementById('btn-sync-sheets');
if (btnSyncSheets) {
    btnSyncSheets.addEventListener('click', () => {
        fetchBranchReportData();
    });
}

// 2. HÀM TÍNH TOÁN VÀ RENDER GIAO DIỆN CHUNG
function renderAllViews() {
    const selectedBranch = document.getElementById('branch-select').value;
    
    if (selectedBranch === 'all') {
        const searchInput = document.querySelector('#all-branches-container input[type="text"]');
        const searchTerm = searchInput ? searchInput.value : "";
        renderAllBranchesTable(searchTerm);
    } else {
        const searchInput = document.getElementById('single-branch-search');
        const searchTerm = searchInput ? searchInput.value : "";
        renderSingleBranchTable(selectedBranch, searchTerm);
    }
    updateKPIs(selectedBranch);
}

// --- HÀM RENDER THANH ĐIỀU HƯỚNG PHÂN TRANG ---
function renderPaginationControls(totalItems, paginationInfoId, paginationButtonsId) {
    const infoEl = document.getElementById(paginationInfoId);
    const buttonsEl = document.getElementById(paginationButtonsId);
    
    if (!infoEl || !buttonsEl) return;

    if (totalItems === 0) {
        infoEl.innerText = "Hiển thị 0 - 0 của 0 món";
        buttonsEl.innerHTML = "";
        return;
    }

    let totalPages = Math.ceil(totalItems / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;

    let startItem = (currentPage - 1) * rowsPerPage + 1;
    let endItem = Math.min(currentPage * rowsPerPage, totalItems);
    
    infoEl.innerText = `Hiển thị ${startItem} - ${endItem} của ${totalItems} món`;

    let html = '';
    
    // Nút Trước (Previous)
    html += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled class="px-3 py-1 bg-gray-100 text-gray-400 rounded border border-gray-200 cursor-not-allowed"' : 'class="px-3 py-1 bg-white text-[#7A431D] rounded border border-[#EFEAE2] hover:bg-[#FAF6F0]"'}><i class="fa-solid fa-chevron-left text-[10px]"></i></button>`;

    // Các nút số trang
    let maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="px-3 py-1 bg-[#7A431D] text-white font-bold rounded shadow-sm">${i}</button>`;
        } else {
            html += `<button onclick="changePage(${i})" class="px-3 py-1 bg-white text-[#3D2513] rounded border border-[#EFEAE2] hover:bg-[#FAF6F0]">${i}</button>`;
        }
    }

    // Nút Sau (Next)
    html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled class="px-3 py-1 bg-gray-100 text-gray-400 rounded border border-gray-200 cursor-not-allowed"' : 'class="px-3 py-1 bg-white text-[#7A431D] rounded border border-[#EFEAE2] hover:bg-[#FAF6F0]"'}><i class="fa-solid fa-chevron-right text-[10px]"></i></button>`;

    buttonsEl.innerHTML = html;
}

// Hàm chuyển trang chung cho cả 2 chế độ
function changePage(newPage) {
    let selectedBranch = document.getElementById('branch-select').value;
    let searchTerm = "";
    
    if (selectedBranch === 'all') {
        let searchInput = document.querySelector('#all-branches-container input[type="text"]');
        searchTerm = searchInput ? searchInput.value : "";
    } else {
        let searchInput = document.getElementById('single-branch-search');
        searchTerm = searchInput ? searchInput.value : "";
    }
    
    let normalizedSearch = removeAccents(searchTerm);
    let totalItems = 0;

    if (selectedBranch === 'all') {
        const filteredData = globalMenuData.filter(item => {
            let tenMon = removeAccents(item["Tên Món"]);
            let maMon = removeAccents(item["Mã Món"]);
            return tenMon.includes(normalizedSearch) || maMon.includes(normalizedSearch);
        });
        totalItems = filteredData.length;
    } else {
        const filteredData = globalMenuData.filter(item => {
            let tenMon = removeAccents(item["Tên Món"]);
            let giaBan = parseNumber(item.chi_nhanh[selectedBranch]);
            return giaBan > 0 && tenMon.includes(normalizedSearch);
        });
        totalItems = filteredData.length;
    }

    let totalPages = Math.ceil(totalItems / rowsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    
    currentPage = newPage;
    renderAllViews();
}

// --- RENDER BẢNG TỔNG QUAN (TẤT CẢ CHI NHÁNH) KÈM PHÂN TRANG & TÌM KIẾM KHÔNG DẤU ---
function renderAllBranchesTable(searchTerm) {
    const tbody = document.querySelector('#all-branches-container tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let sampleBranches = globalMenuData.length > 0 ? Object.keys(globalMenuData[0].chi_nhanh) : [];
    updateAllBranchesHeader(sampleBranches);

    let normalizedSearch = removeAccents(searchTerm);

    const filteredData = globalMenuData.filter(item => {
        let tenMon = removeAccents(item["Tên Món"]);
        let maMon = removeAccents(item["Mã Món"]);
        return tenMon.includes(normalizedSearch) || maMon.includes(normalizedSearch);
    });

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${3 + sampleBranches.length}" class="text-center p-4 text-gray-500">Không tìm thấy món phù hợp</td></tr>`;
        renderPaginationControls(0, 'all-pagination-info', 'all-pagination-buttons');
        return;
    }

    let startIdx = (currentPage - 1) * rowsPerPage;
    let paginatedData = filteredData.slice(startIdx, startIdx + rowsPerPage);

    paginatedData.forEach(item => {
        let costGoc = parseNumber(item["Cost Món"]);
        let tr = document.createElement('tr');
        tr.className = "hover:bg-[#FAF6F0]/40 transition-colors";

        let html = `
            <td class="p-3 text-center font-mono text-gray-400 border border-[#EFEAE2]">${item["Mã Món"] || ""}</td>
            <td class="p-3 border border-[#EFEAE2] font-semibold text-sm">${item["Tên Món"] || ""}</td>
            <td class="p-3 text-right font-semibold border border-[#EFEAE2] bg-[#FAF6F0]/10 text-[#7A431D]">${formatCurrency(costGoc)}</td>
        `;

        sampleBranches.forEach(branch => {
            let giaBanStr = item.chi_nhanh[branch] || "0 đ";
            let giaBan = parseNumber(giaBanStr);
            let foodCostPercent = giaBan > 0 ? ((costGoc / giaBan) * 100).toFixed(0) : 0;
            let isHighCost = foodCostPercent > 35;

            html += `
                <td class="p-3 text-center border border-[#EFEAE2] ${isHighCost ? 'bg-red-50/20' : ''}">
                    <div class="font-bold ${isHighCost ? 'text-red-600' : ''}">${formatCurrency(giaBan)}</div>
                    <div class="text-[10px] ${isHighCost ? 'text-red-600 font-bold' : 'text-emerald-600'} mt-0.5">Cost: ${foodCostPercent}%</div>
                </td>
            `;
        });

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    renderPaginationControls(filteredData.length, 'all-pagination-info', 'all-pagination-buttons');
}

// Cập nhật động tiêu đề cột cho bảng tất cả chi nhánh
function updateAllBranchesHeader(branches) {
    const headerRow = document.querySelector('#all-branches-container thead tr');
    if (!headerRow) return;
    let headerHtml = `
        <th class="p-3.5 text-center border border-[#142B1D] w-24">Mã Món</th>
        <th class="p-3.5 border border-[#142B1D] w-64">Tên Món Thành Phẩm</th>
        <th class="p-3.5 text-right border border-[#142B1D] w-32 bg-[#244A32]">Giá Cost Gốc</th>
    `;
    branches.forEach(branch => {
        headerHtml += `<th class="p-3.5 text-center border border-[#142B1D] w-36">${branch}</th>`;
    });
    headerRow.innerHTML = headerHtml;
}

// --- RENDER BẢNG CHI TIẾT TỪNG CHI NHÁNH ĐƠN LẺ KÈM PHÂN TRANG & TÌM KIẾM KHÔNG DẤU ---
function renderSingleBranchTable(branchName, searchTerm) {
    const tbody = document.querySelector('#single-branch-container tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let normalizedSearch = removeAccents(searchTerm);

    const filteredData = globalMenuData.filter(item => {
        let tenMon = removeAccents(item["Tên Món"]);
        let giaBan = parseNumber(item.chi_nhanh[branchName]);
        return giaBan > 0 && tenMon.includes(normalizedSearch);
    });

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-gray-500">Không tìm thấy món phù hợp tại chi nhánh này</td></tr>`;
        renderPaginationControls(0, 'single-pagination-info', 'single-pagination-buttons');
        return;
    }

    let startIdx = (currentPage - 1) * rowsPerPage;
    let paginatedData = filteredData.slice(startIdx, startIdx + rowsPerPage);

    paginatedData.forEach(item => {
        let costGoc = parseNumber(item["Cost Món"]);
        let giaBan = parseNumber(item.chi_nhanh[branchName]);
        let bienLoiNhuan = giaBan - costGoc;
        let foodCostPercent = giaBan > 0 ? (costGoc / giaBan) * 100 : 0;
        
        let badgeHtml = '';
        if (foodCostPercent > 35) {
            badgeHtml = `<span class="px-2 py-0.5 text-[10px] rounded-full bg-red-50 text-red-600 font-semibold border border-red-200 inline-flex items-center gap-1"><i class="fa-solid fa-arrow-down text-[9px]"></i> Lợi nhuận thấp</span>`;
        } else if (foodCostPercent >= 25 && foodCostPercent <= 35) {
            badgeHtml = `<span class="px-2 py-0.5 text-[10px] rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200 inline-flex items-center gap-1"><i class="fa-solid fa-scale-balanced text-[9px]"></i> Biên ở giữa</span>`;
        } else {
            badgeHtml = `<span class="px-2.5 py-1 text-[10px] rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">Ổn định</span>`;
        }

        let tr = document.createElement('tr');
        tr.className = "hover:bg-[#FAF6F0]/30 transition-colors";
        tr.innerHTML = `
            <td class="p-3.5 font-medium text-sm">${item["Tên Món"]}</td>
            <td class="p-3.5 text-right text-gray-500 font-medium">${formatCurrency(costGoc)}</td>
            <td class="p-3.5 text-right font-bold text-emerald-700 text-sm">${formatCurrency(giaBan)}</td>
            <td class="p-3.5 text-center font-semibold ${foodCostPercent > 35 ? 'text-red-600' : (foodCostPercent >= 25 ? 'text-amber-600' : 'text-emerald-600')}">${foodCostPercent.toFixed(1)}%</td>
            <td class="p-3.5 text-right font-medium">${formatCurrency(bienLoiNhuan)}</td>
            <td class="p-3.5 text-center">${badgeHtml}</td>
        `;
        tbody.appendChild(tr);
    });

    renderPaginationControls(filteredData.length, 'single-pagination-info', 'single-pagination-buttons');
}

// 3. TÍNH TOÁN VÀ CẬP NHẬT CÁC THẺ KPI CARDS
function updateKPIs(branchKey) {
    let totalFoodCostSum = 0;
    let totalCostGocSum = 0;
    let totalProfitSum = 0;
    let highProfitCount = 0;
    let midProfitCount = 0; 
    let alertCostCount = 0;
    let totalMenuLength = globalMenuData.length;
    
    let foodCostArr = [];

    if (branchKey === 'all') {
        let globalItemCount = 0;
        
        globalMenuData.forEach(item => {
            let costGoc = parseNumber(item["Cost Món"]);
            let itemValidInAnyBranch = false;
            let itemIsAlertAnywhere = false;
            let itemIsHighProfitAnywhere = true;
            let itemIsMidProfitAnywhere = false;

            for (let b in item.chi_nhanh) {
                let giaBan = parseNumber(item.chi_nhanh[b]);
                if (giaBan > 0) {
                    let fc = (costGoc / giaBan) * 100;
                    totalFoodCostSum += fc;
                    totalCostGocSum += costGoc;
                    totalProfitSum += (giaBan - costGoc);
                    foodCostArr.push(fc);
                    globalItemCount++;

                    if (fc > 35) itemIsAlertAnywhere = true;
                    if (fc < 25) itemIsHighProfitAnywhere = false;
                    if (fc >= 25 && fc <= 35) itemIsMidProfitAnywhere = true;
                    
                    itemValidInAnyBranch = true;
                }
            }

            if (itemValidInAnyBranch) {
                if (itemIsAlertAnywhere) alertCostCount++;
                if (itemIsMidProfitAnywhere) midProfitCount++;
                if (itemIsHighProfitAnywhere) highProfitCount++;
            }
        });

        var avgFoodCost = globalItemCount > 0 ? (totalFoodCostSum / globalItemCount).toFixed(1) : 0;
        var avgCostVal = globalItemCount > 0 ? (totalCostGocSum / globalItemCount) : 0;
        var avgProfitVal = globalItemCount > 0 ? (totalProfitSum / globalItemCount) : 0;

    } else {
        let branchItemCount = 0;

        globalMenuData.forEach(item => {
            let costGoc = parseNumber(item["Cost Món"]);
            let giaBan = parseNumber(item.chi_nhanh[branchKey]);

            if (giaBan > 0) {
                let fc = (costGoc / giaBan) * 100;
                totalFoodCostSum += fc;
                totalCostGocSum += costGoc;
                let profit = giaBan - costGoc;
                totalProfitSum += profit;
                foodCostArr.push(fc);
                branchItemCount++;

                if (fc < 25) {
                    highProfitCount++;
                } else if (fc >= 25 && fc <= 35) {
                    midProfitCount++;
                } else {
                    alertCostCount++;
                }
            }
        });

        var avgFoodCost = branchItemCount > 0 ? (totalFoodCostSum / branchItemCount).toFixed(1) : 0;
        var avgCostVal = branchItemCount > 0 ? (totalCostGocSum / branchItemCount) : 0;
        var avgProfitVal = branchItemCount > 0 ? (totalProfitSum / branchItemCount) : 0;
    }

    let riskCostVal = 0;
    if (foodCostArr.length > 0) {
        let maxFc = Math.max(...foodCostArr);
        let minFc = Math.min(...foodCostArr);
        riskCostVal = (maxFc - minFc) * 0.2; 
    }

    // Gán dữ liệu lên KPI Cards Hàng 1
    const totalItemsEl = document.getElementById('kpi-total-items');
    if (totalItemsEl) totalItemsEl.innerText = totalMenuLength;

    const kpiFoodCost = document.getElementById('kpi-food-cost');
    if (kpiFoodCost) {
        kpiFoodCost.innerText = avgFoodCost + "%";
        kpiFoodCost.className = avgFoodCost > 35 ? "text-2xl font-black text-red-600" : "text-2xl font-black text-emerald-600";
    }

    const avgProfitEl = document.getElementById('kpi-avg-profit');
    if (avgProfitEl) avgProfitEl.innerText = formatCurrency(avgProfitVal);

    const avgCostEl = document.getElementById('kpi-avg-cost');
    if (avgCostEl) avgCostEl.innerText = formatCurrency(avgCostVal);

    // Gán dữ liệu lên KPI Cards Hàng 2
    const highProfitEl = document.getElementById('kpi-high-profit');
    if (highProfitEl) highProfitEl.innerText = highProfitCount;

    const midProfitEl = document.getElementById('kpi-mid-profit');
    if (midProfitEl) midProfitEl.innerText = midProfitCount;

    const alertCostEl = document.getElementById('kpi-alert-cost');
    if (alertCostEl) alertCostEl.innerText = alertCostCount;

    const riskCostEl = document.getElementById('kpi-risk-cost');
    if (riskCostEl) riskCostEl.innerText = "+" + riskCostVal.toFixed(1) + "%";
}

// 4. CHUYỂN ĐỔI VIEW KHI THAY ĐỔI SELECT CHI NHÁNH
function toggleBranchView() {
    currentPage = 1; // Reset về trang 1 khi đổi chi nhánh
    const select = document.getElementById('branch-select');
    const singleView = document.getElementById('single-branch-container');
    const allView = document.getElementById('all-branches-container');
    
    if (!select || !singleView || !allView) return;

    if (select.value === 'all') {
        singleView.classList.add('hidden');
        allView.classList.remove('hidden');
    } else {
        allView.classList.add('hidden');
        singleView.classList.remove('hidden');
    }
    renderAllViews();
}

// 5. GẮN SỰ KIỆN TÌM KIẾM TRỰC TIẾP
// Tìm kiếm ở bảng tất cả chi nhánh
const allSearchInput = document.querySelector('#all-branches-container input[type="text"]');
if (allSearchInput) {
    allSearchInput.addEventListener('input', () => {
        currentPage = 1;
        renderAllViews();
    });
}

// Tìm kiếm ở bảng chi nhánh đơn lẻ
const singleSearchInput = document.getElementById('single-branch-search');
if (singleSearchInput) {
    singleSearchInput.addEventListener('input', () => {
        currentPage = 1;
        renderAllViews();
    });
}

// Tự động fetch dữ liệu ngay khi mở trang lần đầu
window.addEventListener('DOMContentLoaded', () => {
    fetchBranchReportData();
});