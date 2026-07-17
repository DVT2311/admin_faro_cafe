// ĐƯỜNG DẪN API GOOGLE APPS SCRIPT CỦA BẠN (Thay thế link bên dưới bằng Web App URL thực tế)
const API_URL = "https://script.google.com/macros/s/AKfycbzialygZxzfQ6nXkflHqdXVtguEwisaDBbuCHh4e071GOJmWWM2KFuhJjm_b8MDneSe/exec?sheet=Bao_Cao_Chi_Nhanh";

let globalMenuData = []; // Lưu trữ dữ liệu gốc lấy từ API

// Hàm định dạng tiền tệ VNĐ
function formatCurrency(amount) {
   if (isNaN(amount) || amount === null) return "0 đ";
    // Sử dụng Math.round để làm tròn thành số nguyên trước khi format
    return Math.round(Number(amount)).toLocaleString('vi-VN') + " đ";
}

// Hàm chuyển đổi chuỗi tiền tệ (vd: "35.000 đ" hoặc "35000") về kiểu số
function parseNumber(val) {
   if (!val) return 0;
    if (typeof val === 'number') return Math.round(val);
    let cleanStr = val.toString().replace(/[^\d]/g, '');
    return cleanStr === '' ? 0 : Math.round(parseFloat(cleanStr));
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
    const icon = btnSync.querySelector('.id-sync-icon');
    icon.classList.add('fa-spin');
    setTimeout(() => { icon.classList.remove('fa-spin'); }, 1000);
}

// Gắn sự kiện click cho nút Đồng bộ Google Sheet
document.getElementById('btn-sync-sheets').addEventListener('click', () => {
    fetchBranchReportData();
});

// 2. HÀM TÍNH TOÁN VÀ RENDER GIAO DIỆN
function renderAllViews() {
    const selectedBranch = document.getElementById('branch-select').value;
    const searchTerm = document.querySelector('#all-branches-container input[type="text"]').value.toLowerCase();
    
    if (selectedBranch === 'all') {
        renderAllBranchesTable(searchTerm);
    } else {
        renderSingleBranchTable(selectedBranch, searchTerm);
    }
    updateKPIs(selectedBranch);
}

// --- RENDER BẢNG TỔNG QUAN (TẤT CẢ CHI NHÁNH) ---
function renderAllBranchesTable(searchTerm) {
    const tbody = document.querySelector('#all-branches-container tbody');
    tbody.innerHTML = '';

    // Lấy danh sách toàn bộ các chi nhánh động từ phần tử đầu tiên của dữ liệu
    let sampleBranches = globalMenuData.length > 0 ? Object.keys(globalMenuData[0].chi_nhanh) : [];

    // Cập nhật lại tiêu đề cột (Header) của bảng tổng quan nếu cần thiết để khớp số lượng chi nhánh
    updateAllBranchesHeader(sampleBranches);

    const filteredData = globalMenuData.filter(item => {
        let tenMon = (item["Tên Món"] || "").toLowerCase();
        let maMon = (item["Mã Món"] || "").toLowerCase();
        return tenMon.includes(searchTerm) || maMon.includes(searchTerm);
    });

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${3 + sampleBranches.length}" class="text-center p-4 text-gray-500">Không tìm thấy món phù hợp</td></tr>`;
        return;
    }

    filteredData.forEach(item => {
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

            html  += `
                <td class="p-3 text-center border border-[#EFEAE2] ${isHighCost ? 'bg-red-50/20' : ''}">
                    <div class="font-bold ${isHighCost ? 'text-red-600' : ''}">${formatCurrency(giaBan)}</div>
                    <div class="text-[10px] ${isHighCost ? 'text-red-600 font-bold' : 'text-emerald-600'} mt-0.5">Cost: ${foodCostPercent}%</div>
                </td>
            `;
        });

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

// Cập nhật động tiêu đề cột cho bảng tất cả chi nhánh
function updateAllBranchesHeader(branches) {
    const headerRow = document.querySelector('#all-branches-container thead tr');
    // Giữ lại 3 cột đầu: Mã Món, Tên Món Thành Phẩm, Giá Cost Gốc
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

// --- RENDER BẢNG CHI TIẾT TỪNG CHI NHÁNH ĐƠN LẺ ---
function renderSingleBranchTable(branchName, searchTerm) {
    const tbody = document.querySelector('#single-branch-container tbody');
    tbody.innerHTML = '';

    const filteredData = globalMenuData.filter(item => {
        let tenMon = (item["Tên Món"] || "").toLowerCase();
        let giaBan = parseNumber(item.chi_nhanh[branchName]);
        return giaBan > 0 && tenMon.includes(searchTerm);
    });

    if (filteredData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-gray-500">Không có dữ liệu cho chi nhánh này</td></tr>`;
        return;
    }

    filteredData.forEach(item => {
        let costGoc = parseNumber(item["Cost Món"]);
        let giaBan = parseNumber(item.chi_nhanh[branchName]);
        let bienLoiNhuan = giaBan - costGoc;
        let foodCostPercent = giaBan > 0 ? (costGoc / giaBan) * 100 : 0;
        let isAlert = foodCostPercent > 35;

        let tr = document.createElement('tr');
        tr.className = "hover:bg-[#FAF6F0]/30 transition-colors";
        tr.innerHTML = `
            <td class="p-3.5 font-medium text-sm">${item["Tên Món"]}</td>
            <td class="p-3.5 text-right text-gray-500 font-medium">${formatCurrency(costGoc)}</td>
            <td class="p-3.5 text-right font-bold text-emerald-700 text-sm">${formatCurrency(giaBan)}</td>
            <td class="p-3.5 text-center font-semibold ${isAlert ? 'text-red-600' : 'text-emerald-600'}">${foodCostPercent.toFixed(1)}%</td>
            <td class="p-3.5 text-right font-medium">${formatCurrency(bienLoiNhuan)}</td>
            <td class="p-3.5 text-center">
                ${isAlert ? 
                    `<span class="px-2 py-0.5 text-[10px] rounded-full bg-red-50 text-red-600 font-semibold border border-red-200 inline-flex items-center gap-1"><i class="fa-solid fa-arrow-down text-[9px]"></i> Lợi nhuận thấp</span>` :
                    `<span class="px-2.5 py-1 text-[10px] rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">Ổn định</span>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. TÍNH TOÁN VÀ CẬP NHẬT CÁC THẺ KPI CARDS (ĐÃ SỬA LẠI CHUẨN XÁC THEO TỔNG SỐ MÓN THỰC TẾ)
function updateKPIs(branchKey) {
    let totalFoodCostSum = 0;
    let countValidItems = 0;
    let highProfitCount = 0;
    let alertCostCount = 0;
    
    let totalMenuLength = globalMenuData.length; // Tổng số món thực tế (ví dụ: 93 món)

    if (branchKey === 'all') {
        // Trường hợp xem TẤT CẢ CHI NHÁNH: 
        // Tính trung bình cộng tỉ lệ food cost của tất cả các món trên các chi nhánh
        let globalItemCount = 0;
        
        globalMenuData.forEach(item => {
            let costGoc = parseNumber(item["Cost Món"]);
            let itemValidInAnyBranch = false;
            let itemIsAlertAnywhere = false;
            let itemIsHighProfitAnywhere = true;

            for (let b in item.chi_nhanh) {
                let giaBan = parseNumber(item.chi_nhanh[b]);
                if (giaBan > 0) {
                    let fc = (costGoc / giaBan) * 100;
                    totalFoodCostSum += fc;
                    globalItemCount++;

                    if (fc > 35) itemIsAlertAnywhere = true;
                    if (fc > 30) itemIsHighProfitAnywhere = false;
                    itemValidInAnyBranch = true;
                }
            }

            if (itemValidInAnyBranch) {
                countValidItems++;
                // Nếu món có bất kỳ chi nhánh nào bị vượt ngưỡng 35% thì tính là món cần điều chỉnh giá
                if (itemIsAlertAnywhere) alertCostCount++;
                // Nếu tất cả các chi nhánh bán đều có food cost <= 30% thì tính là món biên lợi nhuận cao
                if (itemIsHighProfitAnywhere) highProfitCount++;
            }
        });

        // Food cost trung bình toàn cục
        var avgFoodCost = globalItemCount > 0 ? (totalFoodCostSum / globalItemCount).toFixed(1) : 0;

    } else {
        // Trường hợp xem RIÊNG 1 CHI NHÁNH CỤ THỂ
        let branchItemCount = 0;

        globalMenuData.forEach(item => {
            let costGoc = parseNumber(item["Cost Món"]);
            let giaBan = parseNumber(item.chi_nhanh[branchKey]);

            if (giaBan > 0) {
                let fc = (costGoc / giaBan) * 100;
                totalFoodCostSum += fc;
                branchItemCount++;

                if (fc <= 30) {
                    highProfitCount++;
                }
                if (fc > 35) {
                    alertCostCount++;
                }
            }
        });

        var avgFoodCost = branchItemCount > 0 ? (totalFoodCostSum / branchItemCount).toFixed(1) : 0;
    }

    // Gán dữ liệu lên giao diện KPI Cards
    const kpiFoodCost = document.getElementById('kpi-food-cost');
    const kpiHighProfit = document.getElementById('kpi-high-profit');
    const kpiAlertCost = document.getElementById('kpi-alert-cost');

    kpiFoodCost.innerText = avgFoodCost + "%";
    if (avgFoodCost > 35) {
        kpiFoodCost.className = "text-2xl font-black text-red-600";
    } else {
        kpiFoodCost.className = "text-2xl font-black text-emerald-600";
    }

    kpiHighProfit.innerText = highProfitCount + " món";
    kpiAlertCost.innerText = alertCostCount + " món";
}

// 4. CHUYỂN ĐỔI VIEW KHI THAY ĐỔI SELECT CHI NHÁNH
function toggleBranchView() {
    const select = document.getElementById('branch-select');
    const singleView = document.getElementById('single-branch-container');
    const allView = document.getElementById('all-branches-container');
    
    if (select.value === 'all') {
        singleView.classList.add('hidden');
        allView.classList.remove('hidden');
    } else {
        allView.classList.add('hidden');
        singleView.classList.remove('hidden');
    }
    renderAllViews();
}

// 5. GẮN SỰ KIỆN TÌM KIẾM THEO TÊN MÓN TRỰC TIẾP
document.querySelector('#all-branches-container input[type="text"]').addEventListener('input', () => {
    renderAllViews();
});

// Tự động fetch dữ liệu ngay khi mở trang lần đầu
window.addEventListener('DOMContentLoaded', () => {
    fetchBranchReportData();
});