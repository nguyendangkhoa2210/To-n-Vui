
(function () {
    const USAGE_API = 'api/usage.php';
    const HEARTBEAT_MS = 60 * 1000;

    let timer = null;
    let started = false;

    // ---------------- CSS: màn hình khóa ----------------
    const style = document.createElement('style');
    style.textContent = `
    #mu-usage-lock {
        display: none; position: fixed; inset: 0; z-index: 9999;
        align-items: center; justify-content: center; text-align: center;
        background: linear-gradient(135deg, #0f172a, #1e293b);
        padding: 24px;
    }
    #mu-usage-lock.open { display: flex; }
    #mu-usage-lock .mu-ul-box {
        max-width: 420px; background: #fff; border-radius: var(--r-lg, 16px);
        padding: 32px 28px; box-shadow: var(--shadow-md);
    }
    #mu-usage-lock .mu-ul-icon { font-size: 3.2rem; margin-bottom: 10px; }
    #mu-usage-lock .mu-ul-title {
        font-family: var(--font-display); font-weight: 800; font-size: 1.25rem;
        margin-bottom: 8px; color: var(--text);
    }
    #mu-usage-lock .mu-ul-sub { font-size: 0.92rem; color: var(--text-2, #555); line-height: 1.5; }
    `;
    document.head.appendChild(style);

    function ensureLockScreen() {
        if (document.getElementById('mu-usage-lock')) return;
        const el = document.createElement('div');
        el.id = 'mu-usage-lock';
        el.innerHTML = `
          <div class="mu-ul-box">
            <div class="mu-ul-icon">⏳</div>
            <div class="mu-ul-title">Hôm nay học vậy là đủ rồi!</div>
            <div class="mu-ul-sub" id="mu-ul-sub">Bố mẹ đã đặt giới hạn thời gian học mỗi ngày.
              Hẹn gặp lại vào ngày mai nhé! 🌙</div>
          </div>`;
        document.body.appendChild(el);
    }

    function showLock(state) {
        ensureLockScreen();
        const sub = document.getElementById('mu-ul-sub');
        if (sub && state && state.gioi_han_phut_ngay) {
            sub.textContent = `Bố mẹ đặt giới hạn ${state.gioi_han_phut_ngay} phút/ngày, hôm nay em đã học đủ rồi. Hẹn gặp lại vào ngày mai nhé! 🌙`;
        }
        document.getElementById('mu-usage-lock').classList.add('open');
        stopTimer();
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    async function callApi(action, method) {
        try {
            const res = await fetch(`${USAGE_API}?action=${action}`, { method });
            const json = await res.json();
            return json && json.ok ? json : null;
        } catch (e) {
            return null; // mất mạng tạm thời -> bỏ qua nhịp này, không khóa oan
        }
    }

    async function tick() {
        if (document.visibilityState !== 'visible') return; // rời tab -> không tính phút
        const state = await callApi('heartbeat', 'POST');
        if (state && state.is_locked) showLock(state);
    }

    window.MU_USAGE = {
        async start() {
            if (started) return; // tránh gắn 2 lần nếu onAuthenticated chạy lại
            started = true;
            // Kiểm tra ngay lúc vào app: có thể học sinh đã đạt giới hạn từ
            // trước (mở lại tab / F5) -> khóa luôn, không cần chờ đủ 60 giây.
            const state = await callApi('status', 'GET');
            if (state && state.is_locked) {
                showLock(state);
                return;
            }
            timer = setInterval(tick, HEARTBEAT_MS);
        },
        stop() {
            started = false;
            stopTimer();
        },
    };
})();
