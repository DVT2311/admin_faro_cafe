document.addEventListener("DOMContentLoaded", async function () {
    try {
        // 1. Ẩn tạm thời body để tránh chớp giật giao diện khi load layout
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.2s ease-in-out";

        // 2. Tự động tính toán độ sâu (depth) chuẩn xác từ URL hiện tại
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        let depth = 0;
        const pagesIndex = pathSegments.indexOf('pages');
        
        if (pagesIndex !== -1) {
            // Ví dụ: /pages/quan-ly-cost/cost-mon.html -> pagesIndex = 0, pathSegments.length = 3 -> depth = 2
            depth = pathSegments.length - (pagesIndex + 1);
        }
        
        // Tạo tiền tố lùi thư mục (VD: "../" hoặc "../../")
        const rootPrefix = "../".repeat(depth);

        // 3. Khai báo danh sách các component cần load
        const components = [
            { id: 'header-container', file: 'components/header.html' },
            { id: 'sidebar-container', file: 'components/sidebar.html' },
            { id: 'footer-container', file: 'components/footer.html' }
        ];

        // 4. Fetch đồng thời tất cả các component
        const fetchPromises = components.map(async (comp) => {
            const container = document.getElementById(comp.id);
            if (!container) return;

            // Nạp file component với đường dẫn gốc chính xác
            const response = await fetch(rootPrefix + comp.file);
            if (!response.ok) {
                throw new Error(`Không thể tải component: ${comp.file}`);
            }
            let htmlContent = await response.text();

            // 5. Chuẩn hóa lại toàn bộ đường dẫn bên trong component cho khớp với vị trí trang hiện tại
            if (depth > 0) {
                // Chuyển đổi các liên kết trang quản lý, ảnh và thư mục gốc
                htmlContent = htmlContent.replace(/href="pages\//g, `href="${rootPrefix}pages/`);
                htmlContent = htmlContent.replace(/src="images\//g, `src="${rootPrefix}images/`);
                htmlContent = htmlContent.replace(/href="index\.html"/g, `href="${rootPrefix}index.html"`);
                
                // Xử lý các đường dẫn tương đối ngược cấp nếu có trong sidebar/header gốc
                htmlContent = htmlContent.replace(/href="\.\.\//g, `href="${rootPrefix}../`);
            } else {
                // Nếu đang ở trang chủ (index.html), chuẩn hóa về dạng chuẩn gốc
                htmlContent = htmlContent.replace(/href="pages\//g, `href="pages/`);
                htmlContent = htmlContent.replace(/src="images\//g, `src="images/`);
                htmlContent = htmlContent.replace(/href="index\.html"/g, `href="index.html"`);
            }

            container.innerHTML = htmlContent;
        });

        // Chờ tất cả component render xong
        await Promise.all(fetchPromises);

        // 6. Phát sự kiện thông báo layout đã load xong để kích hoạt active menu và các sự kiện khác
        const layoutLoadedEvent = new CustomEvent('layoutLoaded');
        document.dispatchEvent(layoutLoadedEvent);

        // 7. Hiển thị lại trang mượt mà
        document.body.style.opacity = "1";

    } catch (error) {
        console.error("Lỗi khi đồng bộ layout hệ thống:", error);
        document.body.style.opacity = "1";
    }
});