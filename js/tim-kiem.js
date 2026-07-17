// Hàm bỏ dấu tiếng Việt, thường dùng cho tìm kiếm không phân biệt dấu
function removeVietnameseAccents(str) {
    if (!str) return "";
    return str
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d");
}

function handleSearch(keyword) {
    // Luôn lấy nguồn dữ liệu mới nhất từ window.allData được gán bởi phân trang hoặc sync
    const dataSource = window.allData || window.originalData;
    if (!dataSource || !Array.isArray(dataSource)) {
        console.warn("Chưa có dữ liệu để tìm kiếm!");
        return;
    }

    // Lưu lại dữ liệu gốc lần đầu tiên khi chưa tìm kiếm
    if (!window.originalData || window.originalData.length === 0) {
        window.originalData = [...dataSource]; 
    }

    const cleanKeyword = removeVietnameseAccents(keyword.trim());

    // Nếu ô tìm kiếm trống, hiển thị lại toàn bộ dữ liệu ban đầu qua phân trang
    if (!cleanKeyword) {
        if (typeof initPagination === "function") {
            initPagination(window.originalData);
        }
        return;
    }

    // Lọc dữ liệu linh hoạt: kiểm tra xem mã hoặc tên có chứa từ khóa hay không
    const filteredData = window.originalData.filter(item => {
        // Mở rộng toàn bộ các trường hợp key có thể trả về từ Google Sheets
        const maCode = removeVietnameseAccents(
            item["Mã NVL"] || item["Mã CCDC"] || item.ma_nvl || item.ma_ccdc || item.maCCDC || item.maNvl || item["Mã HBT"] || item["Mã hbt"] || item.ma_hbt || item.maHBT || ""
        );
        const tenName = removeVietnameseAccents(
            item["Tên Nguyên Vật Liệu"] || item["Tên nguyên vật liệu"] || item["Tên công cụ dụng cụ"] || item.ten_nguyen_vat_lieu || item.ten_cong_cu_dung_cu || item.tenCCDC || item.tenNvl || item["Tên hàng bán thẳng"] || item["Tên Hàng Bán Thẳng"] || item.ten_hang_ban_thang || ""
        );
        
        return tenName.includes(cleanKeyword) || maCode.includes(cleanKeyword);
    });

    // Cập nhật lại phân trang với kết quả đã lọc
    if (typeof initPagination === "function") {
        initPagination(filteredData);
    }
}