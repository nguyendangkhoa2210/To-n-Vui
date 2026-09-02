// ================= TOAST NOTIFICATION =================
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3100);
}

// ================= BOOKMARK =================
function getBookmarks() {
    return JSON.parse(localStorage.getItem('mu_bookmarks') || '[]');
}
function saveBookmarks(bk) {
    localStorage.setItem('mu_bookmarks', JSON.stringify(bk));
}

function toggleBookmark(id, title, btn) {
    let bk = getBookmarks();
    const idx = bk.findIndex(b => b.id === id);
    if (idx === -1) {
        bk.push({ id, title });
        saveBookmarks(bk);
        btn.classList.add('bookmarked');
        btn.textContent = '⭐ Đã Đánh Dấu';
        showToast(`Đã lưu "${title}" vào yêu thích!`, 'success');
    } else {
        bk.splice(idx, 1);
        saveBookmarks(bk);
        btn.classList.remove('bookmarked');
        btn.textContent = '⭐ Đánh Dấu';
        showToast(`Đã xóa khỏi yêu thích.`, 'info');
    }
    renderBookmarkList();
}

function renderBookmarkList() {
    const bk = getBookmarks();
    const group = document.getElementById('bookmark-group');
    const list  = document.getElementById('bookmark-list');
    if (!bk.length) { group.style.display = 'none'; return; }
    group.style.display = 'block';
    list.innerHTML = bk.map(b =>
        `<button class="recent-item" onclick="viewFormula('${b.id}', null)">⭐ ${b.title}</button>`
    ).join('');
}

function syncBookmarkButtons() {
    const bk = getBookmarks();
    const ids = new Set(bk.map(b => b.id));
    document.querySelectorAll('[onclick^="toggleBookmark"]').forEach(btn => {
        const match = btn.getAttribute('onclick').match(/toggleBookmark\('([^']+)'/);
        if (match) {
            const id = match[1];
            if (ids.has(id)) {
                btn.classList.add('bookmarked');
                btn.textContent = '⭐ Đã Đánh Dấu';
            } else {
                btn.classList.remove('bookmarked');
                btn.textContent = '⭐ Đánh Dấu';
            }
        }
    });
}

// ================= RECENTLY VIEWED =================
function getRecent() {
    return JSON.parse(localStorage.getItem('mu_recent') || '[]');
}
function addRecent(id, title) {
    let recent = getRecent();
    recent = recent.filter(r => r.id !== id);
    recent.unshift({ id, title });
    if (recent.length > 5) recent = recent.slice(0, 5);
    localStorage.setItem('mu_recent', JSON.stringify(recent));
    renderRecentList();
}
function renderRecentList() {
    // Khu vực “Xem Gần Đây” đã được bỏ khỏi giao diện để sidebar gọn hơn.
    // Vẫn giữ hàm để các module cũ gọi không gây lỗi.
    const group = document.getElementById('recent-group');
    const list  = document.getElementById('recent-list');
    if (!group || !list) return;
    const recent = getRecent();
    group.style.display = recent.length ? 'block' : 'none';
    list.innerHTML = recent.map(r =>
        `<button class="recent-item" onclick="viewFormula('${r.id}', null)">🕓 ${r.title}</button>`
    ).join('');
}

// ================= SEARCH =================
function handleSearch(query) {
    const resultsEl = document.getElementById('search-results');
    const q = query.trim().toLowerCase();
    if (!q) { resultsEl.classList.remove('open'); return; }

    const matches = FORMULA_INDEX.filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.tags.some(t => t.includes(q))
    );

    if (!matches.length) {
        resultsEl.innerHTML = `<div class="search-result-item" style="color:var(--text-3);">Không tìm thấy kết quả...</div>`;
        resultsEl.classList.add('open');
        return;
    }

    const levelLabel = { 1: 'Lớp 1', 2: 'Lớp 2', 3: 'Lớp 3', 4: 'Lớp 4', 5: 'Lớp 5' };
    const levelClass = { 1: 'level-tag-1', 2: 'level-tag-2', 3: 'level-tag-3', 4: 'level-tag-4', 5: 'level-tag-5' };

    resultsEl.innerHTML = matches.map(f => `
        <div class="search-result-item" onclick="selectSearchResult('${f.id}')">
            <span>${f.title}</span>
            <span class="search-level ${levelClass[f.level]}">${levelLabel[f.level]}</span>
        </div>
    `).join('');
    resultsEl.classList.add('open');
}

function selectSearchResult(id) {
    document.getElementById('formula-search').value = '';
    document.getElementById('search-results').classList.remove('open');
    // Ensure we're in learn mode
    if (document.getElementById('learn-panels').style.display === 'none') {
        switchMode('learn');
    }
    viewFormula(id, null);
}

// Close search on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-wrap-learn')) {
        document.getElementById('search-results').classList.remove('open');
    }
});

// ================= VIEWS TRACKING =================
function trackViewed(id) {
    let viewed = JSON.parse(localStorage.getItem('mu_viewed_set') || '[]');
    if (!viewed.includes(id)) {
        viewed.push(id);
        localStorage.setItem('mu_viewed_set', JSON.stringify(viewed));
    }
}

// ================= ĐIỀU HƯỚNG CHẾ ĐỘ (HỌC / QUIZ) =================
function switchMode(mode) {
    const learnMenu   = document.getElementById('menu-learn');
    const quizMenu    = document.getElementById('menu-quiz');
    const learnPanels = document.getElementById('learn-panels');
    const quizPanels  = document.getElementById('quiz-panels');
    const learnBtn    = document.getElementById('modeLearnBtn');
    const quizBtn     = document.getElementById('modeQuizBtn');
    const searchWrap  = document.getElementById('search-wrap-learn');

    if (mode === 'learn') {
        learnMenu.style.display = 'flex';
        quizMenu.style.display = 'none';
        learnPanels.style.display = 'block';
        quizPanels.style.display = 'none';
        learnBtn.classList.add('active');
        quizBtn.classList.remove('active');
        if (searchWrap) searchWrap.style.display = 'block';
        showWelcome();
    } else {
        learnMenu.style.display = 'none';
        quizMenu.style.display = 'block';
        learnPanels.style.display = 'none';
        quizPanels.style.display = 'flex';
        quizBtn.classList.add('active');
        learnBtn.classList.remove('active');
        if (searchWrap) searchWrap.style.display = 'none';
        resetQuizView();
        refreshHighScores();
        if (typeof window.MU_autoSelectGradeInQuiz === 'function') window.MU_autoSelectGradeInQuiz();
        const ws = document.getElementById('main-content');
        if (ws) ws.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
}

// ================= ĐIỀU HƯỚNG CÔNG THỨC =================
// Đóng/mở từng nhóm cấp học trong sidebar (accordion) — mặc định nhóm chứa
// công thức đang xem sẽ tự mở, các nhóm khác thu gọn để đỡ rối mắt.
function toggleMenuGroup(headerEl) {
    const group = headerEl.closest('.menu-group');
    group.classList.toggle('collapsed');
}

function viewFormula(formulaId, element) {
    // Ẩn tất cả panels
    document.querySelectorAll('#learn-panels .formula-panel').forEach(p => p.classList.remove('active'));
    // Bỏ active khỏi menu items
    document.querySelectorAll('#menu-learn .menu-item').forEach(i => i.classList.remove('active'));

    const targetPanel = document.getElementById(formulaId);
    if (targetPanel) {
        targetPanel.classList.add('active');
        const title = targetPanel.getAttribute('data-title') || formulaId;
        addRecent(formulaId, title);
        trackViewed(formulaId);
        syncBookmarkButtons();
    }

    if (element) {
        element.classList.add('active');
        const grp = element.closest('.menu-group');
        if (grp) grp.classList.remove('collapsed');
    }

    // Highlight matching sidebar button if called from search/recent/bookmark
    if (!element) {
        document.querySelectorAll('#menu-learn .menu-item').forEach(btn => {
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${formulaId}'`)) {
                btn.classList.add('active');
                const grp = btn.closest('.menu-group');
                if (grp) grp.classList.remove('collapsed');
            }
        });
    }

    closeSidebarOnMobile();
}

function showWelcome() {
    document.querySelectorAll('#learn-panels .formula-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('welcome-screen').classList.add('active');
    document.querySelectorAll('#menu-learn .menu-item').forEach(i => i.classList.remove('active'));
    if (document.getElementById('learn-panels').style.display === 'none') switchMode('learn');
    updateWelcomeDashboard();
}

// ================= DASHBOARD CHÀO MỪNG (ĐỘNG, THÂN THIỆN HỌC SINH) =================
const MOTIVATIONAL_QUOTES = [
    '💡 "Toán học là ngôn ngữ mà vũ trụ dùng để viết chính nó."',
    '🌟 "Đừng sợ sai — mỗi lỗi sai là một bước tiến gần hơn đến đáp án đúng."',
    '🔥 "Người giỏi toán không phải người không bao giờ sai, mà là người luyện tập nhiều nhất."',
    '🎯 "Một bài toán khó hôm nay sẽ là bài dễ của ngày mai, nếu bạn kiên trì luyện tập."',
    '🚀 "Mỗi công thức bạn học hôm nay là một viên gạch xây nên tương lai của bạn."',
    '📚 "Học toán giống như tập gym cho não bộ — càng luyện, càng mạnh."',
];
const MASCOT_MORNING = 'wave';
const MASCOT_AFTERNOON = 'happy';
const MASCOT_EVENING = 'thinking';

function updateWelcomeDashboard() {
    // Câu nói truyền cảm hứng ngẫu nhiên mỗi lần vào trang chủ
    const quoteEl = document.getElementById('hero-quote');
    if (quoteEl) quoteEl.textContent = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

    // Lời chào theo giờ trong ngày — Bống (mascot SVG) đổi cảm xúc theo buổi,
    // vẫn giữ nguyên khả năng bấm vào để tương tác (không ghi đè bằng emoji tĩnh).
    const hour = new Date().getHours();
    const greetingEl = document.getElementById('hero-greeting');
    const mascotEl = document.getElementById('hero-mascot');
    let greeting, mood;
    if (hour < 11) { greeting = 'Chào buổi sáng! Bắt đầu ngày mới với vài công thức toán nhé! ☀️'; mood = MASCOT_MORNING; }
    else if (hour < 18) { greeting = 'Chào buổi chiều! Cùng luyện tập để nắm chắc kiến thức nào! 📖'; mood = MASCOT_AFTERNOON; }
    else { greeting = 'Chào buổi tối! Ôn lại bài hôm nay trước khi nghỉ ngơi nhé! 🌙'; mood = MASCOT_EVENING; }
    if (greetingEl) greetingEl.textContent = greeting;
    if (mascotEl && typeof mascotSVG === 'function') {
        mascotEl.innerHTML = mascotSVG(mood, 84);
        // Không gọi lại mascotMakeInteractive: nút bấm được gắn trên chính
        // #hero-mascot (không phải trên SVG con) nên vẫn còn nguyên khi đổi
        // ảnh SVG bên trong — tránh gắn trùng nhiều listener khi vào lại
        // trang chủ (showWelcome) nhiều lần trong 1 phiên.
    }

    // (đã xoá phần cập nhật "mpb-viewed / mpb-bookmarks / mpb-best / mpb-encourage"
    // — panel "Mini Progress Box" này đã được thay bằng "Nhiệm Vụ Hôm Nay"
    // (renderDailyMissionCard bên dưới), các #mpb-* không còn tồn tại trong
    // HTML nữa nên toàn bộ tính toán viewed/bookmarks/best/encourage phía
    // trên chỉ tốn công vô ích mỗi lần vào trang chủ mà không hiển thị gì.)
    if (typeof renderDailyMissionCard === 'function') renderDailyMissionCard();
}

// ================= SIDEBAR RESPONSIVE =================
const hamburgerBtn = document.getElementById('hamburgerBtn');
if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        // On mobile: toggle open class; on desktop: toggle collapsed
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('open');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    });
}
function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

// ================= LOGO BOUNCE =================
document.querySelectorAll('.letters span').forEach(span => {
    span.addEventListener('mouseenter', (e) => {
        e.target.classList.remove('active');
        setTimeout(() => e.target.classList.add('active'), 10);
    });
    span.addEventListener('animationend', (e) => e.target.classList.remove('active'));
});

// ================= ENTER KEY SUPPORT for all panels =================
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;

    const activeInput = document.activeElement;
    if (!activeInput || activeInput.tagName !== 'INPUT') return;

    // Quiz mode
    const quizInput = document.getElementById('quiz-answer-input');
    if (activeInput === quizInput) {
        if (!quizState.answered) submitQuizAnswer();
        else nextQuizQuestion();
        return;
    }

    // Learn mode — find the active panel's calc button
    const activePanel = document.querySelector('.formula-panel.active');
    if (activePanel) {
        const btn = activePanel.querySelector('.calc-btn');
        if (btn) btn.click();
    }
});

// ================================================================
// ================= SVG MINH HỌA HÌNH HỌC =======================
// ================================================================
// Các hàm vẽ SVG động dựa trên số liệu người dùng nhập, giúp trực quan hóa hình học.

let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    return audioCtx;
}

function playSound(type) {
    if (localStorage.getItem('mu_sound_off') === 'on') return;
    const ctx = getAudioCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (type === 'correct') {
        // Hai nốt tăng dần, cảm giác vui tai
        [523.25, 659.25].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, now + i*0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i*0.09 + 0.2);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now + i*0.09);
            osc.stop(now + i*0.09 + 0.2);
        });
    } else {
        // Một nốt trầm ngắn, nhẹ nhàng không gây khó chịu
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 196;
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }
}

// ================================================================
// F4: MINI CELEBRATION — hiệu ứng pháo giấy nhỏ mỗi khi làm đúng 1 câu
// trong Ôn Tập/Đề Thi (xem submitQuizAnswer trong quiz.js). CSS animation
// (.mini-burst-particle, .mini-burst-emoji, .mascot-jump) đã có sẵn trong
// style.css — hàm này chỉ tạo & gắn các phần tử đó vào DOM, tự xoá sau khi
// animation chạy xong.
// ================================================================
function launchMiniCelebration(originEl) {
    const rect = originEl && originEl.getBoundingClientRect
        ? originEl.getBoundingClientRect()
        : { left: window.innerWidth / 2, top: window.innerHeight / 3, width: 0, height: 0 };
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const colors = ['#4e9b55', '#eab308', '#e37b61', '#4f78c7', '#a855f7'];
    const PARTICLES = 10;
    for (let i = 0; i < PARTICLES; i++) {
        const p = document.createElement('span');
        p.className = 'mini-burst-particle';
        const angle = (Math.PI * 2 * i) / PARTICLES + Math.random() * 0.4;
        const dist = 60 + Math.random() * 50;
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        p.style.background = colors[i % colors.length];
        p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        document.body.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
    }

    const EMOJIS = ['⭐', '✨', '🎉'];
    EMOJIS.forEach((emoji, i) => {
        const e = document.createElement('span');
        e.className = 'mini-burst-emoji';
        e.textContent = emoji;
        e.style.left = (cx - 20 + i * 20) + 'px';
        e.style.top = cy + 'px';
        e.style.animationDelay = (i * 0.06) + 's';
        document.body.appendChild(e);
        e.addEventListener('animationend', () => e.remove());
    });

    // Bống ở trang chủ nhảy mừng luôn nếu đang hiển thị (không bắt buộc thấy
    // ngay lúc làm quiz, nhưng vui khi quay lại trang chủ ngay sau đó).
    const mascotEl = document.getElementById('hero-mascot');
    if (mascotEl) {
        mascotEl.classList.remove('mascot-jump');
        void mascotEl.offsetWidth; // reflow để restart animation nếu vừa mới chạy
        mascotEl.classList.add('mascot-jump');
        mascotEl.addEventListener('animationend', () => mascotEl.classList.remove('mascot-jump'), { once: true });
    }
}

function toggleSound() {
    const isOff = localStorage.getItem('mu_sound_off') === 'on';
    localStorage.setItem('mu_sound_off', isOff ? 'off' : 'on');
    const btn = document.getElementById('soundToggleBtn');
    if (btn) { btn.textContent = isOff ? '🔊' : '🔇'; btn.setAttribute('aria-pressed', String(!isOff)); }
    if (isOff) playSound('correct'); // phát thử khi bật lại
}

function initSoundBtn() {
    const btn = document.getElementById('soundToggleBtn');
    if (btn) btn.textContent = localStorage.getItem('mu_sound_off') === 'on' ? '🔇' : '🔊';
}
document.addEventListener('DOMContentLoaded', initSoundBtn);


document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.calc-btn').forEach((btn) => {
        btn.addEventListener('click', function guardClick(e) {
            if (this.dataset.locked === '1') {
                e.stopImmediatePropagation();
                e.preventDefault();
                return;
            }
            this.dataset.locked = '1';
            this.style.opacity = '0.7';
            setTimeout(() => { this.dataset.locked = '0'; this.style.opacity = '1'; }, 300);
        }, true); // capture: chạy trước onclick inline nên có thể chặn kịp
    });
});


function initOnboarding() {
    if (localStorage.getItem('mu_onboarded') === 'yes') return;
    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.classList.add('open');
}
function closeOnboarding() {
    localStorage.setItem('mu_onboarded', 'yes');
    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.classList.remove('open');
}
document.addEventListener('DOMContentLoaded', initOnboarding);

document.addEventListener('DOMContentLoaded', () => {
    
    updateWelcomeDashboard();
});


document.addEventListener('DOMContentLoaded', () => {
    const groups = document.querySelectorAll('#menu-learn .menu-group');
    groups.forEach((g, i) => { if (i > 0) g.classList.add('collapsed'); });
});


function updateDailyStreak() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastVisit = localStorage.getItem('mu_last_visit');
    let streak = parseInt(localStorage.getItem('mu_streak_count') || '0');

    if (lastVisit === todayStr) {
        // Đã tính streak hôm nay rồi, không đổi
    } else if (lastVisit) {
        const diffDays = Math.round((new Date(todayStr) - new Date(lastVisit)) / 86400000);
        streak = diffDays === 1 ? streak + 1 : 1;
    } else {
        streak = 1;
    }
    localStorage.setItem('mu_last_visit', todayStr);
    localStorage.setItem('mu_streak_count', String(streak));

    const badge = document.getElementById('streak-badge');
    const countEl = document.getElementById('streak-count');
    if (badge && countEl && streak > 0) {
        countEl.textContent = streak;
        badge.style.display = 'inline-flex';
    }
    return streak;
}
document.addEventListener('DOMContentLoaded', updateDailyStreak);

// ================================================================
// ================= HỆ THỐNG HUY HIỆU (BADGES) ===================
// ================================================================
const BADGE_DEFS = [
    { id: 'first-view',   icon: '👀', name: 'Người Mới',       check: s => s.viewed >= 1 },
    { id: 'explorer-10',  icon: '🌱', name: 'Nhà Khám Phá',    check: s => s.viewed >= 8 },
    { id: 'explorer-25',  icon: '🔥', name: 'Ham Học',         check: s => s.viewed >= 18 },
    { id: 'explorer-all', icon: '🏆', name: 'Bậc Thầy Tiểu Học', check: s => s.viewed >= 25 },
    { id: 'first-quiz',   icon: '📝', name: 'Chiến Binh Ôn Tập', check: s => s.totalQuizzes >= 1 },
    { id: 'quiz-10',      icon: '⚔️', name: 'Luyện Đề Bền Bỉ',  check: s => s.totalQuizzes >= 10 },
    { id: 'perfect-score',icon: '💯', name: 'Điểm Tuyệt Đối',  check: s => s.bestScore >= 10 },
    { id: 'streak-3',     icon: '🔥', name: 'Chuỗi 3 Ngày',    check: s => s.streak >= 3 },
    { id: 'streak-7',     icon: '⚡', name: 'Chuỗi 7 Ngày',    check: s => s.streak >= 7 },
    { id: 'bookmark-5',   icon: '⭐', name: 'Người Sưu Tầm',   check: s => s.bookmarks >= 5 },
];

function computeBadgeStats() {
    const viewed = JSON.parse(localStorage.getItem('mu_viewed_set') || '[]').length;
    const bookmarks = getBookmarks().length;
    const streak = parseInt(localStorage.getItem('mu_streak_count') || '0');
    let totalQuizzes = 0, bestScore = 0;
    ['lop1','lop2','lop3','lop4','lop5'].forEach(l => {
        totalQuizzes += parseInt(localStorage.getItem(`mu_quiz_count_${l}`) || '0');
        bestScore = Math.max(bestScore, parseInt(localStorage.getItem(`mathuniverse_highscore_${l}`) || '0'));
    });
    return { viewed, bookmarks, streak, totalQuizzes, bestScore };
}

function checkAndRenderBadges() {
    const stats = computeBadgeStats();
    const unlocked = JSON.parse(localStorage.getItem('mu_badges') || '[]');
    let newlyUnlocked = [];

    BADGE_DEFS.forEach(b => {
        if (!unlocked.includes(b.id) && b.check(stats)) {
            unlocked.push(b.id);
            newlyUnlocked.push(b);
        }
    });
    if (newlyUnlocked.length > 0) {
        localStorage.setItem('mu_badges', JSON.stringify(unlocked));
        newlyUnlocked.forEach(b => showToast(`🎉 Mở khóa huy hiệu: ${b.icon} ${b.name}!`, 'success'));
    }

    // Lưu ý: #badges-grid là khung hiển thị huy hiệu KIỂU CŨ, đã được thay
    // bằng tab "🏅 Huy Hiệu" trong modal Sổ Rừng Xanh (forest-friends.js,
    // dùng chung BADGE_DEFS ở trên) nên không còn trong HTML nữa — guard
    // "if (!grid) return" bên dưới xử lý đúng, chỉ bỏ qua phần vẽ lưới cũ;
    // phần MỞ KHOÁ huy hiệu + thông báo toast ở trên vẫn hoạt động bình
    // thường, không phụ thuộc vào #badges-grid.
    const grid = document.getElementById('badges-grid');
    if (!grid) return;
    if (unlocked.length === 0) {
        grid.innerHTML = '<p class="calc-history-empty">Chưa có huy hiệu nào — bắt đầu học và luyện đề để mở khóa!</p>';
        return;
    }
    grid.innerHTML = BADGE_DEFS.map(b => {
        const has = unlocked.includes(b.id);
        return `<div class="badge-item ${has ? 'earned' : 'locked'}" title="${b.name}">
            <span class="badge-icon">${has ? b.icon : '🔒'}</span>
            <span class="badge-name">${b.name}</span>
        </div>`;
    }).join('');
}

// ================================================================
// ========== BẢNG XẾP HẠNG LỚP HỌC (LƯU TRÊN 1 MÁY DÙNG CHUNG) ===
// ================================================================
let pendingQuizStartCallback = null;
let currentStudentName = localStorage.getItem('mu_last_student_name') || '';

// Được gọi thay cho chooseLevel/startQuiz trực tiếp khi cần hỏi tên trước
function promptStudentNameThenRun(callback) {
    pendingQuizStartCallback = callback;
    document.getElementById('student-name-input').value = currentStudentName;
    document.getElementById('name-prompt-modal').classList.add('open');
}
function confirmStudentName() {
    const name = document.getElementById('student-name-input').value.trim();
    currentStudentName = name;
    localStorage.setItem('mu_last_student_name', name);
    document.getElementById('name-prompt-modal').classList.remove('open');
    if (pendingQuizStartCallback) { pendingQuizStartCallback(); pendingQuizStartCallback = null; }
}

function saveToLeaderboard(level, difficulty, score) {
    if (!currentStudentName) return; // học sinh chọn bỏ trống tên -> không tham gia bảng xếp hạng
    const entries = JSON.parse(localStorage.getItem('mu_leaderboard') || '[]');
    entries.push({ name: currentStudentName, level, difficulty, score, date: new Date().toISOString() });
    if (entries.length > 200) entries.shift();
    localStorage.setItem('mu_leaderboard', JSON.stringify(entries));
}

let leaderboardFilterLevel = 'all';
function openLeaderboard() {
    document.getElementById('leaderboard-modal').classList.add('open');
    renderLeaderboard();
}
function closeLeaderboard(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('leaderboard-modal').classList.remove('open');
}
function filterLeaderboard(level, btn) {
    leaderboardFilterLevel = level;
    document.querySelectorAll('#leaderboard-modal .fc-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderLeaderboard();
}
function renderLeaderboard() {
    const entries = JSON.parse(localStorage.getItem('mu_leaderboard') || '[]');
    const filtered = leaderboardFilterLevel === 'all' ? entries : entries.filter(e => e.level === leaderboardFilterLevel);

    // Lấy điểm CAO NHẤT của mỗi học sinh (theo tên) để bảng xếp hạng công bằng, không phụ thuộc số lần làm
    const bestPerStudent = {};
    filtered.forEach(e => {
        const key = e.name;
        if (!bestPerStudent[key] || e.score > bestPerStudent[key].score) bestPerStudent[key] = e;
    });
    const ranked = Object.values(bestPerStudent).sort((a, b) => b.score - a.score).slice(0, 20);

    const list = document.getElementById('leaderboard-list');
    if (ranked.length === 0) {
        list.innerHTML = '<p class="calc-history-empty">Chưa có ai làm bài với tên ở mục này.</p>';
        return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    list.innerHTML = ranked.map((e, i) => `
        <div class="lb-row ${i < 3 ? 'lb-top3' : ''}">
            <span class="lb-rank">${medals[i] || (i+1)}</span>
            <span class="lb-name">${escapeHtml(e.name)}</span>
            <span class="lb-meta">${levelLabels ? levelLabels[e.level] || e.level : e.level}${e.difficulty ? ' · ' + (difficultyLabels ? difficultyLabels[e.difficulty] : e.difficulty) : ''}</span>
            <span class="lb-score">${e.score}/10</span>
        </div>
    `).join('');
}
function clearLeaderboard() {
    if (!confirm('Xóa toàn bộ bảng xếp hạng lớp học? Không thể hoàn tác!')) return;
    localStorage.removeItem('mu_leaderboard');
    renderLeaderboard();
    showToast('Đã xóa bảng xếp hạng.', 'success');
}
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Gọi kiểm tra huy hiệu mỗi khi dashboard cập nhật
const _origUpdateWelcomeDashboard = updateWelcomeDashboard;
updateWelcomeDashboard = function() {
    _origUpdateWelcomeDashboard();
    checkAndRenderBadges();
};


const BREAK_INTERVAL_MS = 18 * 60 * 1000; // 18 phút
const BREAK_SNOOZE_MS   = 5 * 60 * 1000;  // Snooze 5 phút

let _breakTimerId     = null;
let _breakStartedTime = null;

const BREAK_MESSAGES = [
    { emoji: '🦉', msg: 'Bống mỏi mắt rồi! Mình đứng dậy vươn vai một chút nhé! 🌿', action: 'Mình Sẵn Sàng Rồi! 💪' },
    { emoji: '🐻', msg: 'Gấu con nói: "Nghỉ ngơi một chút thôi, rồi mình học tiếp nhé!" 🌸', action: 'Nghỉ Xong Rồi! ⭐' },
    { emoji: '🐰', msg: 'Thỏ Bông bảo hãy uống một ngụm nước và nhìn ra cửa sổ xa xa! 💧', action: 'Tươi Tỉnh Rồi! 🌟' },
    { emoji: '🦊', msg: 'Cáo Tinh Nghịch mách: lắc cổ tay 10 vòng, mắt sẽ đỡ mỏi hơn! 🌀', action: 'Làm Xong Rồi! 🎉' },
];

function startBreakTimer() {
    _stopBreakTimer();
    _breakStartedTime = Date.now();
    _breakTimerId = setTimeout(showBreakOverlay, BREAK_INTERVAL_MS);
}

function _stopBreakTimer() {
    if (_breakTimerId) { clearTimeout(_breakTimerId); _breakTimerId = null; }
}

function showBreakOverlay() {
    // Không hiện nếu đang có overlay khác mở
    if (document.querySelector('.modal-overlay.open')) {
        // Thử lại sau 2 phút
        _breakTimerId = setTimeout(showBreakOverlay, 2 * 60 * 1000);
        return;
    }

    const pick = BREAK_MESSAGES[Math.floor(Math.random() * BREAK_MESSAGES.length)];

    let overlay = document.getElementById('break-reminder-overlay');
    if (!overlay) return; // HTML chưa có, bỏ qua
    overlay.querySelector('.break-emoji').textContent = pick.emoji;
    overlay.querySelector('.break-msg').textContent = pick.msg;
    overlay.querySelector('#break-ok-btn').textContent = pick.action;
    overlay.classList.add('open');

    // Phát âm thanh nhẹ nhàng nếu âm thanh bật
    if (typeof playSound === 'function') playSound('correct');
}

function dismissBreak(snooze = false) {
    const overlay = document.getElementById('break-reminder-overlay');
    if (overlay) overlay.classList.remove('open');
    // Reset timer
    const delay = snooze ? BREAK_SNOOZE_MS : BREAK_INTERVAL_MS;
    _breakTimerId = setTimeout(showBreakOverlay, delay);
}

// Khởi động timer khi trang load; reset mỗi khi học sinh bắt đầu làm bài
document.addEventListener('DOMContentLoaded', () => {
    startBreakTimer();
});


function openGallery() {
    if (typeof openForestBook === 'function') openForestBook();
}