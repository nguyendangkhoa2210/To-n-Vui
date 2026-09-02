(function () {
    const AUTH_URL = 'api/auth.php';
    const NAME_KEY = 'mu_last_student_name';
    const GRADE_KEY = 'mu_selected_grade';
    const DEVICE_ID_KEY = 'mu_device_id';
    const APP_KEY_RE = /^(mu_|mathuniverse_)/;

   
    const GRADE_GATE_DATA = [
        { grade: 1, emoji: '🐣', animal: 'Gà Con' },
        { grade: 2, emoji: '🐰', animal: 'Thỏ Con' },
        { grade: 3, emoji: '🐱', animal: 'Mèo Con' },
        { grade: 4, emoji: '🦊', animal: 'Cáo Con' },
        { grade: 5, emoji: '🦉', animal: 'Cú Tinh Anh' },
    ];

    const FLOATERS = [
        ['⭐', 10, 14, 40, 0, -8],
        ['🌈', 68, 10, 46, 1.1, 6],
        ['✏️', 20, 78, 38, 0.6, 10],
        ['🔺', 78, 74, 34, 1.8, -6],
        ['🎈', 46, 86, 36, 0.3, 12],
        ['🍎', 50, 6, 30, 1.4, -10],
        ['📏', 88, 40, 34, 0.9, 8],
    ];

    const BG_SYMBOLS = [
        ['⭐', 8, 8, 90, 0, -10],
        ['🌸', 78, 4, 80, 1.4, 8],
        ['🧩', 4, 82, 86, 0.7, 6],
        ['🎈', 82, 86, 90, 2.1, -6],
        ['🖍️', 42, 2, 60, 1.1, 12],
        ['🍭', 20, 92, 64, 1.8, -8],
        ['🔵', 60, 94, 50, 0.4, 10],
        ['🐾', 88, 46, 56, 2.4, -4],
    ];

    const style = document.createElement('style');
    style.textContent = `
    #mu-auth-overlay {
        position: fixed; inset: 0; z-index: 100000;
        background: var(--bg, #fffdf8);
        background-image: radial-gradient(circle, rgba(36,48,61,0.06) 1px, transparent 1px);
        background-size: 22px 22px;
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-body, inherit), sans-serif; padding: 20px;
        overflow: hidden;
    }
    /* -------- Nền trang trí phía sau card: vài khối màu loang mờ + ký hiệu
       toán học cỡ lớn, mờ nhạt, nằm dưới card (z-index thấp hơn) để không
       giành sự chú ý với form đăng nhập/đăng ký. -------- */
    #mu-auth-bgdeco {
        position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
    }
    #mu-auth-bgdeco .mu-blob {
        position: absolute; border-radius: 50%; filter: blur(60px); opacity: .35;
        animation: mu-blob-drift 14s ease-in-out infinite;
    }
    #mu-auth-bgdeco .mu-blob.b1 { width: 420px; height: 420px; top: -120px; left: -100px; background: var(--coral-lt, #ffe8e2); }
    #mu-auth-bgdeco .mu-blob.b2 { width: 380px; height: 380px; bottom: -140px; right: -80px; background: var(--blue-lt, #e4edff); animation-delay: 2.5s; }
    #mu-auth-bgdeco .mu-blob.b3 { width: 300px; height: 300px; bottom: 8%; left: 6%; background: var(--yellow-lt, #fff4d6); animation-delay: 5s; }
    #mu-auth-bgdeco .mu-blob.b4 { width: 260px; height: 260px; top: 10%; right: 10%; background: var(--green-lt, #e0f7e9); animation-delay: 1.2s; }
    @keyframes mu-blob-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(18px,-14px) scale(1.06); } }
    #mu-auth-bgdeco .mu-bgsym {
        position: absolute; font-family: var(--font-display, sans-serif); font-weight: 800;
        color: var(--text, #24303d); opacity: .16; line-height: 1; user-select: none;
        animation: mu-float 7s ease-in-out infinite; filter: grayscale(0.15);
    }
    @media (max-width: 720px) { #mu-auth-bgdeco { display: none; } }
    #mu-auth-card {
        position: relative; z-index: 1;
        width: 100%; max-width: 840px;
        background: var(--bg-card, #fff);
        border: 2px solid var(--text, #24303d);
        border-radius: var(--r-xl, 20px);
        box-shadow: var(--shadow-xl, 6px 10px 0 rgba(0,0,0,.16));
        overflow: hidden;
        display: grid; grid-template-columns: 1fr 1fr;
        animation: mu-card-in .45s cubic-bezier(.175,.885,.32,1.275);
    }
    #mu-auth-card.mu-loading-only { grid-template-columns: 1fr; max-width: 380px; }
    @keyframes mu-card-in { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } }

    /* -------- Panel thương hiệu (trái) -------- */
    #mu-auth-brand {
        position: relative; overflow: hidden;
        background: linear-gradient(160deg, var(--coral, #ff6b52) 0%, #ff8a6b 100%);
        padding: 36px 30px; display: flex; flex-direction: column; justify-content: center;
        color: #fff; min-height: 420px;
    }
    #mu-auth-brand .mu-floater {
        position: absolute; font-family: var(--font-display, sans-serif); font-weight: 800;
        color: rgba(255,255,255,0.55); user-select: none; pointer-events: none; line-height: 1;
        animation: mu-float 4.5s ease-in-out infinite; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.08));
    }
    @keyframes mu-float { 0%,100% { transform: translateY(0) rotate(var(--rot,0deg)); } 50% { transform: translateY(-14px) rotate(var(--rot,0deg)); } }
    #mu-auth-brand .mu-badge {
        width: 74px; height: 74px; border-radius: 50%;
        background: #fff;
        display: flex; align-items: center; justify-content: center;
        border: 3px solid var(--text, #24303d); box-shadow: var(--shadow-md, 3px 4px 0 rgba(0,0,0,.1));
        position: relative; z-index: 1; overflow: hidden;
    }
    #mu-auth-brand .mu-badge svg { width: 90%; height: 90%; }
    #mu-auth-brand h1 {
        font-family: var(--font-display, sans-serif); font-size: 26px; font-weight: 800;
        margin: 16px 0 6px; position: relative; z-index: 1;
    }
    #mu-auth-brand .mu-brand-sub {
        font-size: 14px; line-height: 1.5; opacity: .95; max-width: 260px;
        margin-bottom: 22px; position: relative; z-index: 1;
    }
    #mu-auth-brand .mu-feature-list { list-style: none; display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 1; }
    #mu-auth-brand .mu-feature-list li {
        display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700;
    }
    #mu-auth-brand .mu-feature-list .mu-fi {
        width: 30px; height: 30px; flex-shrink: 0; border-radius: var(--r-sm, 8px);
        background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 15px;
    }

    /* -------- Panel form (phải) -------- */
    #mu-auth-formside { padding: 34px 32px; display: flex; flex-direction: column; justify-content: center; }
    #mu-auth-formside h2 {
        font-family: var(--font-display, sans-serif); margin: 0 0 4px; font-size: 21px; color: var(--text, #24303d);
    }
    #mu-auth-formside p.mu-auth-sub {
        margin: 0 0 18px; font-size: 13px; color: var(--text-2, #55606b);
    }
    .mu-auth-tabs {
        display: flex; gap: 4px; margin-bottom: 20px; background: var(--bg, #f6f3ec);
        border: 2px solid var(--text, #24303d); border-radius: var(--r-sm, 8px); padding: 3px; position: relative;
    }
    .mu-auth-tab {
        flex: 1; padding: 8px; text-align: center; cursor: pointer; position: relative; z-index: 1;
        border: none; border-radius: 6px; font-weight: 800; font-size: 13px;
        background: transparent; color: var(--text-2, #55606b);
        font-family: var(--font-body, sans-serif); transition: color .2s ease;
    }
    .mu-auth-tab.active { color: #fff; }
    .mu-auth-tab-slider {
        position: absolute; top: 3px; bottom: 3px; width: calc(50% - 3px);
        background: var(--coral, #ff6b52); border-radius: 6px;
        box-shadow: var(--shadow-sm, 2px 3px 0 rgba(0,0,0,.1));
        transition: transform .25s cubic-bezier(.4,0,.2,1); z-index: 0;
    }
    .mu-auth-tab-slider.mu-pos-1 { transform: translateX(100%); }

    .mu-auth-field { margin-bottom: 13px; }
    .mu-auth-field label { display: block; font-size: 11.5px; font-weight: 800; margin-bottom: 5px; color: var(--text-2, #55606b); text-transform: uppercase; letter-spacing: .02em; }
    .mu-auth-input-wrap { position: relative; display: flex; align-items: center; }
    .mu-auth-input-wrap .mu-ic {
        position: absolute; left: 11px; font-size: 14px; opacity: .55; pointer-events: none;
    }
    .mu-auth-field input {
        width: 100%; box-sizing: border-box; padding: 10px 11px 10px 34px; font-size: 14px;
        font-family: var(--font-body, sans-serif);
        border: 2px solid var(--border-2, #ddd); border-radius: var(--r-sm, 8px);
        background: var(--bg, #fff); color: var(--text, #24303d); transition: var(--ease, all .2s ease);
    }
    .mu-auth-field input:focus { outline: none; border-color: var(--coral, #ff6b52); box-shadow: 0 0 0 3px var(--coral-lt, #ffe8e2); }
    .mu-auth-toggle-pw {
        position: absolute; right: 8px; background: none; border: none; cursor: pointer;
        font-size: 15px; opacity: .55; padding: 4px 6px; line-height: 1;
    }
    .mu-auth-toggle-pw:hover { opacity: .9; }

    .mu-auth-parent-toggle {
        margin: 4px 0 10px; font-size: 12px; color: var(--text-2, #55606b);
        display: flex; align-items: center; gap: 8px;
    }
    .mu-auth-parent-toggle input { width: 16px; height: 16px; cursor: pointer; }
    .mu-auth-parent-toggle label { cursor: pointer; font-weight: 700; }

    #mu-auth-submit {
        width: 100%; padding: 12px; font-size: 14px; font-weight: 800; cursor: pointer;
        font-family: var(--font-body, sans-serif);
        border: 2px solid var(--text, #24303d); border-radius: var(--r-sm, 8px);
        background: var(--coral, #ff6b52); color: #fff; box-shadow: var(--shadow-sm, 2px 3px 0 rgba(0,0,0,.1));
        margin-top: 6px; transition: var(--ease, all .2s ease);
        display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    #mu-auth-submit:hover:not(:disabled) { transform: translate(-1px,-1px); box-shadow: var(--shadow-md, 3px 4px 0 rgba(0,0,0,.12)); }
    #mu-auth-submit:disabled { opacity: .7; cursor: default; }
    .mu-spinner {
        width: 15px; height: 15px; border-radius: 50%;
        border: 2.5px solid rgba(255,255,255,.4); border-top-color: #fff;
        animation: mu-spin .7s linear infinite; display: none;
    }
    #mu-auth-submit.mu-busy .mu-spinner { display: inline-block; }
    #mu-auth-submit.mu-busy .mu-btn-text { opacity: .85; }
    @keyframes mu-spin { to { transform: rotate(360deg); } }

    #mu-auth-error {
        margin-top: 12px; font-size: 12.5px; color: #b3261e; min-height: 0;
        background: #fde9e7; border: 1.5px solid #f3b9b3; border-radius: var(--r-sm, 8px);
        padding: 0; display: flex; align-items: flex-start; gap: 6px; overflow: hidden;
        max-height: 0; opacity: 0; transition: all .2s ease;
    }
    #mu-auth-error.mu-show { max-height: 80px; opacity: 1; padding: 8px 10px; margin-top: 12px; }
    #mu-auth-error.mu-shake { animation: mu-shake .4s ease; }
    @keyframes mu-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }

    #mu-auth-loading { text-align: center; color: var(--text-2, #55606b); font-size: 14px; padding: 30px 10px; }
    #mu-auth-loading .mu-spinner-lg {
        width: 34px; height: 34px; margin: 0 auto 14px; border-radius: 50%;
        border: 3px solid var(--coral-lt, #ffe8e2); border-top-color: var(--coral, #ff6b52);
        animation: mu-spin .8s linear infinite;
    }

    @media (max-width: 720px) {
        #mu-auth-brand { display: none; }
        #mu-auth-card { grid-template-columns: 1fr; max-width: 400px; }
        #mu-auth-formside { padding: 30px 24px; }
    }

    /* -------- Badge người dùng đã đăng nhập (góc navbar) -------- */
    #mu-user-widget { position: relative; display: inline-flex; align-items: center; flex-shrink: 0; }
    #mu-user-btn {
        margin-left: 4px; flex-shrink: 0; padding: 0; width: 38px; height: 38px;
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        border: 2px solid var(--text, #24303d); background: var(--coral, #ff6b52); color: #fff;
        font-family: var(--font-display, sans-serif); font-weight: 800; font-size: 15px;
        cursor: pointer; box-shadow: var(--shadow-sm, 2px 3px 0 rgba(0,0,0,.1)); transition: var(--ease, all .2s ease);
    }
    #mu-user-btn:hover { transform: translate(-1px,-1px); box-shadow: var(--shadow-md, 3px 4px 0 rgba(0,0,0,.12)); }
    @media (max-width: 520px) {
        #mu-user-btn { width: 30px; height: 30px; font-size: 12px; margin-left: 3px; border-width: 1.5px; }
    }
    @media (max-width: 380px) {
        #mu-user-btn { width: 28px; height: 28px; font-size: 11px; }
    }
    /* -------- LỖI ĐÃ SỬA: dropdown "Đăng xuất" bị che hoàn toàn, không
       ấn được trên điện thoại --------
       Trước đây dropdown này dùng "position: absolute" (định vị theo
       #mu-user-widget, nằm bên trong .nav-icon-group -> .nav-actions).
       Trên màn hình hẹp, .nav-actions có "overflow-x: auto" để cuộn
       ngang dự phòng — nhưng theo đúng chuẩn CSS, hễ overflow-x khác
       "visible" thì overflow-y cũng TỰ ĐỘNG bị ép thành "auto". Vì
       .nav-actions chỉ cao ~34-40px (bằng đúng hàng icon) trong khi
       dropdown xổ xuống dưới ~150-200px, toàn bộ dropdown bị CẮT MẤT,
       ẩn hoàn toàn — bấm vào nút vẫn "mở" được (đổi class .open) nhưng
       không nhìn thấy gì để ấn "Đăng xuất" cả — đúng lỗi người dùng báo.

       Sửa: đổi sang "position: fixed" (không còn nằm trong dòng chảy
       bị cắt của .nav-actions nữa) và tính toạ độ top/right bằng JS
       (xem toggleUserDropdown bên dưới) mỗi lần mở, dựa theo vị trí
       thật của nút avatar trên màn hình — luôn hiện đúng chỗ, không
       bao giờ bị ancestor nào che/cắt nữa, hoạt động đúng dù cuộn
       trang hay xoay màn hình. */
    #mu-user-dropdown {
        position: fixed; z-index: 99998;
        background: var(--bg-card, #fff); border: 2px solid var(--text, #24303d);
        border-radius: var(--r-md, 12px); box-shadow: var(--shadow-lg, 4px 6px 0 rgba(0,0,0,.14));
        padding: 14px; min-width: 190px; max-width: calc(100vw - 20px); display: none;
    }
    #mu-user-dropdown.open { display: block; animation: mu-card-in .18s ease; }
    #mu-user-dropdown .mu-name {
        font-size: 13px; font-weight: 800; color: var(--text, #24303d);
        margin-bottom: 10px; word-break: break-word;
    }
    #mu-user-dropdown .mu-name small { display: block; font-weight: 600; color: var(--text-3, #94a0aa); font-size: 11px; margin-top: 2px; }
    #mu-logout-btn {
        width: 100%; border: none; background: var(--coral-lt, #ffe8e2); color: var(--coral, #ff6b52);
        font-weight: 800; font-size: 13px; padding: 8px 10px; border-radius: var(--r-sm, 8px);
        cursor: pointer; transition: var(--ease, all .2s ease);
    }
    #mu-logout-btn:hover { background: var(--coral, #ff6b52); color: #fff; }

    /* -------- Màn hình "Chọn Lớp Học" — hiện sau khi học sinh đăng nhập lần
       đầu (nếu phụ huynh chưa khoá sẵn lớp), mỗi lớp là 1 bạn thú cưng dễ
       thương để các em bấm chọn đúng lớp của mình. Sau khi chọn, công thức
       & ôn tập chỉ hiện đúng lớp đó, không bị rối vì thấy lớp khác. -------- */
    #mu-grade-gate { text-align: center; padding: 6px 4px; }
    #mu-grade-gate .mu-gg-mascot { margin: 0 auto 6px; animation: mu-bob 2.6s ease-in-out infinite; }
    #mu-grade-gate h2 {
        font-family: var(--font-display, sans-serif); font-size: 21px; color: var(--text, #24303d);
        margin: 4px 0 4px;
    }
    #mu-grade-gate p.mu-gg-sub { font-size: 13.5px; color: var(--text-2, #55606b); margin: 0 0 18px; line-height: 1.5; }
    .mu-grade-grid {
        display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;
    }
    @media (max-width: 720px) { .mu-grade-grid { grid-template-columns: repeat(3, 1fr); } }
    .mu-grade-card {
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        padding: 12px 4px 10px; cursor: pointer; background: var(--bg, #fff);
        border: 2.5px solid var(--text, #24303d); border-radius: var(--r-md, 12px);
        box-shadow: var(--shadow-sm, 2px 3px 0 rgba(0,0,0,.1));
        font-family: var(--font-body, sans-serif); transition: var(--ease, all .15s ease);
    }
    .mu-grade-card:hover { transform: translate(-2px,-2px) scale(1.03); box-shadow: var(--shadow-md, 3px 5px 0 rgba(0,0,0,.14)); }
    .mu-grade-card:active { transform: translate(1px,1px) scale(.97); box-shadow: none; }
    .mu-grade-card .mu-gc-emoji { font-size: 34px; line-height: 1; }
    .mu-grade-card .mu-gc-label { font-weight: 800; font-size: 13px; color: var(--text, #24303d); }
    .mu-grade-card .mu-gc-animal { font-size: 10.5px; color: var(--text-3, #94a0aa); font-weight: 700; }
    .mu-grade-card.mu-gc-1 { border-color: var(--orange, #ea580c); }
    .mu-grade-card.mu-gc-2 { border-color: var(--blue, #4f46e5); }
    .mu-grade-card.mu-gc-3 { border-color: var(--green, #16a34a); }
    .mu-grade-card.mu-gc-4 { border-color: var(--purple, #7c3aed); }
    .mu-grade-card.mu-gc-5 { border-color: var(--cyan, #0891b2); }

    /* -------- Huy hiệu "Đổi lớp" ở navbar (chỉ học sinh mới thấy) -------- */
    #mu-grade-badge {
        display: inline-flex; align-items: center; gap: 5px; margin-left: 4px; flex-shrink: 0;
        padding: 5px 10px; border-radius: var(--r-full, 999px);
        border: 2px solid var(--text, #24303d); background: var(--green-lt, #e0f7e9);
        font-family: var(--font-body, sans-serif); font-weight: 800; font-size: 12px; color: var(--text, #24303d);
        cursor: pointer; box-shadow: var(--shadow-sm, 2px 3px 0 rgba(0,0,0,.1)); transition: var(--ease, all .2s ease);
    }
    #mu-grade-badge:hover { transform: translate(-1px,-1px); box-shadow: var(--shadow-md, 3px 4px 0 rgba(0,0,0,.12)); }
    /* Lớp do phụ huynh khoá: đổi màu vàng + không có ý "bấm để đổi" như bình
       thường (vẫn bấm được, nhưng chỉ để xem thông báo, không mở lại màn chọn lớp). */
    #mu-grade-badge.mu-grade-badge-locked {
        background: #fef3c7; border-color: #b45309; color: #713f12; cursor: default;
    }
    #mu-grade-badge.mu-grade-badge-locked:hover { transform: none; box-shadow: var(--shadow-sm, 2px 3px 0 rgba(0,0,0,.1)); }
    @media (max-width: 520px) {
        #mu-grade-badge { padding: 4px 8px; font-size: 11px; }
    }
    /* Trên điện thoại: chỉ giữ icon khoá (nếu có) + emoji riêng từng lớp để
       vẫn nhận ra Lớp 1/2/3/4/5, ẩn bớt chữ "Lớp X" cho gọn — huy hiệu này
       trước đây to ngang với "Toán Vui", chiếm quá nhiều diện tích navbar
       trên màn hình nhỏ. Tên lớp đầy đủ vẫn còn trong title/aria-label. */
    @media (max-width: 640px) {
        #mu-grade-badge {
            gap: 3px; padding: 6px 8px; min-width: 34px; height: 34px;
            box-sizing: border-box; justify-content: center; font-size: 15px;
        }
        #mu-grade-badge .mu-grade-badge-text { display: none; }
    }
    @media (max-width: 380px) {
        #mu-grade-badge { min-width: 30px; height: 30px; padding: 5px 6px; font-size: 13px; }
    }
    `;
    document.head.appendChild(style);

    // ---------------- DOM overlay ----------------
    function bgDecoHtml() {
        const syms = BG_SYMBOLS.map(([sym, top, left, size, delay, rot]) =>
            `<span class="mu-bgsym" style="top:${top}%; left:${left}%; font-size:${size}px; animation-delay:${delay}s; --rot:${rot}deg;">${sym}</span>`
        ).join('');
        return `
          <div class="mu-blob b1"></div>
          <div class="mu-blob b2"></div>
          <div class="mu-blob b3"></div>
          <div class="mu-blob b4"></div>
          ${syms}`;
    }

    const overlay = document.createElement('div');
    overlay.id = 'mu-auth-overlay';
    overlay.innerHTML = `
      <div id="mu-auth-bgdeco">${bgDecoHtml()}</div>
      <div id="mu-auth-card" class="mu-loading-only">
        <div id="mu-auth-loading"><div class="mu-spinner-lg"></div>⏳ Đang kiểm tra đăng nhập...</div>
      </div>`;
    document.body.appendChild(overlay);

    function floatersHtml() {
        return FLOATERS.map(([sym, top, left, size, delay, rot]) =>
            `<span class="mu-floater" style="top:${top}%; left:${left}%; font-size:${size}px; animation-delay:${delay}s; --rot:${rot}deg;">${sym}</span>`
        ).join('');
    }

    // ---------------- Màn "Chọn Lớp Học" ----------------
    // Chỉ dành cho vai trò học sinh. Phụ huynh bỏ qua bước này, vào thẳng
    // app và xem được mọi khối lớp để dễ theo dõi/kiểm tra bài của con.
    function getSavedGrade() {
        try {
            const g = parseInt(localStorage.getItem(GRADE_KEY), 10);
            return (g >= 1 && g <= 5) ? g : null;
        } catch (e) { return null; }
    }

    function gradeCardsHtml() {
        return GRADE_GATE_DATA.map(({ grade, emoji, animal }) => `
            <button type="button" class="mu-grade-card mu-gc-${grade}" data-grade="${grade}">
                <span class="mu-gc-emoji">${emoji}</span>
                <span class="mu-gc-label">Lớp ${grade}</span>
                <span class="mu-gc-animal">${animal}</span>
            </button>`).join('');
    }

    function renderGradeGate(onDone) {
        overlay.style.display = 'flex';
        const card = document.getElementById('mu-auth-card');
        card.classList.remove('mu-loading-only');
        card.innerHTML = `
          <div id="mu-auth-brand">
            ${floatersHtml()}
            <div class="mu-badge">${mascotSVG('happy', 60)}</div>
            <h1>Bạn học lớp mấy?</h1>
            <p class="mu-brand-sub">Chọn đúng khối lớp để Bống chỉ đưa đúng công thức và bài ôn tập hợp với bạn thôi nhé!</p>
          </div>
          <div id="mu-grade-gate">
            <div class="mu-gg-mascot">${mascotSVG('wave', 84)}</div>
            <h2>Chọn Lớp Học Của Bạn 🎒</h2>
            <p class="mu-gg-sub">Bấm vào bạn thú cưng đúng khối lớp của mình nha!</p>
            <div class="mu-grade-grid">${gradeCardsHtml()}</div>
          </div>`;
        card.querySelectorAll('.mu-grade-card').forEach((btn) => {
            btn.addEventListener('click', () => {
                const grade = btn.dataset.grade;
                if (typeof window.MU_setGrade === 'function') window.MU_setGrade(grade);
                overlay.style.display = 'none';
                if (typeof onDone === 'function') onDone();
            });
        });
    }

    // true khi khối lớp của học sinh đang đăng nhập ĐANG BỊ PHỤ HUYNH KHOÁ
    // (khoi_lop_phu_huynh_dat khác NULL ở server) — học sinh không tự đổi
    // lớp được nữa, chỉ phụ huynh mới đổi lại được trong Bảng Điều Khiển.
    let gradeLockedByParent = false;

    // Huy hiệu "Đổi lớp" ở navbar — chỉ hiện cho học sinh, bấm vào để mở lại
    // màn chọn lớp bất cứ lúc nào (không cần đăng xuất). Nếu phụ huynh đã
    // khoá lớp cho con thì huy hiệu chỉ HIỂN THỊ (khoá 🔒), bấm vào sẽ báo
    // cho em biết lớp này do phụ huynh chọn, không mở lại màn chọn lớp.
    function renderGradeBadge(grade, locked) {
        if (window.MU_ROLE === 'parent') return;
        gradeLockedByParent = !!locked;
        const data = GRADE_GATE_DATA.find((d) => d.grade === grade) || GRADE_GATE_DATA[0];
        let badge = document.getElementById('mu-grade-badge');
        if (!badge) {
            badge = document.createElement('button');
            badge.id = 'mu-grade-badge';
            badge.type = 'button';
            const iconGroup = document.querySelector('.nav-icon-group');
            const navActions = document.querySelector('.nav-actions');
            (iconGroup || navActions || document.body).appendChild(badge);
            badge.addEventListener('click', () => {
                if (gradeLockedByParent) {
                    if (typeof showToast === 'function') {
                        showToast('Lớp học này do phụ huynh chọn cho bạn — nhờ bố mẹ đổi trong Bảng Điều Khiển nhé! 🔒', 'info');
                    }
                    return;
                }
                renderGradeGate(() => {
                    renderGradeBadge(getSavedGrade());
                });
            });
        }
        badge.title = gradeLockedByParent ? 'Lớp học do phụ huynh chọn — nhờ bố mẹ đổi giúp nhé' : 'Đổi lớp học';
        badge.setAttribute('aria-label', gradeLockedByParent ? `Lớp ${grade} — do phụ huynh chọn` : `Lớp ${grade} — bấm để đổi lớp`);
        badge.classList.toggle('mu-grade-badge-locked', gradeLockedByParent);
        badge.innerHTML = gradeLockedByParent
            ? `🔒 ${data.emoji} <span class="mu-grade-badge-text">Lớp ${grade}</span>`
            : `${data.emoji} <span class="mu-grade-badge-text">${GRADE_GATE_DATA.length ? 'Lớp ' + grade : ''}</span>`;
    }

    function renderForm(mode) {
        const isLogin = mode === 'login';
        const card = document.getElementById('mu-auth-card');
        card.classList.remove('mu-loading-only');
        card.innerHTML = `
          <div id="mu-auth-brand">
            ${floatersHtml()}
            <div class="mu-badge">${mascotSVG('happy', 60)}</div>
            <h1>Toán Vui Cùng Bống</h1>
            <p class="mu-brand-sub">Học Toán Lớp 1-5 thật vui — vừa xem hình, vừa tự làm bài, vừa được Bống khen mỗi khi đúng! 🎉</p>
            <ul class="mu-feature-list">
              <li><span class="mu-fi">🌟</span> Lưu lại từng ngôi sao con đã đạt được</li>
              <li><span class="mu-fi">🏆</span> Được vinh danh đúng tên trên bảng xếp hạng</li>
              <li><span class="mu-fi">🔄</span> Học tiếp trên điện thoại, máy tính đều được</li>
            </ul>
          </div>
          <div id="mu-auth-formside">
            <h2>${isLogin ? 'Chào bạn quay lại 👋' : 'Đăng ký tài khoản Phụ Huynh ✨'}</h2>
            <p class="mu-auth-sub">${isLogin ? 'Phụ huynh hoặc học sinh đã có tài khoản — đăng nhập để vào học/theo dõi.' : 'Chỉ dành cho phụ huynh. Sau khi đăng ký, vào Bảng Điều Khiển để tạo tài khoản học cho từng con.'}</p>
            <div class="mu-auth-tabs">
              <div class="mu-auth-tab-slider ${isLogin ? '' : 'mu-pos-1'}"></div>
              <button type="button" class="mu-auth-tab ${isLogin ? 'active' : ''}" data-mode="login">Đăng nhập</button>
              <button type="button" class="mu-auth-tab ${!isLogin ? 'active' : ''}" data-mode="register">Đăng ký (Phụ huynh)</button>
            </div>
            <form id="mu-auth-form" novalidate>
              ${!isLogin ? `
              <div class="mu-auth-field">
                <label>Tên hiển thị</label>
                <div class="mu-auth-input-wrap">
                  <span class="mu-ic">✏️</span>
                  <input type="text" id="mu-f-display" maxlength="100" placeholder="VD: Nguyễn Văn A" required>
                </div>
              </div>` : ''}
              <div class="mu-auth-field">
                <label>Tên đăng nhập</label>
                <div class="mu-auth-input-wrap">
                  <span class="mu-ic">👤</span>
                  <input type="text" id="mu-f-username" maxlength="30" placeholder="${isLogin ? 'Tên đăng nhập của bạn' : 'vd: phuhuynh01'}" required autocomplete="username">
                </div>
              </div>
              <div class="mu-auth-field">
                <label>Mật khẩu</label>
                <div class="mu-auth-input-wrap">
                  <span class="mu-ic">🔒</span>
                  <input type="password" id="mu-f-password" maxlength="100" placeholder="Tối thiểu 4 ký tự" required
                         autocomplete="${isLogin ? 'current-password' : 'new-password'}">
                  <button type="button" class="mu-auth-toggle-pw" id="mu-toggle-pw" title="Hiện/ẩn mật khẩu">👁️</button>
                </div>
              </div>
              <button type="submit" id="mu-auth-submit">
                <span class="mu-spinner"></span>
                <span class="mu-btn-text">${isLogin ? 'Đăng nhập' : 'Đăng ký'}</span>
              </button>
              <div id="mu-auth-error"></div>
            </form>
          </div>`;

        document.querySelectorAll('.mu-auth-tab').forEach((btn) => {
            btn.addEventListener('click', () => renderForm(btn.dataset.mode));
        });
        document.getElementById('mu-auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            submitForm(isLogin ? 'login' : 'register');
        });
        const toggleBtn = document.getElementById('mu-toggle-pw');
        toggleBtn.addEventListener('click', () => {
            const pw = document.getElementById('mu-f-password');
            const show = pw.type === 'password';
            pw.type = show ? 'text' : 'password';
            toggleBtn.textContent = show ? '🙈' : '👁️';
        });

        // Focus ô đầu tiên để gõ ngay được, tiện cho máy dùng bàn phím vật lý.
        const firstInput = document.querySelector('#mu-auth-form input');
        if (firstInput) firstInput.focus();
    }

    function showError(msg) {
        const errEl = document.getElementById('mu-auth-error');
        if (!errEl) return;
        errEl.innerHTML = `<span>⚠️</span><span>${escapeHtml(msg)}</span>`;
        errEl.classList.remove('mu-shake');
        errEl.classList.add('mu-show');
        // trigger reflow để animation rung chạy lại được mỗi lần lỗi mới
        void errEl.offsetWidth;
        errEl.classList.add('mu-shake');
    }

    function setBusy(busy) {
        const btn = document.getElementById('mu-auth-submit');
        if (!btn) return;
        btn.disabled = busy;
        btn.classList.toggle('mu-busy', busy);
    }

    async function submitForm(mode) {
        setBusy(true);
        const errEl = document.getElementById('mu-auth-error');
        if (errEl) errEl.classList.remove('mu-show');

        const username = document.getElementById('mu-f-username').value.trim();
        const password = document.getElementById('mu-f-password').value;
        const displayName = mode === 'register' ? document.getElementById('mu-f-display').value.trim() : undefined;

        try {
            
            const res = await fetch(`${AUTH_URL}?action=${mode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, display_name: displayName }),
            });
            const json = await res.json();
            if (!res.ok || !json.ok) {
                showError(json.error || 'Có lỗi xảy ra, thử lại nhé.');
                setBusy(false);
                return;
            }
            onAuthenticated(json);
        } catch (e) {
            showError('Không kết nối được máy chủ.');
            setBusy(false);
        }
    }

    function clearLocalAppData() {
        // Xoá dữ liệu app cũ trong localStorage (trừ chính key device_id, xoá riêng)
        // để tránh máy dùng chung (phòng máy tính) lộ dữ liệu của học sinh trước.
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (APP_KEY_RE.test(key) && key !== DEVICE_ID_KEY) toRemove.push(key);
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
    }

    async function onAuthenticated(info) {
        window.MU_ROLE = info.role || 'student';

     
        if (window.MU_ROLE === 'parent') {
            window.location.href = 'parent.html';
            return;
        }

        
        const previousDeviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (previousDeviceId && previousDeviceId !== info.device_id) {
            clearLocalAppData();
        }

        window.MU_DB.setDeviceId(info.device_id);

      
        await window.MU_DB.pullNow();

        localStorage.setItem(NAME_KEY, info.display_name);
        if (typeof window.currentStudentName !== 'undefined') {
            window.currentStudentName = info.display_name;
        } else {
            try { currentStudentName = info.display_name; } catch (e) { /* biến chưa tồn tại, bỏ qua */ }
        }
        renderUserBadge(info.display_name);

        // Bật bộ đếm giờ + khóa theo giới hạn cho tài khoản HỌC SINH (mọi học
        // sinh giờ đều đăng nhập thật, có student_id ở server — không còn chế
        // độ khách nữa) — xem usage-guard.js.
        if (window.MU_USAGE && typeof window.MU_USAGE.start === 'function') {
            window.MU_USAGE.start();
        }

        if (info.locked_grade) {
       
            try { localStorage.setItem(GRADE_KEY, String(info.locked_grade)); } catch (e) { /* bỏ qua nếu bị chặn */ }
            if (typeof window.MU_setGrade === 'function') window.MU_setGrade(info.locked_grade);
            overlay.style.display = 'none';
            renderGradeBadge(info.locked_grade, true);
        } else {
            const saved = getSavedGrade();
            if (saved) {
                if (typeof window.MU_setGrade === 'function') window.MU_setGrade(saved);
                overlay.style.display = 'none';
                renderGradeBadge(saved, false);
            } else {
                renderGradeGate(() => renderGradeBadge(getSavedGrade(), false));
            }
        }
    }

   
    function initials(name) {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        // Ưu tiên chữ cái đầu của từ cuối (thường là tên gọi trong tiếng Việt).
        const last = parts[parts.length - 1][0] || '';
        return last.toUpperCase();
    }

    function renderUserBadge(name) {
        let widget = document.getElementById('mu-user-widget');
        if (!widget) {
            widget = document.createElement('div');
            widget.id = 'mu-user-widget';
            widget.innerHTML = `
              <button id="mu-user-btn" type="button" title="Tài khoản"></button>
              <div id="mu-user-dropdown">
                <div class="mu-name"></div>
                <button id="mu-logout-btn" type="button">Đăng xuất</button>
              </div>`;

            // Ưu tiên chèn cùng nhóm icon 🌙🔊🖥️ có sẵn (cùng kích thước 40x40,
            // không làm hàng .nav-actions bị tràn/đè lên mode-switch như trước).
            const iconGroup = document.querySelector('.nav-icon-group');
            const navActions = document.querySelector('.nav-actions');
            if (iconGroup) {
                iconGroup.appendChild(widget);
            } else if (navActions) {
                navActions.appendChild(widget);
            } else {
                widget.style.position = 'fixed';
                widget.style.top = '10px';
                widget.style.right = '12px';
                widget.style.zIndex = '99998';
                document.body.appendChild(widget);
            }

          
            function positionUserDropdown() {
                const btn = document.getElementById('mu-user-btn');
                const dd = document.getElementById('mu-user-dropdown');
                if (!btn || !dd) return;
                const r = btn.getBoundingClientRect();
                const margin = 10;
                let right = window.innerWidth - r.right;
                if (right < margin) right = margin;
                const maxRight = window.innerWidth - 190 - margin; // 190 = min-width dropdown
                if (right > maxRight) right = Math.max(margin, maxRight);
                dd.style.top = (r.bottom + 10) + 'px';
                dd.style.right = right + 'px';
            }
            document.getElementById('mu-user-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const dd = document.getElementById('mu-user-dropdown');
                const willOpen = !dd.classList.contains('open');
                if (willOpen) positionUserDropdown();
                dd.classList.toggle('open', willOpen);
            });
            document.addEventListener('click', (e) => {
                const dd = document.getElementById('mu-user-dropdown');
                if (dd && !widget.contains(e.target) && !dd.contains(e.target)) dd.classList.remove('open');
            });
            // position: fixed định vị theo viewport, không theo trang — nếu
            // người dùng cuộn trang hoặc xoay màn hình lúc dropdown đang mở,
            // tính lại toạ độ để không bị lệch khỏi nút avatar.
            window.addEventListener('scroll', () => {
                const dd = document.getElementById('mu-user-dropdown');
                if (dd && dd.classList.contains('open')) positionUserDropdown();
            }, true);
            window.addEventListener('resize', () => {
                const dd = document.getElementById('mu-user-dropdown');
                if (dd && dd.classList.contains('open')) positionUserDropdown();
            });
            document.getElementById('mu-logout-btn').addEventListener('click', logout);
        }
       
        widget.querySelector('#mu-user-btn').textContent = initials(name);
        widget.querySelector('.mu-name').innerHTML = `👤 ${escapeHtml(name)}<small>Đã đăng nhập</small>`;
    }

    function escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    async function logout() {
       
        try { await window.MU_DB.pushNow(); } catch (e) { /* offline thì thôi, vẫn cho đăng xuất cục bộ */ }
        try { await fetch(`${AUTH_URL}?action=logout`, { method: 'POST' }); } catch (e) { /* offline cũng cho đăng xuất cục bộ */ }

       
        location.reload();
    }

    async function checkSession() {
        try {
            const res = await fetch(`${AUTH_URL}?action=me`);
            const json = await res.json();
            if (json.ok && json.logged_in) {
                onAuthenticated(json);
            } else {
               
                overlay.style.display = 'flex';
                renderForm('login');
            }
        } catch (e) {

            overlay.style.display = 'flex';
            renderForm('login');
            showError('Không kết nối được máy chủ.');
        }
    }

   
    checkSession();
})();