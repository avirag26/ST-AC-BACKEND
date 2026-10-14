"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSimplePdf = buildSimplePdf;
function buildSimplePdf(title, lines) {
    const contentLines = [title, ''];
    for (const line of lines) {
        const chunks = wrapText(line, 90);
        contentLines.push(...chunks);
    }
    const escaped = contentLines.map((line) => escapePdfText(line));
    const streamParts = ['BT', '/F1 11 Tf', '50 780 Td', '14 TL'];
    escaped.forEach((line, index) => {
        if (index === 0) {
            streamParts.push(`(${line}) Tj`);
        }
        else {
            streamParts.push('T*');
            streamParts.push(`(${line}) Tj`);
        }
    });
    streamParts.push('ET');
    const stream = streamParts.join('\n');
    const objects = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
    objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`);
    objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(Buffer.byteLength(pdf, 'utf8'));
        pdf += obj;
    }
    const xrefStart = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i < offsets.length; i += 1) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefStart}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
}
function wrapText(text, width) {
    const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const paragraphs = clean.split('\n');
    const out = [];
    for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
            out.push('');
            continue;
        }
        const words = paragraph.split(/\s+/);
        let current = '';
        for (const word of words) {
            const next = current ? `${current} ${word}` : word;
            if (next.length > width && current) {
                out.push(current);
                current = word;
            }
            else {
                current = next;
            }
        }
        if (current)
            out.push(current);
    }
    return out.length ? out : [''];
}
function escapePdfText(value) {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/[^\x20-\x7E]/g, '?');
}
//# sourceMappingURL=pdf.util.js.map