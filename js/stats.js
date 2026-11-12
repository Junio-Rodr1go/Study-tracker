// ============================================
// STUDY TRACKER - Estatísticas (v5 — escala adaptativa)
// ============================================

// ===== 1. Leitura =====
let subjects = [];
let sessions = [];

try {
    const rawSubjects = JSON.parse(localStorage.getItem('studySubjects')) || [];
    const rawSessions = JSON.parse(localStorage.getItem('studySessions')) || [];

    subjects = rawSubjects
        .filter(s => s && s.id)
        .map(s => ({
            id: s.id,
            name: s.name || 'Sem nome',
            color: s.color || '#667eea'
        }));

    sessions = rawSessions
        .filter(s => s && Number(s.duration) > 0 && s.subjectId)
        .map(s => ({
            duration: Math.floor(Number(s.duration)),
            date: s.date || new Date().toISOString(),
            subjectId: s.subjectId
        }));
} catch (e) {
    console.error('❌ Erro lendo localStorage:', e);
}

console.log('📊 Sessões:', sessions.length, '| Total seg:', sessions.reduce((a, b) => a + b.duration, 0));

// ===== 2. Helpers =====
function formatHM(totalSeconds) {
    const secs = Math.floor(Number(totalSeconds) || 0);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatFull(totalSeconds) {
    const secs = Math.floor(Number(totalSeconds) || 0);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Formata de forma "inteligente":
 * - < 60s → mostra em segundos
 * - >= 60s → mostra em HH:MM
 */
function formatSmart(totalSeconds) {
    const secs = Math.floor(Number(totalSeconds) || 0);
    if (secs < 60) return `${secs}s`;
    return formatHM(secs);
}

function getSubject(id) {
    return subjects.find(s => s.id === id) || { name: 'Sem matéria', color: '#999' };
}

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isSameDay(a, b) {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/**
 * Converte segundos para a unidade mais legível baseada no máximo.
 * Retorna { values, unit, divisor } — se max < 60 usa segundos, senão minutos.
 */
function pickUnit(maxSeconds) {
    if (maxSeconds < 60) {
        return { divisor: 1, unit: 's', label: 'segundos' };
    }
    return { divisor: 60, unit: 'min', label: 'minutos' };
}

// ===== 3. Cálculos =====
function getDailyTotals(days) {
    const result = [];
    const today = startOfDay(new Date());

    for (let i = days - 1; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);

        let total = 0;
        for (const s of sessions) {
            if (isSameDay(new Date(s.date), day)) {
                total += s.duration;
            }
        }

        result.push({ date: day, seconds: total });
    }

    return result;
}

function getSubjectTotals() {
    const map = {};
    for (const s of sessions) {
        if (!map[s.subjectId]) map[s.subjectId] = 0;
        map[s.subjectId] += s.duration;
    }
    return map;
}

function calculateStreak() {
    if (sessions.length === 0) return 0;
    const today = startOfDay(new Date());
    const daysWithStudy = new Set(
        sessions.map(s => startOfDay(new Date(s.date)).getTime())
    );

    let streak = 0;
    let cursor = new Date(today);

    if (!daysWithStudy.has(cursor.getTime())) {
        cursor.setDate(cursor.getDate() - 1);
    }

    while (daysWithStudy.has(cursor.getTime())) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

// ===== 4. KPIs (agora mostram SEGUNDOS também) =====
function renderKPIs() {
    const today = startOfDay(new Date());
    let todayTotal = 0;
    let total = 0;
    let weekTotal = 0;

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    for (const s of sessions) {
        total += s.duration;
        const d = startOfDay(new Date(s.date));
        if (isSameDay(d, today)) todayTotal += s.duration;
        if (d >= weekAgo && d <= today) weekTotal += s.duration;
    }

    // Usa formatSmart (mostra segundos se < 60s)
    document.getElementById('kpiToday').textContent = formatSmart(todayTotal);
    document.getElementById('kpiWeek').textContent = formatSmart(weekTotal);
    document.getElementById('kpiTotal').textContent = formatSmart(total);
    document.getElementById('kpiStreak').textContent = calculateStreak();

    console.log('KPIs → hoje:', todayTotal, 's | semana:', weekTotal, 's | total:', total, 's');
}

// ===== 5. Gráfico 7 dias =====
function renderWeekChart() {
    const data = getDailyTotals(7);
    const labels = data.map(d => d.date.toLocaleDateString('pt-BR', { weekday: 'short' }));
    const maxSecs = Math.max(...data.map(d => d.seconds), 0);
    const { divisor, unit, label } = pickUnit(maxSecs);
    const values = data.map(d => +(d.seconds / divisor).toFixed(2));

    const ctx = document.getElementById('weekChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.9)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.6)');

    // Garante que a barra de 5s seja visível
    const suggestedMax = Math.max(values.reduce((a, b) => Math.max(a, b), 0), 1);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: `Estudo (${label})`,
                data: values,
                backgroundColor: gradient,
                borderRadius: 10,
                borderSkipped: false,
                maxBarThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 50, 0.95)',
                    padding: 12,
                    titleFont: { size: 13, family: 'Poppins' },
                    bodyFont: { size: 12, family: 'Poppins' },
                    callbacks: {
                        label: (c) => formatFull(data[c.dataIndex].seconds)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: suggestedMax,
                    ticks: {
                        font: { family: 'Poppins', size: 11 },
                        color: '#888',
                        callback: v => v + unit
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    ticks: {
                        font: { family: 'Poppins', size: 11 },
                        color: '#666'
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

// ===== 6. Gráfico por matéria =====
function renderSubjectChart() {
    const totals = getSubjectTotals();
    const entries = Object.entries(totals);

    if (entries.length === 0) {
        document.getElementById('subjectChart').parentElement.innerHTML =
            '<div class="empty-history">Sem dados</div>';
        return;
    }

    const labels = [];
    const values = [];
    const colors = [];

    for (const [id, seconds] of entries) {
        const subj = getSubject(id);
        labels.push(subj.name);
        values.push(seconds);
        colors.push(subj.color);
    }

    const ctx = document.getElementById('subjectChart').getContext('2d');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Poppins', size: 11 },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (c) => formatFull(entries[c.dataIndex][1])
                    }
                }
            }
        }
    });
}

// ===== 7. Ranking =====
function renderRanking() {
    const totals = getSubjectTotals();
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const el = document.getElementById('rankingList');

    if (entries.length === 0) {
        el.innerHTML = '<div class="empty-history">Sem dados</div>';
        return;
    }

    const max = entries[0][1];
    el.innerHTML = '';

    entries.forEach(([id, seconds], i) => {
        const subj = getSubject(id);
        const pct = (seconds / max) * 100;

        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <div class="ranking-position top-${i + 1}">${i + 1}</div>
            <div class="ranking-info">
                <div class="ranking-name">
                    <span class="ranking-dot" style="background: ${subj.color}"></span>
                    ${subj.name}
                </div>
                <div class="ranking-bar">
                    <div class="ranking-bar-fill" style="width: ${pct}%; background: ${subj.color}"></div>
                </div>
            </div>
            <div class="ranking-time">${formatSmart(seconds)}</div>
        `;
        el.appendChild(item);
    });
}

// ===== 8. Gráfico 30 dias =====
function renderMonthChart() {
    const data = getDailyTotals(30);
    const labels = data.map(d => d.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    const maxSecs = Math.max(...data.map(d => d.seconds), 0);
    const { divisor, unit, label } = pickUnit(maxSecs);
    const values = data.map(d => +(d.seconds / divisor).toFixed(2));

    const ctx = document.getElementById('monthChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.35)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');

    const suggestedMax = Math.max(values.reduce((a, b) => Math.max(a, b), 0), 1);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: `Estudo (${label})`,
                data: values,
                borderColor: '#667eea',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 30, 50, 0.95)',
                    padding: 12,
                    titleFont: { size: 13, family: 'Poppins' },
                    bodyFont: { size: 12, family: 'Poppins' },
                    callbacks: {
                        label: (c) => formatFull(data[c.dataIndex].seconds)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: suggestedMax,
                    ticks: {
                        font: { family: 'Poppins', size: 11 },
                        color: '#888',
                        callback: v => v + unit
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    ticks: {
                        font: { family: 'Poppins', size: 10 },
                        color: '#666',
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

// ===== 9. Tabela =====
function renderSubjectTable() {
    const totals = getSubjectTotals();
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const el = document.getElementById('subjectTable');

    if (entries.length === 0) {
        el.innerHTML = '<div class="empty-history">Sem dados</div>';
        return;
    }

    const grandTotal = entries.reduce((sum, [, s]) => sum + s, 0);
    const uniqueDays = new Set(
        sessions.map(s => startOfDay(new Date(s.date)).getTime())
    ).size;
    const safeDays = Math.max(1, uniqueDays);

    el.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'table-row header-row';
    header.innerHTML = `
        <span>Matéria</span>
        <span style="text-align: right;">Total</span>
        <span style="text-align: right;">Média/dia</span>
        <span style="text-align: right;">%</span>
    `;
    el.appendChild(header);

    for (const [id, seconds] of entries) {
        const subj = getSubject(id);
        const pct = ((seconds / grandTotal) * 100).toFixed(1);
        const dailyAvg = seconds / safeDays;

        const row = document.createElement('div');
        row.className = 'table-row';
        row.style.borderLeftColor = subj.color;
        row.innerHTML = `
            <div class="table-subject">
                <span class="table-dot" style="background: ${subj.color}"></span>
                ${subj.name}
            </div>
            <span class="table-value highlight">${formatSmart(seconds)}</span>
            <span class="table-value">${formatSmart(dailyAvg)}</span>
            <span class="table-value">${pct}%</span>
        `;
        el.appendChild(row);
    }
}

// ===== 10. Init =====
window.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js NÃO carregou.');
        return;
    }

    if (sessions.length === 0) {
        const msg = '<div class="empty-history">Nenhum dado ainda</div>';
        document.getElementById('weekChart').parentElement.innerHTML = msg;
        document.getElementById('subjectChart').parentElement.innerHTML = msg;
        document.getElementById('monthChart').parentElement.innerHTML = msg;
        document.getElementById('rankingList').innerHTML = msg;
        document.getElementById('subjectTable').innerHTML = msg;
        renderKPIs();
        return;
    }

    renderKPIs();
    renderWeekChart();
    renderSubjectChart();
    renderRanking();
    renderMonthChart();
    renderSubjectTable();
});