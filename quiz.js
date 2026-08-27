

let quizState = { level: null, questions: [], currentIndex: 0, score: 0, answered: false, wrongCount: 0, totalQuestions: 10, topicMode: false, dailyMission: false };
let quizTimerInterval = null;
let quizTimeLeft = 60;
const TOTAL_QUESTIONS = 10;
const TOPIC_QUIZ_TOTAL = 5;

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function totalQ() { return quizState.totalQuestions || TOTAL_QUESTIONS; }

let _speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
let _currentUtterance = null;
let _viVoiceWarned = false; 

function _findVietnameseVoice() {
    const voices = window.speechSynthesis.getVoices();
    return (
        voices.find(v => v.lang === 'vi-VN') ||
        voices.find(v => v.lang && v.lang.toLowerCase().startsWith('vi')) ||
        voices.find(v => /viet|việt/i.test(v.name)) ||
        null
    );
}

// Bọc từng "từ" (cụm ký tự không phải khoảng trắng) trong <span data-start/data-end>
// để có thể tô sáng đúng từ đang đọc, dựa trên charIndex do SpeechSynthesis trả về
// qua sự kiện 'boundary'. Chỉ dùng cho Lớp 1 & 2.
function wrapWordsForSpeech(text) {
    let idx = 0;
    return text.split(/(\s+)/).map((chunk) => {
        if (chunk === '' || /^\s+$/.test(chunk)) { idx += chunk.length; return chunk; }
        const start = idx;
        idx += chunk.length;
        return `<span class="tts-word" data-start="${start}" data-end="${idx}">${escapeHtml(chunk)}</span>`;
    }).join('');
}

// Gắn hiệu ứng phát sáng từng từ vào 1 utterance, dựa trên vị trí ký tự đang đọc.
// Không phải trình duyệt/giọng nào cũng bắn sự kiện 'boundary' (đặc biệt giọng
// tiếng Việt trên một số máy) — nếu không có sự kiện thì chỉ đơn giản là không
// phát sáng, phần đọc to vẫn hoạt động bình thường.
function attachWordHighlight(utt, containerEl) {
    if (!containerEl) return;
    const clearActive = () => containerEl.querySelectorAll('.tts-word.active').forEach((el) => el.classList.remove('active'));
    utt.onboundary = (e) => {
        if (e.name && e.name !== 'word') return;
        clearActive();
        const spans = containerEl.querySelectorAll('.tts-word');
        for (const span of spans) {
            const start = Number(span.dataset.start), end = Number(span.dataset.end);
            if (e.charIndex >= start && e.charIndex < end) { span.classList.add('active'); break; }
        }
    };
    const prevEnd = utt.onend, prevErr = utt.onerror;
    utt.onend = (e) => { clearActive(); if (prevEnd) prevEnd(e); };
    utt.onerror = (e) => { clearActive(); if (prevErr) prevErr(e); };
}

// Phát sáng 1 nút đáp án đúng lúc đáp án đó đang được đọc to, để các em
// Lớp 1 & 2 vừa nghe vừa nhìn thấy đáp án nào đang đọc rồi chạm chọn theo.
function _attachChoiceHighlight(utt, btnEl) {
    if (!btnEl) return;
    utt.onstart = () => btnEl.classList.add('tts-choice-active');
    const clear = () => btnEl.classList.remove('tts-choice-active');
    const prevEnd = utt.onend, prevErr = utt.onerror;
    utt.onend = (e) => { clear(); if (prevEnd) prevEnd(e); };
    utt.onerror = (e) => { clear(); if (prevErr) prevErr(e); };
}

function clearAllTtsHighlights() {
    document.querySelectorAll('.tts-word.active').forEach((el) => el.classList.remove('active'));
    document.querySelectorAll('.tts-choice-active').forEach((el) => el.classList.remove('tts-choice-active'));
}

// Đọc to đề bài — và nếu có truyền vào danh sách nút đáp án (choiceBtns),
// đọc tiếp lần lượt từng đáp án, đáp án nào đang đọc thì đáp án đó sáng lên
// (xem _attachChoiceHighlight), để các em Lớp 1 & 2 nghe xong là chạm chọn được luôn.
function speakQuestion(text, btnId, highlightEl, choiceBtns) {
    if (!_speechSupported) return;

    const viVoice = _findVietnameseVoice();
    if (!viVoice) {

        if (!_viVoiceWarned && typeof showToast === 'function') {
            showToast('Máy này chưa có giọng đọc tiếng Việt — hãy thử trên Chrome hoặc Android để bật tính năng đọc đề 🔊', 'info');
            _viVoiceWarned = true;
        }
        return;
    }

    window.speechSynthesis.cancel();
    clearAllTtsHighlights();

    const makeUtt = (t) => {
        const u = new SpeechSynthesisUtterance(t);
        u.voice = viVoice;
        u.lang = viVoice.lang;
        u.rate = 0.88;
        u.pitch = 1.1;
        u.volume = 1;
        return u;
    };

    // Hiệu ứng: nút đổi thành ⏸ khi đang đọc, trở lại 🔊 khi đọc xong toàn bộ
    // (kể cả khi có đọc thêm các đáp án phía sau câu hỏi)
    const btn = document.getElementById(btnId || 'quiz-read-btn');
    if (btn) {
        btn.textContent = '⏸ Đang đọc...';
        btn.classList.add('reading');
    }
    const resetBtn = () => { if (btn) { btn.textContent = '🔊 Nghe lại'; btn.classList.remove('reading'); } };

    const qUtt = makeUtt(text);
    if (highlightEl) attachWordHighlight(qUtt, highlightEl);
    _currentUtterance = qUtt;

    const hasChoices = Array.isArray(choiceBtns) && choiceBtns.length > 0;
    if (!hasChoices) {
        qUtt.onend = qUtt.onerror = resetBtn;
        window.speechSynthesis.speak(qUtt);
        return;
    }

    // speechSynthesis.speak() xếp hàng các utterance và tự phát nối tiếp nhau,
    // nên chỉ cần gọi speak() liên tiếp là câu hỏi rồi đến từng đáp án sẽ đọc lần lượt.
    window.speechSynthesis.speak(qUtt);

    const introUtt = makeUtt('Chọn đáp án đúng nhé.');
    window.speechSynthesis.speak(introUtt);

    choiceBtns.forEach((btnEl, i) => {
        const label = (btnEl.dataset && btnEl.dataset.ttsText) || btnEl.textContent || '';
        const cUtt = makeUtt(label);
        _attachChoiceHighlight(cUtt, btnEl);
        if (i === choiceBtns.length - 1) {
            const prevEnd = cUtt.onend, prevErr = cUtt.onerror;
            cUtt.onend = (e) => { if (prevEnd) prevEnd(e); resetBtn(); };
            cUtt.onerror = (e) => { if (prevErr) prevErr(e); resetBtn(); };
        }
        window.speechSynthesis.speak(cUtt);
    });
}

function stopSpeaking() {
    if (_speechSupported) window.speechSynthesis.cancel();
    clearAllTtsHighlights();
    const btn = document.getElementById('quiz-read-btn');
    if (btn) { btn.textContent = '🔊 Nghe đề'; btn.classList.remove('reading'); }
}


// ================================================================
// ======= 🎯 CHỌN ĐÁP ÁN (Lớp 1 & 2 — thay cho bộ đếm số) =======
// ================================================================
// Trước đây Lớp 1 & 2 dùng bộ đếm tay (bấm +/− hoặc kéo-thả) để tự gõ ra
// đáp số. Nay đổi hẳn sang cho các em CHẠM CHỌN đáp án trong 4 lựa chọn —
// khớp với cách đọc to đề + đọc to từng đáp án (xem speakQuestion ở trên):
// đáp án nào đang được đọc thì đáp án đó sáng lên, đọc xong các em chọn luôn.
const CHOICE_GRADES = ['lop1', 'lop2']; // chỉ Lớp 1 & 2 mới dùng chọn đáp án

function _isChoiceGrade() {
    return CHOICE_GRADES.includes(quizState.level);
}

// Sinh ra 3 đáp án gây nhiễu xung quanh đáp án đúng — dùng cho mọi câu trong
// ngân hàng Ôn Tập/Đề Thi Lớp 1 & 2 vì tất cả các câu ở đây đều có đáp án số.
// Chỉ sinh MỘT LẦN cho mỗi câu hỏi rồi lưu vào q.choices để không đổi thứ tự
// khi các em quay lại xem hoặc khi bấm nghe lại.
function _buildQuizChoices(q) {
    if (q.choices) return q.choices;
    const answer = q.answer;
    if (typeof answer !== 'number' || isNaN(answer)) { q.choices = [String(answer)]; return q.choices; }

    const spread = Math.max(2, Math.round(Math.abs(answer) * 0.3) || 2);
    const distractors = new Set();
    let guard = 0;
    while (distractors.size < 3 && guard < 50) {
        guard++;
        const delta = randInt(-spread, spread) || (Math.random() < 0.5 ? -1 : 1);
        const candidate = answer + delta;
        if (candidate === answer) continue;
        if (candidate < 0 && answer >= 0) continue; // đáp án không âm thì tránh phương án nhiễu bị âm cho đỡ rối
        distractors.add(candidate);
    }
    // Trường hợp đáp án quá nhỏ (VD 0 hoặc 1) khiến vòng lặp trên khó đủ 3 số khác nhau
    let step = 1;
    while (distractors.size < 3 && guard < 100) {
        guard++;
        const candidate = answer + step * (distractors.size % 2 === 0 ? 1 : -1);
        step++;
        if (candidate === answer || (candidate < 0 && answer >= 0)) continue;
        distractors.add(candidate);
    }

    const choices = Array.from(distractors).map(String);
    choices.push(String(answer));
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    q.choices = choices;
    return choices;
}

// Vẽ hàng nút đáp án cho Lớp 1 & 2. Lớp 3 trở lên vẫn gõ đáp số như cũ.
function renderChoiceInput(q) {
    const wrap = document.getElementById('quiz-choice-row');
    const nativeInput = document.getElementById('quiz-answer-input');
    if (!wrap) return;

    if (!_isChoiceGrade()) {
        wrap.style.display = 'none';
        wrap.innerHTML = '';
        if (nativeInput) nativeInput.style.display = 'block';
        return;
    }

    if (nativeInput) { nativeInput.style.display = 'none'; nativeInput.value = ''; }
    quizState.selectedChoice = undefined;

    const choices = _buildQuizChoices(q);
    const unit = q.unit ? ` ${q.unit}` : '';
    wrap.style.display = 'flex';
    wrap.innerHTML = choices.map((c) => {
        const ttsText = escapeHtml(c + unit);
        const safeVal = c.replace(/'/g, "\\'");
        return `<button type="button" class="mu-choice-btn quiz-choice-btn" data-value="${escapeHtml(c)}" data-tts-text="${ttsText}" onclick="selectQuizChoice(this, '${safeVal}')">${escapeHtml(c)}${unit ? `<span class="quiz-choice-unit">${escapeHtml(q.unit)}</span>` : ''}</button>`;
    }).join('');
}

// Các em chạm để chọn 1 đáp án — bấm "Xác Nhận Đáp Án" mới thực sự nộp bài,
// nên vẫn có thể đổi ý và chọn lại đáp án khác trước khi xác nhận.
function selectQuizChoice(btnEl, value) {
    if (quizState.answered) return;
    document.querySelectorAll('#quiz-choice-row .quiz-choice-btn').forEach((b) => b.classList.remove('mu-choice-selected'));
    btnEl.classList.add('mu-choice-selected');
    quizState.selectedChoice = value;
    const nativeInput = document.getElementById('quiz-answer-input');
    if (nativeInput) nativeInput.value = value;
}


const difficultyScale = { easy: 1, medium: 1.6, hard: 2.4 };
const difficultyLabels = { easy: 'Dễ', medium: 'Trung Bình', hard: 'Khó', luyen: 'Luyện Nhanh' };

// Toàn bộ tiểu học không giới hạn thời gian — trọng tâm là làm đúng
// và hiểu cách giải, không tạo áp lực thời gian cho học sinh nhỏ tuổi.
const TIMER_SECONDS_BY_LEVEL = { lop1: null, lop2: null, lop3: null, lop4: null, lop5: null };

const levelLabels = { lop1: 'Lớp 1', lop2: 'Lớp 2', lop3: 'Lớp 3', lop4: 'Lớp 4', lop5: 'Lớp 5' };
const LEVEL_KEYS = ['lop1', 'lop2', 'lop3', 'lop4', 'lop5'];

// Trộn tất cả generator của các chủ đề "quizPool !== false" trong 1 khối lớp
// thành một ngân hàng câu hỏi chung cho chế độ Ôn Tập / Đề Thi.
const quizGenerators = {};
LEVEL_KEYS.forEach((key, idx) => {
    const grade = idx + 1;
    const pool = [];
    GRADE_TOPICS[grade].forEach(topicId => {
        if (TOPIC_META[topicId].quizPool === false) return;
        TOPIC_GENERATORS[topicId].forEach(fn => pool.push(fn));
    });
    quizGenerators[key] = pool;
});

function resetQuizView() {
    document.querySelectorAll('#quiz-panels .formula-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('quiz-intro').classList.add('active');
    document.querySelectorAll('#menu-quiz .menu-item').forEach(i => i.classList.remove('active'));
    clearQuizTimer();
    const ws = document.getElementById('main-content');
    if (ws) ws.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

let pendingQuizLevel = null;

function chooseLevel(level, element) {
    pendingQuizLevel = level;
    document.querySelectorAll('#menu-quiz .menu-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');
    document.querySelectorAll('#quiz-panels .formula-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('quiz-difficulty-select').classList.add('active');
    document.getElementById('difficulty-level-label').textContent = levelLabels[level];
    closeSidebarOnMobile();
}

function startQuiz(difficulty) {
    const level = pendingQuizLevel;
    quizState = { level, difficulty, questions: [], currentIndex: 0, score: 0, answered: false, wrongCount: 0, totalQuestions: TOTAL_QUESTIONS, topicMode: false };

    const scale = difficultyScale[difficulty] || 1;
    const generators = quizGenerators[level];
    const weights = getWeakWeights(level, generators.length);
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
        const genIndex = weightedRandomIndex(weights);
        const q = generators[genIndex](scale);
        q.genIndex = genIndex;
        quizState.questions.push(q);
    }

    document.querySelectorAll('#quiz-panels .formula-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('quiz-active').classList.add('active');
    document.getElementById('quiz-level-label').textContent = `${levelLabels[level]} · ${difficultyLabels[difficulty]}`;

    renderQuizQuestion();
}


// ================= NHIỆM VỤ HÔM NAY =================
const DAILY_MISSION_TOTAL = 5;

function getDailyMissionDate() {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

function getSelectedStudentGrade() {
    const fromGlobal = parseInt(window.MU_GRADE, 10);
    if (fromGlobal >= 1 && fromGlobal <= 5) return fromGlobal;
    const saved = parseInt(localStorage.getItem('mu_selected_grade') || '', 10);
    return (saved >= 1 && saved <= 5) ? saved : 1;
}

function getDailyMissionProgress() {
    const today = getDailyMissionDate();
    const savedDate = localStorage.getItem('mu_daily_mission_date');
    const progress = savedDate === today ? parseInt(localStorage.getItem('mu_daily_mission_progress') || '0', 10) : 0;
    return Math.max(0, Math.min(DAILY_MISSION_TOTAL, progress));
}

function setDailyMissionProgress(progress) {
    localStorage.setItem('mu_daily_mission_date', getDailyMissionDate());
    localStorage.setItem('mu_daily_mission_progress', String(Math.max(0, Math.min(DAILY_MISSION_TOTAL, progress))));
    renderDailyMissionCard();
}

function renderDailyMissionCard() {
    const progress = getDailyMissionProgress();
    const bar = document.getElementById('daily-mission-progress');
    const status = document.getElementById('daily-mission-status');
    const desc = document.getElementById('daily-mission-desc');
    const btn = document.getElementById('daily-mission-btn');
    const level = getSelectedStudentGrade();

    if (bar) {
        bar.setAttribute('aria-valuenow', String(progress));
        bar.setAttribute('aria-label', `Đã hoàn thành ${progress} trên ${DAILY_MISSION_TOTAL} câu hỏi`);
        const steps = bar.querySelectorAll('.mission-step');
        const lines = bar.querySelectorAll('.mission-line');
        steps.forEach((step, i) => step.classList.toggle('done', i < progress));
        lines.forEach((line, i) => line.classList.toggle('filled', i < Math.max(0, progress - 1)));
    }
    if (status) {
        status.innerHTML = progress >= DAILY_MISSION_TOTAL
            ? '🎉 Đã hoàn thành! <strong>5 / 5 chiếc lá</strong>'
            : `Tiến độ hôm nay · <strong>${progress} / ${DAILY_MISSION_TOTAL} chiếc lá</strong>`;
    }
    if (desc) desc.textContent = `Trả lời 5 câu hỏi Toán cho Lớp ${level} để giúp Gấu con nhặt đủ lá nhé!`;
    if (btn) {
        btn.innerHTML = progress >= DAILY_MISSION_TOTAL
            ? 'LÀM LẠI NHIỆM VỤ <span aria-hidden="true">↻</span>'
            : 'BẮT ĐẦU NHIỆM VỤ <span aria-hidden="true">→</span>';
    }
}

function startDailyMission() {
    const level = `lop${getSelectedStudentGrade()}`;
    const generators = quizGenerators[level];
    if (!generators || !generators.length) {
        showToast('Chưa có câu hỏi cho khối lớp này.', 'error');
        return;
    }

    // Mỗi lần bấm bắt đầu sẽ tạo một nhiệm vụ 5 câu mới.
    setDailyMissionProgress(0);
    pendingQuizLevel = level;
    quizState = {
        level,
        difficulty: 'daily',
        questions: [],
        currentIndex: 0,
        score: 0,
        answered: false,
        wrongCount: 0,
        totalQuestions: DAILY_MISSION_TOTAL,
        topicMode: false,
        dailyMission: true
    };

    const weights = getWeakWeights(level, generators.length);
    for (let i = 0; i < DAILY_MISSION_TOTAL; i++) {
        const genIndex = weightedRandomIndex(weights);
        const q = generators[genIndex](difficultyScale.easy);
        q.genIndex = genIndex;
        quizState.questions.push(q);
    }

    switchMode('quiz');
    document.querySelectorAll('#quiz-panels .formula-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('quiz-active').classList.add('active');
    document.getElementById('quiz-level-label').textContent = `🌿 Nhiệm Vụ Hôm Nay · Lớp ${getSelectedStudentGrade()}`;
    renderQuizQuestion();
}

// Luyện nhanh 1 chủ đề cụ thể (gọi từ nút "🎯 Luyện Tập Ngay" trong panel học).
function practiceTopic(topicId) {
    switchMode('quiz');
    const gens = TOPIC_GENERATORS[topicId];
    quizState = { level: `topic:${topicId}`, difficulty: 'luyen', questions: [], currentIndex: 0, score: 0, answered: false, wrongCount: 0, totalQuestions: TOPIC_QUIZ_TOTAL, topicMode: true, topicId };
    for (let i = 0; i < TOPIC_QUIZ_TOTAL; i++) {
        const genIndex = randInt(0, gens.length - 1);
        const q = gens[genIndex](1);
        q.genIndex = genIndex;
        quizState.questions.push(q);
    }
    document.querySelectorAll('#quiz-panels .formula-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('quiz-active').classList.add('active');
    document.getElementById('quiz-level-label').textContent = `${TOPIC_META[topicId].icon} ${TOPIC_META[topicId].title}`;
    renderQuizQuestion();
}

// ---- Luyện tập thích ứng: ưu tiên ra lại các dạng câu học sinh hay sai ----
function getWeakWeights(level, count) {
    const stored = JSON.parse(localStorage.getItem(`mu_weak_${level}`) || '{}');
    const weights = [];
    for (let i = 0; i < count; i++) {
        weights.push(1 + Math.min(stored[i] || 0, 8));
    }
    return weights;
}

function weightedRandomIndex(weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}

function recordWeakness(level, genIndex, wasCorrect) {
    const key = `mu_weak_${level}`;
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    if (wasCorrect) stored[genIndex] = Math.max(0, (stored[genIndex] || 0) - 1);
    else stored[genIndex] = (stored[genIndex] || 0) + 2;
    localStorage.setItem(key, JSON.stringify(stored));
}

function renderQuizQuestion() {
    const q = quizState.questions[quizState.currentIndex];
    const qEl = document.getElementById('quiz-question');
    const isVoiceGrade = CHOICE_GRADES.includes(quizState.level); // ['lop1','lop2']
    // Lớp 1 & 2: bọc từng từ trong <span> để phát sáng theo từ khi đang đọc to
    // (xem attachWordHighlight). Lớp 3 trở lên giữ nguyên văn bản thường.
    if (isVoiceGrade) qEl.innerHTML = wrapWordsForSpeech(q.text);
    else qEl.textContent = q.text;
    const visualEl = document.getElementById('quiz-visual');
    if (visualEl) visualEl.innerHTML = q.visual ? q.visual : '';
    document.getElementById('quiz-progress').textContent = `Câu ${quizState.currentIndex + 1} / ${totalQ()}`;
    document.getElementById('quiz-score').textContent = `Điểm: ${quizState.score}`;
    document.getElementById('quiz-answer-input').value = '';
    document.getElementById('quiz-answer-input').disabled = false;
    document.getElementById('quiz-feedback').style.display = 'none';
    document.getElementById('quiz-submit-btn').style.display = 'block';
    document.getElementById('quiz-next-btn').style.display = 'none';
    quizState.answered = false;

    const pct = (quizState.currentIndex / totalQ()) * 100;
    document.getElementById('quiz-progress-fill').style.width = pct + '%';

    // --- F2: Chọn đáp án (Lớp 1 & 2) — thay cho bộ đếm số trước đây ---
    renderChoiceInput(q);

    // --- F1: Đọc đề bài + đọc từng đáp án (chỉ Lớp 1 & 2 — từ Lớp 3 các em tự đọc và tự gõ đáp số) ---
    // Cập nhật nút đọc
    const readBtn = document.getElementById('quiz-read-btn');
    const getChoiceBtns = () => Array.from(document.querySelectorAll('#quiz-choice-row .quiz-choice-btn'));
    if (readBtn) {
        readBtn.style.display = (_speechSupported && isVoiceGrade) ? 'flex' : 'none';
        readBtn.textContent = '🔊 Nghe đề';
        readBtn.classList.remove('reading');
        readBtn.onclick = () => speakQuestion(q.text, 'quiz-read-btn', qEl, isVoiceGrade ? getChoiceBtns() : null);
    }
    // Lớp 1 & 2: tự động đọc đề + đọc từng đáp án khi câu mới xuất hiện (Lớp 3 trở lên không cần)
    if (isVoiceGrade && _speechSupported) {
        // Chờ voices load xong (trình duyệt lazy-load voices)
        const doSpeak = () => speakQuestion(q.text, 'quiz-read-btn', qEl, getChoiceBtns());
        if (window.speechSynthesis.getVoices().length > 0) {
            setTimeout(doSpeak, 300);
        } else {
            window.speechSynthesis.onvoiceschanged = () => { setTimeout(doSpeak, 300); };
        }
    }

    startQuizTimer();

    // Focus: nếu Lớp 1/2 dùng chọn đáp án thì không focus input ẩn
    if (!_isChoiceGrade()) {
        document.getElementById('quiz-answer-input').focus();
    }
}

// ---- TIMER (không dùng cho tiểu học, nhưng giữ hàm để không vỡ code cũ) ----
function startQuizTimer() {
    clearQuizTimer();
    const timerWrap = document.getElementById('quiz-timer-wrap');
    const limit = TIMER_SECONDS_BY_LEVEL[quizState.level];
    if (limit === null || limit === undefined) {
        if (timerWrap) timerWrap.style.display = 'none';
        return;
    }
    if (timerWrap) timerWrap.style.display = '';
    quizTimeLeft = limit;
    updateTimerUI();
    quizTimerInterval = setInterval(() => {
        quizTimeLeft--;
        updateTimerUI();
        if (quizTimeLeft <= 0) {
            clearQuizTimer();
            if (!quizState.answered) timeoutQuestion();
        }
    }, 1000);
}

function updateTimerUI() {
    const fill = document.getElementById('quiz-timer-fill');
    const label = document.getElementById('quiz-timer-label');
    const limit = TIMER_SECONDS_BY_LEVEL[quizState.level] || 60;
    const pct = (quizTimeLeft / limit) * 100;
    fill.style.width = pct + '%';
    label.textContent = `⏱️ ${quizTimeLeft}s`;
    const isWarning = quizTimeLeft <= 10;
    fill.classList.toggle('warning', isWarning);
    label.classList.toggle('warning', isWarning);
}

function clearQuizTimer() {
    if (quizTimerInterval) { clearInterval(quizTimerInterval); quizTimerInterval = null; }
}

function timeoutQuestion() {
    const q = quizState.questions[quizState.currentIndex];
    quizState.answered = true;
    quizState.wrongCount++;
    document.getElementById('quiz-answer-input').disabled = true;
    document.getElementById('quiz-submit-btn').style.display = 'none';
    document.getElementById('quiz-next-btn').style.display = 'block';
    const feedback = document.getElementById('quiz-feedback');
    feedback.style.display = 'block';
    feedback.className = 'output-box is-error';
    feedback.innerHTML = `<div class="feedback-row"><span class="feedback-icon-big" aria-hidden="true">⏰</span><div class="feedback-text">Hết thời gian! Đáp án đúng là <strong>${q.answer}</strong>.</div></div>`;
    document.getElementById('quiz-score').textContent = `Điểm: ${quizState.score}`;
}

function submitQuizAnswer() {
    if (quizState.answered) return;
    clearQuizTimer();

    const q = quizState.questions[quizState.currentIndex];
    const feedback = document.getElementById('quiz-feedback');
    const isChoiceGrade = _isChoiceGrade();

    let userAnswer, userAnswerDisplay, isCorrect;

    if (isChoiceGrade) {
        // Lớp 1 & 2: chấm theo đáp án đã CHỌN (chạm nút), không gõ số nữa
        if (quizState.selectedChoice === undefined) {
            feedback.style.display = 'block';
            feedback.className = 'output-box is-error';
            feedback.innerHTML = '⚠️ Hãy chạm chọn một đáp án trước khi xác nhận nhé.';
            startQuizTimer();
            return;
        }
        userAnswer = parseFloat(quizState.selectedChoice);
        userAnswerDisplay = quizState.selectedChoice;
        isCorrect = Math.abs(userAnswer - q.answer) <= (q.tolerance || 0.001);
    } else {
        const input = document.getElementById('quiz-answer-input');
        userAnswer = parseFloat((input.value || '').replace(',', '.'));
        userAnswerDisplay = input.value;
        if (isNaN(userAnswer)) {
            feedback.style.display = 'block';
            feedback.className = 'output-box is-error';
            feedback.innerHTML = '⚠️ Vui lòng nhập một giá trị số hợp lệ.';
            startQuizTimer();
            return;
        }
        isCorrect = Math.abs(userAnswer - q.answer) <= (q.tolerance || 0.001);
    }

    stopSpeaking(); // Dừng đọc (nếu đang đọc đề/đáp án) ngay khi nộp bài

    quizState.answered = true;
    document.getElementById('quiz-answer-input').disabled = true;
    document.getElementById('quiz-submit-btn').style.display = 'none';
    document.getElementById('quiz-next-btn').style.display = 'block';
    feedback.style.display = 'block';

    // Lớp 1 & 2: khoá các nút đáp án lại, tô xanh đáp án đúng / đỏ đáp án đã chọn sai
    if (isChoiceGrade) {
        document.querySelectorAll('#quiz-choice-row .quiz-choice-btn').forEach((b) => {
            b.disabled = true;
            const btnValue = parseFloat(b.dataset.value);
            if (Math.abs(btnValue - q.answer) <= (q.tolerance || 0.001)) b.classList.add('quiz-choice-correct');
            else if (b.classList.contains('mu-choice-selected')) b.classList.add('quiz-choice-wrong');
        });
    }

    if (typeof q.genIndex === 'number' && !quizState.topicMode) recordWeakness(quizState.level, q.genIndex, isCorrect);

    const stepsHtml = q.steps ? renderAnimatedSteps(q.steps) : '';
    const answerDisplay = q.answer + (q.unit ? ' ' + q.unit : '');

    if (isCorrect) {
        quizState.score++;
        if (quizState.dailyMission) setDailyMissionProgress(quizState.score);
        feedback.className = 'output-box';
        feedback.innerHTML = `<div class="feedback-row"><span class="feedback-icon-big" aria-hidden="true">✅</span><div class="feedback-text"><strong>Chính xác!</strong> Đáp án đúng là <strong>${answerDisplay}</strong>.${stepsHtml}</div></div>`;
        playSound('correct');
        // --- F4: Mini celebration animation mỗi câu đúng — bung pháo giấy
        // ngay tại vị trí icon ✅ vừa hiện lên cho các em thấy ngay ---
        launchMiniCelebration(feedback.querySelector('.feedback-icon-big'));
    } else {
        quizState.wrongCount++;
        feedback.className = 'output-box is-error';
        feedback.innerHTML = `<div class="feedback-row"><span class="feedback-icon-big" aria-hidden="true">❌</span><div class="feedback-text"><strong>Chưa đúng.</strong> Đáp án đúng: <strong>${answerDisplay}</strong> — Bạn ${isChoiceGrade ? 'chọn' : 'nhập'}: ${userAnswerDisplay}${stepsHtml}</div></div>`;
        playSound('wrong');
    }
    document.getElementById('quiz-score').textContent = `Điểm: ${quizState.score}`;
}

function renderAnimatedSteps(steps) {
    const stepsInner = steps.map((s, i) =>
        `<div class="step-line" style="animation-delay:${i * 0.35}s">
            <span class="step-num">${i+1}</span><span class="step-text">${s}</span>
        </div>`
    ).join('');
    return `<div class="quiz-explain"><strong>🔎 Cách giải từng bước:</strong>${stepsInner}</div>`;
}

function nextQuizQuestion() {
    stopSpeaking(); // Dừng đọc nếu đang đọc khi chuyển câu
    quizState.currentIndex++;
    if (quizState.currentIndex >= totalQ()) finishQuiz();
    else renderQuizQuestion();
}

function finishQuiz() {
    clearQuizTimer();
    document.querySelectorAll('#quiz-panels .formula-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('quiz-result').classList.add('active');

    const score = quizState.score;
    const wrong = quizState.wrongCount;
    const total = totalQ();
    const pct = Math.round((score / total) * 100);

    document.getElementById('result-ring-num').textContent = score;
    const ringDen = document.querySelector('.ring-den');
    if (ringDen) ringDen.textContent = `/${total}`;
    document.getElementById('result-correct').textContent = score;
    document.getElementById('result-wrong').textContent = wrong;
    document.getElementById('result-pct').textContent = pct + '%';

    const circumference = 2 * Math.PI * 56;
    const offset = circumference - (score / total) * circumference;
    const circle = document.getElementById('score-ring-circle');
    circle.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)';
    setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);

    const title = document.getElementById('quiz-result-title');
    if (score === total) title.textContent = '🏆 Xuất Sắc! Điểm Tuyệt Đối!';
    else if (score >= total*0.8) title.textContent = '🎉 Làm Rất Tốt!';
    else if (score >= total*0.6) title.textContent = '👍 Khá Tốt!';
    else if (score >= total*0.4) title.textContent = '📖 Cần Cố Gắng Thêm!';
    else title.textContent = '💪 Hãy Luyện Tập Thêm!';

    const backBtn = document.getElementById('quiz-result-back-btn');
    if (backBtn) {
        if (quizState.dailyMission) {
            backBtn.textContent = '⬅ Về Trang Chủ';
            backBtn.onclick = () => showWelcome();
        } else if (quizState.topicMode) {
            backBtn.textContent = '⬅ Về Bài Học';
            backBtn.onclick = () => { switchMode('learn'); viewFormula(quizState.topicId, null); };
        } else {
            backBtn.textContent = '⬅ Trang Chủ';
            backBtn.onclick = () => showWelcome();
        }
    }

    if (!quizState.topicMode && !quizState.dailyMission) {
        saveHighScore(quizState.level, score);
        incrementQuizCount(quizState.level);
        saveQuizHistory(quizState.level, score, quizState.difficulty);
        recordDifficultyStats(quizState.level, quizState.difficulty, score);
        saveToLeaderboard(quizState.level, quizState.difficulty, score);
        refreshHighScores();
        checkAndRenderBadges();
    }

    // Nút "🏆 Xem Bảng Xếp Hạng" chỉ có ý nghĩa khi điểm vừa được lưu vào
    // bảng xếp hạng ở trên (bài Ôn Tập/Đề Thi thường) — luyện theo chủ đề
    // hay Nhiệm Vụ Hôm Nay không tính điểm vào bảng xếp hạng chung.
    const lbBtn = document.getElementById('quiz-result-leaderboard-btn');
    if (lbBtn) lbBtn.style.display = (!quizState.topicMode && !quizState.dailyMission) ? '' : 'none';

    if (score === total && total >= 5) {
        launchConfetti();
        // Nhiệm vụ hôm nay hoàn hảo (5/5) → có cơ hội kết bạn với một bạn thú mới trong rừng!
        if (quizState.dailyMission && typeof unlockRandomFriend === 'function') {
            const newFriend = unlockRandomFriend();
            if (newFriend && typeof showFriendUnlockCelebration === 'function') {
                setTimeout(() => showFriendUnlockCelebration(newFriend), 900);
            }
        }
    }
}

function retryQuiz() {
    if (quizState.topicMode) {
        practiceTopic(quizState.topicId);
        return;
    }
    pendingQuizLevel = quizState.level;
    startQuiz(quizState.difficulty);
    document.querySelectorAll('#menu-quiz .menu-item').forEach((btn, i) => {
        if (LEVEL_KEYS[i] === quizState.level) btn.classList.add('active');
    });
}

// ---- CONFETTI ----
function launchConfetti() {
    const colors = ['#4f46e5','#db2777','#16a34a','#ea580c','#0891b2','#7c3aed','#f59e0b'];
    for (let i = 0; i < 80; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.top = '-10px';
        el.style.background = colors[Math.floor(Math.random()*colors.length)];
        el.style.width = (Math.random()*8+6) + 'px';
        el.style.height = (Math.random()*8+6) + 'px';
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        el.style.animationDuration = (Math.random()*2+2) + 's';
        el.style.animationDelay = (Math.random()*1.5) + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
    showToast('🏆 Điểm tuyệt đối! Xuất sắc!', 'success');
}

// ---- HIGH SCORE & STATS ----
function saveHighScore(level, score) {
    const key = `mathuniverse_highscore_${level}`;
    const current = parseInt(localStorage.getItem(key) || '0');
    if (score > current) localStorage.setItem(key, String(score));
}

function incrementQuizCount(level) {
    const c = parseInt(localStorage.getItem(`mu_quiz_count_${level}`) || '0');
    localStorage.setItem(`mu_quiz_count_${level}`, String(c + 1));
}

function recordDifficultyStats(level, difficulty, score) {
    const sumKey = `mu_sum_${level}_${difficulty}`;
    const cntKey = `mu_count_${level}_${difficulty}`;
    const bestKey = `mu_best_${level}_${difficulty}`;
    const sum = parseFloat(localStorage.getItem(sumKey) || '0') + score;
    const cnt = parseInt(localStorage.getItem(cntKey) || '0') + 1;
    localStorage.setItem(sumKey, String(sum));
    localStorage.setItem(cntKey, String(cnt));
    const best = Math.max(parseInt(localStorage.getItem(bestKey) || '0'), score);
    localStorage.setItem(bestKey, String(best));
}

function getDifficultyStats(level, difficulty) {
    const cnt = parseInt(localStorage.getItem(`mu_count_${level}_${difficulty}`) || '0');
    const sum = parseFloat(localStorage.getItem(`mu_sum_${level}_${difficulty}`) || '0');
    const best = parseInt(localStorage.getItem(`mu_best_${level}_${difficulty}`) || '0');
    return { attempts: cnt, avg: cnt > 0 ? sum / cnt : 0, best };
}

function saveQuizHistory(level, score, difficulty) {
    const key = `mu_history_${level}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    history.push({ date: new Date().toISOString(), score, difficulty });
    if (history.length > 20) history.shift();
    localStorage.setItem(key, JSON.stringify(history));
}

function getQuizHistory(level) {
    return JSON.parse(localStorage.getItem(`mu_history_${level}`) || '[]');
}

function refreshHighScores() {
    LEVEL_KEYS.forEach(level => {
        const val = localStorage.getItem(`mathuniverse_highscore_${level}`);
        const el = document.getElementById(`highscore-${level}`);
        if (el) el.textContent = val
            ? `${levelLabels[level]}: ${val}/${TOTAL_QUESTIONS} điểm`
            : `${levelLabels[level]}: chưa có dữ liệu`;
    });
}

// ================================================================
// ======================= KHỞI TẠO APP ==========================
// ================================================================
(function init() {
    renderDailyMissionCard();
    renderRecentList();
    renderBookmarkList();
    syncBookmarkButtons();
    refreshHighScores();
})();
