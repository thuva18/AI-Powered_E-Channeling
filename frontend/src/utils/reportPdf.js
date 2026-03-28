import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Brand colours
const C = {
    blue: [37, 99, 235],
    indigo: [99, 102, 241],
    dark: [15, 23, 42],
    gray: [100, 116, 139],
    light: [241, 245, 249],
    green: [16, 185, 129],
    amber: [245, 158, 11],
    red: [239, 68, 68],
    violet: [139, 92, 246],
};

const fmtLKR = n => `LKR ${(n || 0).toLocaleString()}`;

// ── Page header (called once per new doc) ─────────────────────────────────────
function addPageHeader(doc, title, subtitle, dateFrom, dateTo) {
    const W = doc.internal.pageSize.getWidth();
    // Blue top bar
    doc.setFillColor(...C.blue);
    doc.rect(0, 0, W, 24, 'F');
    // Logo area
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('MediPortal', 14, 11);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('E-Channeling Platform', 14, 17);
    // Generated at (right aligned)
    doc.setFontSize(7);
    doc.text(`Generated: ${new Date().toLocaleString()}`, W - 14, 17, { align: 'right' });

    // Report title block
    doc.setTextColor(...C.dark);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(title || 'Report', 14, 36);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.gray);
    doc.text(subtitle || '', 14, 43);
    doc.setFontSize(8);
    doc.text(`Period: ${dateFrom}  →  ${dateTo}`, 14, 50);
    // Divider
    doc.setDrawColor(...C.blue); doc.setLineWidth(0.4);
    doc.line(14, 55, W - 14, 55);

    return 63; // starting Y after header
}

// ── Section heading ───────────────────────────────────────────────────────────
function sectionHeading(doc, y, text) {
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(...C.light);
    doc.roundedRect(14, y, W - 28, 9, 1.5, 1.5, 'F');
    doc.setFillColor(...C.blue);
    doc.roundedRect(14, y, 3.5, 9, 0.5, 0.5, 'F');
    doc.setTextColor(...C.blue);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(text, 21, y + 6);
    return y + 14;
}

// ── Stat row of boxes ─────────────────────────────────────────────────────────
function statRow(doc, y, stats) {
    const W = doc.internal.pageSize.getWidth();
    const usable = W - 28;
    const n = stats.length;
    const bw = (usable - (n - 1) * 3) / n;
    stats.forEach((s, i) => {
        const x = 14 + i * (bw + 3);
        doc.setFillColor(...(s.bg || C.light));
        doc.roundedRect(x, y, bw, 19, 2, 2, 'F');
        doc.setFillColor(...(s.accent || C.blue));
        doc.roundedRect(x, y, 3, 19, 1, 1, 'F');
        doc.setTextColor(...C.gray);
        doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text(String(s.label).toUpperCase(), x + 5, y + 7);
        doc.setTextColor(...(s.accent || C.dark));
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text(String(s.value ?? '—'), x + 5, y + 15);
    });
    return y + 24;
}

// ── Auto-safe page break ──────────────────────────────────────────────────────
function checkNewPage(doc, y, need = 40) {
    if (y + need > 275) { doc.addPage(); return 20; }
    return y;
}

// ── Page footers ──────────────────────────────────────────────────────────────
function addFooters(doc) {
    const total = doc.getNumberOfPages();
    const W = doc.internal.pageSize.getWidth();
    for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setDrawColor(220, 226, 234); doc.setLineWidth(0.3);
        doc.line(14, 283, W - 14, 283);
        doc.setTextColor(...C.gray); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
        doc.text('MediPortal E-Channeling — Confidential', 14, 289);
        doc.text(`Page ${i} of ${total}`, W - 14, 289, { align: 'right' });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STANDARD REPORT  (all 3 sections always included)
// ═══════════════════════════════════════════════════════════════════════════════
export function generateStandardPDF({ reportName, dateFrom, dateTo, data }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = addPageHeader(doc, reportName || 'Platform Report', 'Standard Overview Report', dateFrom, dateTo);

    const a = data?.appointments || {};
    const p = data?.payments || {};
    const dr = data?.doctorRevenue || [];

    // ── 1. Appointment Summary ─────────────────────────────────────────────────
    y = sectionHeading(doc, y, 'APPOINTMENT SUMMARY');
    y = statRow(doc, y, [
        { label: 'Total', value: a.total ?? 0, accent: C.blue },
        { label: 'Completed', value: a.completed ?? 0, accent: C.green },
        { label: 'Accepted', value: a.accepted ?? 0, accent: C.indigo },
        { label: 'Pending', value: a.pending ?? 0, accent: C.amber },
        { label: 'Cancelled', value: a.cancelled ?? 0, accent: C.red },
    ]);

    if (a.topSpecializations?.length) {
        y = checkNewPage(doc, y, 30);
        autoTable(doc, {
            startY: y, margin: { left: 14, right: 14 },
            head: [['Specialization', 'Appointments']],
            body: a.topSpecializations.map(s => [s._id || 'General', s.count]),
            theme: 'striped',
            headStyles: { fillColor: C.blue, textColor: 255, fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8 },
            columnStyles: { 1: { halign: 'center' } },
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    // ── 2. Doctor Revenue ──────────────────────────────────────────────────────
    y = checkNewPage(doc, y, 40);
    y = sectionHeading(doc, y, 'DOCTOR REVENUE');
    if (dr.length) {
        const totalRev = dr.reduce((s, d) => s + (d.revenue || 0), 0);
        const totalApt = dr.reduce((s, d) => s + (d.appointments || 0), 0);
        autoTable(doc, {
            startY: y, margin: { left: 14, right: 14 },
            head: [['Doctor', 'Specialization', 'Appointments', 'Revenue (LKR)', 'Avg/Visit']],
            body: [
                ...dr.map(d => [
                    `Dr. ${d.firstName || ''} ${d.lastName || ''}`.trim(),
                    d.specialization || '—',
                    d.appointments ?? 0,
                    fmtLKR(d.revenue),
                    d.appointments > 0 ? fmtLKR(Math.round(d.revenue / d.appointments)) : '—',
                ]),
                ['TOTAL', '', totalApt, fmtLKR(totalRev), ''],
            ],
            theme: 'striped',
            headStyles: { fillColor: C.violet, textColor: 255, fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8 },
            columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
            didParseCell: (d) => {
                if (d.row.index === dr.length) { // last row = total
                    d.cell.styles.fillColor = [235, 235, 255];
                    d.cell.styles.fontStyle = 'bold';
                }
            },
        });
        y = doc.lastAutoTable.finalY + 8;
    } else {
        doc.setTextColor(...C.gray); doc.setFontSize(8); doc.setFont('helvetica', 'italic');
        doc.text('No doctor revenue data for this period.', 14, y + 5);
        y += 12;
    }

    // ── 3. Payment Details ─────────────────────────────────────────────────────
    y = checkNewPage(doc, y, 50);
    y = sectionHeading(doc, y, 'PAYMENT DETAILS');
    y = statRow(doc, y, [
        { label: 'Total Revenue', value: fmtLKR(p.totalRevenue), accent: C.green },
        { label: 'Success Rate', value: `${p.successRate ?? 100}%`, accent: C.blue },
        { label: 'Paid Count', value: p.paidCount ?? 0, accent: C.indigo },
        { label: 'Refunds', value: p.refunds ?? 0, accent: C.red },
    ]);

    if (p.byMethod?.length) {
        y = checkNewPage(doc, y, 30);
        autoTable(doc, {
            startY: y, margin: { left: 14, right: 14 },
            head: [['Payment Method', 'Transactions', 'Revenue (LKR)', 'Share %']],
            body: p.byMethod.map(m => [
                m._id || '—', m.count,
                fmtLKR(m.amount),
                p.totalRevenue > 0 ? `${(m.amount / p.totalRevenue * 100).toFixed(1)}%` : '—'
            ]),
            theme: 'striped',
            headStyles: { fillColor: C.green, textColor: 255, fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8 },
            columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'center' } },
        });
    }

    addFooters(doc);
    doc.save(`${(reportName || 'report').replace(/\s+/g, '_')}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED REPORT
// ═══════════════════════════════════════════════════════════════════════════════
export function generateAdvancedPDF({ reportName, dateFrom, dateTo, advSections, data }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = addPageHeader(doc, reportName || 'Advanced Report', 'Advanced Analytics Report', dateFrom, dateTo);

    // ── Appointment Summary ────────────────────────────────────────────────────
    if (advSections?.appointmentSummary && data?.appointments) {
        const a = data.appointments;
        y = sectionHeading(doc, y, 'APPOINTMENT SUMMARY');
        y = statRow(doc, y, [
            { label: 'Total', value: a.total ?? 0, accent: C.blue },
            { label: 'Completed', value: a.completed ?? 0, accent: C.green },
            { label: 'Pending', value: a.pending ?? 0, accent: C.amber },
            { label: 'Cancelled', value: a.cancelled ?? 0, accent: C.red },
            { label: 'Accepted', value: a.accepted ?? 0, accent: C.indigo },
        ]);
        if (a.topSpecializations?.length) {
            y = checkNewPage(doc, y, 25);
            autoTable(doc, {
                startY: y, margin: { left: 14, right: 14 },
                head: [['Specialization', 'Count']], body: a.topSpecializations.map(s => [s._id || 'General', s.count]),
                theme: 'striped', headStyles: { fillColor: C.blue, textColor: 255, fontSize: 8, fontStyle: 'bold' }, bodyStyles: { fontSize: 8 },
            });
            y = doc.lastAutoTable.finalY + 8;
        }
    }

    // ── Doctor Performance ─────────────────────────────────────────────────────
    if (advSections?.doctorPerformance && data?.doctorPerformance?.length) {
        y = checkNewPage(doc, y, 45);
        y = sectionHeading(doc, y, 'DOCTOR PERFORMANCE');
        autoTable(doc, {
            startY: y, margin: { left: 14, right: 14 },
            head: [['Doctor', 'Specialization', 'Total', 'Completed', 'Cancelled', 'Completion %', 'Cancellation %']],
            body: data.doctorPerformance.map(d => [
                `Dr. ${d.name || ''}`, d.specialization || '—',
                d.total ?? 0, d.completed ?? 0, d.cancelled ?? 0,
                `${d.completionRate ?? 0}%`, `${d.cancellationRate ?? 0}%`
            ]),
            theme: 'striped',
            headStyles: { fillColor: C.violet, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
            bodyStyles: { fontSize: 7.5 },
            columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' } },
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    // ── Cancellation Analysis ──────────────────────────────────────────────────
    if (advSections?.cancellationAnalysis && data?.cancellation) {
        y = checkNewPage(doc, y, 50);
        y = sectionHeading(doc, y, 'CANCELLATION ANALYSIS');
        const c = data.cancellation;
        y = statRow(doc, y, [
            { label: 'Total Cancelled', value: c.total ?? 0, accent: C.red },
            { label: 'Cancellation Rate', value: `${c.rate ?? 0}%`, accent: C.amber },
        ]);
        if (c.byDay?.length) {
            y = checkNewPage(doc, y, 25);
            autoTable(doc, {
                startY: y, margin: { left: 14, right: 14 },
                head: [['Day', 'Cancellations']], body: c.byDay.map(d => [d.day, d.count]),
                theme: 'striped', headStyles: { fillColor: C.red, textColor: 255, fontSize: 8, fontStyle: 'bold' }, bodyStyles: { fontSize: 8 }, tableWidth: 80,
            });
            y = doc.lastAutoTable.finalY + 6;
        }
        if (c.byDoctor?.length) {
            y = checkNewPage(doc, y, 25);
            autoTable(doc, {
                startY: y, margin: { left: 14, right: 14 },
                head: [['Doctor', 'Cancellations']], body: c.byDoctor.map(d => [d.name, d.count]),
                theme: 'striped', headStyles: { fillColor: C.amber, textColor: 255, fontSize: 8, fontStyle: 'bold' }, bodyStyles: { fontSize: 8 },
            });
            y = doc.lastAutoTable.finalY + 8;
        }
    }

    // ── Financial Summary ──────────────────────────────────────────────────────
    if (advSections?.financialSummary && data?.financial) {
        y = checkNewPage(doc, y, 55);
        y = sectionHeading(doc, y, 'FINANCIAL SUMMARY');
        const f = data.financial;
        y = statRow(doc, y, [
            { label: 'Total Revenue', value: fmtLKR(f.total ?? 0), accent: C.green },
            { label: 'Avg Transaction', value: fmtLKR(Math.round(f.avg ?? 0)), accent: C.blue },
            { label: 'Success Rate', value: `${f.successRate ?? 100}%`, accent: C.indigo },
            { label: 'Refunds', value: f.refunds ?? 0, accent: C.red },
        ]);
        if (f.byMethod?.length) {
            y = checkNewPage(doc, y, 25);
            autoTable(doc, {
                startY: y, margin: { left: 14, right: 14 },
                head: [['Method', 'Transactions', 'Revenue (LKR)']], body: f.byMethod.map(m => [m._id || '—', m.count, fmtLKR(m.amount)]),
                theme: 'striped', headStyles: { fillColor: C.green, textColor: 255, fontSize: 8, fontStyle: 'bold' }, bodyStyles: { fontSize: 8 },
                columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
            });
            y = doc.lastAutoTable.finalY + 6;
        }
        if (f.dailyRevenue?.length) {
            y = checkNewPage(doc, y, 35);
            autoTable(doc, {
                startY: y, margin: { left: 14, right: 14 },
                head: [['Date', 'Transactions', 'Revenue (LKR)']], body: f.dailyRevenue.map(d => [d._id, d.count, fmtLKR(d.amount)]),
                theme: 'striped', headStyles: { fillColor: C.green, textColor: 255, fontSize: 8, fontStyle: 'bold' }, bodyStyles: { fontSize: 8 },
                columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
            });
            y = doc.lastAutoTable.finalY + 8;
        }
    }

    // ── Peak Hours ─────────────────────────────────────────────────────────────
    if (advSections?.peakHours && data?.peakHours?.length) {
        y = checkNewPage(doc, y, 50);
        y = sectionHeading(doc, y, 'PEAK HOURS ANALYSIS');
        const maxCount = Math.max(...data.peakHours.map(h => h.count || 0), 1);
        autoTable(doc, {
            startY: y, margin: { left: 14, right: 14 },
            head: [['Time Slot', 'Appointments', 'Load Bar', 'Load %']],
            body: data.peakHours.map(h => {
                const pct = Math.round((h.count / maxCount) * 100);
                const barLen = Math.round(pct / 5);
                return [
                    h.displayLabel || h.label || '—',
                    h.count ?? 0,
                    '█'.repeat(barLen) + '░'.repeat(20 - barLen),
                    `${pct}%`,
                ];
            }),
            theme: 'striped',
            headStyles: { fillColor: C.indigo, textColor: 255, fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, font: 'helvetica' },
            columnStyles: { 1: { halign: 'center' }, 3: { halign: 'center' } },
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    addFooters(doc);
    doc.save(`${(reportName || 'advanced_report').replace(/\s+/g, '_')}.pdf`);
}
