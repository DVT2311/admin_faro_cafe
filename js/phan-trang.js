// Cấu hình phân trang
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let allData = []; // Mảng chứa toàn bộ dữ liệu tải về từ API/Google Sheets

// Hàm gọi khi nhận được dữ liệu từ API thành công
function initPagination(dataList) {
    window.allData = dataList;
    allData = dataList;
    currentPage = 1; // Reset về trang đầu tiên khi có dữ liệu mới
    renderPage(currentPage);
    renderPaginationControls();
}

// Hàm render dữ liệu của trang hiện tại ra bảng
function renderPage(page) {
    currentPage = page;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    // Cắt mảng dữ liệu lấy đúng 10 item cho trang hiện tại
    const pageData = allData.slice(startIndex, endIndex);
    
    // Gọi hàm render ra giao diện HTML (hàm renderTableData đã có sẵn của bạn)
    renderTableData(pageData);
    
    // Cập nhật lại text hiển thị số lượng (Ví dụ: "Hiển thị 1-10 / 24 dòng")
    updatePaginationInfo(startIndex + 1, Math.min(endIndex, allData.length), allData.length);
    
    // Cập nhật lại trạng thái active của nút phân trang giao diện
    renderPaginationControls();
}

// Hàm tạo các nút chuyển trang tự động dựa trên tổng số dữ liệu
function renderPaginationControls() {
    const totalPages = Math.ceil(allData.length / ITEMS_PER_PAGE);
    const paginationContainer = document.querySelector(".flex.items-center.space-x-1"); // Thẻ chứa các nút phân trang trong HTML của bạn
    
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

// Hàm chuyển trang khi click vào nút
function changePage(page) {
    const totalPages = Math.ceil(allData.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    renderPage(page);
}

// Cập nhật dòng chữ thống kê ở footer bảng
function updatePaginationInfo(start, end, total) {
    const infoSpan = document.querySelector(".p-4.border-t.border-\\[\\#EFEAE2\\] span");
    if (infoSpan) {
        infoSpan.textContent = `Hiển thị ${start}-${end} / ${total} dòng nguyên liệu`;
    }
}