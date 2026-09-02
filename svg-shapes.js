function objectRow(emoji, count, opts = {}) {
    if (count <= 0) return `<span class="mu-obj-empty">(không có)</span>`;
    const items = Array.from({ length: count }, () => `<span class="mu-obj">${emoji}</span>`).join('');
    return `<div class="mu-object-row">${items}</div>`;
}

// Hai nhóm vật thể cộng lại: "🌸🌸🌸  +  🌸🌸  =  ?"
function objectAddVisual(emoji, a, b) {
    return `
        <div class="mu-object-op">
            ${objectRow(emoji, a)}
            <span class="mu-obj-sign">+</span>
            ${objectRow(emoji, b)}
        </div>`;
}

// Trừ trực quan: tổng ban đầu, phần bị gạch bỏ (đã lấy đi) hiển thị mờ + gạch chéo
function objectSubtractVisual(emoji, total, removed) {
    const items = Array.from({ length: total }, (_, i) => {
        const isRemoved = i >= (total - removed);
        return `<span class="mu-obj${isRemoved ? ' mu-obj-removed' : ''}">${emoji}</span>`;
    }).join('');
    return `<div class="mu-object-row">${items}</div><div class="mu-obj-note">✂️ Đã bớt đi ${removed} (phần bị gạch)</div>`;
}


function numberLineSVG(n, direction) {
    // direction: 'next' (tìm số liền SAU, mũi tên phải) | 'prev' (liền TRƯỚC, mũi tên trái)
    const cellW = 56, cellH = 56, pad = 16, count = 5;
    const viewW = cellW * count + pad * 2, viewH = cellH + pad * 2 + 26;
    const startVal = n - 2; // 5 ô: n-2, n-1, n, n+1, n+2
    const targetVal = direction === 'next' ? n + 1 : n - 1;

    let cells = '';
    for (let i = 0; i < count; i++) {
        const val = startVal + i;
        const x = pad + i * cellW;
        const isKnown = val === n;
        const isTarget = val === targetVal;
        const fillClass = isTarget ? 'geo-shape-highlight-target' : (isKnown ? 'geo-shape-highlight-known' : 'geo-shape');
        const label = isTarget ? '?' : String(val);
        cells += `
            <rect x="${x}" y="${pad}" width="${cellW}" height="${cellH}" class="${fillClass}" rx="10"/>
            <text x="${x + cellW / 2}" y="${pad + cellH / 2 + 8}" class="geo-cell-label" text-anchor="middle">${label}</text>
        `;
    }

    // Mũi tên cong nối ô "biết" tới ô "cần tìm", nằm phía trên các ô số
    const knownIdx = 2; // ô ở giữa luôn là n
    const targetIdx = direction === 'next' ? 3 : 1;
    const x1 = pad + knownIdx * cellW + cellW / 2;
    const x2 = pad + targetIdx * cellW + cellW / 2;
    const arrowY = pad - 6;
    const midX = (x1 + x2) / 2;

    return svgFrame(`
        <defs>
            <marker id="nl-arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" class="geo-arrowhead"/>
            </marker>
        </defs>
        ${cells}
        <path d="M ${x1} ${arrowY} Q ${midX} ${arrowY - 24} ${x2} ${arrowY}" class="geo-arrow-path" marker-end="url(#nl-arrowhead)"/>
        <text x="${midX}" y="${arrowY - 28}" class="geo-label" text-anchor="middle">${direction === 'next' ? '+1' : '−1'}</text>
    `, viewW, viewH);
}

// Lưới vật thể hàng x cột — minh họa phép nhân trực quan: "n hàng, mỗi hàng x vật"
function arrayGridSVG(rows, cols, emoji) {
    const rowsHtml = Array.from({ length: rows }, () => objectRow(emoji, cols)).join('');
    return `<div class="mu-array-grid">${rowsHtml}</div><div class="mu-obj-note">${rows} hàng × ${cols} vật mỗi hàng</div>`;
}

// Khối que tính chục — đơn vị (base-10 blocks) minh họa cộng/trừ có nhớ và số có
// nhiều chữ số: mỗi "que dài" = 1 chục (10 ô), mỗi "ô vuông nhỏ" = 1 đơn vị.
// Cách học quen thuộc với học sinh Tiểu học Việt Nam (que tính Cánh Diều/Kết Nối).
function placeValueBlocksSVG(tens, units, opts = {}) {
    const rodW = 14, rodH = 90, gap = 8, unitSize = 20;
    const tensToShow = Math.min(tens, 9); // giới hạn hiển thị để không tràn khung
    const unitsToShow = Math.min(units, 9);
    const pad = 16;
    const rodsWidth = tensToShow * (rodW + gap);
    const unitsPerRow = 5;
    const unitRows = Math.ceil(unitsToShow / unitsPerRow) || 1;
    const unitsBlockW = Math.min(unitsToShow, unitsPerRow) * (unitSize + 4);
    const viewW = pad * 2 + Math.max(rodsWidth, unitsBlockW, 40) + (tensToShow > 0 && unitsToShow > 0 ? 20 : 0);
    const viewH = pad * 2 + rodH + 30;

    let rods = '';
    for (let i = 0; i < tensToShow; i++) {
        const x = pad + i * (rodW + gap);
        rods += `<rect x="${x}" y="${pad}" width="${rodW}" height="${rodH}" rx="4" class="geo-shape-tens"/>`;
        for (let j = 1; j < 10; j++) {
            rods += `<line x1="${x}" y1="${pad + j * (rodH/10)}" x2="${x+rodW}" y2="${pad + j*(rodH/10)}" class="geo-block-tick"/>`;
        }
    }

    let units_ = '';
    const unitsX = pad + rodsWidth + (tensToShow > 0 ? 16 : 0);
    for (let i = 0; i < unitsToShow; i++) {
        const col = i % unitsPerRow, row = Math.floor(i / unitsPerRow);
        const x = unitsX + col * (unitSize + 4);
        const y = pad + rodH - unitSize - row * (unitSize + 4);
        units_ += `<rect x="${x}" y="${y}" width="${unitSize}" height="${unitSize}" rx="3" class="geo-shape-units"/>`;
    }

    const label = `<text x="${pad}" y="${pad + rodH + 22}" class="geo-label">${tens} chục ${units ? '+ ' + units + ' đơn vị' : ''}</text>`;
    return svgFrame(`${rods}${units_}${label}`, viewW, viewH);
}

// Tứ giác bất kỳ có 4 cạnh ghi số đo — minh họa bài "Chu vi hình tứ giác"
function quadrilateralSVG(sides) {
    const [a, b, c, d] = sides;
    const pts = [ [40, 150], [190, 130], [220, 40], [70, 20] ]; // hình tứ giác lệch, cố định hình dáng dễ nhìn
    const pathD = `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]} L ${pts[2][0]} ${pts[2][1]} L ${pts[3][0]} ${pts[3][1]} Z`;
    const mid = (p1, p2) => [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2];
    const labels = [a, b, c, d];
    const midpoints = [mid(pts[0],pts[1]), mid(pts[1],pts[2]), mid(pts[2],pts[3]), mid(pts[3],pts[0])];
    const labelsHtml = midpoints.map((m, i) =>
        `<text x="${m[0]}" y="${m[1]}" class="geo-label" text-anchor="middle">${labels[i]}cm</text>`).join('');
    return svgFrame(`<path d="${pathD}" class="geo-shape"/>${labelsHtml}`, 260, 190);
}

// ---------- Khối hình học (SVG thật, có ghi số đo) ----------
function svgFrame(inner, viewW, viewH) {
    return `<svg viewBox="0 0 ${viewW} ${viewH}" class="geo-svg" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function shapeRectangleSVG(a, b) {
    const maxDim = 220, pad = 30;
    const ratio = a / b;
    let w, h;
    if (ratio >= 1) { w = maxDim; h = maxDim / ratio; } else { h = maxDim; w = maxDim * ratio; }
    const viewW = w + pad * 2, viewH = h + pad * 2 + 20;
    const x = pad, y = pad;
    return svgFrame(`
        <rect x="${x}" y="${y}" width="${w}" height="${h}" class="geo-shape" />
        <text x="${x + w/2}" y="${y - 10}" class="geo-label" text-anchor="middle">a = ${a} cm</text>
        <text x="${x - 12}" y="${y + h/2}" class="geo-label" text-anchor="middle" transform="rotate(-90 ${x-12} ${y+h/2})">b = ${b} cm</text>
    `, viewW, viewH);
}

function shapeSquareSVG(a) { return shapeRectangleSVG(a, a); }

function shapeTriangleSVG(a, h) {
    const maxDim = 220, pad = 30;
    const ratio = a / h;
    let w, hh;
    if (ratio >= 1) { w = maxDim; hh = maxDim / ratio; } else { hh = maxDim; w = maxDim * ratio; }
    const viewW = w + pad * 2, viewH = hh + pad * 2 + 20;
    const x0 = pad, y0 = pad + hh;
    const apexX = x0 + w * 0.35;
    return svgFrame(`
        <polygon points="${x0},${y0} ${x0+w},${y0} ${apexX},${pad}" class="geo-shape" />
        <line x1="${apexX}" y1="${pad}" x2="${apexX}" y2="${y0}" class="geo-dashed" />
        <text x="${x0 + w/2}" y="${y0 + 22}" class="geo-label" text-anchor="middle">a = ${a} cm</text>
        <text x="${apexX + 10}" y="${pad + hh/2}" class="geo-label" text-anchor="start">h = ${h} cm</text>
    `, viewW, viewH);
}

function shapeTrapezoidSVG(a, b, h) {
    const maxDim = 220, pad = 30;
    const scale = maxDim / Math.max(a, h * 1.2);
    const w1 = a * scale, w2 = b * scale, hh = h * scale;
    const viewW = w1 + pad * 2, viewH = hh + pad * 2 + 20;
    const x0 = pad, y0 = pad + hh;
    const offset = (w1 - w2) / 2;
    return svgFrame(`
        <polygon points="${x0},${y0} ${x0+w1},${y0} ${x0+w1-offset},${pad} ${x0+offset},${pad}" class="geo-shape" />
        <text x="${x0 + w1/2}" y="${y0 + 22}" class="geo-label" text-anchor="middle">a = ${a} cm</text>
        <text x="${x0 + w1/2}" y="${pad - 10}" class="geo-label" text-anchor="middle">b = ${b} cm</text>
        <line x1="${x0+offset}" y1="${pad}" x2="${x0+offset}" y2="${y0}" class="geo-dashed" />
        <text x="${x0 + offset - 10}" y="${pad + hh/2}" class="geo-label" text-anchor="end">h = ${h} cm</text>
    `, viewW, viewH);
}

function shapeCircleSVG(r) {
    const maxR = 90, pad = 30;
    const viewW = maxR * 2 + pad * 2, viewH = maxR * 2 + pad * 2;
    const cx = viewW / 2, cy = viewH / 2;
    return svgFrame(`
        <circle cx="${cx}" cy="${cy}" r="${maxR}" class="geo-shape" />
        <line x1="${cx}" y1="${cy}" x2="${cx + maxR}" y2="${cy}" class="geo-dashed" />
        <circle cx="${cx}" cy="${cy}" r="2.5" fill="var(--pink,#db2777)" />
        <text x="${cx + maxR/2}" y="${cy - 8}" class="geo-label" text-anchor="middle">r = ${r} cm</text>
    `, viewW, viewH);
}

function shapeParallelogramSVG(a, h) {
    const maxDim = 220, pad = 30;
    const scale = maxDim / (a * 1.3);
    const w = a * scale, hh = Math.min(h * scale, 150);
    const skew = w * 0.28;
    const viewW = w + skew + pad * 2, viewH = hh + pad * 2 + 20;
    const x0 = pad, y0 = pad + hh;
    return svgFrame(`
        <polygon points="${x0+skew},${pad} ${x0+skew+w},${pad} ${x0+w},${y0} ${x0},${y0}" class="geo-shape" />
        <line x1="${x0+skew}" y1="${pad}" x2="${x0+skew}" y2="${y0}" class="geo-dashed" />
        <text x="${x0 + w/2}" y="${y0 + 22}" class="geo-label" text-anchor="middle">a (đáy) = ${a} cm</text>
        <text x="${x0+skew-10}" y="${pad + hh/2}" class="geo-label" text-anchor="end">h = ${h} cm</text>
    `, viewW, viewH);
}

function shapeRhombusSVG(d1, d2) {
    const maxDim = 200, pad = 30;
    const scale = maxDim / Math.max(d1, d2);
    const halfD1 = (d1 * scale) / 2, halfD2 = (d2 * scale) / 2;
    const viewW = d1 * scale + pad * 2, viewH = d2 * scale + pad * 2;
    const cx = viewW / 2, cy = viewH / 2;
    return svgFrame(`
        <polygon points="${cx},${cy-halfD2} ${cx+halfD1},${cy} ${cx},${cy+halfD2} ${cx-halfD1},${cy}" class="geo-shape" />
        <line x1="${cx-halfD1}" y1="${cy}" x2="${cx+halfD1}" y2="${cy}" class="geo-dashed" />
        <line x1="${cx}" y1="${cy-halfD2}" x2="${cx}" y2="${cy+halfD2}" class="geo-dashed" />
        <text x="${cx}" y="${cy+halfD2+18}" class="geo-label" text-anchor="middle">d₁ = ${d1} cm</text>
        <text x="${cx+halfD1+8}" y="${cy}" class="geo-label" text-anchor="start">d₂ = ${d2} cm</text>
    `, viewW, viewH);
}

// Hình hộp chữ nhật (khối 3 chiều vẽ giả phối cảnh)
function shapeCuboidSVG(a, b, c) {
    const pad = 30, sx = 130 / Math.max(a, 1), depth = 40;
    const w = Math.min(a * sx, 160), h = Math.min(c * sx, 120), d = Math.min(b * sx * 0.6, depth);
    const viewW = w + d + pad * 2, viewH = h + d + pad * 2;
    const x0 = pad, y0 = pad + d + h;
    return svgFrame(`
        <polygon points="${x0},${y0-h} ${x0+w},${y0-h} ${x0+w},${y0} ${x0},${y0}" class="geo-shape" />
        <polygon points="${x0},${y0-h} ${x0+d},${y0-h-d} ${x0+w+d},${y0-h-d} ${x0+w},${y0-h}" class="geo-shape" style="opacity:0.75" />
        <polygon points="${x0+w},${y0-h} ${x0+w+d},${y0-h-d} ${x0+w+d},${y0-d} ${x0+w},${y0}" class="geo-shape" style="opacity:0.55" />
        <text x="${x0+w/2}" y="${y0+20}" class="geo-label" text-anchor="middle">a = ${a} cm</text>
        <text x="${x0-8}" y="${y0-h/2}" class="geo-label" text-anchor="end">c = ${c} cm</text>
        <text x="${x0+w+d/2+6}" y="${y0-h-d/2-4}" class="geo-label" text-anchor="middle">b = ${b} cm</text>
    `, viewW, viewH);
}

function shapeCubeSVG(a) { return shapeCuboidSVG(a, a, a); }

// Nhận diện hình phẳng cơ bản Lớp 1 (không ghi số đo — chỉ để nhận biết)
function shapeBasicSVG(kind) {
    const pad = 20, size = 140;
    const viewW = size + pad * 2, viewH = size + pad * 2;
    const cx = viewW / 2, cy = viewH / 2;
    let inner = '';
    if (kind === 'vuong') inner = `<rect x="${cx-60}" y="${cy-60}" width="120" height="120" class="geo-shape" />`;
    else if (kind === 'chunhat') inner = `<rect x="${cx-70}" y="${cy-42}" width="140" height="84" class="geo-shape" />`;
    else if (kind === 'tron') inner = `<circle cx="${cx}" cy="${cy}" r="65" class="geo-shape" />`;
    else if (kind === 'tamgiac') inner = `<polygon points="${cx},${cy-65} ${cx+65},${cy+55} ${cx-65},${cy+55}" class="geo-shape" />`;
    else if (kind === 'tugiac') inner = `<polygon points="${cx-60},${cy-45} ${cx+68},${cy-60} ${cx+55},${cy+55} ${cx-65},${cy+40}" class="geo-shape" />`;
    return svgFrame(inner, viewW, viewH);
}

// ---------- Khối lập phương / khối hộp chữ nhật (nhận diện Lớp 1, KHÔNG ghi số đo) ----------
function shapeSolidBasicSVG(kind) {
    const pad = 26, dd = 30;
    if (kind === 'lapphuong') {
        const s = 100;
        const vw = s + dd + pad * 2, vh = s + dd + pad * 2;
        const x = pad, y = pad + dd + s;
        return svgFrame(`
            <polygon points="${x},${y-s} ${x+s},${y-s} ${x+s},${y} ${x},${y}" class="geo-shape" />
            <polygon points="${x},${y-s} ${x+dd},${y-s-dd} ${x+s+dd},${y-s-dd} ${x+s},${y-s}" class="geo-shape" style="opacity:0.75" />
            <polygon points="${x+s},${y-s} ${x+s+dd},${y-s-dd} ${x+s+dd},${y-dd} ${x+s},${y}" class="geo-shape" style="opacity:0.55" />
        `, vw, vh);
    }
    const w = 150, h = 90;
    const viewW = w + dd + pad * 2, viewH = h + dd + pad * 2;
    const x0 = pad, y0 = pad + dd + h;
    return svgFrame(`
        <polygon points="${x0},${y0-h} ${x0+w},${y0-h} ${x0+w},${y0} ${x0},${y0}" class="geo-shape" />
        <polygon points="${x0},${y0-h} ${x0+dd},${y0-h-dd} ${x0+w+dd},${y0-h-dd} ${x0+w},${y0-h}" class="geo-shape" style="opacity:0.75" />
        <polygon points="${x0+w},${y0-h} ${x0+w+dd},${y0-h-dd} ${x0+w+dd},${y0-dd} ${x0+w},${y0}" class="geo-shape" style="opacity:0.55" />
    `, viewW, viewH);
}

// ---------- Đồng hồ (giờ đúng) ----------
function clockFaceSVG(hour) {
    const size = 200, r = 84, cx = size / 2, cy = size / 2;
    let ticks = '';
    for (let n = 1; n <= 12; n++) {
        const angle = (n / 12) * 2 * Math.PI - Math.PI / 2;
        const tx = cx + Math.cos(angle) * (r - 20);
        const ty = cy + Math.sin(angle) * (r - 20) + 5;
        ticks += `<text x="${tx}" y="${ty}" class="geo-clock-num" text-anchor="middle">${n}</text>`;
    }
    const hourAngle = ((hour % 12) / 12) * 2 * Math.PI - Math.PI / 2;
    const hx = cx + Math.cos(hourAngle) * (r * 0.48);
    const hy = cy + Math.sin(hourAngle) * (r * 0.48);
    const minAngle = -Math.PI / 2; // giờ đúng: kim phút luôn chỉ số 12
    const mx = cx + Math.cos(minAngle) * (r * 0.76);
    const my = cy + Math.sin(minAngle) * (r * 0.76);
    return svgFrame(`
        <circle cx="${cx}" cy="${cy}" r="${r}" class="geo-shape" stroke-width="4" />
        ${ticks}
        <line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" class="geo-clock-hour" />
        <line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" class="geo-clock-min" />
        <circle cx="${cx}" cy="${cy}" r="4" fill="var(--pink,#db2777)" />
    `, size, size);
}

// ---------- So sánh độ dài (dài hơn / ngắn hơn) ----------
function lengthCompareSVG(lenA, lenB, labelA, labelB) {
    const scale = 20, pad = 14, barH = 28, gap = 34, labelW = 96;
    const maxLen = Math.max(lenA, lenB);
    const viewW = labelW + maxLen * scale + pad * 2, viewH = barH * 2 + gap + pad * 2;
    const wA = lenA * scale, wB = lenB * scale;
    const y1 = pad + 10, y2 = pad + barH + gap + 10;
    const barX = pad + labelW;
    return svgFrame(`
        <text x="${pad}" y="${y1 + barH / 2 + 5}" class="geo-label" text-anchor="start">${labelA}</text>
        <rect x="${barX}" y="${y1}" width="${wA}" height="${barH}" rx="8" class="geo-shape" />
        <text x="${pad}" y="${y2 + barH / 2 + 5}" class="geo-label" text-anchor="start">${labelB}</text>
        <rect x="${barX}" y="${y2}" width="${wB}" height="${barH}" rx="8" class="geo-shape" style="opacity:0.65" />
    `, viewW, viewH);
}

// ---------- Góc (nhọn / vuông / tù / bẹt) ----------
function angleSVG(kind) {
    const angles = { nhon: 40, vuong: 90, tu: 130, bet: 180 };
    const deg = angles[kind] || 90;
    const rad = (deg * Math.PI) / 180;
    const len = 120, pad = 24, cx = pad + 20, cy = 150 - pad;
    const x2 = cx + len, y2 = cy;
    const x3 = cx + Math.cos(-rad) * len, y3 = cy + Math.sin(-rad) * len;
    const viewW = len + 80, viewH = 150;
    const largeArc = deg > 180 ? 1 : 0;
    const rightAngleMark = kind === 'vuong'
        ? `<polyline points="${cx+18},${cy} ${cx+18},${cy-18} ${cx},${cy-18}" class="geo-dashed" fill="none" />`
        : `<path d="M ${cx+28} ${cy} A 28 28 0 ${largeArc} 0 ${cx + Math.cos(-rad)*28} ${cy + Math.sin(-rad)*28}" class="geo-dashed" fill="none" />`;
    return svgFrame(`
        <line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" class="geo-shape" stroke-width="4" fill="none" />
        <line x1="${cx}" y1="${cy}" x2="${x3}" y2="${y3}" class="geo-shape" stroke-width="4" fill="none" />
        ${rightAngleMark}
        <circle cx="${cx}" cy="${cy}" r="3" fill="var(--pink,#db2777)" />
    `, viewW, viewH);
}

// ---------- Cân trái cây (khối lượng: g, kg) ----------
function weighScaleSVG(emoji, label) {
    const viewW = 160, viewH = 190, cx = viewW / 2;
    return svgFrame(`
        <line x1="${cx}" y1="8" x2="${cx}" y2="36" class="geo-shape" stroke-width="3" fill="none" />
        <rect x="${cx-32}" y="36" width="64" height="56" rx="12" class="geo-shape" />
        <text x="${cx}" y="70" class="geo-label" text-anchor="middle" font-size="15">${label}</text>
        <line x1="${cx}" y1="92" x2="${cx}" y2="122" class="geo-dashed" fill="none" />
        <text x="${cx}" y="158" text-anchor="middle" font-size="34">${emoji}</text>
    `, viewW, viewH);
}

// ---------- Ca đong nước (dung tích: lít) ----------
function jugSVG(amount, maxAmount, unit) {
    const w = 84, h = 120, pad = 18;
    const viewW = w + pad * 2, viewH = h + pad * 2 + 6;
    const x = pad, y = pad;
    const fillRatio = Math.min(1, amount / maxAmount);
    const fillH = h * fillRatio;
    const fillY = y + h - fillH;
    return svgFrame(`
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="geo-dashed" fill="none" />
        <rect x="${x}" y="${fillY}" width="${w}" height="${fillH}" rx="8" class="geo-shape" style="opacity:0.8" />
        <text x="${x+w/2}" y="${y+h/2+6}" class="geo-label" text-anchor="middle">${amount}${unit}</text>
    `, viewW, viewH);
}

// ---------- Tờ tiền Việt Nam (HTML, giống objectRow) ----------
function moneyChipsHTML(denoms) {
    const items = [];
    denoms.forEach(d => {
        for (let i = 0; i < d.count; i++) {
            items.push(`<span class="mu-money-chip mu-money-${d.value}">${d.value.toLocaleString('vi-VN')}đ</span>`);
        }
    });
    return `<div class="mu-money-row">${items.join('')}</div>`;
}

// ---------- Mô hình phân số (băng chia phần) ----------
function fractionBarSVG(numerator, denominator) {
    const pad = 12, totalW = 260, h = 60;
    const partW = totalW / denominator;
    let rects = '';
    for (let i = 0; i < denominator; i++) {
        const filled = i < numerator;
        rects += `<rect x="${pad + i*partW}" y="${pad}" width="${partW}" height="${h}" class="geo-shape" style="${filled ? '' : 'opacity:0.12'}" stroke="var(--text)"/>`;
    }
    const viewW = totalW + pad * 2, viewH = h + pad * 2;
    return svgFrame(rects, viewW, viewH);
}

// ================================================================
// NHÓM HÀNG SỐ LỚN — minh họa cách "tách nhóm 3 chữ số từ phải sang"
// khi đọc/so sánh số nhiều chữ số (lớp 3: phạm vi 100 000; lớp 4: hàng
// triệu). Mỗi nhóm 3 chữ số (đơn vị / nghìn / triệu) là 1 khối riêng,
// có thể tô đậm 1 khối để hỏi "chữ số hàng X là bao nhiêu?".
// highlightGroup: 0 = nhóm đơn vị (phải nhất), 1 = nhóm nghìn, 2 = nhóm triệu...
// ================================================================
function numberGroupsSVG(n, highlightGroup) {
    const groupNames = ['đơn vị', 'nghìn', 'triệu'];
    const digits = String(Math.trunc(Math.abs(n)));
    const groups = [];
    for (let i = digits.length; i > 0; i -= 3) {
        groups.unshift(digits.slice(Math.max(0, i - 3), i));
    }
    const digitW = 26, digitGap = 2, groupGap = 14, pad = 14, boxH = 46;
    let x = pad;
    let inner = '';
    const groupCount = groups.length;
    groups.forEach((g, gi) => {
        const groupIdxFromRight = groupCount - 1 - gi;
        const isHighlight = highlightGroup !== undefined && groupIdxFromRight === highlightGroup;
        const w = g.length * digitW + (g.length - 1) * digitGap;
        inner += `<rect x="${x - 4}" y="${pad - 4}" width="${w + 8}" height="${boxH + 8}" rx="8" class="${isHighlight ? 'geo-shape-highlight-target' : 'geo-shape'}" style="${isHighlight ? '' : 'opacity:0.85'}"/>`;
        [...g].forEach((d, di) => {
            const dx = x + di * (digitW + digitGap) + digitW / 2;
            inner += `<text x="${dx}" y="${pad + boxH/2 + 8}" class="geo-cell-label" text-anchor="middle" fill="${isHighlight ? '#fff' : ''}">${d}</text>`;
        });
        inner += `<text x="${x + w/2}" y="${pad + boxH + 20}" class="geo-label" text-anchor="middle" font-size="11">${groupNames[groupIdxFromRight] || ''}</text>`;
        x += w + groupGap;
    });
    const viewW = x - groupGap + pad, viewH = pad + boxH + 32;
    return svgFrame(inner, viewW, viewH);
}

// ================================================================
// ĐẶT TÍNH THEO CỘT — minh họa 2 số được đặt thẳng hàng đơn vị/chục/trăm
// để cộng/trừ/nhân, đúng cách trình bày quen thuộc trong vở học sinh
// Tiểu học. op: '+' | '-' | '×'
// ================================================================
function columnOpSVG(a, b, op) {
    const digitW = 30, pad = 14;
    const sa = String(a), sb = String(b);
    const width = Math.max(sa.length, sb.length) + 1; // +1 chỗ cho dấu phép tính
    const totalW = width * digitW;
    const viewW = totalW + pad * 2, viewH = 3 * 40 + pad * 2 + 6;
    const rowY = (rowIdx) => pad + rowIdx * 40 + 28;
    const digitsRow = (str, rowIdx, opSymbol) => {
        let out = '';
        const startCol = width - str.length - (opSymbol ? 0 : 0);
        if (opSymbol) {
            out += `<text x="${pad + digitW/2}" y="${rowY(rowIdx)}" class="geo-cell-label" text-anchor="middle">${opSymbol}</text>`;
        }
        [...str].forEach((d, i) => {
            const col = width - str.length + i;
            const x = pad + col * digitW + digitW / 2;
            out += `<text x="${x}" y="${rowY(rowIdx)}" class="geo-cell-label" text-anchor="middle">${d}</text>`;
        });
        return out;
    };
    const lineY = pad + 2 * 40 + 8;
    return svgFrame(`
        ${digitsRow(sa, 0, '')}
        ${digitsRow(sb, 1, op)}
        <line x1="${pad}" y1="${lineY}" x2="${totalW + pad}" y2="${lineY}" class="geo-shape" stroke-width="2.5" fill="none"/>
    `, viewW, viewH);
}

// ================================================================
// BIỂU ĐỒ CỘT + ĐƯỜNG TRUNG BÌNH — minh họa "tìm số trung bình cộng":
// mỗi số là 1 cột cao thấp khác nhau, đường nét đứt nằm ngang ở mức
// trung bình giúp hình dung trực quan ý nghĩa "san bằng" các cột.
// ================================================================
function barChartSVG(nums, opts = {}) {
    const pad = 16, barW = 40, gap = 16, maxBarH = 130;
    const maxVal = Math.max(...nums, 1);
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    const scale = maxBarH / maxVal;
    const viewW = pad * 2 + nums.length * barW + (nums.length - 1) * gap;
    const viewH = pad + maxBarH + 36;
    const baseY = pad + maxBarH;
    let bars = '';
    nums.forEach((v, i) => {
        const h = Math.max(4, v * scale);
        const x = pad + i * (barW + gap);
        bars += `<rect x="${x}" y="${baseY - h}" width="${barW}" height="${h}" rx="4" class="geo-shape"/>`;
        bars += `<text x="${x + barW/2}" y="${baseY + 18}" class="geo-label" text-anchor="middle">${v}</text>`;
    });
    const avgY = baseY - avg * scale;
    return svgFrame(`
        ${bars}
        <line x1="${pad - 6}" y1="${avgY}" x2="${viewW - pad + 6}" y2="${avgY}" class="geo-arrow-path" stroke-dasharray="5 4"/>
        <text x="${viewW - pad}" y="${avgY - 6}" class="geo-label" text-anchor="end" fill="var(--coral,#ff6b6b)">TBC = ?</text>
    `, viewW, viewH);
}

// ================================================================
// LƯỚI 100 Ô — mô hình trực quan kinh điển cho tỉ số phần trăm: tô đậm
// đúng "percent" trong tổng 100 ô vuông nhỏ (10 hàng × 10 cột).
// ================================================================
function percentGridSVG(percent) {
    const cell = 18, gap = 2, pad = 12, cols = 10, rows = 10;
    const filled = Math.round(percent);
    const viewW = pad * 2 + cols * (cell + gap) - gap;
    const viewH = pad * 2 + rows * (cell + gap) - gap + 26;
    let cells = '';
    for (let i = 0; i < rows * cols; i++) {
        const row = Math.floor(i / cols), col = i % cols;
        const x = pad + col * (cell + gap), y = pad + row * (cell + gap);
        const isFilled = i < filled;
        cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" class="${isFilled ? 'geo-shape-highlight-known' : 'geo-shape'}" style="${isFilled ? '' : 'opacity:0.15'}"/>`;
    }
    return svgFrame(`${cells}<text x="${viewW/2}" y="${viewH - 6}" class="geo-label" text-anchor="middle">${filled}/100 ô = ${filled}%</text>`, viewW, viewH);
}

// ================================================================
// SƠ ĐỒ CHUYỂN ĐỘNG — đường thẳng từ A đến B, chỉ ghi những giá trị ĐÃ
// BIẾT trong đề (để không lộ đáp số). known: { distance?, time?, speed? }
// ================================================================
function motionDiagramSVG(known) {
    const viewW = 300, viewH = 110, pad = 24;
    const y = 55;
    let labels = '';
    if (known.speed !== undefined) {
        labels += `<text x="${viewW/2}" y="${y - 34}" class="geo-label" text-anchor="middle">v = ${known.speed}km/h</text>`;
    }
    if (known.time !== undefined) {
        labels += `<text x="${viewW/2}" y="${y - 14}" class="geo-label" text-anchor="middle">t = ${known.time} giờ</text>`;
    }
    if (known.distance !== undefined) {
        labels += `<text x="${viewW/2}" y="${y + 30}" class="geo-label" text-anchor="middle">S = ${known.distance}km</text>`;
    }
    return svgFrame(`
        <defs>
            <marker id="motion-arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" class="geo-arrowhead"/>
            </marker>
        </defs>
        <circle cx="${pad}" cy="${y}" r="7" class="geo-shape-highlight-known"/>
        <text x="${pad}" y="${y + 22}" class="geo-label" text-anchor="middle">A</text>
        <line x1="${pad + 10}" y1="${y}" x2="${viewW - pad - 4}" y2="${y}" class="geo-arrow-path" marker-end="url(#motion-arrowhead)"/>
        <text x="${viewW - pad*2}" y="${y - 10}" text-anchor="middle" font-size="26">🚗</text>
        <circle cx="${viewW - pad}" cy="${y}" r="7" class="geo-shape-highlight-known"/>
        <text x="${viewW - pad}" y="${y + 22}" class="geo-label" text-anchor="middle">B</text>
        ${labels}
    `, viewW, viewH);
}


function decimalCompareTableHTML(aStr, bStr) {
    const split = (s) => {
        const [intPart, decPart = ''] = s.replace(',', '.').split('.');
        return { intPart, decPart };
    };
    const A = split(aStr), B = split(bStr);
    const decLen = Math.max(A.decPart.length, B.decPart.length, 1);
    const headers = ['Đơn vị', ...Array.from({length: decLen}, (_, i) => i === 0 ? 'Phần mười' : i === 1 ? 'Phần trăm' : `Hàng ${i+1}`)];
    const row = (r) => {
        const decPadded = r.decPart.padEnd(decLen, ' ');
        const cells = [`<td class="mu-dec-cell mu-dec-int">${r.intPart}</td>`, `<td class="mu-dec-comma">,</td>`];
        for (let i = 0; i < decLen; i++) {
            const ch = decPadded[i];
            cells.push(`<td class="mu-dec-cell">${ch === ' ' ? '<span class="mu-dec-empty">0</span>' : ch}</td>`);
        }
        return `<tr>${cells.join('')}</tr>`;
    };
    return `<table class="mu-dec-table">
        <thead><tr><th>Đơn vị</th><th></th>${headers.slice(1).map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${row(A)}${row(B)}</tbody>
    </table>`;
}