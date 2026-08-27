
(function (global) {
    'use strict';

    const STORAGE_KEY = 'mu_forest_friends';

    const FOREST_FRIENDS = [
        {
            id: 'rabbit', name: 'Thỏ Bông', tagline: 'Nhảy tưng tưng khi bạn làm đúng!',
            svg: () => `
                <ellipse cx="80" cy="140" rx="44" ry="10" fill="#dfe9cf"/>
                <path d="M58 46 Q50 4 40 8 Q34 44 52 60 Z" fill="#f4ede3"/>
                <path d="M102 46 Q110 4 120 8 Q126 44 108 60 Z" fill="#f4ede3"/>
                <path d="M59 46 Q54 14 46 18 Q42 44 56 56 Z" fill="#ffc7d1"/>
                <path d="M101 46 Q106 14 114 18 Q118 44 104 56 Z" fill="#ffc7d1"/>
                <circle cx="80" cy="88" r="46" fill="#fbf6ee"/>
                <circle cx="63" cy="84" r="6" fill="#2d241e"/>
                <circle cx="97" cy="84" r="6" fill="#2d241e"/>
                <circle cx="65" cy="82" r="2" fill="#fff"/>
                <circle cx="99" cy="82" r="2" fill="#fff"/>
                <ellipse cx="80" cy="98" rx="6" ry="4.5" fill="#ffb3c1"/>
                <path d="M73 106 Q80 112 87 106" fill="none" stroke="#2d241e" stroke-width="3.4" stroke-linecap="round"/>
                <ellipse cx="55" cy="98" rx="6" ry="4" fill="#ffcfd8" opacity=".8"/>
                <ellipse cx="105" cy="98" rx="6" ry="4" fill="#ffcfd8" opacity=".8"/>`,
        },
        {
            id: 'fox', name: 'Cáo Tinh Nghịch', tagline: 'Luôn có mẹo hay để nhớ bài!',
            svg: () => `
                <ellipse cx="80" cy="140" rx="44" ry="10" fill="#dfe9cf"/>
                <path d="M50 50 L30 12 L64 42 Z" fill="#ef8a3d"/>
                <path d="M110 50 L130 12 L96 42 Z" fill="#ef8a3d"/>
                <path d="M52 44 L38 22 L62 40 Z" fill="#fff3e2"/>
                <path d="M108 44 L122 22 L98 40 Z" fill="#fff3e2"/>
                <circle cx="80" cy="86" r="48" fill="#f2984f"/>
                <path d="M80 74 Q108 74 108 100 Q108 122 80 128 Q52 122 52 100 Q52 74 80 74 Z" fill="#fff3e2"/>
                <circle cx="65" cy="86" r="5.6" fill="#2d241e"/>
                <circle cx="95" cy="86" r="5.6" fill="#2d241e"/>
                <path d="M80 100 L74 108 L86 108 Z" fill="#2d241e"/>
                <path d="M74 112 Q80 117 86 112" fill="none" stroke="#2d241e" stroke-width="3" stroke-linecap="round"/>`,
        },
        {
            id: 'squirrel', name: 'Sóc Nhanh Trí', tagline: 'Tính nhẩm siêu nhanh như chớp!',
            svg: () => `
                <ellipse cx="86" cy="142" rx="46" ry="9" fill="#dfe9cf"/>
                <path d="M118 120 Q150 96 132 54 Q152 78 140 118 Q136 138 108 138 Z" fill="#c1652f"/>
                <path d="M120 116 Q142 98 130 64" fill="none" stroke="#e0894f" stroke-width="7" stroke-linecap="round" opacity=".7"/>
                <circle cx="66" cy="46" r="15" fill="#c1652f"/>
                <circle cx="66" cy="46" r="7" fill="#e0894f"/>
                <circle cx="70" cy="82" r="44" fill="#d17a3e"/>
                <ellipse cx="70" cy="92" rx="26" ry="22" fill="#fbe6cf"/>
                <circle cx="56" cy="78" r="5.6" fill="#2d241e"/>
                <circle cx="84" cy="78" r="5.6" fill="#2d241e"/>
                <ellipse cx="70" cy="92" rx="5" ry="3.6" fill="#2d241e"/>
                <path d="M64 100 Q70 105 76 100" fill="none" stroke="#2d241e" stroke-width="3" stroke-linecap="round"/>`,
        },
        {
            id: 'owl', name: 'Cú Mèo Thông Thái', tagline: 'Biết hết mọi lời giải hay!',
            svg: () => `
                <ellipse cx="80" cy="140" rx="44" ry="10" fill="#dfe9cf"/>
                <path d="M60 40 L48 16 L70 32 Z" fill="#6b5645"/>
                <path d="M100 40 L112 16 L90 32 Z" fill="#6b5645"/>
                <circle cx="80" cy="82" r="50" fill="#8a6f57"/>
                <circle cx="61" cy="80" r="19" fill="#fbf6ee"/>
                <circle cx="99" cy="80" r="19" fill="#fbf6ee"/>
                <circle cx="61" cy="80" r="9" fill="#2d241e"/>
                <circle cx="99" cy="80" r="9" fill="#2d241e"/>
                <circle cx="64" cy="77" r="2.6" fill="#fff"/>
                <circle cx="102" cy="77" r="2.6" fill="#fff"/>
                <path d="M80 92 L73 104 L87 104 Z" fill="#eeae44"/>
                <path d="M40 100 Q30 116 44 128" fill="none" stroke="#6b5645" stroke-width="9" stroke-linecap="round"/>
                <path d="M120 100 Q130 116 116 128" fill="none" stroke="#6b5645" stroke-width="9" stroke-linecap="round"/>`,
        },
        {
            id: 'hedgehog', name: 'Nhím Chăm Chỉ', tagline: 'Luyện tập mỗi ngày không nghỉ!',
            svg: () => `
                <ellipse cx="80" cy="140" rx="46" ry="9" fill="#dfe9cf"/>
                <path d="M40 96 Q30 60 60 44 Q52 66 58 82 Z" fill="#8a6a4e"/>
                <path d="M56 66 Q34 46 56 30 Q56 54 66 72 Z" fill="#8a6a4e"/>
                <path d="M76 56 Q60 26 86 20 Q78 44 84 64 Z" fill="#8a6a4e"/>
                <path d="M100 60 Q104 28 130 30 Q114 46 112 68 Z" fill="#8a6a4e"/>
                <path d="M116 84 Q140 70 138 100 Q120 92 106 98 Z" fill="#8a6a4e"/>
                <ellipse cx="82" cy="98" rx="46" ry="38" fill="#a2795a"/>
                <ellipse cx="66" cy="110" rx="26" ry="22" fill="#f4e6d3"/>
                <circle cx="56" cy="104" r="4.6" fill="#2d241e"/>
                <ellipse cx="42" cy="112" rx="5.5" ry="4.4" fill="#2d241e"/>
                <path d="M48 120 Q56 124 62 120" fill="none" stroke="#2d241e" stroke-width="2.6" stroke-linecap="round"/>`,
        },
        {
            id: 'deer', name: 'Hươu Sao Dịu Dàng', tagline: 'Luôn động viên bạn cố gắng!',
            svg: () => `
                <ellipse cx="80" cy="142" rx="46" ry="9" fill="#dfe9cf"/>
                <path d="M58 34 Q46 6 30 12 Q40 24 40 38 Q30 30 22 36 Q34 46 52 44 Z" fill="#8a6543"/>
                <path d="M102 34 Q114 6 130 12 Q120 24 120 38 Q130 30 138 36 Q126 46 108 44 Z" fill="#8a6543"/>
                <circle cx="46" cy="52" r="14" fill="#caa06f"/>
                <circle cx="114" cy="52" r="14" fill="#caa06f"/>
                <circle cx="80" cy="86" r="46" fill="#caa06f"/>
                <ellipse cx="80" cy="96" rx="27" ry="23" fill="#f6ecdd"/>
                <circle cx="64" cy="82" r="5.4" fill="#2d241e"/>
                <circle cx="96" cy="82" r="5.4" fill="#2d241e"/>
                <ellipse cx="80" cy="98" rx="5" ry="3.6" fill="#2d241e"/>
                <path d="M74 105 Q80 110 86 105" fill="none" stroke="#2d241e" stroke-width="3" stroke-linecap="round"/>
                <g fill="#f4ede0">
                    <circle cx="60" cy="72" r="2.6"/><circle cx="100" cy="72" r="2.6"/>
                    <circle cx="55" cy="90" r="2.2"/><circle cx="105" cy="90" r="2.2"/>
                </g>`,
        },
    ];

    function safeGet(key, fallback) {
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : fallback;
        } catch (e) { return fallback; }
    }
    function safeSet(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* bỏ qua nếu bị chặn */ }
    }

    function getUnlockedFriends() {
        return safeGet(STORAGE_KEY, []);
    }

    function unlockRandomFriend() {
        const owned = getUnlockedFriends();
        const candidates = FOREST_FRIENDS.filter(f => !owned.includes(f.id));
        if (!candidates.length) return null;
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        owned.push(picked.id);
        safeSet(STORAGE_KEY, owned);
        refreshForestBadge();
        return picked;
    }

    function friendCardHtml(friend, unlocked) {
        const svgInner = unlocked ? friend.svg() : friend.svg();
        const filterStyle = unlocked ? '' : 'filter:grayscale(1) brightness(.6); opacity:.45;';
        return `
        <div class="mu-ff-card${unlocked ? ' mu-ff-unlocked' : ''}">
            <div class="mu-ff-art" style="${filterStyle}">
                <svg viewBox="0 0 160 160" width="72" height="72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${svgInner}</svg>
                ${unlocked ? '' : '<span class="mu-ff-lock">🔒</span>'}
            </div>
            <div class="mu-ff-name">${unlocked ? friend.name : '???'}</div>
            <div class="mu-ff-tagline">${unlocked ? friend.tagline : 'Hoàn thành Nhiệm Vụ Hôm Nay thật xuất sắc để gặp bạn này nhé!'}</div>
        </div>`;
    }

    // Render badge grid HTML (dùng BADGE_DEFS từ app-core.js nếu có)
    function _badgesHtml() {
        const BADGE_DEFS_REF = typeof BADGE_DEFS !== 'undefined' ? BADGE_DEFS : [];
        if (!BADGE_DEFS_REF.length) return '<p class="mu-ff-hint">Đang tải huy hiệu...</p>';
        const unlocked = JSON.parse(localStorage.getItem('mu_badges') || '[]');
        const earned = BADGE_DEFS_REF.filter(b => unlocked.includes(b.id));
        const locked = BADGE_DEFS_REF.filter(b => !unlocked.includes(b.id));
        if (!earned.length) {
            return `<div class="mu-badge-empty">
                <div style="font-size:3rem;margin-bottom:12px;">🔒</div>
                <p>Chưa có huy hiệu nào — bắt đầu học và làm nhiệm vụ hằng ngày để mở khóa nhé!</p>
            </div>`;
        }
        const earnedHtml = earned.map(b => `
            <div class="mu-badge-card mu-badge-earned" title="${b.name}">
                <div class="mu-badge-icon">${b.icon}</div>
                <div class="mu-badge-name">${b.name}</div>
                <div class="mu-badge-glow"></div>
            </div>`).join('');
        const lockedHtml = locked.map(b => `
            <div class="mu-badge-card mu-badge-locked" title="${b.name}">
                <div class="mu-badge-icon">🔒</div>
                <div class="mu-badge-name">${b.name}</div>
            </div>`).join('');
        return `<div class="mu-badge-section-title">✨ Đã Mở Khóa (${earned.length}/${BADGE_DEFS_REF.length})</div>
                <div class="mu-badge-grid">${earnedHtml}${lockedHtml}</div>`;
    }

    function openForestBook(activeTab) {
        activeTab = activeTab || 'friends';
        let overlay = document.getElementById('forest-book-overlay');
        const owned = getUnlockedFriends();
        const cardsHtml = FOREST_FRIENDS.map(f => friendCardHtml(f, owned.includes(f.id))).join('');
        const badgesContent = _badgesHtml();
        const html = `
            <div class="modal-box mu-ff-box" onclick="event.stopPropagation()">
                <button type="button" class="mu-ff-close" onclick="closeForestBook()" aria-label="Đóng">✕</button>
                <div class="mu-ff-header">
                    <h2>🎁 Phòng Trưng Bày</h2>
                    <p>Bộ sưu tập riêng của bạn — không xếp hạng, chỉ là niềm vui của chính mình! 🌈</p>
                </div>
                <div class="mu-ff-tabs">
                    <button class="mu-ff-tab ${activeTab==='friends'?'active':''}" onclick="openForestBook('friends')">🐾 Bạn Thú <span class="mu-ff-tab-count">${owned.length}/${FOREST_FRIENDS.length}</span></button>
                    <button class="mu-ff-tab ${activeTab==='badges'?'active':''}" onclick="openForestBook('badges')">🏅 Huy Hiệu</button>
                </div>
                <div class="mu-ff-tab-content" id="mu-ff-tab-friends" style="display:${activeTab==='friends'?'block':'none'}">
                    <div class="mu-ff-grid">${cardsHtml}</div>
                    <p class="mu-ff-hint">🌿 Mẹo: Hoàn thành trọn vẹn 5/5 câu ở "Nhiệm Vụ Hôm Nay" để có cơ hội gặp bạn thú mới!</p>
                </div>
                <div class="mu-ff-tab-content" id="mu-ff-tab-badges" style="display:${activeTab==='badges'?'block':'none'}">
                    ${badgesContent}
                    <p class="mu-ff-hint">🏅 Mẹo: Học bài, làm quiz, duy trì streak nhiều ngày để mở khóa thêm huy hiệu nhé!</p>
                </div>
            </div>`;

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'forest-book-overlay';
            overlay.className = 'modal-overlay';
            overlay.addEventListener('click', closeForestBook);
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = html;
        overlay.classList.add('open');
    }

    function closeForestBook() {
        const overlay = document.getElementById('forest-book-overlay');
        if (overlay) overlay.classList.remove('open');
    }

    function refreshForestBadge() {
        const badge = document.getElementById('forest-book-count');
        if (badge) badge.textContent = `${getUnlockedFriends().length}/${FOREST_FRIENDS.length}`;
    }

    // Hộp chúc mừng khi có bạn thú mới — hiện sau khi hoàn thành nhiệm vụ hoàn hảo.
    function showFriendUnlockCelebration(friend) {
        if (!friend) return;
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay open mu-ff-celebrate-overlay';
        overlay.innerHTML = `
            <div class="modal-box mu-ff-celebrate" onclick="event.stopPropagation()">
                <div class="mu-ff-celebrate-burst">✨🎉✨</div>
                <div class="mu-ff-celebrate-art">
                    <svg viewBox="0 0 160 160" width="120" height="120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${friend.svg()}</svg>
                </div>
                <h2>Bạn Mới Xuất Hiện! 🐾</h2>
                <p><strong>${friend.name}</strong> muốn kết bạn với bạn đó!</p>
                <p class="mu-ff-celebrate-tagline">"${friend.tagline}"</p>
                <button type="button" class="calc-btn" id="mu-ff-celebrate-ok">Tuyệt Vời! 🌟</button>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#mu-ff-celebrate-ok').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', () => overlay.remove());
        if (typeof playSound === 'function') playSound('correct');
    }

    global.FOREST_FRIENDS = FOREST_FRIENDS;
    global.getUnlockedFriends = getUnlockedFriends;
    global.unlockRandomFriend = unlockRandomFriend;
    global.openForestBook = openForestBook;
    global.closeForestBook = closeForestBook;
    global.refreshForestBadge = refreshForestBadge;
    global.showFriendUnlockCelebration = showFriendUnlockCelebration;

    document.addEventListener('DOMContentLoaded', refreshForestBadge);
})(window);
