(function (global) {
    'use strict';

    // ── Mỗi chapter có: nhân vật, bối cảnh, nhiệm vụ, mood mascot ──
    const STORY_ARC = [
        // ======= TUẦN 1: GẤU CON BĂNG RỪNG TÌM NHÀ MỚI =======
        {
            week: 1, day: 1,
            character: '🐻', characterName: 'Gấu con',
            bg: 'linear-gradient(135deg, #a8d8a8 0%, #88c98b 100%)',
            title: 'Gấu Con Lên Đường!',
            story: 'Gấu con tỉnh dậy và quyết định tìm một cái hang mới ấm áp hơn cho mùa đông. Nhưng hành trình thật dài...',
            mission: 'Giúp Gấu con thu thập đủ {n} chiếc lá khô để lót ổ nhé!',
            reward: '🍂 Gấu con có thêm {n} chiếc lá ấm áp!',
            emoji: '🍂',
        },
        {
            week: 1, day: 2,
            character: '🐻', characterName: 'Gấu con',
            bg: 'linear-gradient(135deg, #a8d8a8 0%, #7bc88f 100%)',
            title: 'Vượt Qua Con Suối!',
            story: 'Gấu con gặp một con suối nhỏ cắt ngang đường. Cần đếm đủ số đá mới bắc được cầu qua...',
            mission: 'Giúp Gấu con đặt {n} viên đá qua suối để bước qua nhé!',
            reward: '🪨 Gấu con đã vượt qua suối an toàn!',
            emoji: '🪨',
        },
        {
            week: 1, day: 3,
            character: '🐻', characterName: 'Gấu con',
            bg: 'linear-gradient(135deg, #b5e0b0 0%, #7bc88f 100%)',
            title: 'Tìm Quả Dại Trong Rừng!',
            story: 'Bụng đói rồi! Gấu con cần hái đủ quả dại để ăn bữa trưa rồi tiếp tục hành trình.',
            mission: 'Hái {n} trái quả dại trong rừng cho Gấu con nhé!',
            reward: '🍇 Gấu con đã no bụng, sẵn sàng đi tiếp!',
            emoji: '🍇',
        },
        {
            week: 1, day: 4,
            character: '🐻', characterName: 'Gấu con',
            bg: 'linear-gradient(135deg, #c4eabc 0%, #8ad4a0 100%)',
            title: 'Gặp Bạn Chồn!',
            story: 'Gấu con gặp Chồn trên đường — Chồn đang thu thập hạt dẻ cho mùa đông. Hai bạn cùng nhau làm cho nhanh!',
            mission: 'Thu thập {n} hạt dẻ cùng Chồn để chia nhau nhé!',
            reward: '🌰 Gấu con và Chồn đã có đủ hạt dẻ để dành!',
            emoji: '🌰',
        },
        {
            week: 1, day: 5,
            character: '🐻', characterName: 'Gấu con',
            bg: 'linear-gradient(135deg, #d0efc8 0%, #9adaac 100%)',
            title: 'Xây Tổ Ấm!',
            story: 'Cuối cùng Gấu con tìm được cái hang đẹp! Bây giờ cần thu thập đủ cành khô để lót bên trong cho ấm.',
            mission: 'Giúp Gấu con gom {n} cành khô để lót hang nhé!',
            reward: '🪵 Hang của Gấu con thật ấm áp và dễ chịu!',
            emoji: '🪵',
        },
        {
            week: 1, day: 6,
            character: '🐻', characterName: 'Gấu con',
            bg: 'linear-gradient(135deg, #d8f5d0 0%, #a0e0b8 100%)',
            title: 'Bữa Tiệc Ăn Mừng!',
            story: 'Gấu con mời tất cả bạn bè đến dự bữa tiệc ăn mừng nhà mới! Cần chuẩn bị đủ mật ong ngon.',
            mission: 'Chuẩn bị {n} hũ mật ong cho tiệc của Gấu con nhé!',
            reward: '🍯 Bữa tiệc thật vui và ngon miệng!',
            emoji: '🍯',
        },
        {
            week: 1, day: 7,
            character: '🐻', characterName: 'Gấu con',
            bg: 'linear-gradient(135deg, #e0f8d8 0%, #a8e8c0 100%)',
            title: 'Ngủ Đông Vui Vẻ!',
            story: 'Gấu con đã có nhà mới ấm áp, đầy thức ăn, và nhiều bạn bè! Sắp đến mùa đông rồi, cần thu dọn lần cuối.',
            mission: 'Giúp Gấu con sắp xếp {n} thứ gọn gàng trước khi ngủ đông!',
            reward: '💤 Gấu con ngủ đông thật ngon lành và hạnh phúc!',
            emoji: '💤',
        },

        // ======= TUẦN 2: THỎ BÔNG VƯỢT SÔNG VỀ DỰ HỘI =======
        {
            week: 2, day: 1,
            character: '🐰', characterName: 'Thỏ Bông',
            bg: 'linear-gradient(135deg, #fce4f0 0%, #f4b8d8 100%)',
            title: 'Thỏ Bông Nhận Thư Mời!',
            story: 'Thỏ Bông nhận được thư mời dự Hội Mùa Xuân bên kia sông! Hội chỉ tổ chức 1 lần/năm — không thể bỏ lỡ!',
            mission: 'Giúp Thỏ Bông chuẩn bị {n} cà rốt mang theo làm quà nhé!',
            reward: '🥕 Thỏ Bông có đủ quà mang đến hội rồi!',
            emoji: '🥕',
        },
        {
            week: 2, day: 2,
            character: '🐰', characterName: 'Thỏ Bông',
            bg: 'linear-gradient(135deg, #fce4f0 0%, #f0a8cc 100%)',
            title: 'Đến Bờ Sông!',
            story: 'Thỏ Bông đến bờ sông nhưng không có thuyền. Phải thu thập đủ cành tre để kết bè mới qua được!',
            mission: 'Thu thập {n} cành tre để Thỏ Bông kết bè vượt sông nhé!',
            reward: '🎋 Bè đã kết xong, Thỏ Bông sẵn sàng xuống bè!',
            emoji: '🎋',
        },
        {
            week: 2, day: 3,
            character: '🐰', characterName: 'Thỏ Bông',
            bg: 'linear-gradient(135deg, #fceef8 0%, #f4bce0 100%)',
            title: 'Dòng Sông Dữ Dội!',
            story: 'Sóng to quá! Thỏ Bông cần dùng {n} chiếc nón lá để làm buồm cho bè đi nhanh hơn.',
            mission: 'Giúp Thỏ Bông thu thập {n} chiếc nón lá làm buồm bè nhé!',
            reward: '🎏 Bè đi nhanh hơn rồi, gần đến bờ kia rồi!',
            emoji: '🎏',
        },
        {
            week: 2, day: 4,
            character: '🐰', characterName: 'Thỏ Bông',
            bg: 'linear-gradient(135deg, #fde8f8 0%, #f8c0e8 100%)',
            title: 'Đặt Chân Bên Kia Bờ!',
            story: 'Thỏ Bông đã vượt sông thành công! Nhưng quần áo bị ướt hết. Cần hái hoa để trang trí lại.',
            mission: 'Hái {n} bông hoa rừng để Thỏ Bông trang trí trang phục nhé!',
            reward: '🌸 Thỏ Bông đẹp hơn bao giờ hết rồi!',
            emoji: '🌸',
        },
        {
            week: 2, day: 5,
            character: '🐰', characterName: 'Thỏ Bông',
            bg: 'linear-gradient(135deg, #fef0f8 0%, #f8d0f0 100%)',
            title: 'Hội Mùa Xuân Bắt Đầu!',
            story: 'Hội Mùa Xuân vui ơi là vui! Thỏ Bông muốn tặng quà cho tất cả bạn bè mới gặp.',
            mission: 'Giúp Thỏ Bông phân chia {n} phần quà cho các bạn bè mới!',
            reward: '🎁 Tất cả bạn bè đều nhận được quà và rất vui!',
            emoji: '🎁',
        },
        {
            week: 2, day: 6,
            character: '🐰', characterName: 'Thỏ Bông',
            bg: 'linear-gradient(135deg, #fef2fc 0%, #fcd8f8 100%)',
            title: 'Múa Cùng Bạn Bè!',
            story: 'Điệu múa hội có {n} vòng xoay! Thỏ Bông cần đếm đúng để không bị lạc nhịp.',
            mission: 'Đếm đúng {n} vòng xoay để Thỏ Bông múa đúng điệu nhé!',
            reward: '💃 Thỏ Bông múa đẹp nhất hội — mọi người đều vỗ tay!',
            emoji: '💃',
        },
        {
            week: 2, day: 7,
            character: '🐰', characterName: 'Thỏ Bông',
            bg: 'linear-gradient(135deg, #fff0fc 0%, #fce0f8 100%)',
            title: 'Về Nhà Bình An!',
            story: 'Hội kết thúc, Thỏ Bông vui vẻ ra về. Lần này có thêm nhiều bạn mới cùng đi — đông vui hơn trên bè!',
            mission: 'Đếm {n} người bạn mới của Thỏ Bông cùng về nhé!',
            reward: '🌈 Thỏ Bông về đến nhà an toàn với đầy ắp kỷ niệm!',
            emoji: '🌈',
        },

        // ======= TUẦN 3: CÁO TINH NGHỊCH HỌC NẤU MẬT ONG =======
        {
            week: 3, day: 1,
            character: '🦊', characterName: 'Cáo Tinh Nghịch',
            bg: 'linear-gradient(135deg, #fef0d8 0%, #f8d090 100%)',
            title: 'Cáo Muốn Học Nấu Ăn!',
            story: 'Cáo ngửi thấy mùi mật ong từ nhà Gấu thơm quá! Cáo quyết tâm tự học làm bánh mật ong.',
            mission: 'Thu thập {n} bông hoa để Cáo lấy phấn hoa làm nguyên liệu nhé!',
            reward: '🌻 Cáo đã có đủ phấn hoa cho công thức bí mật!',
            emoji: '🌻',
        },
        {
            week: 3, day: 2,
            character: '🦊', characterName: 'Cáo Tinh Nghịch',
            bg: 'linear-gradient(135deg, #fff0d0 0%, #f8d898 100%)',
            title: 'Tìm Tổ Ong!',
            story: 'Cần tìm tổ ong! Cáo biết ong hay làm tổ trên cây cao. Nhưng cây nào vừa vặn nhất?',
            mission: 'Giúp Cáo đếm {n} cây để tìm cây có tổ ong đúng độ cao!',
            reward: '🐝 Cáo đã tìm được tổ ong ưng ý nhất!',
            emoji: '🐝',
        },
        {
            week: 3, day: 3,
            character: '🦊', characterName: 'Cáo Tinh Nghịch',
            bg: 'linear-gradient(135deg, #fff4d8 0%, #f8dca0 100%)',
            title: 'Xin Ong Chút Mật!',
            story: 'Cáo lịch sự xin ong một ít mật. Ong đồng ý nhưng yêu cầu Cáo giúp đếm số hoa trong vườn.',
            mission: 'Đếm {n} bông hoa trong vườn giúp Ong để đổi lấy mật nhé!',
            reward: '🍯 Ong vui vẻ tặng Cáo đúng {n} muỗng mật ngon!',
            emoji: '🍯',
        },
        {
            week: 3, day: 4,
            character: '🦊', characterName: 'Cáo Tinh Nghịch',
            bg: 'linear-gradient(135deg, #fff8e0 0%, #f8e0a8 100%)',
            title: 'Học Từ Bà Gấu!',
            story: 'Bà Gấu là người làm bánh mật ong ngon nhất rừng! Bà đồng ý dạy nhưng cần Cáo chuẩn bị nguyên liệu.',
            mission: 'Chuẩn bị {n} nguyên liệu theo danh sách của Bà Gấu nhé!',
            reward: '👩‍🍳 Bà Gấu hài lòng và bắt đầu dạy Cáo bí quyết!',
            emoji: '🫙',
        },
        {
            week: 3, day: 5,
            character: '🦊', characterName: 'Cáo Tinh Nghịch',
            bg: 'linear-gradient(135deg, #fffce0 0%, #f8e8b0 100%)',
            title: 'Nấu Thử Lần Đầu!',
            story: 'Cáo nấu thử mẻ bánh đầu tiên! Cần theo đúng công thức: thêm đúng từng loại nguyên liệu.',
            mission: 'Theo công thức để Cáo pha đúng {n} nguyên liệu nhé!',
            reward: '🧁 Bánh ra lò rồi — mùi thơm phức cả khu rừng!',
            emoji: '🧁',
        },
        {
            week: 3, day: 6,
            character: '🦊', characterName: 'Cáo Tinh Nghịch',
            bg: 'linear-gradient(135deg, #fffde8 0%, #f8ecca 100%)',
            title: 'Chia Sẻ Với Bạn Bè!',
            story: 'Bánh ngon quá! Cáo muốn chia cho tất cả bạn bè thưởng thức. Nhưng chia sao cho đều nhỉ?',
            mission: 'Chia {n} cái bánh đều cho các bạn trong rừng nhé!',
            reward: '🎂 Tất cả đều khen Cáo làm bánh ngon hơn cả Bà Gấu!',
            emoji: '🎂',
        },
        {
            week: 3, day: 7,
            character: '🦊', characterName: 'Cáo Tinh Nghịch',
            bg: 'linear-gradient(135deg, #fffce8 0%, #f8f0d0 100%)',
            title: 'Mở Tiệm Bánh Nhỏ!',
            story: 'Cáo quyết định mở tiệm bánh mật ong nhỏ cho cả rừng! Ngày khai trương cần chuẩn bị thật kỹ.',
            mission: 'Chuẩn bị {n} cái bánh cho ngày khai trương tiệm của Cáo!',
            reward: '🏪 Tiệm bánh của Cáo đông khách — hết hàng ngay ngày đầu!',
            emoji: '🏪',
        },

        // ======= TUẦN 4: SÓC NHANH TRÍ XÂY CÂY NHÀ TRÊN CÂY =======
        {
            week: 4, day: 1,
            character: '🐿️', characterName: 'Sóc Nhanh Trí',
            bg: 'linear-gradient(135deg, #e0f8d8 0%, #b8e8a0 100%)',
            title: 'Sóc Có Ý Tưởng Lớn!',
            story: 'Sóc nhìn thấy con người ở xa có những ngôi nhà trên cây thật đẹp! Sóc muốn tự xây cho mình một cái.',
            mission: 'Thu thập {n} mảnh gỗ để Sóc bắt đầu xây nhà trên cây nhé!',
            reward: '🪵 Sóc đã có đủ gỗ để bắt tay vào xây!',
            emoji: '🪵',
        },
        {
            week: 4, day: 2,
            character: '🐿️', characterName: 'Sóc Nhanh Trí',
            bg: 'linear-gradient(135deg, #e8f8e0 0%, #c0eca8 100%)',
            title: 'Đo Và Cắt Gỗ!',
            story: 'Phải cắt gỗ đúng kích thước mới lắp ghép được! Sóc cần đếm đúng số nhát cưa.',
            mission: 'Đếm đúng {n} nhát cưa để Sóc cắt gỗ đúng kích thước nhé!',
            reward: '📐 Tất cả mảnh gỗ đã đúng kích thước, sẵn sàng lắp ghép!',
            emoji: '📐',
        },
        {
            week: 4, day: 3,
            character: '🐿️', characterName: 'Sóc Nhanh Trí',
            bg: 'linear-gradient(135deg, #f0fce8 0%, #c8f0b0 100%)',
            title: 'Dựng Sàn Nhà!',
            story: 'Phần khó nhất là dựng sàn trên cao! Sóc cần đóng đúng số đinh để sàn không bị nghiêng.',
            mission: 'Giúp Sóc đóng đúng {n} cái đinh cho sàn nhà thật chắc nhé!',
            reward: '🔨 Sàn nhà vững chắc như bàn thạch — không hề rung lắc!',
            emoji: '🔨',
        },
        {
            week: 4, day: 4,
            character: '🐿️', characterName: 'Sóc Nhanh Trí',
            bg: 'linear-gradient(135deg, #f4fce8 0%, #cef2b8 100%)',
            title: 'Xây Bốn Vách!',
            story: 'Bốn bức vách cần đúng số ván gỗ mỗi phía. Sóc cần tính toán cẩn thận để không thiếu không thừa.',
            mission: 'Tính và chuẩn bị {n} tấm ván cho bốn vách nhà của Sóc nhé!',
            reward: '🏠 Bốn vách đã dựng xong — nhìn từ xa đã thấy hình ngôi nhà!',
            emoji: '🏠',
        },
        {
            week: 4, day: 5,
            character: '🐿️', characterName: 'Sóc Nhanh Trí',
            bg: 'linear-gradient(135deg, #f8fde8 0%, #d4f8c0 100%)',
            title: 'Lợp Mái Bằng Lá!',
            story: 'Mái nhà lợp bằng lá lớn chống mưa — đẹp và thân thiện môi trường! Cần đủ lá to mới che kín.',
            mission: 'Hái {n} chiếc lá lớn để Sóc lợp mái nhà chống mưa nhé!',
            reward: '🍀 Mái nhà xanh mướt, nhìn từ xa cứ như một phần của tán cây!',
            emoji: '🍀',
        },
        {
            week: 4, day: 6,
            character: '🐿️', characterName: 'Sóc Nhanh Trí',
            bg: 'linear-gradient(135deg, #fcffe8 0%, #dafcc8 100%)',
            title: 'Trang Trí Nội Thất!',
            story: 'Nhà xây xong rồi! Giờ là bước vui nhất: trang trí bên trong. Sóc muốn treo {n} chiếc đèn lồng nhỏ.',
            mission: 'Làm {n} chiếc đèn lồng nhỏ từ lá và cành cây cho Sóc nhé!',
            reward: '🏮 Nhà của Sóc lung linh như trong truyện cổ tích buổi tối!',
            emoji: '🏮',
        },
        {
            week: 4, day: 7,
            character: '🐿️', characterName: 'Sóc Nhanh Trí',
            bg: 'linear-gradient(135deg, #faffd8 0%, #e0ffc8 100%)',
            title: 'Lễ Khánh Thành Ngôi Nhà!',
            story: 'Sóc mời toàn bộ cư dân Rừng Xanh đến tham quan nhà mới! Cần chuẩn bị đủ chỗ ngồi cho mọi người.',
            mission: 'Chuẩn bị {n} chiếc ghế nhỏ bằng cục đá cho khách của Sóc nhé!',
            reward: '🎉 Rừng Xanh vang lên tiếng hò reo mừng ngôi nhà đẹp nhất rừng!',
            emoji: '🎉',
        },
    ];

    // Trả về chapter theo ngày hiện tại (rotate qua 28 chapter)
    // Dùng "ngày thứ N từ một mốc cố định" để chapter không đổi trong ngày
    function getTodayChapter() {
        const today = new Date();
        const epoch = new Date('2025-01-06'); // Thứ 2 đầu tiên làm mốc (tuần 1 chương 1)
        const daysDiff = Math.floor((today - epoch) / 86400000);
        const chapterIndex = ((daysDiff % STORY_ARC.length) + STORY_ARC.length) % STORY_ARC.length;
        return STORY_ARC[chapterIndex];
    }

    // Trả về tên ngày bằng tiếng Việt
    function getTodayLabel() {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return days[new Date().getDay()];
    }

    // Ghi đè renderDailyMissionCard nếu đã tồn tại, bổ sung nội dung cốt truyện
    function patchDailyMissionCard() {
        const chapter = getTodayChapter();
        const totalLeaves = 5; // DAILY_MISSION_TOTAL

        // Cập nhật tiêu đề và mô tả theo chapter
        const titleEl = document.getElementById('daily-mission-title');
        const descEl  = document.getElementById('daily-mission-desc');
        const kickerEl = document.querySelector('.daily-mission-kicker');
        const artImg   = document.querySelector('.daily-mission-mascot');

        if (titleEl) titleEl.textContent = `${chapter.character} ${chapter.title}`;
        if (descEl) {
            const grade = typeof getSelectedStudentGrade === 'function' ? getSelectedStudentGrade() : 1;
            descEl.textContent = chapter.mission.replace('{n}', totalLeaves) +
                ` (Toán Lớp ${grade})`;
        }
        if (kickerEl) {
            kickerEl.innerHTML = `🌿 NHIỆM VỤ HÔM NAY · ${getTodayLabel().toUpperCase()}`;
        }

        // Gradient nền nhẹ theo theme chapter
        const card = document.querySelector('.daily-mission-card');
        if (card) {
            card.style.setProperty('--chapter-bg', chapter.bg);
        }

        // Badge "Chương X"
        let weekBadge = document.getElementById('story-week-badge');
        if (!weekBadge && card) {
            weekBadge = document.createElement('div');
            weekBadge.id = 'story-week-badge';
            weekBadge.className = 'story-week-badge';
            card.insertBefore(weekBadge, card.firstChild);
        }
        if (weekBadge) {
            weekBadge.textContent = `Tuần ${chapter.week} · Ngày ${chapter.day}/7`;
        }
    }

    // Hook vào DOMContentLoaded và sau mỗi lần renderDailyMissionCard được gọi
    document.addEventListener('DOMContentLoaded', () => {
        // Patch sau khi renderDailyMissionCard gốc đã chạy
        setTimeout(patchDailyMissionCard, 100);
    });

    // Expose để quiz.js có thể dùng khi hiển thị context nhiệm vụ
    global.getTodayChapter = getTodayChapter;
    global.patchDailyMissionCard = patchDailyMissionCard;
    global.STORY_ARC = STORY_ARC;

})(window);
