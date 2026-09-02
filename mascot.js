
(function (global) {
    'use strict';

    const COLORS = {
        body: '#ffffff',
        bodyStroke: '#2b2b2b',
        patch: '#2b2b2b',
        blush: '#ffb3c1',
        mouth: '#2b2b2b',
        accent: '#ff8fab' 
    };


    function baseHead() {
        return `
            <!-- Tai -->
            <circle cx="27" cy="24" r="14" fill="${COLORS.patch}"/>
            <circle cx="73" cy="24" r="14" fill="${COLORS.patch}"/>
            <circle cx="27" cy="25" r="7" fill="${COLORS.accent}" opacity="0.55"/>
            <circle cx="73" cy="25" r="7" fill="${COLORS.accent}" opacity="0.55"/>

            <!-- Đầu -->
            <circle cx="50" cy="52" r="34" fill="${COLORS.body}" stroke="${COLORS.bodyStroke}" stroke-width="2.5"/>

            <!-- Má hồng -->
            <ellipse cx="28" cy="60" rx="7" ry="5" fill="${COLORS.blush}"/>
            <ellipse cx="72" cy="60" rx="7" ry="5" fill="${COLORS.blush}"/>

            <!-- Vá mắt đen -->
            <ellipse cx="36" cy="48" rx="10" ry="12" fill="${COLORS.patch}"/>
            <ellipse cx="64" cy="48" rx="10" ry="12" fill="${COLORS.patch}"/>

            <!-- Mũi -->
            <ellipse cx="50" cy="62" rx="4" ry="3" fill="${COLORS.patch}"/>
        `;
    }

    const MOODS = {
 
        wave: () => `
            ${baseHead()}
            <!-- Mắt mở to, vui vẻ -->
            <circle cx="36" cy="49" r="4" fill="#fff"/>
            <circle cx="64" cy="49" r="4" fill="#fff"/>
            <circle cx="37" cy="50" r="2.1" fill="#111"/>
            <circle cx="65" cy="50" r="2.1" fill="#111"/>
            <!-- Miệng cười hé -->
            <path d="M 42 68 Q 50 74 58 68" stroke="${COLORS.mouth}" stroke-width="2.5" fill="none" stroke-linecap="round"/>

            <!-- Tay vẫy: bàn tay hình tròn + cẳng tay, đặt bên phải đầu -->
            <g>
                <path d="M 82 58 Q 92 46 88 34" stroke="${COLORS.patch}" stroke-width="9" fill="none" stroke-linecap="round"/>
                <circle cx="88" cy="30" r="8" fill="${COLORS.patch}"/>
            </g>
            <!-- Vạch chuyển động của cái vẫy -->
            <path d="M 96 18 L 100 12" stroke="${COLORS.accent}" stroke-width="3" stroke-linecap="round"/>
            <path d="M 100 26 L 106 24" stroke="${COLORS.accent}" stroke-width="3" stroke-linecap="round"/>
        `,

        // Vui vẻ — mắt cong hình chữ ^ (nhắm vì cười), miệng cười to
        happy: () => `
            ${baseHead()}
            <path d="M 31 48 Q 36 43 41 48" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M 59 48 Q 64 43 69 48" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M 40 66 Q 50 78 60 66 Q 50 72 40 66 Z" fill="${COLORS.mouth}"/>
        `,

        // Ngại ngùng — mắt nhìn xuống/né, má ửng hồng đậm hơn, 2 tay
        // chụm lại gần mặt như đang bẽn lẽn.
        shy: () => `
            ${baseHead()}
            <ellipse cx="26" cy="61" rx="9" ry="6" fill="${COLORS.blush}"/>
            <ellipse cx="74" cy="61" rx="9" ry="6" fill="${COLORS.blush}"/>
            <path d="M 32 50 Q 36 53 40 50" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M 60 50 Q 64 53 68 50" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M 45 68 Q 50 71 55 68" stroke="${COLORS.mouth}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
            <!-- Hai tay chụm phía trước, hơi hạ thấp -->
            <circle cx="34" cy="82" r="7" fill="${COLORS.patch}"/>
            <circle cx="66" cy="82" r="7" fill="${COLORS.patch}"/>
        `,

        // Suy nghĩ — một tay chạm cằm, mắt nhìn lên, dấu chấm hỏi nhỏ
        thinking: () => `
            ${baseHead()}
            <circle cx="36" cy="46" r="4" fill="#fff"/>
            <circle cx="64" cy="46" r="4" fill="#fff"/>
            <circle cx="38" cy="45" r="2.1" fill="#111"/>
            <circle cx="66" cy="45" r="2.1" fill="#111"/>
            <path d="M 45 68 L 55 68" stroke="${COLORS.mouth}" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Tay chạm cằm -->
            <path d="M 70 70 Q 80 68 78 58" stroke="${COLORS.patch}" stroke-width="8" fill="none" stroke-linecap="round"/>
            <circle cx="66" cy="72" r="7" fill="${COLORS.patch}"/>
            <!-- Dấu chấm hỏi nhỏ bên trên -->
            <text x="80" y="20" font-size="18" font-weight="900" fill="${COLORS.accent}" font-family="sans-serif">?</text>
        `,

        // Phấn khích — mắt hình sao, hai tay giơ cao ăn mừng, vài tia lấp lánh
        // xung quanh. Dùng khi trả lời đúng liên tiếp hoặc khi bé chạm vào Bống.
        excited: () => `
            ${baseHead()}
            <!-- Mắt hình sao lấp lánh -->
            <path d="M 36 42 L 38 47 L 43 47 L 39 50 L 41 55 L 36 52 L 31 55 L 33 50 L 29 47 L 34 47 Z" fill="#ffd23f" stroke="${COLORS.patch}" stroke-width="1"/>
            <path d="M 64 42 L 66 47 L 71 47 L 67 50 L 69 55 L 64 52 L 59 55 L 61 50 L 57 47 L 62 47 Z" fill="#ffd23f" stroke="${COLORS.patch}" stroke-width="1"/>
            <path d="M 40 66 Q 50 80 60 66 Q 50 74 40 66 Z" fill="${COLORS.mouth}"/>
            <!-- Hai tay giơ cao -->
            <path d="M 20 60 Q 8 50 12 34" stroke="${COLORS.patch}" stroke-width="9" fill="none" stroke-linecap="round"/>
            <circle cx="13" cy="30" r="8" fill="${COLORS.patch}"/>
            <path d="M 80 60 Q 92 50 88 34" stroke="${COLORS.patch}" stroke-width="9" fill="none" stroke-linecap="round"/>
            <circle cx="87" cy="30" r="8" fill="${COLORS.patch}"/>
            <!-- Tia lấp lánh -->
            <path d="M 50 6 L 52 12 L 48 12 Z" fill="${COLORS.accent}"/>
            <path d="M 14 14 L 18 18 M 86 14 L 82 18" stroke="${COLORS.accent}" stroke-width="3" stroke-linecap="round"/>
        `,

        // Ngạc nhiên — mắt tròn to, miệng chữ O, tay ôm má, dùng khi mở hộp
        // giải thích hoặc gặp lỗi hay sai để nhắc nhở nhẹ nhàng, không dọa nạt.
        surprised: () => `
            ${baseHead()}
            <circle cx="36" cy="49" r="5" fill="#fff"/>
            <circle cx="64" cy="49" r="5" fill="#fff"/>
            <circle cx="36" cy="50" r="2.4" fill="#111"/>
            <circle cx="64" cy="50" r="2.4" fill="#111"/>
            <ellipse cx="50" cy="70" rx="5" ry="6" fill="${COLORS.mouth}"/>
            <!-- Tay chạm má ngạc nhiên -->
            <circle cx="24" cy="66" r="7" fill="${COLORS.patch}"/>
            <path d="M 30 66 Q 20 60 22 50" stroke="${COLORS.patch}" stroke-width="8" fill="none" stroke-linecap="round"/>
        `
    };

    /**
     * Sinh chuỗi HTML <svg> cho một mood/kích thước cho trước.
     * Luôn có class "mu-mascot" để CSS bên ngoài (style.css / auth-ui.js)
     * có thể style thêm (animation bob, shadow...).
     */
    function mascotSVG(mood, size) {
        const chosenMood = MOODS[mood] ? mood : 'happy';
        const px = Number(size) > 0 ? Number(size) : 60;
        const content = MOODS[chosenMood]();
        return `<svg class="mu-mascot" width="${px}" height="${px}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Linh vật Bống">${content}</svg>`;
    }

    // Expose ra global để các script khác (auth-ui.js, practice-engine.js...) dùng
    global.mascotSVG = mascotSVG;

    /**
     * Tự động đổ Bống vào các vị trí placeholder cố định trong index.html
     * (logo header + logo hộp thoại onboarding + mascot lớn ở màn hình chào)
     * ngay khi DOM sẵn sàng, để không còn span rỗng.
     */
    function autoInit() {
        const header = document.getElementById('header-mascot');
        if (header && !header.innerHTML.trim()) {
            header.innerHTML = mascotSVG('happy', 36);
        }
        const onboarding = document.getElementById('onboarding-mascot');
        if (onboarding && !onboarding.innerHTML.trim()) {
            onboarding.innerHTML = mascotSVG('wave', 48);
        }
        const hero = document.getElementById('hero-mascot');
        if (hero) {
            hero.innerHTML = mascotSVG('wave', 84);
            makeInteractive(hero, 'wave', 84);
        }
    }

    // --------------------------------------------------------------
    // TƯƠNG TÁC: chạm/bấm vào Bống ở bất kỳ đâu có class "mu-mascot-live"
    // (hoặc được đăng ký qua makeInteractive) sẽ khiến Bống đổi cảm xúc
    // trong chốc lát + bật lên một câu nói dễ thương, rồi quay lại như cũ.
    // Giúp linh vật cảm giác "sống", không chỉ là hình tĩnh.
    // --------------------------------------------------------------
    const REACT_MOODS = ['excited', 'surprised', 'happy'];
    const PHRASES = [
        'Giỏi quá à! 🎉', 'Cố lên nào! 💪', 'Học cùng Bống nhé!',
        'Bống thích bạn ghê! 🐼', 'Toán vui lắm luôn!', 'Chạm Bống nè, hihi~',
        'Mình luôn ở đây cổ vũ bạn!', 'Hôm nay học gì thế? 🌟'
    ];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function popBubble(el, text) {
        const old = el.querySelector('.mu-mascot-bubble');
        if (old) old.remove();
        const bubble = document.createElement('span');
        bubble.className = 'mu-mascot-bubble';
        bubble.textContent = text;
        el.appendChild(bubble);
        setTimeout(() => bubble.remove(), 1600);
    }

    /**
     * Đăng ký một phần tử chứa mascotSVG để có thể bấm vào tương tác.
     * el: phần tử DOM chứa <svg class="mu-mascot">
     * baseMood/baseSize: mood + kích thước "bình thường" để quay lại sau khi phản ứng.
     */
    function makeInteractive(el, baseMood, baseSize) {
        if (!el || el.dataset.muInteractive) return;
        el.dataset.muInteractive = '1';
        el.classList.add('mu-mascot-live');
        el.style.position = el.style.position || 'relative';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', 'Chạm vào Bống để chào');
        let timer = null;
        function react() {
            const mood = pick(REACT_MOODS);
            el.innerHTML = mascotSVG(mood, baseSize);
            el.classList.remove('mu-poke-pop');
            void el.offsetWidth; // restart animation
            el.classList.add('mu-poke-pop');
            popBubble(el, pick(PHRASES));
            clearTimeout(timer);
            timer = setTimeout(() => {
                el.innerHTML = mascotSVG(baseMood, baseSize);
            }, 1400);
        }
        el.addEventListener('click', react);
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); react(); }
        });
    }

    global.mascotMakeInteractive = makeInteractive;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
})(window);
