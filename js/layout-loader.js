document.addEventListener("DOMContentLoaded", async function () {
    try {
        document.body.style.opacity = "0";
        document.body.style.transition = "opacity 0.2s ease-in-out";

        // 1. Tự động nhận diện Base URL (Hỗ trợ cả Localhost lẫn GitHub Pages có tên Repo)
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        const pathSegments = pathname.split('/').filter(Boolean);

        let repoBase = "";
        if (hostname.includes('github.io')) {
            // Nếu dùng User/Organization Pages dạng dvt2311.github.io mà project nằm ở sub-folder (repo name)
            // Kiểm tra xem phân đoạn đầu tiên có phải là tên repo hay là chữ 'pages'
            if (pathSegments.length > 0 && pathSegments[0] !== 'pages') {
                repoBase = "/" + pathSegments[0];
            }
        }

        // 2. Tính toán độ sâu (depth) để fetch component chính xác
        let depth = 0;
        const pagesIndex = pathSegments.indexOf('pages');
        if (pagesIndex !== -1) {
            depth = pathSegments.length - (pagesIndex + 1);
        }
        const relativePrefix = "../".repeat(depth);

        // 3. Load components đồng thời
        const components = [
            { id: 'header-container', file: 'components/header.html' },
            { id: 'sidebar-container', file: 'components/sidebar.html' },
            { id: 'footer-container', file: 'components/footer.html' }
        ];

        const fetchPromises = components.map(async (comp) => {
            const container = document.getElementById(comp.id);
            if (!container) return;

            const response = await fetch(relativePrefix + comp.file);
            if (!response.ok) throw new Error(`Không thể tải ${comp.file}`);
            let htmlContent = await response.text();

            // 4. CHUẨN HÓA TOÀN BỘ ĐƯỜNG DẪN THÀNH TUYỆT ĐỐI TỪ GỐC (Bắt đầu bằng repoBase hoặc /)
            // Thay vì dùng ../ dễ lệch, ta ép mọi link trỏ về đúng gốc của dự án
            const absoluteRoot = repoBase === "" ? "" : repoBase;

            if (depth > 0) {
                htmlContent = htmlContent.replace(/href="pages\//g, `href="${absoluteRoot}/pages/`);
                htmlContent = htmlContent.replace(/src="images\//g, `src="${absoluteRoot}/images/`);
                htmlContent = htmlContent.replace(/href="index\.html"/g, `href="${absoluteRoot}/index.html"`);
            } else {
                htmlContent = htmlContent.replace(/href="pages\//g, `href="${absoluteRoot}pages/`);
                htmlContent = htmlContent.replace(/src="images\//g, `src="${absoluteRoot}images/`);
                htmlContent = htmlContent.replace(/href="index\.html"/g, `href="${absoluteRoot}index.html"`);
            }

            // Làm sạch các lỗi double slash //
            htmlContent = htmlContent.replace(/([^:]\/)\/+/g, "$1");

            container.innerHTML = htmlContent;
        });

        await Promise.all(fetchPromises);

        document.dispatchEvent(new CustomEvent('layoutLoaded'));
        document.body.style.opacity = "1";

    } catch (error) {
        console.error("Lỗi layout loader:", error);
        document.body.style.opacity = "1";
    }
});