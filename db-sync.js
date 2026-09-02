(function () {
    const API_URL = 'api/sync.php';
    const KEY_PREFIX_RE = /^(mu_|mathuniverse_)/;
    const DEVICE_ID_KEY = 'mu_device_id';

   
    const _origSetItem = Storage.prototype.setItem;

    let applyingRemote = false; 
    let pushTimer = null;
    let dbOnline = null;       

    window.MU_DB_STATUS = { online: null };

    function getDeviceId() {
        return localStorage.getItem(DEVICE_ID_KEY);
    }

    function collectLocalState() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (KEY_PREFIX_RE.test(key) && key !== DEVICE_ID_KEY) {
                data[key] = localStorage.getItem(key);
            }
        }
        return data;
    }

    async function pushToServer() {
        const deviceId = getDeviceId();
        if (!deviceId) return; 
        try {
            const res = await fetch(`${API_URL}?action=push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_id: deviceId, data: collectLocalState() }),
            });
            const json = await res.json().catch(() => ({ ok: false }));
            setDbOnline(res.ok && json.ok === true);
        } catch (e) {
            setDbOnline(false);
        }
    }

    function schedulePush() {
        clearTimeout(pushTimer);
        pushTimer = setTimeout(pushToServer, 700);
    }

    // QUAN TRỌNG — có retry (giống pushNow ở logout()) vì đây là bước PHỤC HỒI
    // dữ liệu (bạn thú, huy hiệu...) ngay sau khi clearLocalAppData() đã xoá
    // sạch dữ liệu cũ lúc đổi tài khoản (xem onAuthenticated() trong auth-ui.js).
    // Nếu mạng chậm/lag đúng lúc này mà không thử lại, request pull thất bại
    // âm thầm -> local trống trơn -> nhìn như "mất bạn thú" dù server vẫn còn
    // nguyên (bảng device_state), và không có gì tự retry cho tới lần
    // 'online'/visibilitychange kế tiếp.
    async function pullFromServer(retriesLeft) {
        if (retriesLeft === undefined) retriesLeft = 2;
        const deviceId = getDeviceId();
        if (!deviceId) return false;
        try {
            const res = await fetch(`${API_URL}?action=pull&device_id=${encodeURIComponent(deviceId)}`);
            const json = await res.json().catch(() => ({ ok: false }));
            if (!res.ok || json.ok !== true) {
                if (retriesLeft > 0) {
                    await new Promise((r) => setTimeout(r, 500));
                    return pullFromServer(retriesLeft - 1);
                }
                setDbOnline(false);
                return false;
            }
            setDbOnline(true);

            applyingRemote = true;
            Object.entries(json.data || {}).forEach(([key, value]) => {
                if (value === null || value === undefined) return;
                _origSetItem.call(localStorage, key, value);
            });
            applyingRemote = false;

            refreshUI();
            return true;
        } catch (e) {
            if (retriesLeft > 0) {
                await new Promise((r) => setTimeout(r, 500));
                return pullFromServer(retriesLeft - 1);
            }
            setDbOnline(false);
            return false;
        }
    }

    function refreshUI() {

        const fns = [
            'renderBookmarkList', 'renderRecentList', 'syncBookmarkButtons',
            'refreshHighScores', 'updateWelcomeDashboard',
            'checkAndRenderBadges', 'renderLeaderboard', 'refreshForestBadge',
        ];
        fns.forEach((name) => {
            try { if (typeof window[name] === 'function') window[name](); } catch (e) { /* bỏ qua */ }
        });
    }

    // ---- Điểm hook duy nhất: ghi đè Storage.prototype.setItem ----
    Storage.prototype.setItem = function (key, value) {
        _origSetItem.apply(this, arguments);
        if (this === localStorage && !applyingRemote && KEY_PREFIX_RE.test(key) && key !== DEVICE_ID_KEY) {
            schedulePush();
        }
    };

    function setDbOnline(v) {
        if (dbOnline === v) return;
        dbOnline = v;
        window.MU_DB_STATUS.online = v;
        renderStatusBadge();
    }

    

  
    window.MU_DB = {
        setDeviceId(id) { _origSetItem.call(localStorage, DEVICE_ID_KEY, id); },
        clearDeviceId() { localStorage.removeItem(DEVICE_ID_KEY); },
        hasDeviceId: () => !!getDeviceId(),
        pullNow: pullFromServer,
        pushNow: pushToServer,
    };


    window.addEventListener('online', () => { if (getDeviceId()) pullFromServer(); });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && getDeviceId()) pullFromServer();
        // Rời tab (chuyển app khác / thu nhỏ / sắp đóng) -> tranh thủ đẩy nốt
        // dữ liệu chưa kịp push (đề phòng bé đóng máy ngay sau khi làm bài,
        // không chờ được 700ms debounce hay không kịp bấm "Đăng xuất").
        if (document.visibilityState === 'hidden') beaconPush();
    });
    window.addEventListener('pagehide', beaconPush);

    function beaconPush() {
        const deviceId = getDeviceId();
        if (!deviceId || !navigator.sendBeacon) return;
        try {
            const payload = JSON.stringify({ device_id: deviceId, data: collectLocalState() });
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(`${API_URL}?action=push`, blob);
        } catch (e) { /* bỏ qua, best-effort thôi */ }
    }
})();