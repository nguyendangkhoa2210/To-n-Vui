window.MU_PRACTICE = (function () {
    const state = {}; // topicId -> { exercise, answered }

    function getScore(topicId) {
        return JSON.parse(localStorage.getItem(`mu_topic_score_${topicId}`) || '{"correct":0,"total":0}');
    }
    function saveScore(topicId, correct, total) {
        localStorage.setItem(`mu_topic_score_${topicId}`, JSON.stringify({ correct, total }));
    }

    function scoreLineHtml(topicId) {
        const s = getScore(topicId);
        return `<span class="mu-practice-score">⭐ Đã làm đúng ${s.correct}/${s.total} câu</span>`;
    }

    function mount(topicId) {
        const zone = document.getElementById(`practice-${topicId}`);
        if (!zone) return;
        zone.innerHTML = `
            <div class="mu-practice-head">
                <span class="mu-practice-title">🎯 Luyện Tập</span>
                ${scoreLineHtml(topicId)}
            </div>
            <div class="mu-practice-body" id="pbody-${topicId}">
                <button class="calc-btn" onclick="MU_PRACTICE.next('${topicId}')">▶ Bắt Đầu Làm Bài</button>
            </div>`;
    }

    function pickGenerator(topicId) {
        const gens = TOPIC_GENERATORS[topicId];
        return gens[Math.floor(Math.random() * gens.length)];
    }

    function next(topicId) {
        const gen = pickGenerator(topicId);
        const ex = gen(1);
        ex.inputType = ex.inputType || 'number';

        // Lớp 1 & 2: đổi câu hỏi dạng "gõ đáp số" thành "chạm chọn đáp án" —
        // các em nhỏ thao tác bằng cách chạm sẽ dễ và vui hơn gõ bàn phím
        // (đỡ lỗi gõ nhầm, đỡ cần biết chữ số nhiều chữ số). Không đụng tới
        // câu dạng 'text'/'choice' đã có sẵn — chỉ chuyển câu số học thường.
        const grade = (typeof getSelectedStudentGrade === 'function') ? getSelectedStudentGrade() : null;
        if ((grade === 1 || grade === 2) && ex.inputType === 'number' && typeof ex.answer === 'number') {
            const answerStr = String(ex.answer);
            const spread = Math.max(2, Math.round(Math.abs(ex.answer) * 0.3) || 2);
            const distractors = new Set();
            let guard = 0;
            while (distractors.size < 3 && guard < 40) {
                guard++;
                const delta = randInt(-spread, spread) || (Math.random() < 0.5 ? -1 : 1);
                const candidate = ex.answer + delta;
                if (candidate === ex.answer || candidate < 0) continue;
                distractors.add(String(candidate));
            }
            // Đáp án quá nhỏ (VD 0 hoặc 1) có thể khiến vòng lặp trên không đủ 3 số
            // khác nhau (do né số âm) — bù thêm bằng các số lân cận cố định.
            let step = 1;
            while (distractors.size < 3 && guard < 80) {
                guard++;
                const candidate = ex.answer + step;
                step++;
                if (candidate === ex.answer || candidate < 0) continue;
                distractors.add(String(candidate));
            }
            const choices = Array.from(distractors);
            choices.push(answerStr);
            for (let i = choices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [choices[i], choices[j]] = [choices[j], choices[i]];
            }
            ex.choices = choices;
            ex.answer = answerStr;
            ex.inputType = 'choice';
        }

        state[topicId] = { exercise: ex, answered: false };

        const body = document.getElementById(`pbody-${topicId}`);
        let inputHtml = '';
        if (ex.inputType === 'choice') {
            // Đáp án nào đang được đọc to sẽ sáng lên (xem readAloud bên dưới &
            // speakQuestion trong quiz.js) — hỗ trợ cho .tts-choice-active
            inputHtml = `<div class="mu-choice-row" id="choices-${topicId}">` +
                ex.choices.map(c => {
                    const label = String(c);
                    const ttsText = label + (ex.unit ? ' ' + ex.unit : '');
                    return `<button class="mu-choice-btn" data-value="${escapeHtml(label)}" data-tts-text="${escapeHtml(ttsText)}" onclick="MU_PRACTICE.selectChoice('${topicId}', this, '${label.replace(/'/g,"\\'")}')">${escapeHtml(label)}${ex.unit ? `<span class="quiz-choice-unit">${escapeHtml(ex.unit)}</span>` : ''}</button>`;
                }).join('') +
                `</div>`;
        } else {
            inputHtml = `<div class="input-area row">
                <input type="${ex.inputType === 'text' ? 'text' : 'number'}" step="any" id="ans-${topicId}" placeholder="Gõ đáp số của bạn...">
                ${ex.unit ? `<span class="mu-unit-tag">${ex.unit}</span>` : ''}
            </div>`;
        }

        const isVoiceGrade = grade === 1 || grade === 2;
        body.innerHTML = `
            <div class="mu-practice-q" id="q-${topicId}">${isVoiceGrade && typeof wrapWordsForSpeech === 'function' ? wrapWordsForSpeech(ex.text) : escapeHtml(ex.text)}</div>
            ${isVoiceGrade && typeof speakQuestion === 'function' ? `<button type="button" class="mu-practice-read-btn" id="read-${topicId}" onclick="MU_PRACTICE.readAloud('${topicId}')">🔊 Nghe câu hỏi</button>` : ''}
            ${ex.visual ? `<div class="mu-practice-visual">${ex.visual}</div>` : ''}
            ${inputHtml}
            <button class="calc-btn" id="check-${topicId}" onclick="MU_PRACTICE.check('${topicId}')">✓ Kiểm Tra</button>
            <div class="output-box" id="fb-${topicId}" style="display:none;"></div>`;

        // Lớp 1 & 2: tự động đọc to câu hỏi để các bạn chưa đọc nhanh vẫn hiểu bài
        // (dùng chung engine giọng nói tiếng Việt của quiz.js, nạp trước file này).
        if (isVoiceGrade && typeof speakQuestion === 'function') {
            setTimeout(() => readAloud(topicId), 300);
        }
    }

    function readAloud(topicId) {
        const st = state[topicId];
        if (!st || typeof speakQuestion !== 'function') return;
        // Câu dạng "chọn đáp án": đọc đề xong rồi đọc lần lượt từng đáp án,
        // đáp án nào đang đọc thì sáng lên (đồng bộ với quiz.js) để các em
        // Lớp 1 & 2 nghe xong là chạm chọn được luôn.
        const choiceBtns = st.exercise.inputType === 'choice'
            ? Array.from(document.querySelectorAll(`#choices-${topicId} .mu-choice-btn`))
            : null;
        speakQuestion(st.exercise.text, `read-${topicId}`, document.getElementById(`q-${topicId}`), choiceBtns);
    }

    function selectChoice(topicId, btn, value) {
        if (state[topicId] && state[topicId].answered) return;
        document.querySelectorAll(`#choices-${topicId} .mu-choice-btn`).forEach(b => b.classList.remove('mu-choice-selected'));
        btn.classList.add('mu-choice-selected');
        state[topicId].selected = value;
    }

    function check(topicId) {
        const st = state[topicId];
        if (!st || st.answered) return;
        const ex = st.exercise;
        let userAnswer, isCorrect;

        if (ex.inputType === 'choice') {
            userAnswer = st.selected;
            if (userAnswer === undefined) { showFeedback(topicId, false, '⚠️ Hãy chọn một đáp án trước khi kiểm tra.'); return; }
            isCorrect = userAnswer === ex.answer;
        } else if (ex.inputType === 'text') {
            const input = document.getElementById(`ans-${topicId}`);
            userAnswer = (input.value || '').trim();
            if (!userAnswer) { showFeedback(topicId, false, '⚠️ Hãy gõ đáp án trước khi kiểm tra.'); return; }
            isCorrect = userAnswer.toLowerCase() === String(ex.answer).toLowerCase();
        } else {
            const input = document.getElementById(`ans-${topicId}`);
            const raw = (input.value || '').replace(',', '.');
            userAnswer = parseFloat(raw);
            if (isNaN(userAnswer)) { showFeedback(topicId, false, '⚠️ Hãy nhập một giá trị số hợp lệ.'); return; }
            isCorrect = Math.abs(userAnswer - ex.answer) <= (ex.tolerance || 0.001);
        }

        st.answered = true;
        const s = getScore(topicId);
        s.total++;
        if (isCorrect) s.correct++;
        saveScore(topicId, s.correct, s.total);

        document.querySelectorAll(`#pbody-${topicId} input`).forEach(i => i.disabled = true);
        document.querySelectorAll(`#pbody-${topicId} .mu-choice-btn`).forEach(b => {
            b.disabled = true;
            // Tô xanh đáp án đúng, tô đỏ đáp án đã chọn nếu chọn sai — để các em
            // thấy ngay đáp án đúng là đáp án nào, không chỉ đọc chữ phản hồi.
            // So sánh bằng data-value (giá trị gốc), không dùng textContent vì
            // đơn vị (VD "đồng") bị nối liền vào chữ nên so sánh chuỗi con dễ nhầm.
            if (ex.inputType === 'choice') {
                if (b.dataset.value === String(ex.answer)) b.classList.add('quiz-choice-correct');
                else if (b.classList.contains('mu-choice-selected')) b.classList.add('quiz-choice-wrong');
            }
        });
        const checkBtn = document.getElementById(`check-${topicId}`);
        if (checkBtn) checkBtn.style.display = 'none';

        const stepsHtml = ex.steps ? `<div class="quiz-explain"><strong>🔎 Cách giải:</strong>${ex.steps.map((s,i)=>`<div class="step-line"><span class="step-num">${i+1}</span><span class="step-text">${s}</span></div>`).join('')}</div>` : '';
        const answerDisplay = ex.answer + (ex.unit ? ' ' + ex.unit : '');
        // Bống phản ứng theo kết quả: 'happy' khi đúng (cứ mỗi 3 câu đúng liên tiếp thì
        // 'excited' ăn mừng to hơn cho vui), 'shy' khi chưa đúng (động viên, không chê
        // trách) — dùng mascotSVG nếu đã nạp (mascot.js load trước file này).
        const reactionMood = isCorrect ? (s.correct > 0 && s.correct % 3 === 0 ? 'excited' : 'happy') : 'shy';
        const reactionSvg = (typeof mascotSVG === 'function') ? mascotSVG(reactionMood, 44) : '';
        const reactionHtml = reactionSvg ? `<div class="mu-fb-mascot mu-mascot-live" id="fbm-${topicId}">${reactionSvg}</div>` : '';

        // Thỉnh thoảng, một bạn thú trong rừng mà em đã kết bạn sẽ ghé qua cổ vũ
        // cùng Bống khi làm đúng — thêm chút bất ngờ vui nhộn, không lặp lại nhàm chán.
        let friendCheerHtml = '';
        if (isCorrect && typeof getUnlockedFriends === 'function') {
            const owned = getUnlockedFriends();
            if (owned.length && Math.random() < 0.4) {
                const fid = owned[Math.floor(Math.random() * owned.length)];
                const friend = (typeof FOREST_FRIENDS !== 'undefined') ? FOREST_FRIENDS.find(f => f.id === fid) : null;
                if (friend) {
                    const cheerLine = (typeof mascotCheer === 'function') ? mascotCheer() : 'Giỏi quá!';
                    friendCheerHtml = `<div class="mu-cheer-pop"><svg viewBox="0 0 160 160" width="26" height="26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${friend.svg()}</svg> ${friend.name} cổ vũ: "${cheerLine}"</div>`;
                }
            }
        }
        showFeedback(topicId, isCorrect,
            reactionHtml +
            (isCorrect ? `✅ <strong>Chính xác!</strong> Đáp án đúng là <strong>${answerDisplay}</strong>.` :
                         `❌ <strong>Chưa đúng, không sao nhé!</strong> Đáp án đúng là <strong>${answerDisplay}</strong>.`) + stepsHtml + friendCheerHtml, true);

        if (typeof playSound === 'function') playSound(isCorrect ? 'correct' : 'wrong');
        // Cho phép các em chạm vào Bống trong ô phản hồi để thấy Bống phản ứng thêm.
        const fbMascot = document.getElementById(`fbm-${topicId}`);
        if (fbMascot && typeof mascotMakeInteractive === 'function') mascotMakeInteractive(fbMascot, reactionMood, 44);

        const body = document.getElementById(`pbody-${topicId}`);
        body.insertAdjacentHTML('beforeend', `<button class="calc-btn next-btn" onclick="MU_PRACTICE.next('${topicId}')">Câu Tiếp Theo →</button>`);

        const head = document.querySelector(`#practice-${topicId} .mu-practice-head`);
        if (head) head.querySelector('.mu-practice-score').outerHTML = scoreLineHtml(topicId);
    }

    function showFeedback(topicId, isCorrect, html, replace) {
        const fb = document.getElementById(`fb-${topicId}`);
        if (!fb) return;
        fb.style.display = 'block';
        fb.className = 'output-box' + (isCorrect ? '' : ' is-error');
        fb.innerHTML = html;
    }

    function launchTopicQuiz(topicId) {
        // Các chủ đề dạng "chọn đáp án" (VD: nhận diện hình) dùng engine luyện tập
        // riêng trong panel (đã hỗ trợ inputType 'choice'/'text'), KHÔNG đưa vào
        // engine Ôn Tập chung vì engine đó chỉ chấm đáp án dạng số.
        const meta = (typeof TOPIC_META !== 'undefined') ? TOPIC_META[topicId] : null;
        if (meta && meta.quizPool === false) {
            const zone = document.getElementById(`practice-${topicId}`);
            if (zone) {
                zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
                next(topicId);
            }
            return;
        }
        if (typeof practiceTopic === 'function') {
            practiceTopic(topicId);
        } else {
            document.getElementById(`practice-${topicId}`).scrollIntoView({ behavior: 'smooth' });
        }
    }

    return { mount, next, check, selectChoice, launchTopicQuiz, readAloud };
})();
