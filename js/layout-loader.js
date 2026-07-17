document.addEventListener("DOMContentLoaded", async function () {
    try {
        // 1. Ẩn tạm thời body để tránh chớp giật giao diện khi load layout
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.2s ease-in-out";

        // 2. Tự động xác định Base Path chuẩn xác cho mọi môi trường (Local vs GitHub Pages)
        const pathname = window.location.pathname;
        const pathSegments = pathname.split('/').filter(Boolean);
        
        let repoPrefix = "";
        // Nếu chạy trên GitHub Pages (có chứa tên repository trên URL, và không phải localhost)
        if (window.location.hostname.includes('github.io') && pathSegments.length > 0) {
            // Lấy tên repository làm gốc (ví dụ: /admin-faro-cafe/)
            repoPrefix = "/" + pathSegments[0];
        }

        // 3. Tính toán độ sâu (depth) hiện tại của trang so với thư mục gốc
        let depth = 0;
        const pagesIndex = pathSegments.indexOf('pages');
        if (pagesIndex !== -1) {
            // Độ sâu được tính bằng số cấp nằm sâu bên trong thư mục pages
            depth = pathSegments.length - (pagesIndex + 1);
        }
        
        // Tạo tiền tố lùi thư mục tương đối (VD: "", "../", "../../")
        const relativePrefix = "../".repeat(depth);

        // 4. Danh sách các component cần load
        const components = [
            { id: 'header-container', file: 'components/header.html' },
            { id: 'sidebar-container', file: 'components/sidebar.html' },
            { id: 'footer-container', file: 'components/footer.html' }
        ];

        // 5. Fetch đồng thời tất cả các component bằng đường dẫn gốc tuyệt đối an toàn tuyệt đối
        const fetchPromises = components.map(async (comp) => {
            const container = document.getElementById(comp.id);
            if (!container) return;

            // Xây dựng đường dẫn fetch chuẩn xác: [RepoPrefix] + [RelativePrefix] + [File]
            // Ví dụ trên Git: /admin-faro-cafe/ + ../ + components/header.html
            // Ví dụ trên Local: "" + ../ + components/header.html
            let pathToComponent = repoPrefix + "/" + relativePrefix + comp.file;
            // Làm sạch các dấu gạch chéo kép nếu có (//)
            pathToComponent = pathToComponent.replace(/\/+/g, '/');
            // Đảm bảo bắt đầu bằng dấu / nếu chạy trên git, hoặc giữ nguyên nếu local
            if (repoPrefix !== "") {
                pathToComponent = repoPrefix + "/" + relativePrefix.replace(/^\.\.\//g, (match, offset, string) => {
                    // Xử lý lùi cấp nếu cần thiết cho đường dẫn tuyệt đối
                    return "../".repeat(depth);
                });
                // Cách an toàn nhất cho fetch: dùng trực tiếp relativePrefix + comp.file khi đã ở đúng context, 
                // nhưng để chắc chắn không lệch trên GitHub Pages, ta dùng đường dẫn tuyệt đối gốc:
            }

            // Dùng cách kết hợp an toàn nhất cho cả 2 môi trường:
            let finalFetchPath = relativePrefix + comp.file;

            const response = await fetch(finalFetchPath);
            if (!response.ok) {
                throw new Error(`Không thể tải component tại: ${finalFetchPath}`);
            }
            let htmlContent = await response.text();

            // 6. Chuẩn hóa lại toàn bộ đường dẫn bên trong component (link, ảnh, trang chủ)
            if (depth > 0) {
                htmlContent = htmlContent.replace(/href="pages\//g, `href="${relativePrefix}pages/`);
                htmlContent = htmlContent.replace(/src="images\//g, `src="${relativePrefix}images/`);
                htmlContent = htmlContent.replace(/href="index\.html"/g, `href="${relativePrefix}index.html"`);
            } else {
                htmlContent = htmlContent.replace(/href="pages\//g, `href="pages/`);
                htmlContent = htmlContent.replace(/src="images\//g, `src="images/`);
                htmlContent = htmlContent.replace(/href="index\.html"/g, `href="index.html"`);
            }

            container.innerHTML = htmlContent;
        });

        await Promise.all(fetchPromises);

        // 7. Phát sự kiện layout đã load thành công để kích hoạt active menu và các sự kiện khác
        document.dispatchEvent(new CustomEvent('layoutLoaded'));
        document.body.style.opacity = "1";

    } catch (error) {
        console.error("Lỗi layout loader:", error);
        document.body.style.opacity = "1";
    }
});