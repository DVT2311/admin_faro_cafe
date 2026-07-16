document.addEventListener("DOMContentLoaded", function () {
    console.log("Faro Cafe Admin System Initialized.");

    // 1. Xử lý tìm kiếm nhanh trên Header
    const searchInput = document.querySelector('header input[type="text"]');
    if (searchInput) {
        searchInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                alert("Đang tìm kiếm chức năng: " + this.value);
            }
        });
    }

    // 2. Xử lý đồng bộ Google Sheets
    const syncButton = document.getElementById('btn-sync-sheets');
    if (syncButton) {
        syncButton.addEventListener('click', function () {
            const icon = this.querySelector('.id-sync-icon');
            const textSpan = this.querySelector('span');
            
            syncButton.disabled = true;
            if (icon) icon.classList.add('animate-spin-custom', 'fa-spin');
            if (textSpan) textSpan.innerText = 'Đang đồng bộ dữ liệu...';
            
            setTimeout(() => {
                if (icon) icon.classList.remove('animate-spin-custom', 'fa-spin');
                syncButton.disabled = false;
                if (textSpan) textSpan.innerText = 'Đồng bộ Google Sheet';
                alert('🎉 Đồng bộ dữ liệu giá vốn từ Google Sheets thành công!');
            }, 2000); 
        });
    }

    // 3. Tự động Active Sidebar Menu theo Tên File (Bất chấp nằm ở thư mục nào)
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.split('/').pop().toLowerCase(); // Lấy tên file hiện tại
    
    const sidebarLinks = document.querySelectorAll("aside a[href]");

    sidebarLinks.forEach(link => {
        const linkHref = link.getAttribute("href");
        if (!linkHref) return;

        const linkFileName = linkHref.split('/').pop().toLowerCase();

        // So sánh trực tiếp tên file với nhau
        if (linkFileName === currentFileName && currentFileName !== "") {
            // Active chuẩn: Bo tròn tất cả các góc (rounded-lg) và có border ôm trọn quanh thẻ a
            link.className = "flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition-all";
            link.style.backgroundColor = "#FAF2EB";
            link.style.color = "#7A431D";
            link.style.border = "1px solid #7A431D"; // Border bao quanh 4 cạnh hoặc chỉnh theo ý muốn
            link.style.fontWeight = "600";
        } else {
            // Trạng thái bình thường
            link.className = "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-[#3D2513]/70 hover:bg-[#FAF6F0] transition-all";
            link.style.backgroundColor = "";
            link.style.color = "";
            link.style.border = "";
            link.style.fontWeight = "";
        }
    });
});