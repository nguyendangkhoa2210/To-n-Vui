// ================================================================
// ================= ĐĂNG KÝ SERVICE WORKER (PWA) =================
// ================================================================
// Cho phép cài đặt web như ứng dụng và chạy được khi mất mạng.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .catch((err) => console.warn('Không thể đăng ký Service Worker:', err));
    });
}


