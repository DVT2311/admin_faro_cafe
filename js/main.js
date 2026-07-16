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
    const currentFileName = currentPath.split('/').pop().toLowerCase(); // Lấy tên file hiện tại (VD: quan-ly-nhan-vien.html)
    
    const sidebarLinks = document.querySelectorAll("aside a[href]");

    sidebarLinks.forEach(link => {
        const linkHref = link.getAttribute("href");
        if (!linkHref) return;

        const linkFileName = linkHref.split('/').pop().toLowerCase(); // Lấy tên file ở thẻ a
        const parentDiv = link.parentElement;

        // So sánh trực tiếp tên file với nhau
        if (linkFileName === currentFileName && currentFileName !== "") {
            // Active chuẩn phong cách Faro Cafe
            link.className = "flex items-center space-x-3 pl-3 pr-4 py-2.5 text-sm sidebar-item-active rounded-l-lg";
            link.style.backgroundColor = "#FAF2EB";
            link.style.color = "#7A431D";
            link.style.borderRight = "3px solid #7A431D";
            link.style.fontWeight = "600";

            if (parentDiv && parentDiv.classList.contains("pr-4")) {
                parentDiv.classList.remove("pr-4");
            }
        } else {
            // Trạng thái bình thường
            link.className = "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-[#3D2513]/70 hover:bg-[#FAF6F0] transition-all";
            link.style.backgroundColor = "";
            link.style.color = "";
            link.style.borderRight = "";
            link.style.fontWeight = "";

            if (parentDiv && !parentDiv.classList.contains("pr-4")) {
                parentDiv.classList.add("pr-4");
            }
        }
    });
});