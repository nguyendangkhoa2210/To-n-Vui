
(function () {
    const AUTH_URL = 'api/auth.php';
    const PARENT_API = 'api/parent.php';
    const APP_KEY_RE = /^(mu_|mathuniverse_)/;

    let childrenCache = [];
    let currentDisplayName = '';

    // ---------------- Tiện ích chung ----------------
    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }
    function initials(name) {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        const last = parts[parts.length - 1][0] || '';
        return last.toUpperCase();
    }
    function fmtDate(s) {
        if (!s) return '—';
        const d = new Date(String(s).replace(' ', 'T'));
        if (isNaN(d)) return '—';
        return d.toLocaleDateString('vi-VN');
    }
    let toastTimer;
    function showToast(msg, type) {
        const t = document.getElementById('pd-toast');
        if (!t) return;
        t.textContent = msg;
        t.className = 'pd-toast show' + (type === 'error' ? ' error' : '');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
    }

   
    const CHILD_COLORS = ['#4e9b55', '#4f78c7', '#d9788f', '#d9903d', '#8a78b7', '#2f9f8f'];
    function childColor(id) {
        const n = Math.abs(parseInt(id, 10) || 0);
        return CHILD_COLORS[n % CHILD_COLORS.length];
    }

    // ---------------- Xác thực: trang này CHỈ dành cho Phụ Huynh ----------------
    async function checkParentSession() {
        try {
            const res = await fetch(`${AUTH_URL}?action=me`);
            const json = await res.json();
            if (!json.ok || !json.logged_in) {
                // Chưa đăng nhập -> quay lại trang đăng nhập.
                window.location.href = 'index.html';
                return;
            }
            if (json.role !== 'parent') {
                // Tài khoản học sinh lỡ vào nhầm URL này -> đưa về app học.
                window.location.href = 'index.html';
                return;
            }
            currentDisplayName = json.display_name || 'Phụ huynh';
            renderUserWidget(currentDisplayName);
            document.getElementById('pd-loading').style.display = 'none';
            document.getElementById('pd-page').style.display = '';
            loadChildren();
        } catch (e) {
            document.getElementById('pd-loading').style.display = 'none';
            const fatal = document.getElementById('pd-fatal');
            fatal.style.display = 'flex';
            fatal.innerHTML = '⚠️ Không kết nối được máy chủ.<br>Kiểm tra Apache/MySQL trong XAMPP đã bật chưa, rồi <a href="parent.html">thử lại</a>.';
        }
    }

    function renderUserWidget(name) {
        const widget = document.getElementById('pd-user-widget');
        widget.style.display = '';
        document.getElementById('pd-user-av').textContent = initials(name);
        document.getElementById('pd-user-label').textContent = name;

        document.getElementById('pd-user-chip').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('pd-user-dropdown').classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            const dd = document.getElementById('pd-user-dropdown');
            if (dd && !widget.contains(e.target)) dd.classList.remove('open');
        });
        document.getElementById('pd-logout-btn').addEventListener('click', logout);
    }

    async function logout() {
        try { await fetch(`${AUTH_URL}?action=logout`, { method: 'POST' }); } catch (e) { /* vẫn đăng xuất cục bộ nếu mất mạng */ }
        try {
            Object.keys(localStorage).forEach((k) => { if (APP_KEY_RE.test(k)) localStorage.removeItem(k); });
        } catch (e) { /* localStorage có thể bị chặn, bỏ qua */ }
        window.location.href = 'index.html';
    }

    // ---------------- Tải & vẽ danh sách các con ----------------
    async function loadChildren() {
        const grid = document.getElementById('pd-card-grid');
        try {
            const res = await fetch(`${PARENT_API}?action=children`);
            const json = await res.json();
            if (!json.ok) {
                grid.innerHTML = `<div class="pd-empty">⚠️ ${escapeHtml(json.error || 'Không tải được danh sách con.')}</div>`;
                return;
            }
            childrenCache = json.data || [];
            renderCardGrid();
            // Nếu đang mở chi tiết 1 con (VD sau khi lưu cài đặt) -> vẽ lại
            // đúng dữ liệu mới nhất thay vì quay về danh sách.
            const openId = document.getElementById('pd-view-detail').dataset.openId;
            if (openId) {
                const child = childrenCache.find((c) => String(c.id) === String(openId));
                if (child) renderDetail(child); else showListView();
            }
        } catch (e) {
            grid.innerHTML = '<div class="pd-empty">⚠️ Không kết nối được máy chủ.</div>';
        }
    }

    function renderCardGrid() {
        const grid = document.getElementById('pd-card-grid');
        const sub = document.getElementById('pd-list-sub');
        if (!childrenCache.length) {
            sub.textContent = 'Chưa có con nào — tạo tài khoản đầu tiên cho con ngay bên dưới.';
            grid.innerHTML = '<div class="pd-empty">👋 Bấm "+ Tạo Tài Khoản Cho Con" ở trên để bắt đầu theo dõi việc học của con.</div>';
            return;
        }
        sub.textContent = 'Bấm vào 1 con để xem chi tiết tiến độ và cài đặt.';
        grid.innerHTML = childrenCache.map((c) => {
            const color = childColor(c.id);
            const limit = c.gioi_han_phut_ngay;
            const today = c.so_phut_hom_nay || 0;
            const over = limit && today >= limit;
            const timeBadge = limit
                ? `<span class="pd-badge ${over ? 'time-over' : 'time-ok'}">⏱️ ${today}/${limit} phút</span>`
                : `<span class="pd-badge time-ok">⏱️ ${today} phút hôm nay</span>`;
            const gradeBadge = c.khoi_lop_phu_huynh_dat
                ? `<span class="pd-badge grade">🔒 Lớp ${c.khoi_lop_phu_huynh_dat}</span>`
                : `<span class="pd-badge grade free">🎒 Tự chọn lớp</span>`;
            return `
              <button type="button" class="pd-child-card" data-id="${c.id}">
                <div class="pd-child-card-top">
                    <div class="pd-av-lg" style="background:${color};">${escapeHtml(initials(c.ten_hien_thi))}</div>
                    <div>
                        <div class="pd-cname">${escapeHtml(c.ten_hien_thi)}</div>
                        <div class="pd-cuname">@${escapeHtml(c.username)}</div>
                    </div>
                </div>
                <div class="pd-child-card-stats">
                    <span>📖 <b>${c.so_ct_hom_nay}</b></span>
                    <span>📝 <b>${c.so_quiz_hom_nay}</b></span>
                </div>
                <div class="pd-child-card-badges">${gradeBadge}${timeBadge}</div>
              </button>`;
        }).join('');

        grid.querySelectorAll('.pd-child-card').forEach((card) => {
            card.addEventListener('click', () => {
                const child = childrenCache.find((c) => String(c.id) === card.dataset.id);
                if (child) renderDetail(child);
            });
        });
    }

    // ---------------- Xem chi tiết 1 con: chỉ hiện khi con đó được chọn ----------------
    function showListView() {
        document.getElementById('pd-view-detail').style.display = 'none';
        document.getElementById('pd-view-detail').removeAttribute('data-open-id');
        document.getElementById('pd-view-list').style.display = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderDetail(c) {
        document.getElementById('pd-view-list').style.display = 'none';
        const detailView = document.getElementById('pd-view-detail');
        detailView.style.display = '';
        detailView.dataset.openId = c.id;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const lockedGrade = c.khoi_lop_phu_huynh_dat;
        // Số công thức của TỪNG khối lớp (phải khớp GRADE_TOPICS trong curriculum.js —
        // parent.html không nạp curriculum.js nên không tính động được, phải cập nhật tay
        // nếu sau này thêm/bớt bài học).
        const GRADE_TOTALS = { 1: 8, 2: 6, 3: 6, 4: 6, 5: 6 };
        // Con bị khoá cứng 1 khối lớp -> tính trên đúng khối đó.
        // Con chưa bị khoá (được tự chọn lớp) -> không biết đang học khối nào, tạm lấy tổng cả 5 khối.
        const TOTAL = lockedGrade ? GRADE_TOTALS[lockedGrade] : Object.values(GRADE_TOTALS).reduce((a, b) => a + b, 0);
        const color = childColor(c.id);
        const limit = c.gioi_han_phut_ngay;
        const today = c.so_phut_hom_nay || 0;
        const over = limit && today >= limit;
        const pct = Math.min(100, Math.round((c.so_ct_da_hoc / TOTAL) * 100));
        const gradeOptionsHtml = [1, 2, 3, 4, 5].map((g) =>
            `<option value="${g}"${lockedGrade === g ? ' selected' : ''}>Lớp ${g}</option>`
        ).join('');

        document.getElementById('pd-detail-content').innerHTML = `
          <div class="pd-detail-header">
            <div class="pd-detail-header-left">
                <div class="pd-av-xl" style="background:${color};">${escapeHtml(initials(c.ten_hien_thi))}</div>
                <div>
                    <h1>${escapeHtml(c.ten_hien_thi)}</h1>
                    <div class="pd-uname">@${escapeHtml(c.username)}</div>
                </div>
            </div>
            ${lockedGrade
                ? `<span class="pd-badge grade" style="font-size:12.5px;padding:6px 13px;">🔒 Lớp ${lockedGrade} — do bạn khoá</span>`
                : `<span class="pd-badge grade free" style="font-size:12.5px;padding:6px 13px;">🎒 Con tự chọn lớp</span>`}
          </div>

          <div class="pd-section-label">Hôm nay</div>
          <div class="pd-stat-row">
            <div class="pd-stat-card"><span class="pd-icon">📖</span><div class="pd-num">${c.so_ct_hom_nay}</div><div class="pd-lbl">Công thức mới đã học</div></div>
            <div class="pd-stat-card"><span class="pd-icon">📝</span><div class="pd-num">${c.so_quiz_hom_nay}</div><div class="pd-lbl">Lượt luyện tập</div></div>
            <div class="pd-stat-card limit${over ? ' over' : ''}">
                <span class="pd-icon">⏱️</span>
                <div class="pd-num">${today}${limit ? `<small>/${limit}p</small>` : '<small>p</small>'}</div>
                <div class="pd-lbl">${over ? 'Đã hết giờ hôm nay' : (limit ? 'Thời gian học hôm nay' : 'Thời gian học hôm nay — chưa đặt giới hạn')}</div>
                ${limit ? `<div class="pd-bar-track"><div class="pd-bar-fill" style="width:${Math.min(100, Math.round((today / limit) * 100))}%;"></div></div>` : ''}
            </div>
          </div>

          <div class="pd-progress-card">
            <h3>🏆 Tổng tiến độ học tập</h3>
            <div class="pd-progress-track"><div class="pd-progress-fill" style="width:${pct}%;"></div></div>
            <div class="pd-progress-foot"><span>Đã học <span class="pd-n">${c.so_ct_da_hoc}</span>/${TOTAL} công thức</span><span class="pd-n">${pct}%</span></div>
            <div class="pd-mini-stats">
                <div><b>${c.so_lan_quiz}</b>lần làm Quiz</div>
                <div><b>${c.diem_cao_nhat !== null && c.diem_cao_nhat !== undefined ? c.diem_cao_nhat + '/10' : '—'}</b>điểm cao nhất</div>
                <div><b>${fmtDate(c.lan_gan_nhat)}</b>lần học gần nhất</div>
            </div>
          </div>

          <div class="pd-section-label">Cài đặt cho ${escapeHtml(c.ten_hien_thi)}</div>
          <div class="pd-settings-grid">
            <div class="pd-settings-card">
                <h4>🎒 Khối lớp</h4>
                <p>Khoá lớp học để con không tự đổi được — hoặc để trống cho con tự chọn.</p>
                <div class="pd-settings-row">
                    <select id="pd-grade-input">
                        <option value="0"${!lockedGrade ? ' selected' : ''}>— Để con tự chọn —</option>
                        ${gradeOptionsHtml}
                    </select>
                    <button type="button" class="pd-btn-primary" id="pd-grade-save-btn">Lưu</button>
                </div>
                ${lockedGrade ? `<span class="pd-locked-tag">🔒 Đang khoá Lớp ${lockedGrade}</span>` : ''}
            </div>
            <div class="pd-settings-card">
                <h4>⏳ Giới hạn học/ngày</h4>
                <p>Tự động khoá màn hình khi con học đủ số phút đã đặt trong ngày.</p>
                <div class="pd-settings-row">
                    <input type="number" min="0" max="1440" step="5" id="pd-limit-input" placeholder="phút" value="${limit || ''}">
                    <button type="button" class="pd-btn-primary" id="pd-limit-save-btn">Lưu</button>
                </div>
                <button type="button" class="pd-danger-link" id="pd-unlink-btn">Bỏ liên kết tài khoản này</button>
            </div>
          </div>`;

        document.getElementById('pd-back-btn').onclick = showListView;
        document.getElementById('pd-grade-save-btn').onclick = () => saveGrade(c.id);
        document.getElementById('pd-limit-save-btn').onclick = () => saveLimit(c.id);
        document.getElementById('pd-unlink-btn').onclick = () => unlinkChild(c.id, c.ten_hien_thi);
    }

    // ---------------- Đặt / bỏ khoá khối lớp ----------------
    async function saveGrade(id) {
        const select = document.getElementById('pd-grade-input');
        const grade = parseInt(select.value, 10) || 0;
        try {
            const res = await fetch(`${PARENT_API}?action=set_grade`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, grade }),
            });
            const json = await res.json();
            if (!json.ok) { showToast(json.error || 'Không lưu được khối lớp.', 'error'); return; }
            showToast(grade > 0 ? `Đã khoá Lớp ${grade} cho con.` : 'Đã bỏ khoá — con tự chọn lớp lại được.');
            loadChildren();
        } catch (e) { showToast('Không kết nối được máy chủ.', 'error'); }
    }

    // ---------------- Đặt / bỏ giới hạn phút học/ngày ----------------
    async function saveLimit(id) {
        const input = document.getElementById('pd-limit-input');
        const raw = input.value.trim();
        const minutes = raw === '' ? 0 : parseInt(raw, 10);
        if (isNaN(minutes) || minutes < 0 || minutes > 1440) {
            showToast('Nhập số phút từ 0 đến 1440 (24 giờ).', 'error');
            return;
        }
        try {
            const res = await fetch(`${PARENT_API}?action=set_limit`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, minutes }),
            });
            const json = await res.json();
            if (!json.ok) { showToast(json.error || 'Không lưu được giới hạn.', 'error'); return; }
            showToast(minutes > 0 ? `Đã đặt giới hạn ${minutes} phút/ngày.` : 'Đã bỏ giới hạn.');
            loadChildren();
        } catch (e) { showToast('Không kết nối được máy chủ.', 'error'); }
    }

    // ---------------- Bỏ liên kết 1 con ----------------
    async function unlinkChild(id, name) {
        if (!confirm(`Bỏ liên kết "${name}"? Bạn sẽ không xem được tiến độ học của con nữa (không xoá tài khoản/dữ liệu học của con).`)) return;
        try {
            const res = await fetch(`${PARENT_API}?action=unlink_child`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const json = await res.json();
            if (!json.ok) { showToast(json.error || 'Không bỏ liên kết được.', 'error'); return; }
            showToast(`Đã bỏ liên kết ${name}.`);
            showListView();
            loadChildren();
        } catch (e) { showToast('Không kết nối được máy chủ.', 'error'); }
    }

    // ---------------- Panel: Tạo tài khoản mới / Liên kết tài khoản đã có ----------------
    function initPanel() {
        const backdrop = document.getElementById('pd-panel-backdrop');
        const openBtn = document.getElementById('pd-open-create-btn');
        const closeBtn = document.getElementById('pd-panel-close');
        const tabs = document.querySelectorAll('.pd-panel-tab');
        const createForm = document.getElementById('pd-create-form');
        const linkForm = document.getElementById('pd-link-form');

        function openPanel() { backdrop.classList.add('open'); }
        function closePanel() {
            backdrop.classList.remove('open');
            createForm.reset(); linkForm.reset();
            document.getElementById('pd-create-error').classList.remove('show');
            document.getElementById('pd-link-error').classList.remove('show');
        }
        openBtn.addEventListener('click', openPanel);
        closeBtn.addEventListener('click', closePanel);
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closePanel(); });

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                tabs.forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');
                const mode = tab.dataset.panelMode;
                createForm.style.display = mode === 'create' ? '' : 'none';
                linkForm.style.display = mode === 'link' ? '' : 'none';
            });
        });

        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('pd-create-error');
            errEl.classList.remove('show');
            const display_name = document.getElementById('pd-create-display').value.trim();
            const username = document.getElementById('pd-create-username').value.trim();
            const password = document.getElementById('pd-create-password').value;
            try {
                const res = await fetch(`${PARENT_API}?action=create_child`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ display_name, username, password }),
                });
                const json = await res.json();
                if (!json.ok) { errEl.textContent = json.error || 'Có lỗi xảy ra.'; errEl.classList.add('show'); return; }
                closePanel();
                showToast(`Đã tạo tài khoản cho ${json.display_name}! Cho con dùng "${json.username}" để đăng nhập nhé. 🎉`);
                loadChildren();
            } catch (e2) { errEl.textContent = 'Không kết nối được máy chủ.'; errEl.classList.add('show'); }
        });

        linkForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('pd-link-error');
            errEl.classList.remove('show');
            const username = document.getElementById('pd-link-username').value.trim();
            const password = document.getElementById('pd-link-password').value;
            try {
                const res = await fetch(`${PARENT_API}?action=link_child`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const json = await res.json();
                if (!json.ok) { errEl.textContent = json.error || 'Có lỗi xảy ra.'; errEl.classList.add('show'); return; }
                closePanel();
                showToast(`Đã liên kết ${json.display_name || username}! 🎉`);
                loadChildren();
            } catch (e2) { errEl.textContent = 'Không kết nối được máy chủ.'; errEl.classList.add('show'); }
        });
    }

    initPanel();
    checkParentSession();
})();
