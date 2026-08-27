
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

    async function pullFromServer() {
        const deviceId = getDeviceId();
        if (!deviceId) return;
        try {
            const res = await fetch(`${API_URL}?action=pull&device_id=${encodeURIComponent(deviceId)}`);
            const json = await res.json().catch(() => ({ ok: false }));
            if (!res.ok || json.ok !== true) { setDbOnline(false); return; }
            setDbOnline(true);

            applyingRemote = true;
            Object.entries(json.data || {}).forEach(([key, value]) => {
                if (value === null || value === undefined) return;
                _origSetItem.call(localStorage, key, value);
            });
            applyingRemote = false;

            refreshUI();
        } catch (e) {
            setDbOnline(false);
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

    function renderStatusBadge() {
        let el = document.getElementById('mu-db-status');
        if (!el) {
            el = document.createElement('div');
            el.id = 'mu-db-status';
            el.style.cssText =
                'position:fixed;bottom:12px;right:12px;z-index:99999;font-size:12px;' +
                'padding:6px 12px;border-radius:20px;font-family:inherit;' +
                'box-shadow:0 2px 8px rgba(0,0,0,.18);cursor:default;transition:opacity .2s;';
            document.body.appendChild(el);
        }
        if (dbOnline) {
            el.textContent = '🟢 Đã kết nối MySQL (XAMPP)';
            el.style.background = '#d5f5e3';
            el.style.color = '#1e7e34';
        } else {
            el.textContent = '🟡 Ngoại tuyến — đang dùng dữ liệu máy này';
            el.style.background = '#fff3cd';
            el.style.color = '#856404';
        }
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
    });
})();
