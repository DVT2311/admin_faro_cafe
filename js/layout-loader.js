document.addEventListener("DOMContentLoaded", async function () {
    try {
        // 1. Ẩn tạm thời nội dung body hoặc đặt độ mờ bằng 0 để tránh chớp giật giao diện
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.2s ease-in-out";

        // 2. Tự động tính toán đường dẫn gốc dựa vào vị trí file HTML hiện tại
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        let depth = 0;
        const pagesIndex = pathSegments.indexOf('pages');
        if (pagesIndex !== -1) {
            depth = pathSegments.length - (pagesIndex + 1);
        }
        const rootPrefix = "../".repeat(depth);

        // 3. Khai báo danh sách các component cần load
        const components = [
            { id: 'header-container', file: 'components/header.html' },
            { id: 'sidebar-container', file: 'components/sidebar.html' },
            { id: 'footer-container', file: 'components/footer.html' }
        ];

        // 4. Dùng Promise.all để FETCH ĐỒNG THỜI TẤT CẢ CÁC COMPONENT CÙNG MỘT LÚC
        // Thay vì fetch từng cái tuần tự, cách này giúp rút ngắn tối đa thời gian chờ đợi
        const fetchPromises = components.map(async (comp) => {
            const container = document.getElementById(comp.id);
            if (!container) return;

            const response = await fetch(rootPrefix + comp.file);
            if (!response.ok) {
                throw new Error(`Không thể tải component: ${comp.file}`);
            }
            let htmlContent = await response.text();

            // Vá lại đường dẫn tương đối cho khớp với cấp thư mục hiện tại
            if (depth > 0) {
                htmlContent = htmlContent.replace(/href="pages\//g, `href="${rootPrefix}pages/`);
                htmlContent = htmlContent.replace(/src="images\//g, `src="${rootPrefix}images/`);
                htmlContent = htmlContent.replace(/href="\.\.\//g, `href="${rootPrefix}../`);
            }

            container.innerHTML = htmlContent;
        });

        // Chờ tất cả Header, Sidebar, Footer được fetch và tiêm vào DOM hoàn tất
        await Promise.all(fetchPromises);

        // 5. Sau khi mọi thứ đã sẵn sàng 100%, kích hoạt sự kiện active menu
        const layoutLoadedEvent = new CustomEvent('layoutLoaded');
        document.dispatchEvent(layoutLoadedEvent);

        // 6. Cho toàn bộ trang hiện lên mượt mà cùng một thời điểm (Fade-in)
        document.body.style.opacity = "1";

    } catch (error) {
        console.error("Lỗi khi đồng bộ layout hệ thống:", error);
        // Đề phòng lỗi vẫn cho hiện trang để người dùng không bị kẹt màn hình trắng
        document.body.style.opacity = "1";
    }
});