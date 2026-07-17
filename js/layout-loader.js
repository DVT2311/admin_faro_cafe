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


// Bổ sung vào file js/layout-loader.js hoặc file js dùng chung sau khi load xong component sidebar
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        // Kiểm tra xem trang hiện tại đang nằm ở cấp mấy (dựa vào số lượng dấu / trong pathname)
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        
        // Nếu đang ở trang chủ (index.html hoặc root domain)
        let depth = pathSegments.length;
        if (window.location.pathname.endsWith('index.html') || pathSegments.length === 0) {
            depth = 0;
        } else if (pathSegments.includes('pages')) {
            // Tính số cấp sâu kể từ thư mục pages
            const pagesIdx = pathSegments.indexOf('pages');
            depth = pathSegments.length - pagesIdx; 
        }

        // Tự động tinh chỉnh lại href cho các thẻ a trong sidebar
        const links = sidebar.querySelectorAll('a');
        links.forEach(link => {
            let originalHref = link.getAttribute('href');
            if (!originalHref) return;

            // Xóa bỏ các ký tự lùi thư mục cũ nếu có để chuẩn hóa lại từ đầu
            let cleanPath = originalHref.replace(/^(\.\.\/)+/, '').replace(/^\/+/, '');
            
            // Xây dựng lại đường dẫn chính xác dựa trên độ sâu thực tế
            let prefix = '';
            for (let i = 0; i < depth - 1; i++) {
                prefix += '../';
            }
            
            link.setAttribute('href', prefix + cleanPath);
        });
    }, 100);
});