function randIntC(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }


function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const GRADE_LABELS = { 1: 'Lớp 1', 2: 'Lớp 2', 3: 'Lớp 3', 4: 'Lớp 4', 5: 'Lớp 5' };

const GRADE_ICONS  = { 1: '🐣', 2: '🐰', 3: '🐱', 4: '🦊', 5: '🦉' };
const GRADE_ANIMAL_NAMES = { 1: 'Gà Con', 2: 'Thỏ Con', 3: 'Mèo Con', 4: 'Cáo Con', 5: 'Cú Tinh Anh' };
// (đã xoá GRADE_COLOR — khai báo nhưng không có chỗ nào dùng trong toàn bộ dự án)
const OBJ_EMOJI = ['🌸','🍎','🍊','⭐','🍪'];
function pickEmoji() { return OBJ_EMOJI[randIntC(0, OBJ_EMOJI.length - 1)]; }


const TOPIC_META = {};
const TOPIC_GENERATORS = {};
const GRADE_TOPICS = { 1: [], 2: [], 3: [], 4: [], 5: [] };

function defineTopic(id, grade, icon, title, tags, explain, genFn) {
    TOPIC_META[id] = { id, grade, icon, title, tags, ...explain };
    TOPIC_GENERATORS[id] = [genFn];
    GRADE_TOPICS[grade].push(id);
}


// LỚP 1

defineTopic('l1-sosanh', 1, '🔟', 'So Sánh Số Đến 10', ['so sánh', 'lớn hơn', 'bé hơn', 'bằng nhau'],
    {
        meaning: 'Đếm mỗi bên có bao nhiêu, rồi xem bên nào nhiều hơn.',
        example: '3 bông hoa và 5 bông hoa → bên phải nhiều hơn.',
        tip: 'Dùng ngón tay chỉ và đếm thật chậm từng cái một.',
        mistake: 'Đừng đoán theo hình to nhỏ — phải đếm đúng số lượng.',
        quizPool: false,
    },
    (d = 1) => {
        const a = randIntC(1, 10), b = randIntC(1, 10);
        const emoji = pickEmoji();
        const cmp = a > b ? 1 : (a < b ? -1 : 0);
        const answerText = cmp === 1 ? 'Bên trái nhiều hơn' : (cmp === -1 ? 'Bên phải nhiều hơn' : 'Hai bên bằng nhau');
        return {
            text: `Bên nào nhiều hơn? 🤔`,
            visual: `<div class="mu-object-op">${objectRow(emoji, a)}<span class="mu-obj-sign">⚖️</span>${objectRow(emoji, b)}</div>`,
            inputType: 'choice',
            choices: ['Bên trái nhiều hơn', 'Bên phải nhiều hơn', 'Hai bên bằng nhau'],
            answer: answerText,
            steps: [`Bên trái có ${a} ${emoji}, bên phải có ${b} ${emoji}.`, `→ ${answerText}.`],
        };
    });

defineTopic('l1-cong10', 1, '➕', 'Phép Cộng Trong Phạm Vi 10', ['cộng', 'phép cộng', 'phạm vi 10'],
    {
        meaning: 'Cộng là gộp hai nhóm lại rồi đếm tất cả.',
        example: '3 bông hoa thêm 2 bông hoa → có tất cả 5 bông hoa.',
        tip: 'Đếm hết cả hai nhóm, đừng bỏ sót cái nào.',
        mistake: 'Đếm trùng một vật hai lần khi gộp nhóm.',
    },
    (d = 1) => {
        const max = Math.min(10, Math.round(6 * d) + 2);
        const a = randIntC(1, max - 1), b = randIntC(1, max - a);
        const emoji = pickEmoji();
        return {
            text: `Có ${a}${emoji} thêm ${b}${emoji}. Tất cả có mấy cái?`,
            visual: objectAddVisual(emoji, a, b),
            answer: a + b, tolerance: 0, unit: emoji,
            steps: [`Gộp hai nhóm: ${a} và ${b}.`, `${a} + ${b} = ${a + b}.`],
        };
    });

defineTopic('l1-tru10', 1, '➖', 'Phép Trừ Trong Phạm Vi 10', ['trừ', 'phép trừ', 'phạm vi 10'],
    {
        meaning: 'Trừ là bớt đi một ít, rồi đếm phần còn lại.',
        example: 'Có 7 quả táo, ăn mất 3 quả → còn lại 4 quả.',
        tip: 'Đếm phần KHÔNG bị gạch trong hình — đó là đáp số.',
        mistake: 'Đếm nhầm cả phần đã bị gạch bỏ.',
    },
    (d = 1) => {
        const total = randIntC(3, Math.min(10, Math.round(6 * d) + 3));
        const removed = randIntC(1, total - 1);
        const emoji = pickEmoji();
        return {
            text: `Có ${total}${emoji}, bớt đi ${removed}${emoji} (phần bị gạch). Còn lại mấy cái?`,
            visual: objectSubtractVisual(emoji, total, removed),
            answer: total - removed, tolerance: 0, unit: emoji,
            steps: [`Ban đầu có ${total}, bớt đi ${removed}.`, `${total} − ${removed} = ${total - removed}.`],
        };
    });

defineTopic('l1-so100', 1, '💯', 'Các Số Đến 100', ['số liền trước', 'số liền sau', 'số tròn chục'],
    {
        meaning: 'Số liền sau lớn hơn 1; số liền trước bé hơn 1.',
        example: 'Liền sau của 29 là 30. Liền trước của 40 là 39.',
        tip: 'Nhìn trục số: liền sau bước sang phải, liền trước bước sang trái.',
        mistake: 'Nhầm lẫn liền trước với liền sau.',
    },
    (d = 1) => {
        const n = randIntC(2, Math.min(99, Math.round(60 * d) + 10));
        const askNext = Math.random() < 0.5;
        return {
            text: askNext ? `Số liền SAU của ${n} là số nào?` : `Số liền TRƯỚC của ${n} là số nào?`,
            visual: numberLineSVG(n, askNext ? 'next' : 'prev'),
            answer: askNext ? n + 1 : n - 1, tolerance: 0,
            steps: askNext ? [`Liền sau = ${n} + 1`, `= ${n + 1}`] : [`Liền trước = ${n} − 1`, `= ${n - 1}`],
        };
    });

defineTopic('l1-hinhphang', 1, '🔷', 'Nhận Diện Hình Phẳng', ['hình vuông', 'hình tròn', 'hình tam giác', 'hình chữ nhật'],
    {
        meaning: 'Đếm số cạnh để biết tên hình.',
        example: 'Bánh xe tròn 🚲, viên gạch vuông 🧱.',
        tip: '0 cạnh = tròn, 3 cạnh = tam giác, 4 cạnh = vuông/chữ nhật.',
        mistake: 'Nhầm hình vuông với hình chữ nhật.',
        quizPool: false,
    },
    () => {
        const kinds = [
            { k: 'vuong', name: 'Hình vuông' }, { k: 'chunhat', name: 'Hình chữ nhật' },
            { k: 'tron', name: 'Hình tròn' }, { k: 'tamgiac', name: 'Hình tam giác' },
        ];
        const correct = kinds[randIntC(0, kinds.length - 1)];
        const choices = shuffleArr(kinds).map(k => k.name);
        return {
            text: 'Đây là hình gì?',
            visual: shapeBasicSVG(correct.k),
            inputType: 'choice', choices, answer: correct.name,
            steps: [`Đếm số cạnh để nhận biết ${correct.name.toLowerCase()}.`],
        };
    });

defineTopic('l1-hinhkhoi', 1, '📦', 'Làm Quen Khối Lập Phương, Khối Hộp Chữ Nhật', ['khối lập phương', 'khối hộp chữ nhật', 'hình khối'],
    {
        meaning: 'Khối lập phương giống viên xúc xắc — 6 mặt đều là hình vuông bằng nhau. Khối hộp chữ nhật giống hộp quà, hộp sữa — 6 mặt là hình chữ nhật.',
        example: 'Viên xúc xắc, khối ru-bích → khối lập phương. Hộp bút, hộp sữa → khối hộp chữ nhật.',
        tip: 'Khối "béo đều như con xúc xắc" là lập phương; khối "dài hơn một chiều như hộp quà" là hộp chữ nhật.',
        mistake: 'Nhầm khối hộp chữ nhật hơi vuông với khối lập phương.',
        quizPool: false,
    },
    () => {
        const kinds = [
            { k: 'lapphuong', name: 'Khối lập phương' },
            { k: 'hopchunhat', name: 'Khối hộp chữ nhật' },
        ];
        const correct = kinds[randIntC(0, 1)];
        const choices = shuffleArr(kinds).map(k => k.name);
        return {
            text: 'Đây là khối gì?',
            visual: shapeSolidBasicSVG(correct.k),
            inputType: 'choice', choices, answer: correct.name,
            steps: [correct.k === 'lapphuong' ? 'Khối lập phương có các mặt đều là hình vuông bằng nhau.' : 'Khối hộp chữ nhật có các mặt là hình chữ nhật.'],
        };
    });

defineTopic('l1-dodai', 1, '📏', 'So Sánh Dài Hơn, Ngắn Hơn', ['dài hơn', 'ngắn hơn', 'độ dài'],
    {
        meaning: 'Đặt hai vật cạnh nhau, sao cho hai đầu bằng nhau — vật nào thừa ra nhiều hơn thì vật đó dài hơn.',
        example: 'Đặt bút chì và cây thước cạnh nhau, cùng một đầu → thước dài hơn bút chì.',
        tip: 'Luôn đặt hai vật thẳng hàng ở một đầu trước khi so sánh, đừng đoán bằng mắt.',
        mistake: 'So sánh khi hai vật không đặt thẳng hàng ở cùng một điểm bắt đầu.',
        quizPool: false,
    },
    () => {
        const objs = [['✏️ Bút chì', '🖊️ Bút bi'], ['🥕 Củ cà rốt', '🍌 Quả chuối'], ['🪢 Sợi dây A', '🪢 Sợi dây B'], ['🎗️ Băng vải A', '🎗️ Băng vải B']];
        const pair = objs[randIntC(0, objs.length - 1)];
        const lenA = randIntC(3, 9);
        let lenB = randIntC(3, 9);
        while (lenB === lenA) lenB = randIntC(3, 9);
        const answerText = lenA > lenB ? `${pair[0]} dài hơn` : `${pair[1]} dài hơn`;
        return {
            text: 'Vật nào dài hơn? 🤔',
            visual: lengthCompareSVG(lenA, lenB, pair[0], pair[1]),
            inputType: 'choice',
            choices: [`${pair[0]} dài hơn`, `${pair[1]} dài hơn`],
            answer: answerText,
            steps: ['Đặt hai vật thẳng đầu để so sánh.', `→ ${answerText}.`],
        };
    });

defineTopic('l1-xemgio', 1, '🕐', 'Xem Đồng Hồ – Giờ Đúng', ['xem giờ', 'đồng hồ', 'giờ đúng'],
    {
        meaning: 'Khi kim phút (kim dài) chỉ đúng vào số 12, đó là "giờ đúng" — kim giờ (kim ngắn) đang chỉ vào số nào thì đồng hồ chỉ giờ đó.',
        example: 'Kim ngắn chỉ số 7, kim dài chỉ số 12 → đồng hồ chỉ 7 giờ.',
        tip: 'Luôn tìm kim NGẮN trước — đó là kim chỉ giờ.',
        mistake: 'Nhầm kim dài (chỉ phút) với kim ngắn (chỉ giờ).',
    },
    () => {
        const hour = randIntC(1, 12);
        return {
            text: 'Đồng hồ dưới đây đang chỉ mấy giờ?',
            visual: clockFaceSVG(hour),
            answer: hour, tolerance: 0, unit: 'giờ',
            steps: ['Kim dài chỉ số 12 → là giờ đúng.', `Kim ngắn chỉ số ${hour} → đồng hồ chỉ ${hour} giờ.`],
        };
    });


// LỚP 2

defineTopic('l2-congtru100', 2, '🧮', 'Cộng Trừ Có Nhớ (Phạm Vi 100)', ['cộng có nhớ', 'trừ có nhớ', 'phạm vi 100'],
    {
        meaning: 'Khi cộng/trừ số có 2 chữ số, nếu hàng đơn vị cộng vượt quá 9 thì phải "nhớ 1" sang hàng chục; khi trừ mà số bị trừ ở hàng đơn vị bé hơn, phải "mượn 1" từ hàng chục.',
        example: '38 + 27: 8+7=15, viết 5 nhớ 1; 3+2+1(nhớ)=6 &nbsp;→&nbsp; kết quả 65.',
        tip: 'Luôn đặt tính thẳng cột (hàng đơn vị thẳng hàng đơn vị, hàng chục thẳng hàng chục) trước khi cộng/trừ.',
        mistake: 'Quên cộng thêm số đã nhớ vào hàng chục, hoặc quên trừ bớt số đã mượn.',
    },
    (d = 1) => {
        const isAdd = Math.random() < 0.5;
        const maxN = Math.min(99, Math.round(70 * d) + 20);
        if (isAdd) {
            const a = randIntC(15, maxN), b = randIntC(15, maxN - Math.floor(maxN/3));
            // LỖI ĐÃ SỬA: trước đây chỉ vẽ que tính cho SỐ ĐẦU (a), số thứ
            // hai (b) bị "che" hoàn toàn — chỉ có 1 dòng chữ bắt học sinh tự
            // tưởng tượng ("bạn tự hình dung để cộng dồn"), không có que tính
            // thật nào cho b cả. Giờ vẽ que tính cho CẢ HAI số, đặt cạnh nhau
            // trong ".mu-object-op" (giống cách minh hoạ cộng 2 phân số) —
            // khung này đã hỗ trợ tự xuống dòng khi màn hình hẹp nên không lo
            // tràn ra ngoài trên điện thoại.
            return { text: `Đặt tính rồi tính: ${a} + ${b} = ?`,
                visual: `<div class="mu-object-op">${placeValueBlocksSVG(Math.floor(a/10), a%10)}<span class="mu-obj-sign">+</span>${placeValueBlocksSVG(Math.floor(b/10), b%10)}</div>`,
                answer: a + b, tolerance: 0,
                steps: [`Cộng hàng đơn vị, nhớ nếu vượt quá 9.`, `${a} + ${b} = ${a + b}.`] };
        } else {
            const a = randIntC(20, maxN), b = randIntC(10, a - 5);
            // Tương tự: trước đây phép trừ chỉ vẽ số bị trừ (a), số trừ (b)
            // không có que tính minh hoạ nào cả. Giờ vẽ cả hai, ngăn cách
            // bằng dấu trừ, để học sinh thấy rõ đang "bớt đi" bao nhiêu que.
            return { text: `Đặt tính rồi tính: ${a} − ${b} = ?`,
                visual: `<div class="mu-object-op">${placeValueBlocksSVG(Math.floor(a/10), a%10)}<span class="mu-obj-sign">−</span>${placeValueBlocksSVG(Math.floor(b/10), b%10)}</div>`,
                answer: a - b, tolerance: 0,
                steps: [`Trừ hàng đơn vị, mượn 1 chục nếu không đủ trừ.`, `${a} − ${b} = ${a - b}.`] };
        }
    });

defineTopic('l2-so1000', 2, '🔢', 'Các Số Đến 1000', ['số tròn trăm', 'so sánh số có 3 chữ số'],
    {
        meaning: 'Số có 3 chữ số gồm hàng trăm — hàng chục — hàng đơn vị. Muốn so sánh, xét từ hàng trăm trước: hàng trăm lớn hơn thì số đó lớn hơn.',
        example: '425 so với 398 &nbsp;→&nbsp; hàng trăm: 4 > 3 &nbsp;→&nbsp; 425 > 398.',
        tip: 'Nếu hàng trăm bằng nhau, so tiếp đến hàng chục; nếu hàng chục cũng bằng, so đến hàng đơn vị.',
        mistake: 'So sánh vội theo chữ số đầu tiên nhìn thấy mà quên xét đúng hàng trăm/chục/đơn vị.',
    },
    (d = 1) => {
        const a = randIntC(100, 999), b = randIntC(100, 999);
        const cmp = a > b ? 1 : (a < b ? -1 : 0);
        return {
            text: `So sánh ${a} và ${b}.`,
            visual: `<div class="mu-object-op"><span class="mu-big-number">${a}</span><span class="mu-obj-sign">⚖️</span><span class="mu-big-number">${b}</span></div>`,
            inputType: 'compare', answer: cmp, tolerance: 0,
            steps: [`So từ hàng trăm: ${a} và ${b}.`, `Kết quả: ${a} ${cmp===1?'>':cmp===-1?'<':'='} ${b}.`],
        };
    });

defineTopic('l2-bangnhanchia', 2, '✖️', 'Bảng Nhân, Bảng Chia 2–5', ['bảng nhân', 'bảng chia'],
    {
        meaning: 'Phép nhân N × x nghĩa là lấy N cộng liên tiếp x lần. Phép chia là phép tính ngược lại của phép nhân: a : b = c nghĩa là b × c = a.',
        example: '4 × 3 = 4 + 4 + 4 = 12 &nbsp;→&nbsp; ngược lại 12 : 4 = 3.',
        tip: 'Học thuộc bảng nhân theo cặp: biết 3 × 4 = 12 thì suy ra ngay 12 : 3 = 4 và 12 : 4 = 3.',
        mistake: 'Nhầm giữa phép nhân và phép cộng — 4 × 3 khác hoàn toàn với 4 + 3.',
    },
    (d = 1) => {
        const bases = [2, 3, 4, 5];
        const n = bases[randIntC(0, bases.length - 1)];
        const isMul = Math.random() < 0.6;
        const emoji = pickEmoji();
        if (isMul) {
            const x = randIntC(1, 10);
            return { text: `Tính: ${n} × ${x} = ?`,
                visual: arrayGridSVG(n, x, emoji),
                answer: n * x, tolerance: 0,
                steps: [`${n} × ${x} nghĩa là cộng ${n} liên tiếp ${x} lần.`, `${n} × ${x} = ${n * x}.`] };
        } else {
            const x = randIntC(1, 10), prod = n * x;
            return { text: `Tính: ${prod} : ${n} = ?`,
                visual: arrayGridSVG(n, x, emoji) + `<div class="mu-obj-note">Chia đều ${prod} vật thành các hàng, mỗi hàng ${n} vật — hỏi có bao nhiêu hàng?</div>`,
                answer: x, tolerance: 0,
                steps: [`Tìm số mà nhân với ${n} ra ${prod}.`, `${prod} : ${n} = ${x} (vì ${n} × ${x} = ${prod}).`] };
        }
    });

defineTopic('l2-chuvi', 2, '📏', 'Chu Vi Hình Tam Giác, Tứ Giác', ['chu vi', 'tam giác', 'tứ giác'],
    {
        meaning: 'Chu vi của một hình là tổng độ dài tất cả các cạnh của hình đó, cộng lần lượt từng cạnh lại với nhau.',
        example: 'Tam giác 3 cạnh 4cm, 5cm, 6cm &nbsp;→&nbsp; chu vi = 4 + 5 + 6 = 15cm.',
        tip: 'Đi vòng quanh hình theo thứ tự các cạnh, cộng dồn từng cạnh — không bỏ sót cạnh nào.',
        mistake: 'Quên cộng đủ tất cả các cạnh (đặc biệt với tứ giác có 4 cạnh, dễ quên 1 cạnh).',
    },
    (d = 1) => {
        const isTri = Math.random() < 0.5;
        const scale = Math.round(10 * d) + 3;
        if (isTri) {
            const a = randIntC(3, scale), b = randIntC(3, scale), c = randIntC(3, scale);
            return { text: `Tam giác có 3 cạnh lần lượt là ${a}cm, ${b}cm, ${c}cm. Tính chu vi.`,
                visual: shapeTriangleSVG(Math.max(a,b,c), Math.min(a,b,c)),
                answer: a + b + c, tolerance: 0, unit: 'cm',
                steps: [`Chu vi = tổng 3 cạnh.`, `${a} + ${b} + ${c} = ${a+b+c}cm.`] };
        } else {
            const s = [randIntC(3, scale), randIntC(3, scale), randIntC(3, scale), randIntC(3, scale)];
            const sum = s.reduce((x,y)=>x+y,0);
            return { text: `Tứ giác có 4 cạnh lần lượt là ${s.join('cm, ')}cm. Tính chu vi.`,
                visual: quadrilateralSVG(s),
                answer: sum, tolerance: 0, unit: 'cm',
                steps: [`Chu vi = tổng 4 cạnh.`, `${s.join(' + ')} = ${sum}cm.`] };
        }
    });

defineTopic('l2-duongthang', 2, '📐', 'Đường Thẳng, Đường Cong, Hình Tứ Giác', ['đường thẳng', 'đường cong', 'tứ giác'],
    {
        meaning: 'Đường thẳng không bị cong, kéo dài mãi về hai phía. Đường cong thì uốn lượn. Hình tứ giác là hình có đúng 4 cạnh và 4 đỉnh.',
        example: 'Cạnh bàn học là đường thẳng; đường ven biển là đường cong.',
        tip: 'Dùng thước để kiểm tra: áp thước vào, nếu khớp hoàn toàn thì đó là đường thẳng.',
        mistake: 'Nhầm hình có cạnh hơi gãy khúc với đường cong — đường gấp khúc vẫn là các đoạn thẳng nối tiếp nhau.',
        quizPool: false,
    },
    () => {
        const kinds = [
            { k: 'tugiac', name: 'Hình tứ giác' }, { k: 'tron', name: 'Đường cong khép kín' }, { k: 'tamgiac', name: 'Hình tam giác (không phải tứ giác)' },
        ];
        const correct = kinds[randIntC(0, kinds.length - 1)];
        const choices = shuffleArr(kinds.map(k => k.name));
        return { text: 'Hình dưới đây được gọi là gì?', visual: shapeBasicSVG(correct.k),
            inputType: 'choice', choices, answer: correct.name,
            steps: [`Đếm số cạnh/đỉnh để xác định đúng tên hình.`] };
    });

defineTopic('l2-tienvietnam', 2, '💵', 'Làm Quen Với Tiền Việt Nam', ['tiền việt nam', 'mua bán', 'tiền'],
    {
        meaning: 'Các tờ tiền thường gặp: 1000đ, 2000đ, 5000đ, 10 000đ... Muốn biết tổng số tiền, cộng giá trị các tờ lại với nhau.',
        example: '1 tờ 5000đ + 1 tờ 2000đ = 7000đ.',
        tip: 'Đếm tờ tiền mệnh giá lớn trước, tờ nhỏ sau, rồi cộng dồn lại.',
        mistake: 'Đếm nhầm số 0 trên tờ tiền, dẫn đến tính sai giá trị.',
    },
    () => {
        const denoms = [1000, 2000, 5000, 10000];
        const type = randIntC(0, 1);
        const emoji = pickEmoji();
        if (type === 0) {
            const count = randIntC(2, 3);
            const picks = Array.from({ length: count }, () => denoms[randIntC(0, denoms.length - 1)]);
            const sum = picks.reduce((a, b) => a + b, 0);
            const grouped = {};
            picks.forEach(p => grouped[p] = (grouped[p] || 0) + 1);
            const chips = Object.keys(grouped).map(v => ({ value: parseInt(v), count: grouped[v] }));
            return {
                text: 'Bạn có các tờ tiền sau. Tất cả có bao nhiêu đồng?',
                visual: moneyChipsHTML(chips), answer: sum, tolerance: 0, unit: 'đồng',
                steps: [`Cộng giá trị các tờ: ${picks.join(' + ')} = ${sum}đ.`],
            };
        }
        const prices = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
        const price = prices[randIntC(0, prices.length - 1)];
        const paidOptions = [5000, 10000].filter(x => x >= price);
        const paid = paidOptions[randIntC(0, paidOptions.length - 1)];
        const change = paid - price;
        return {
            text: `Mua 1 ${emoji} giá ${price.toLocaleString('vi-VN')}đ, con đưa cô bán hàng tờ ${paid.toLocaleString('vi-VN')}đ. Hỏi được trả lại bao nhiêu tiền?`,
            visual: moneyChipsHTML([{ value: paid, count: 1 }]) + `<div class="mu-obj-note">Giá ${emoji} = ${price.toLocaleString('vi-VN')}đ</div>`,
            answer: change, tolerance: 0, unit: 'đồng',
            steps: ['Tiền thừa = tiền đưa − giá tiền.', `${paid} − ${price} = ${change}đ.`],
        };
    });


// LỚP 3

defineTopic('l3-bangnhanchia', 3, '✳️', 'Bảng Nhân, Bảng Chia 6–9', ['bảng nhân', 'bảng chia', '6 7 8 9'],
    {
        meaning: 'Tiếp tục học các bảng nhân/chia 6, 7, 8, 9 — vẫn dựa trên nguyên tắc "cộng liên tiếp" và "chia là phép tính ngược của nhân".',
        example: '7 × 8 = 56 &nbsp;→&nbsp; suy ra 56 : 7 = 8 và 56 : 8 = 7.',
        tip: 'Ghi nhớ 7×8=56 và 8×8=64 là hai phép hay nhầm nhất — luyện riêng hai phép này nhiều hơn.',
        mistake: 'Nhầm lẫn giữa bảng 7 và bảng 8 vì kết quả gần nhau (56 với 64, 49 với 56...).',
    },
    (d = 1) => {
        const bases = [6, 7, 8, 9];
        const n = bases[randIntC(0, bases.length - 1)];
        const isMul = Math.random() < 0.6;
        const emoji = ['🍎', '⭐', '🟢', '🍬'][randIntC(0, 3)];
        if (isMul) {
            const x = randIntC(1, 10);
            return { text: `Tính: ${n} × ${x} = ?`, visual: arrayGridSVG(n, x, emoji), answer: n * x, tolerance: 0, steps: [`${n} × ${x} = ${n*x}.`] };
        } else {
            const x = randIntC(1, 10), prod = n * x;
            return { text: `Tính: ${prod} : ${n} = ?`,
                visual: arrayGridSVG(n, x, emoji) + `<div class="mu-obj-note">Chia đều ${prod} vật thành các hàng, mỗi hàng ${n} vật — hỏi có bao nhiêu hàng?</div>`,
                answer: x, tolerance: 0, steps: [`${prod} : ${n} = ${x}.`] };
        }
    });

defineTopic('l3-nhanchiasocos', 3, '🧾', 'Nhân, Chia Số Có Nhiều Chữ Số', ['nhân', 'chia', 'số có 2-3 chữ số'],
    {
        meaning: 'Nhân số có 2-3 chữ số với số có 1 chữ số: nhân lần lượt từng hàng (đơn vị → chục → trăm), nhớ khi tích vượt quá 9.',
        example: '124 × 3: 4×3=12 viết 2 nhớ 1; 2×3+1=7; 1×3=3 &nbsp;→&nbsp; kết quả 372.',
        tip: 'Luôn nhân từ hàng đơn vị trước, không nhân ngược từ hàng cao xuống thấp.',
        mistake: 'Quên cộng số đã nhớ vào kết quả của hàng tiếp theo.',
    },
    (d = 1) => {
        const isMul = Math.random() < 0.6;
        const scaleMax = Math.min(500, Math.round(200 * d) + 100);
        if (isMul) {
            const a = randIntC(11, scaleMax), b = randIntC(2, 9);
            return { text: `Đặt tính rồi tính: ${a} × ${b} = ?`, visual: columnOpSVG(a, b, '×'), answer: a * b, tolerance: 0,
                steps: [`Nhân từng hàng của ${a} với ${b}, nhớ khi vượt quá 9.`, `${a} × ${b} = ${a*b}.`] };
        } else {
            const b = randIntC(2, 9), c = randIntC(11, 99), a = b * c;
            return { text: `Đặt tính rồi tính: ${a} : ${b} = ?`, answer: c, tolerance: 0,
                steps: [`${a} : ${b} = ${c} (vì ${b} × ${c} = ${a}).`] };
        }
    });

defineTopic('l3-so100000', 3, '🔟', 'Các Số Trong Phạm Vi 100 000', ['số tròn nghìn', 'so sánh số lớn'],
    {
        meaning: 'So sánh các số có nhiều chữ số: số nào có nhiều chữ số hơn thì lớn hơn; nếu số chữ số bằng nhau, so sánh từ chữ số hàng cao nhất (trái nhất) trước.',
        example: '48 500 so với 9 900 &nbsp;→&nbsp; 48 500 có 5 chữ số, 9 900 chỉ có 4 chữ số &nbsp;→&nbsp; 48 500 lớn hơn.',
        tip: 'Đếm số chữ số trước tiên — cách nhanh nhất để biết số nào lớn hơn hẳn.',
        mistake: 'So sánh theo "cảm giác nhìn dài" mà quên đếm đúng số chữ số khi có dấu chấm ngăn cách hàng nghìn.',
    },
    (d = 1) => {
        const a = randIntC(1000, 99999), b = randIntC(1000, 99999);
        const cmp = a > b ? 1 : (a < b ? -1 : 0);
        return { text: `So sánh ${a.toLocaleString('vi-VN')} và ${b.toLocaleString('vi-VN')}.`,
            visual: `<div class="mu-object-op">${numberGroupsSVG(a)}<span class="mu-obj-sign">?</span>${numberGroupsSVG(b)}</div>`,
            inputType: 'compare', answer: cmp, tolerance: 0,
            steps: [`So sánh số chữ số, rồi đến từng hàng từ trái sang.`, `Kết quả: ${a.toLocaleString('vi-VN')} ${cmp===1?'>':cmp===-1?'<':'='} ${b.toLocaleString('vi-VN')}.`] };
    });

defineTopic('l3-hcnhv', 3, '⬛', 'Chu Vi & Diện Tích Hình Chữ Nhật, Hình Vuông', ['chu vi', 'diện tích', 'hình chữ nhật', 'hình vuông'],
    {
        meaning: 'Hình chữ nhật: chu vi P = (dài + rộng) × 2; diện tích S = dài × rộng. Hình vuông (dài = rộng = a): P = a × 4; S = a × a.',
        example: 'HCN dài 8cm, rộng 5cm &nbsp;→&nbsp; P = (8+5)×2 = 26cm; S = 8×5 = 40cm².',
        tip: 'Chu vi dùng đơn vị dài (cm), diện tích dùng đơn vị vuông (cm²) — luôn ghi đúng đơn vị vào đáp số.',
        mistake: 'Quên nhân 2 khi tính chu vi hình chữ nhật, chỉ dừng lại ở (dài + rộng).',
    },
    (d = 1) => {
        const isSquare = Math.random() < 0.4;
        const max = Math.min(20, Math.round(12*d)+4);
        const askArea = Math.random() < 0.5;
        if (isSquare) {
            const a = randIntC(2, max);
            const ans = askArea ? a*a : a*4;
            return { text: `Hình vuông cạnh ${a}cm. Tính ${askArea ? 'diện tích' : 'chu vi'}.`,
                visual: shapeSquareSVG(a), answer: ans, tolerance: 0, unit: askArea ? 'cm²' : 'cm',
                steps: askArea ? [`S = a × a = ${a} × ${a} = ${ans}cm².`] : [`P = a × 4 = ${a} × 4 = ${ans}cm.`] };
        } else {
            const a = randIntC(3, max), b = randIntC(2, a);
            const ans = askArea ? a*b : (a+b)*2;
            return { text: `Hình chữ nhật dài ${a}cm, rộng ${b}cm. Tính ${askArea ? 'diện tích' : 'chu vi'}.`,
                visual: shapeRectangleSVG(a, b), answer: ans, tolerance: 0, unit: askArea ? 'cm²' : 'cm',
                steps: askArea ? [`S = dài × rộng = ${a} × ${b} = ${ans}cm².`] : [`P = (dài + rộng) × 2 = (${a}+${b})×2 = ${ans}cm.`] };
        }
    });

defineTopic('l3-phanso', 3, '🍰', 'Nhận Biết Phân Số', ['phân số', 'tử số', 'mẫu số'],
    {
        meaning: 'Phân số a/b cho biết một hình được chia thành b phần bằng nhau, và ta đang xét a phần trong số đó (a là tử số, b là mẫu số).',
        example: 'Băng giấy chia 4 phần bằng nhau, tô màu 3 phần &nbsp;→&nbsp; phân số chỉ phần tô màu là 3/4.',
        tip: 'Đếm tổng số phần bằng nhau trước (ra mẫu số), rồi đếm số phần được tô màu (ra tử số).',
        mistake: 'Đếm nhầm số phần đã chia (mẫu số) khi các phần không được đánh dấu rõ ràng.',
    },
    (d = 1) => {
        const denom = randIntC(3, 8);
        const numer = randIntC(1, denom - 1);
        return { text: `Băng giấy dưới đây được chia thành các phần bằng nhau, phần tô đậm là phần đã "ăn". Tử số (số phần đã tô đậm) là bao nhiêu?`,
            visual: fractionBarSVG(numer, denom) + `<div class="mu-obj-note">Mẫu số (tổng số phần) = ${denom}</div>`,
            answer: numer, tolerance: 0,
            steps: [`Đếm số ô được tô đậm trong tổng ${denom} ô.`, `Tử số = ${numer} → phân số ${numer}/${denom}.`] };
    });

defineTopic('l3-khoiluongdungtich', 3, '⚖️', 'Gam, Ki-lô-gam, Lít', ['gam', 'ki-lô-gam', 'lít', 'khối lượng', 'dung tích'],
    {
        meaning: '1kg = 1000g. Ki-lô-gam (kg), gam (g) đo khối lượng (độ nặng); lít (l) đo dung tích (sức chứa của nước, sữa...).',
        example: 'Một quả dưa hấu nặng 2kg = 2000g. Một chai nước có dung tích 1 lít.',
        tip: 'Đổi kg sang g thì nhân với 1000; đổi g sang kg thì chia cho 1000.',
        mistake: 'Nhầm lẫn đơn vị cân nặng (kg, g) với đơn vị dung tích (lít).',
    },
    (d = 1) => {
        const type = randIntC(0, 2);
        const emoji = ['🍉', '🍎', '🍊', '🥭'][randIntC(0, 3)];
        if (type === 0) {
            const kg = randIntC(1, Math.round(5 * d) + 2);
            return {
                text: `Một ${emoji} cân nặng ${kg}kg. Hỏi ${kg}kg bằng bao nhiêu gam?`,
                visual: weighScaleSVG(emoji, `${kg} kg`), answer: kg * 1000, tolerance: 0, unit: 'g',
                steps: ['1kg = 1000g.', `${kg}kg = ${kg} × 1000 = ${kg*1000}g.`],
            };
        }
        if (type === 1) {
            const g = randIntC(1, Math.round(9 * d) + 2) * 1000;
            return {
                text: `Một túi gạo nặng ${g}g. Hỏi ${g}g bằng bao nhiêu ki-lô-gam?`,
                visual: weighScaleSVG('🌾', `${g} g`), answer: g / 1000, tolerance: 0, unit: 'kg',
                steps: ['1000g = 1kg.', `${g}g = ${g} : 1000 = ${g/1000}kg.`],
            };
        }
        const l1 = randIntC(1, Math.round(4 * d) + 1), l2 = randIntC(1, Math.round(4 * d) + 1);
        return {
            text: `Bình A chứa ${l1} lít nước, bình B chứa ${l2} lít nước. Đổ cả hai bình vào một thùng. Hỏi thùng có bao nhiêu lít nước?`,
            visual: `<div class="mu-object-op">${jugSVG(l1, l1 + l2, 'l')}${jugSVG(l2, l1 + l2, 'l')}</div>`,
            answer: l1 + l2, tolerance: 0, unit: 'lít',
            steps: [`Tổng dung tích = ${l1} + ${l2} = ${l1+l2} lít.`],
        };
    });


// LỚP 4

defineTopic('l4-sotunhien', 4, '🔠', 'Số Tự Nhiên Lớn (Hàng Triệu)', ['hàng triệu', 'giá trị hàng', 'đọc số'],
    {
        meaning: 'Mỗi chữ số trong một số có giá trị phụ thuộc vào hàng nó đứng (đơn vị, chục, trăm, nghìn, chục nghìn, trăm nghìn, triệu...).',
        example: 'Số 3 254 000: chữ số 3 ở hàng triệu nên có giá trị là 3 000 000.',
        tip: 'Tách số thành từng nhóm 3 chữ số từ phải sang trái (nhóm đơn vị, nhóm nghìn, nhóm triệu) để đọc số dễ hơn.',
        mistake: 'Nhầm giá trị hàng khi số có nhiều chữ số 0 ở giữa.',
    },
    (d = 1) => {
        const millions = randIntC(1, 9), thousands = randIntC(0, 999), rest = randIntC(0, 999);
        const n = millions * 1000000 + thousands * 1000 + rest;
        return { text: `Trong số ${n.toLocaleString('vi-VN')}, chữ số hàng triệu là bao nhiêu?`,
            visual: numberGroupsSVG(n, 2), answer: millions, tolerance: 0,
            steps: [`Nhóm 3 chữ số từ phải sang: nhóm đầu tiên bên trái là hàng triệu.`, `Chữ số hàng triệu = ${millions}.`] };
    });

defineTopic('l4-4phéptinh', 4, '➗', '4 Phép Tính Với Số Tự Nhiên', ['cộng', 'trừ', 'nhân', 'chia', 'nhiều chữ số'],
    {
        meaning: 'Với số có nhiều chữ số, vẫn thực hiện đặt tính thẳng cột như các lớp dưới, chỉ là có nhiều hàng hơn nên cần cẩn thận khi nhớ/mượn.',
        example: '2456 + 1789 = 4245 (cộng thẳng cột, nhớ nhiều lần).',
        tip: 'Luôn viết các số thẳng hàng theo đúng hàng đơn vị — lệch một cột là sai toàn bộ kết quả.',
        mistake: 'Đặt tính lệch hàng khi các số có độ dài chữ số khác nhau.',
    },
    (d = 1) => {
        const ops = ['+', '-', '×'];
        const op = ops[randIntC(0, ops.length - 1)];
        const scale = Math.round(2000 * d) + 500;
        if (op === '+') { const a = randIntC(100, scale), b = randIntC(100, scale); return { text: `Tính: ${a} + ${b} = ?`, visual: columnOpSVG(a, b, '+'), answer: a+b, tolerance: 0, steps: [`${a} + ${b} = ${a+b}.`] }; }
        if (op === '-') { const a = randIntC(500, scale), b = randIntC(100, a-50); return { text: `Tính: ${a} − ${b} = ?`, visual: columnOpSVG(a, b, '−'), answer: a-b, tolerance: 0, steps: [`${a} − ${b} = ${a-b}.`] }; }
        const a = randIntC(12, Math.round(60*d)+15), b = randIntC(3, 12);
        return { text: `Tính: ${a} × ${b} = ?`, visual: columnOpSVG(a, b, '×'), answer: a*b, tolerance: 0, steps: [`${a} × ${b} = ${a*b}.`] };
    });

defineTopic('l4-phanso', 4, '🥧', 'So Sánh, Cộng Trừ Phân Số Cùng Mẫu', ['phân số cùng mẫu', 'so sánh phân số'],
    {
        meaning: 'Hai phân số cùng mẫu số: phân số nào có tử số lớn hơn thì lớn hơn. Muốn cộng/trừ phân số cùng mẫu, chỉ cần cộng/trừ tử số, giữ nguyên mẫu số.',
        example: '2/7 + 3/7 = (2+3)/7 = 5/7.',
        tip: 'Vì mẫu số bằng nhau nghĩa là các phần chia bằng nhau — chỉ cần đếm gộp số phần (tử số) lại.',
        mistake: 'Cộng luôn cả mẫu số (2/7 + 3/7 = 5/14) — mẫu số cùng nhau thì GIỮ NGUYÊN, không cộng.',
    },
    (d = 1) => {
        const denom = randIntC(4, 12);
        const a = randIntC(1, denom - 2), b = randIntC(1, denom - a - 1 > 0 ? denom - a - 1 : 1);
        return { text: `Tính: ${a}/${denom} + ${b}/${denom} = ?/${denom} — nhập TỬ SỐ của kết quả.`,
            visual: `<div class="mu-object-op">${fractionBarSVG(a, denom)}<span class="mu-obj-sign">+</span>${fractionBarSVG(b, denom)}</div>`,
            answer: a + b, tolerance: 0,
            steps: [`Mẫu số giữ nguyên là ${denom}, cộng tử số: ${a} + ${b} = ${a+b}.`, `Kết quả: ${a+b}/${denom}.`] };
    });

defineTopic('l4-hbh-hthoi', 4, '◈', 'Diện Tích Hình Bình Hành, Hình Thoi', ['hình bình hành', 'hình thoi', 'diện tích'],
    {
        meaning: 'Hình bình hành: S = đáy × chiều cao. Hình thoi: S = (đường chéo 1 × đường chéo 2) : 2.',
        example: 'Hình bình hành đáy 8cm, cao 5cm &nbsp;→&nbsp; S = 8 × 5 = 40cm². Hình thoi 2 đường chéo 6cm, 8cm &nbsp;→&nbsp; S = (6×8):2 = 24cm².',
        tip: 'Chiều cao hình bình hành là đoạn vuông góc từ đáy lên cạnh đối diện, KHÔNG phải cạnh bên.',
        mistake: 'Với hình thoi, quên chia 2 sau khi nhân hai đường chéo.',
    },
    (d = 1) => {
        const isRhombus = Math.random() < 0.5;
        const max = Math.min(20, Math.round(12*d)+5);
        if (isRhombus) {
            const d1 = randIntC(4, max), d2 = randIntC(4, max);
            return { text: `Hình thoi có 2 đường chéo dài ${d1}cm và ${d2}cm. Tính diện tích.`,
                visual: shapeRhombusSVG(d1, d2), answer: (d1*d2)/2, tolerance: 0.01, unit: 'cm²',
                steps: [`S = (d₁ × d₂) : 2 = (${d1}×${d2}):2 = ${(d1*d2)/2}cm².`] };
        } else {
            const a = randIntC(4, max), h = randIntC(3, max);
            return { text: `Hình bình hành có cạnh đáy ${a}cm, chiều cao ${h}cm. Tính diện tích.`,
                visual: shapeParallelogramSVG(a, h), answer: a*h, tolerance: 0, unit: 'cm²',
                steps: [`S = đáy × chiều cao = ${a} × ${h} = ${a*h}cm².`] };
        }
    });

defineTopic('l4-tbc', 4, '🧮', 'Tìm Số Trung Bình Cộng', ['trung bình cộng'],
    {
        meaning: 'Số trung bình cộng của một dãy số = (tổng các số) : (số lượng các số).',
        example: 'Ba bạn có 6, 8, 10 quyển vở &nbsp;→&nbsp; TBC = (6+8+10):3 = 8 quyển.',
        tip: 'Đếm chính xác có bao nhiêu số hạng trước khi chia — thiếu 1 số hạng sẽ sai toàn bộ kết quả.',
        mistake: 'Chia tổng cho sai số lượng số hạng (ví dụ có 4 số nhưng lại chia cho 3).',
    },
    (d = 1) => {
        const count = randIntC(3, 5);
        const nums = Array.from({length: count}, () => randIntC(2, Math.round(20*d)+5));
        const sum = nums.reduce((a,b)=>a+b,0);
        const tbc = sum / count;
        return { text: `Tính trung bình cộng của các số: ${nums.join(', ')}.`,
            visual: barChartSVG(nums), answer: parseFloat(tbc.toFixed(2)), tolerance: 0.05,
            steps: [`Tổng = ${nums.join('+')} = ${sum}.`, `TBC = ${sum} : ${count} = ${tbc.toFixed(2)}.`] };
    });

defineTopic('l4-goc', 4, '📐', 'Góc Nhọn, Góc Vuông, Góc Tù, Góc Bẹt', ['góc nhọn', 'góc vuông', 'góc tù', 'góc bẹt'],
    {
        meaning: 'Góc vuông = đúng 90°. Góc nhọn bé hơn góc vuông. Góc tù lớn hơn góc vuông nhưng bé hơn góc bẹt. Góc bẹt = 180° (hai cạnh thẳng hàng).',
        example: 'Góc ê-ke là góc vuông. Kim đồng hồ lúc 2 giờ tạo thành một góc nhọn.',
        tip: 'So với góc vuông (dùng ê-ke) để biết góc đang xét nhỏ hơn (nhọn), bằng (vuông) hay lớn hơn (tù).',
        mistake: 'Nhầm góc tù với góc vuông khi góc chỉ hơi lớn hơn 90° một chút.',
        quizPool: false,
    },
    () => {
        const kinds = [
            { k: 'nhon', name: 'Góc nhọn' }, { k: 'vuong', name: 'Góc vuông' },
            { k: 'tu', name: 'Góc tù' }, { k: 'bet', name: 'Góc bẹt' },
        ];
        const correct = kinds[randIntC(0, kinds.length - 1)];
        const choices = shuffleArr(kinds).map(k => k.name);
        return {
            text: 'Đây là góc gì?', visual: angleSVG(correct.k),
            inputType: 'choice', choices, answer: correct.name,
            steps: [`So với góc vuông (90°) để nhận biết ${correct.name.toLowerCase()}.`],
        };
    });


// LỚP 5

defineTopic('l5-sothapphan', 5, '🔣', 'Đọc, Viết, So Sánh Số Thập Phân', ['số thập phân', 'phần nguyên', 'phần thập phân'],
    {
        meaning: 'Số thập phân gồm phần nguyên và phần thập phân, ngăn cách bởi dấu phẩy. So sánh: xét phần nguyên trước, nếu bằng nhau thì so tiếp phần thập phân từ trái sang.',
        example: '3,45 so với 3,5 &nbsp;→&nbsp; phần nguyên bằng nhau (3) &nbsp;→&nbsp; so 4 với 5 &nbsp;→&nbsp; 3,45 &lt; 3,5.',
        tip: 'Có thể viết thêm số 0 vào cuối phần thập phân cho dễ so sánh: 3,5 = 3,50, rõ ràng 3,50 > 3,45.',
        mistake: 'So sánh phần thập phân như số tự nhiên (nghĩ 3,45 > 3,5 vì "45 > 5") — đây là hiểu sai bản chất.',
    },
    (d = 1) => {
        const a = parseFloat((randIntC(10, 999) / 10).toFixed(1));
        const b = parseFloat((randIntC(10, 999) / 10).toFixed(1));
        const cmp = a > b ? 1 : (a < b ? -1 : 0);
        const aStr = a.toString().replace('.', ','), bStr = b.toString().replace('.', ',');
        return { text: `So sánh ${aStr} và ${bStr}.`,
            visual: decimalCompareTableHTML(aStr, bStr),
            inputType: 'compare', answer: cmp, tolerance: 0, steps: [`So phần nguyên trước, rồi đến phần thập phân.`, `Kết quả: ${aStr} ${cmp===1?'>':cmp===-1?'<':'='} ${bStr}.`] };
    });

defineTopic('l5-tisophantram', 5, '💯', 'Tỉ Số Phần Trăm', ['phần trăm', 'tỉ số phần trăm'],
    {
        meaning: 'Muốn tìm b% của một số B, ta tính A = B × b : 100.',
        example: 'Tìm 20% của 150 &nbsp;→&nbsp; A = 150 × 20 : 100 = 30.',
        tip: 'b% có nghĩa là "b phần trong 100 phần" — có thể đổi thành phân số b/100 để dễ hình dung.',
        mistake: 'Quên chia cho 100 sau khi nhân, dẫn đến kết quả lớn gấp 100 lần đáp số đúng.',
    },
    (d = 1) => {
        const B = randIntC(20, Math.round(300*d)+50);
        const percents = [5,10,15,20,25,30,40,50,60,75];
        const p = percents[randIntC(0, percents.length-1)];
        const A = parseFloat((B * p / 100).toFixed(2));
        return { text: `Một lớp có ${B} học sinh, ${p}% trong số đó là học sinh giỏi. Hỏi có bao nhiêu học sinh giỏi?`,
            visual: percentGridSVG(p),
            answer: A, tolerance: 0.05, steps: [`A = B × b% : 100 = ${B} × ${p} : 100 = ${A}.`] };
    });

defineTopic('l5-hinhtg-thang-tron', 5, '🔺', 'Diện Tích Tam Giác, Hình Thang, Hình Tròn', ['tam giác', 'hình thang', 'hình tròn', 'diện tích', 'chu vi'],
    {
        meaning: 'Tam giác: S = (đáy × cao) : 2. Hình thang: S = (đáy lớn + đáy bé) × cao : 2. Hình tròn: C = 2 × π × r; S = π × r² (π ≈ 3,14).',
        example: 'Hình thang đáy lớn 10cm, đáy bé 6cm, cao 4cm &nbsp;→&nbsp; S = (10+6)×4:2 = 32cm².',
        tip: 'Với hình tròn, luôn dùng π ≈ 3,14 trừ khi đề bài yêu cầu khác.',
        mistake: 'Quên chia 2 ở công thức tam giác và hình thang.',
    },
    (d = 1) => {
        const type = ['tamgiac','thang','tron_cv','tron_dt'][randIntC(0,3)];
        const max = Math.min(20, Math.round(12*d)+5);
        if (type === 'tamgiac') {
            const a = randIntC(4,max), h = randIntC(3,max);
            return { text: `Tam giác có đáy ${a}cm, chiều cao ${h}cm. Tính diện tích.`, visual: shapeTriangleSVG(a,h),
                answer: (a*h)/2, tolerance: 0.01, unit: 'cm²', steps: [`S = (${a}×${h}):2 = ${(a*h)/2}cm².`] };
        }
        if (type === 'thang') {
            const b = randIntC(3,max-1), a = randIntC(b+1,max+2), h = randIntC(2,max);
            return { text: `Hình thang có đáy lớn ${a}cm, đáy bé ${b}cm, chiều cao ${h}cm. Tính diện tích.`, visual: shapeTrapezoidSVG(a,b,h),
                answer: (a+b)*h/2, tolerance: 0.01, unit: 'cm²', steps: [`S = (${a}+${b})×${h}:2 = ${(a+b)*h/2}cm².`] };
        }
        const r = randIntC(2, Math.min(15, max));
        if (type === 'tron_cv') {
            const c = parseFloat((2*3.14*r).toFixed(2));
            return { text: `Hình tròn bán kính ${r}cm (π ≈ 3,14). Tính chu vi.`, visual: shapeCircleSVG(r),
                answer: c, tolerance: 0.5, unit: 'cm', steps: [`C = 2×3,14×${r} ≈ ${c}cm.`] };
        }
        const s = parseFloat((3.14*r*r).toFixed(2));
        return { text: `Hình tròn bán kính ${r}cm (π ≈ 3,14). Tính diện tích.`, visual: shapeCircleSVG(r),
            answer: s, tolerance: 0.5, unit: 'cm²', steps: [`S = 3,14×${r}² ≈ ${s}cm².`] };
    });

defineTopic('l5-hhcn-hlp', 5, '📦', 'Thể Tích Hình Hộp Chữ Nhật, Hình Lập Phương', ['thể tích', 'hình hộp chữ nhật', 'hình lập phương'],
    {
        meaning: 'Hình hộp chữ nhật: V = dài × rộng × cao. Hình lập phương (3 cạnh bằng nhau, cạnh a): V = a × a × a.',
        example: 'Hộp 5cm × 4cm × 3cm &nbsp;→&nbsp; V = 5×4×3 = 60cm³.',
        tip: 'Đơn vị thể tích luôn là "khối" (cm³, m³) — khác với diện tích (cm²) và độ dài (cm).',
        mistake: 'Chỉ nhân 2 cạnh mà quên nhân cạnh thứ 3 (nhầm với công thức diện tích).',
    },
    (d = 1) => {
        const isCube = Math.random() < 0.4;
        const max = Math.min(15, Math.round(8*d)+4);
        if (isCube) {
            const a = randIntC(2, max);
            return { text: `Hình lập phương cạnh ${a}cm. Tính thể tích.`, visual: shapeCubeSVG(a),
                answer: a*a*a, tolerance: 0, unit: 'cm³', steps: [`V = ${a}×${a}×${a} = ${a*a*a}cm³.`] };
        }
        const a = randIntC(2,max), b = randIntC(2,max), c = randIntC(2,max);
        return { text: `Hình hộp chữ nhật có 3 kích thước ${a}cm, ${b}cm, ${c}cm. Tính thể tích.`, visual: shapeCuboidSVG(a,b,c),
            answer: a*b*c, tolerance: 0, unit: 'cm³', steps: [`V = ${a}×${b}×${c} = ${a*b*c}cm³.`] };
    });

defineTopic('l5-chuyendong', 5, '🚗', 'Toán Chuyển Động Đều', ['vận tốc', 'quãng đường', 'thời gian'],
    {
        meaning: 'S là quãng đường, v là vận tốc, t là thời gian. Ba công thức: S = v × t; v = S : t; t = S : v (cùng đơn vị: km—giờ hoặc m—giây).',
        example: 'v = 45km/h, t = 2 giờ &nbsp;→&nbsp; S = 45 × 2 = 90km.',
        tip: 'Nhớ hình tam giác: S ở trên, v và t ở dưới — che S còn v×t; che v còn S/t; che t còn S/v.',
        mistake: 'Trộn đơn vị: v theo km/h nhưng t lại theo phút — phải đổi cùng đơn vị trước khi tính.',
    },
    (d = 1) => {
        const type = randIntC(0,2);
        const v = randIntC(20, Math.round(40*d)+30), t = randIntC(1, Math.round(4*d)+2);
        const S = v*t;
        if (type === 0) return { text: `Một xe máy đi với vận tốc ${v}km/h trong ${t} giờ. Tính quãng đường đi được.`,
            visual: motionDiagramSVG({ speed: v, time: t }),
            answer: S, tolerance: 0, unit: 'km', steps: [`S = v × t = ${v} × ${t} = ${S}km.`] };
        if (type === 1) return { text: `Một xe đi được ${S}km trong ${t} giờ. Tính vận tốc.`,
            visual: motionDiagramSVG({ distance: S, time: t }),
            answer: v, tolerance: 0, unit: 'km/h', steps: [`v = S : t = ${S} : ${t} = ${v}km/h.`] };
        return { text: `Một xe đi được ${S}km với vận tốc ${v}km/h. Tính thời gian đi.`,
            visual: motionDiagramSVG({ distance: S, speed: v }),
            answer: t, tolerance: 0, unit: 'giờ', steps: [`t = S : v = ${S} : ${v} = ${t} giờ.`] };
    });

defineTopic('l5-hhcn-xungquanh-toanphan', 5, '📦', 'Diện Tích Xung Quanh, Toàn Phần Hình Hộp Chữ Nhật', ['diện tích xung quanh', 'diện tích toàn phần', 'hình hộp chữ nhật'],
    {
        meaning: 'Diện tích xung quanh = chu vi đáy × chiều cao. Diện tích toàn phần = diện tích xung quanh + diện tích 2 đáy.',
        example: 'Hộp 5cm×4cm×3cm → chu vi đáy = (5+4)×2 = 18cm; Sxq = 18×3 = 54cm²; Stp = 54 + 2×(5×4) = 94cm².',
        tip: 'Luôn tính diện tích xung quanh trước, rồi cộng thêm 2 lần diện tích đáy để ra diện tích toàn phần.',
        mistake: 'Quên nhân đôi diện tích đáy khi tính diện tích toàn phần.',
    },
    (d = 1) => {
        const max = Math.min(15, Math.round(8 * d) + 4);
        const a = randIntC(2, max), b = randIntC(2, max), c = randIntC(2, max);
        const askTP = Math.random() < 0.5;
        const cvDay = (a + b) * 2, sxq = cvDay * c, sday = a * b, stp = sxq + 2 * sday;
        return {
            text: `Hình hộp chữ nhật có đáy dài ${a}cm, rộng ${b}cm, cao ${c}cm. Tính diện tích ${askTP ? 'toàn phần' : 'xung quanh'}.`,
            visual: shapeCuboidSVG(a, b, c), answer: askTP ? stp : sxq, tolerance: 0, unit: 'cm²',
            steps: askTP
                ? [`Sxq = (${a}+${b})×2×${c} = ${sxq}cm².`, `Stp = Sxq + 2×đáy = ${sxq} + 2×${sday} = ${stp}cm².`]
                : [`Chu vi đáy = (${a}+${b})×2 = ${cvDay}cm.`, `Sxq = ${cvDay}×${c} = ${sxq}cm².`],
        };
    });

// ================================================================
// TỔNG HỢP: FORMULA_INDEX (dùng cho tìm kiếm/bookmark/gần đây, giữ
// nguyên tên biến để tương thích với app-core.js).
// ================================================================
const FORMULA_INDEX = Object.values(TOPIC_META).map(t => ({
    id: t.id, title: `${t.icon} ${t.title}`, level: t.grade, tags: t.tags,
}));

// ================================================================
// DỰNG SIDEBAR (menu-learn) VÀ CÁC PANEL HỌC/LUYỆN TẬP
// ================================================================
function buildLearnSidebar() {
    const menu = document.getElementById('menu-learn');
    if (!menu) return;
    let html = '';
    for (let g = 1; g <= 5; g++) {
        const ids = GRADE_TOPICS[g];
        html += `<div class="menu-group" data-grade="${g}">
            <button class="menu-header" onclick="toggleMenuGroup(this)">
                <span class="mh-text">${GRADE_ICONS[g]} ${GRADE_LABELS[g]}</span>
                <span class="mh-count">${ids.length}</span>
                <span class="mh-chevron">▾</span>
            </button>
            <div class="menu-group-items">
                ${ids.map(id => `<button class="menu-item" onclick="viewFormula('${id}', this)">${TOPIC_META[id].icon} ${TOPIC_META[id].title}</button>`).join('')}
            </div>
        </div>`;
    }
    menu.insertAdjacentHTML('beforeend', html);
}

// ================================================================
// LỌC THEO KHỐI LỚP ĐÃ CHỌN — mỗi học sinh chỉ học và ôn tập đúng lớp của
// mình sau khi chọn ở màn "Chọn lớp học" lúc đăng nhập (hoặc theo lớp phụ
// huynh đã khoá sẵn — xem locked_grade trong auth-ui.js). Trang này giờ
// chỉ có học sinh dùng nên luôn có đúng 1 khối lớp đang được lọc.
// ================================================================
window.MU_GRADE = null;

window.MU_setGrade = function (grade) {
    grade = parseInt(grade, 10);
    if (!grade || grade < 1 || grade > 5) return;
    window.MU_GRADE = grade;
    try { localStorage.setItem('mu_selected_grade', String(grade)); } catch (e) { /* bỏ qua nếu bị chặn */ }

    // Lớp 1-2: bật "chế độ icon lớn" — các em chưa rành chữ nên ưu tiên
    // hình ảnh/icon to, chữ chỉ là phụ. Xem CSS .mu-simple-mode.
    document.body.classList.toggle('mu-simple-mode', grade === 1 || grade === 2);

    // Sidebar học công thức: chỉ hiện đúng 1 nhóm lớp, tự mở luôn cho khỏi phải bấm thêm.
    document.querySelectorAll('#menu-learn .menu-group[data-grade]').forEach((g) => {
        const match = g.dataset.grade === String(grade);
        g.style.display = match ? '' : 'none';
        if (match) g.classList.remove('collapsed');
    });

    // Sidebar ôn tập: chỉ còn 1 nút đúng khối lớp (+ thẻ điểm cao đi kèm),
    // đổi luôn tiêu đề cho thân thiện.
    document.querySelectorAll('#menu-quiz .quiz-select[data-grade]').forEach((btn) => {
        btn.style.display = btn.dataset.grade === String(grade) ? '' : 'none';
    });
    document.querySelectorAll('#menu-quiz .highscore-box[data-grade]').forEach((box) => {
        box.style.display = box.dataset.grade === String(grade) ? '' : 'none';
    });
    const quizHeader = document.getElementById('quiz-grade-menu-header');
    if (quizHeader) quizHeader.innerHTML = `${GRADE_ICONS[grade]} Ôn Tập ${GRADE_LABELS[grade]}`;

    // Màn chào welcome-screen: chỉ hiện đúng 1 thẻ khối lớp của học sinh đó.
    document.querySelectorAll('#welcome-level-picker .level-card[data-grade]').forEach((c) => {
        c.style.display = c.dataset.grade === String(grade) ? '' : 'none';
    });

    // Nếu welcome-screen có placeholder tên lớp/con vật thì cập nhật luôn.
    document.querySelectorAll('[data-grade-animal]').forEach((el) => {
        el.textContent = `${GRADE_ICONS[grade]} ${GRADE_ANIMAL_NAMES[grade]}`;
    });
};

// Khi chuyển sang chế độ Ôn Tập mà học sinh đã có sẵn khối lớp, tự bấm
// giúp luôn nút khối lớp đó để khỏi mất thêm 1 bước bấm chọn lại lớp.
window.MU_autoSelectGradeInQuiz = function () {
    if (!window.MU_GRADE) return;
    const btn = document.querySelector(`#menu-quiz .quiz-select[data-grade="${window.MU_GRADE}"]`);
    if (btn) chooseLevel(`lop${window.MU_GRADE}`, btn);
};

function buildLearnPanels() {
    const container = document.getElementById('learn-panels');
    if (!container) return;
    let html = '';
    Object.values(TOPIC_META).forEach(t => {
        html += `
        <div id="${t.id}" class="formula-panel" data-title="${t.icon} ${t.title}" data-level="${t.grade}">
            <div class="panel-actions">
                <button class="action-tag" onclick="toggleBookmark('${t.id}','${t.icon} ${t.title}',this)">⭐ Đánh Dấu</button>
                <button class="action-tag" onclick="window.MU_PRACTICE.launchTopicQuiz('${t.id}')">🎯 Luyện Tập Ngay (5 câu)</button>
            </div>
            <h2>${t.icon} ${t.title}</h2>
            <div class="formula-expr">${t.example.replace(/<[^>]+>/g, ' ').split('&nbsp;→&nbsp;').join(' → ')}</div>
            <details class="mu-explain-box">
                <summary class="mu-explain-toggle">
                    <span class="mu-explain-mascot" data-mascot-mood="thinking" data-mascot-live="1"></span>
                    <span class="mu-explain-toggle-text">
                        <b>Bống giải thích thêm</b>
                        <small>Chạm để xem ý nghĩa, ví dụ, mẹo nhớ...</small>
                    </span>
                    <span class="mu-explain-chevron">▾</span>
                </summary>
                <div class="mu-learn-sec mu-ls-meaning"><span class="mu-ls-icon">💡</span><div class="mu-ls-text"><b>Ý nghĩa</b>${t.meaning}</div></div>
                <div class="mu-learn-sec mu-ls-example"><span class="mu-ls-icon">✏️</span><div class="mu-ls-text"><b>Ví dụ giải mẫu</b>${t.example}</div></div>
                <div class="mu-learn-sec mu-ls-tip"><span class="mu-ls-icon">🌟</span><div class="mu-ls-text"><b>Mẹo nhớ</b>${t.tip}</div></div>
                <div class="mu-learn-sec mu-ls-mistake"><span class="mu-ls-icon">⚠️</span><div class="mu-ls-text"><b>Lỗi hay gặp</b>${t.mistake}</div></div>
            </details>
            <div class="mu-practice-zone" id="practice-${t.id}"></div>
        </div>`;
    });
    container.insertAdjacentHTML('beforeend', html);
    // Sau khi panel đã có trong DOM, khởi tạo khu luyện tập cho từng panel.
    Object.keys(TOPIC_META).forEach(id => window.MU_PRACTICE && window.MU_PRACTICE.mount(id));
    // Đổ Bống vào từng nút "Bống giải thích thêm" (data-mascot-mood là mood mong muốn).
    // Nếu có data-mascot-live, đăng ký cho bấm/chạm vào để Bống phản ứng vui nhộn.
    if (typeof mascotSVG === 'function') {
        container.querySelectorAll('[data-mascot-mood]').forEach(el => {
            const size = 28;
            el.innerHTML = mascotSVG(el.dataset.mascotMood, size);
            if (el.dataset.mascotLive && typeof mascotMakeInteractive === 'function') {
                // Ngăn việc bấm vào Bống làm gấp/mở luôn khối <details> cha ngoài ý muốn kép.
                el.addEventListener('click', (e) => e.stopPropagation());
                mascotMakeInteractive(el, el.dataset.mascotMood, size);
            }
        });
    }
}

buildLearnSidebar();
buildLearnPanels();