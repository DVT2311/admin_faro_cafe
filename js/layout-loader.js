document.addEventListener("DOMContentLoaded", async function () {
    try {
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.2s ease-in-out";

        const pathname = window.location.pathname;
        const pathSegments = pathname.split('/').filter(Boolean);
        
        // Tính toán độ sâu (depth) chuẩn xác dựa vào vị trí xuất hiện của chữ 'pages'
        let depth = 0;
        const pagesIndex = pathSegments.indexOf('pages');
        if (pagesIndex !== -1) {
            depth = pathSegments.length - (pagesIndex + 1);
        }
        
        // Tạo tiền tố lùi cấp (VD: "", "../", "../../")
        const rootPrefix = "../".repeat(depth);

        // Danh sách các component cần load
        const components = [
            { id: 'header-container', file: 'components/header.html' },
            { id: 'sidebar-container', file: 'components/sidebar.html' },
            { id: 'footer-container', file: 'components/footer.html' }
        ];

        const fetchPromises = components.map(async (comp) => {
            const container = document.getElementById(comp.id);
            if (!container) return;

            // Đường dẫn fetch kết hợp rootPrefix đảm bảo đúng vị trí dù ở thư mục con cấp mấy
            const pathToComponent = rootPrefix + comp.file;
            
            const response = await fetch(pathToComponent);
            if (!response.ok) {
                throw new Error(`Không thể tải component tại: ${pathToComponent}`);
            }
            let htmlContent = await response.text();

            // Chuẩn hóa lại các đường dẫn bên trong component cho khớp ngữ cảnh trang hiện tại
            if (depth > 0) {
                htmlContent = htmlContent.replace(/href="pages\//g, `href="${rootPrefix}pages/`);
                htmlContent = htmlContent.replace(/src="images\//g, `src="${rootPrefix}images/`);
                htmlContent = htmlContent.replace(/href="index\.html"/g, `href="${rootPrefix}index.html"`);
            } else {
                htmlContent = htmlContent.replace(/href="pages\//g, `href="pages/`);
                htmlContent = htmlContent.replace(/src="images\//g, `src="images/`);
                htmlContent = htmlContent.replace(/href="index\.html"/g, `href="index.html"`);
            }

            container.innerHTML = htmlContent;
        });

        await Promise.all(fetchPromises);

        // Phát sự kiện thông báo layout đã load thành công
        document.dispatchEvent(new CustomEvent('layoutLoaded'));
        document.body.style.opacity = "1";

    } catch (error) {
        console.error("Lỗi layout loader:", error);
        document.body.style.opacity = "1";
    }
});