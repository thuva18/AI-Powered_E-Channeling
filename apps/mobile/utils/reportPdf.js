import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const fmtLKR = n => `LKR ${(n || 0).toLocaleString()}`;

const HTML_HEAD = `
<style>
  body { font-family: 'Helvetica', 'Arial', sans-serif; color: #0F172A; margin: 0; padding: 20px; }
  .header { background-color: #2563EB; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 24px; }
  .header p { margin: 4px 0 0 0; font-size: 14px; opacity: 0.9; }
  .report-meta { background-color: #F1F5F9; padding: 15px; border-radius: 0 0 8px 8px; margin-bottom: 20px; }
  .report-meta h2 { margin: 0; font-size: 18px; color: #1E293B; }
  .report-meta p { margin: 5px 0 0 0; color: #64748B; font-size: 14px; }
  .section { margin-bottom: 30px; }
  .section-title { font-size: 16px; font-weight: bold; color: #2563EB; margin-bottom: 15px; text-transform: uppercase; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px; }
  .stats-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; }
  .stat-card { flex: 1; min-width: 120px; background-color: #F8FAFC; padding: 15px; border-radius: 8px; border-left: 4px solid #2563EB; }
  .stat-label { font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
  .stat-value { font-size: 20px; color: #0F172A; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
  th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #E2E8F0; }
  th { background-color: #F1F5F9; color: #334155; font-weight: bold; }
  tr:nth-child(even) { background-color: #F8FAFC; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .fw-bold { font-weight: bold; }
</style>
`;

const generateHeaderHtml = (title, subtitle, dateFrom, dateTo) => `
  <div class="header">
    <h1>MediPortal</h1>
    <p>E-Channeling Platform</p>
  </div>
  <div class="report-meta">
    <h2>${title || 'Report'}</h2>
    <p>${subtitle || ''}</p>
    <p>Period: ${dateFrom} to ${dateTo}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
`;

const statCardHtml = (label, value, colorCode) => `
  <div class="stat-card" style="border-left-color: ${colorCode};">
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}</div>
  </div>
`;

export async function generateStandardPDF({ reportName, dateFrom, dateTo, data }) {
  const a = data?.appointments || {};
  const p = data?.payments || {};
  const dr = data?.doctorRevenue || [];

  let html = `
    <html>
      <head>${HTML_HEAD}</head>
      <body>
        ${generateHeaderHtml(reportName || 'Platform Report', 'Standard Overview Report', dateFrom, dateTo)}
        
        <div class="section">
          <div class="section-title">Appointment Summary</div>
          <div class="stats-grid">
            ${statCardHtml('Total', a.total ?? 0, '#2563EB')}
            ${statCardHtml('Completed', a.completed ?? 0, '#10B981')}
            ${statCardHtml('Accepted', a.accepted ?? 0, '#6366F1')}
            ${statCardHtml('Pending', a.pending ?? 0, '#F59E0B')}
            ${statCardHtml('Cancelled', a.cancelled ?? 0, '#EF4444')}
          </div>
          ${a.topSpecializations?.length ? `
          <table>
            <thead><tr><th>Specialization</th><th class="text-center">Appointments</th></tr></thead>
            <tbody>
              ${a.topSpecializations.map(s => `<tr><td>${s._id || 'General'}</td><td class="text-center">${s.count}</td></tr>`).join('')}
            </tbody>
          </table>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Doctor Revenue</div>
          ${dr.length ? `
          <table>
            <thead>
              <tr><th>Doctor</th><th>Specialization</th><th class="text-center">Appointments</th><th class="text-right">Revenue (LKR)</th><th class="text-right">Avg/Visit</th></tr>
            </thead>
            <tbody>
              ${dr.map(d => `
                <tr>
                  <td>Dr. ${d.firstName || ''} ${d.lastName || ''}</td>
                  <td>${d.specialization || '—'}</td>
                  <td class="text-center">${d.appointments ?? 0}</td>
                  <td class="text-right">${fmtLKR(d.revenue)}</td>
                  <td class="text-right">${d.appointments > 0 ? fmtLKR(Math.round(d.revenue / d.appointments)) : '—'}</td>
                </tr>
              `).join('')}
              <tr class="fw-bold" style="background-color: #E2E8F0;">
                <td colspan="2">TOTAL</td>
                <td class="text-center">${dr.reduce((s, d) => s + (d.appointments || 0), 0)}</td>
                <td class="text-right">${fmtLKR(dr.reduce((s, d) => s + (d.revenue || 0), 0))}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          ` : '<p>No doctor revenue data for this period.</p>'}
        </div>

        <div class="section">
          <div class="section-title">Payment Details</div>
          <div class="stats-grid">
            ${statCardHtml('Total Revenue', fmtLKR(p.totalRevenue), '#10B981')}
            ${statCardHtml('Success Rate', `${p.successRate ?? 100}%`, '#2563EB')}
            ${statCardHtml('Paid Count', p.paidCount ?? 0, '#6366F1')}
            ${statCardHtml('Refunds', p.refunds ?? 0, '#EF4444')}
          </div>
          ${p.byMethod?.length ? `
          <table>
            <thead><tr><th>Payment Method</th><th class="text-center">Transactions</th><th class="text-right">Revenue (LKR)</th><th class="text-center">Share %</th></tr></thead>
            <tbody>
              ${p.byMethod.map(m => `
                <tr>
                  <td>${m._id || '—'}</td>
                  <td class="text-center">${m.count}</td>
                  <td class="text-right">${fmtLKR(m.amount)}</td>
                  <td class="text-center">${p.totalRevenue > 0 ? `${(m.amount / p.totalRevenue * 100).toFixed(1)}%` : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download Report' });
  } catch (err) {
    console.error('PDF Generate Error', err);
    throw err;
  }
}

export async function generateAdvancedPDF({ reportName, dateFrom, dateTo, advSections, data }) {
  let html = `<html><head>${HTML_HEAD}</head><body>`;
  html += generateHeaderHtml(reportName || 'Advanced Report', 'Advanced Analytics Report', dateFrom, dateTo);

  if (advSections?.appointmentSummary && data?.appointments) {
    const a = data.appointments;
    html += `
      <div class="section">
        <div class="section-title">Appointment Summary</div>
        <div class="stats-grid">
          ${statCardHtml('Total', a.total ?? 0, '#2563EB')}
          ${statCardHtml('Completed', a.completed ?? 0, '#10B981')}
          ${statCardHtml('Pending', a.pending ?? 0, '#F59E0B')}
          ${statCardHtml('Cancelled', a.cancelled ?? 0, '#EF4444')}
          ${statCardHtml('Accepted', a.accepted ?? 0, '#6366F1')}
        </div>
        ${a.topSpecializations?.length ? `
        <table>
          <thead><tr><th>Specialization</th><th class="text-center">Count</th></tr></thead>
          <tbody>
            ${a.topSpecializations.map(s => `<tr><td>${s._id || 'General'}</td><td class="text-center">${s.count}</td></tr>`).join('')}
          </tbody>
        </table>
        ` : ''}
      </div>
    `;
  }

  if (advSections?.doctorPerformance && data?.doctorPerformance?.length) {
    html += `
      <div class="section">
        <div class="section-title">Doctor Performance</div>
        <table>
          <thead><tr><th>Doctor</th><th>Specialization</th><th class="text-center">Total</th><th class="text-center">Completed</th><th class="text-center">Cancelled</th><th class="text-center">Completion %</th><th class="text-center">Cancel %</th></tr></thead>
          <tbody>
            ${data.doctorPerformance.map(d => `
              <tr>
                <td>Dr. ${d.name || ''}</td>
                <td>${d.specialization || '—'}</td>
                <td class="text-center">${d.total ?? 0}</td>
                <td class="text-center">${d.completed ?? 0}</td>
                <td class="text-center">${d.cancelled ?? 0}</td>
                <td class="text-center">${d.completionRate ?? 0}%</td>
                <td class="text-center">${d.cancellationRate ?? 0}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (advSections?.cancellationAnalysis && data?.cancellation) {
    const c = data.cancellation;
    html += `
      <div class="section">
        <div class="section-title">Cancellation Analysis</div>
        <div class="stats-grid">
          ${statCardHtml('Total Cancelled', c.total ?? 0, '#EF4444')}
          ${statCardHtml('Cancellation Rate', `${c.rate ?? 0}%`, '#F59E0B')}
        </div>
        ${c.byDay?.length ? `
        <table>
          <thead><tr><th>Day</th><th class="text-center">Cancellations</th></tr></thead>
          <tbody>
            ${c.byDay.map(d => `<tr><td>${d.day}</td><td class="text-center">${d.count}</td></tr>`).join('')}
          </tbody>
        </table>
        ` : ''}
        ${c.byDoctor?.length ? `
        <table>
          <thead><tr><th>Doctor</th><th class="text-center">Cancellations</th></tr></thead>
          <tbody>
            ${c.byDoctor.map(d => `<tr><td>${d.name}</td><td class="text-center">${d.count}</td></tr>`).join('')}
          </tbody>
        </table>
        ` : ''}
      </div>
    `;
  }

  if (advSections?.financialSummary && data?.financial) {
    const f = data.financial;
    html += `
      <div class="section">
        <div class="section-title">Financial Summary</div>
        <div class="stats-grid">
          ${statCardHtml('Total Revenue', fmtLKR(f.total ?? 0), '#10B981')}
          ${statCardHtml('Avg Transaction', fmtLKR(Math.round(f.avg ?? 0)), '#2563EB')}
          ${statCardHtml('Success Rate', `${f.successRate ?? 100}%`, '#6366F1')}
          ${statCardHtml('Refunds', f.refunds ?? 0, '#EF4444')}
        </div>
        ${f.byMethod?.length ? `
        <table>
          <thead><tr><th>Method</th><th class="text-center">Transactions</th><th class="text-right">Revenue (LKR)</th></tr></thead>
          <tbody>
            ${f.byMethod.map(m => `<tr><td>${m._id || '—'}</td><td class="text-center">${m.count}</td><td class="text-right">${fmtLKR(m.amount)}</td></tr>`).join('')}
          </tbody>
        </table>
        ` : ''}
        ${f.dailyRevenue?.length ? `
        <table>
          <thead><tr><th>Date</th><th class="text-center">Transactions</th><th class="text-right">Revenue (LKR)</th></tr></thead>
          <tbody>
            ${f.dailyRevenue.map(d => `<tr><td>${d._id}</td><td class="text-center">${d.count}</td><td class="text-right">${fmtLKR(d.amount)}</td></tr>`).join('')}
          </tbody>
        </table>
        ` : ''}
      </div>
    `;
  }

  if (advSections?.peakHours && data?.peakHours?.length) {
    const maxCount = Math.max(...data.peakHours.map(h => h.count || 0), 1);
    html += `
      <div class="section">
        <div class="section-title">Peak Hours Analysis</div>
        <table>
          <thead><tr><th>Time Slot</th><th class="text-center">Appointments</th><th>Load Bar</th><th class="text-center">Load %</th></tr></thead>
          <tbody>
            ${data.peakHours.map(h => {
              const pct = Math.round((h.count / maxCount) * 100);
              const barLen = Math.round(pct / 5);
              return `
                <tr>
                  <td>${h.displayLabel || h.label || '—'}</td>
                  <td class="text-center">${h.count ?? 0}</td>
                  <td style="font-family: monospace;">${'█'.repeat(barLen) + '░'.repeat(20 - barLen)}</td>
                  <td class="text-center">${pct}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  html += '</body></html>';

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download Report' });
  } catch (err) {
    console.error('PDF Generate Error', err);
    throw err;
  }
}
