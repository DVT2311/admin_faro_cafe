document.addEventListener("DOMContentLoaded", function () {
    console.log("Faro Cafe Admin System Initialized.");

    // Gọi các sự kiện gắn trên giao diện tĩnh (nếu có sẵn từ đầu)
    initHeaderActions();
});

// Lắng nghe sự kiện layout đã được load xong từ layout-loader.js
document.addEventListener('layoutLoaded', function () {
    // Kích hoạt lại các sự kiện gắn vào Header/Sidebar sau khi đã fetch động thành công
    initHeaderActions();
    highlightActiveMenu();
});

// Hàm gom nhóm các xử lý tương tác trên Header (Tìm kiếm, Đồng bộ, v.v.)
function initHeaderActions() {
    // 1. Xử lý tìm kiếm nhanh trên Header (Dùng event delegation hoặc kiểm tra lại phần tử đã tồn tại chưa)
    const searchInput = document.querySelector('header input[type="text"]');
    if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = "true"; // Đánh dấu đã gắn sự kiện để tránh bị gán trùng lặp
        searchInput.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                alert("Đang tìm kiếm chức năng: " + this.value);
            }
        });
    }

    // 2. Xử lý đồng bộ Google Sheets
    const syncButton = document.getElementById('btn-sync-sheets');
    if (syncButton && !syncButton.dataset.bound) {
        syncButton.dataset.bound = "true";
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
}

// Hàm dùng chung để Tự động Active Sidebar Menu theo Tên File
function highlightActiveMenu() {
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.split('/').pop().toLowerCase();
    
    const sidebarLinks = document.querySelectorAll("aside a[href]");
    if (sidebarLinks.length === 0) return;

    sidebarLinks.forEach(link => {
        const linkHref = link.getAttribute("href");
        if (!linkHref) return;

        const linkFileName = linkHref.split('/').pop().toLowerCase();

        if (linkFileName === currentFileName && currentFileName !== "") {
            link.className = "flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition-all";
            link.style.backgroundColor = "#FAF2EB";
            link.style.color = "#7A431D";
            link.style.border = "1px solid #7A431D"; 
            link.style.fontWeight = "600";

            const icon = link.querySelector('i');
            if (icon) {
                icon.style.color = "#7A431D";
            }
        } else {
            link.className = "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-[#3D2513]/70 hover:bg-[#FAF6F0] transition-all";
            link.style.backgroundColor = "";
            link.style.color = "";
            link.style.border = "";
            link.style.fontWeight = "";

            const icon = link.querySelector('i');
            if (icon) {
                icon.style.color = "";
            }
        }
    });
}