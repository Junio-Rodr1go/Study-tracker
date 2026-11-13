// ============================================
// STUDY TRACKER - Estatísticas (Firestore)
// ============================================

let sessions = [];
let subjectTotals = {};
let currentUserStats = null;

// ===== Elementos =====
const kpiToday = document.getElementById('kpiToday');
const kpiWeek = document.getElementById('kpiWeek');
const kpiTotal = document.getElementById('kpiTotal');
const kpiStreak = document.getElementById('kpiStreak');
const rankingList = document.getElementById('rankingList');
const subjectTable = document.getElementById('subjectTable');

// ===== Helpers =====

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

function formatSmart(totalSeconds) {
    const secs = Math.floor(Number(totalSeconds) || 0);
    if (secs < 60) return `${secs}s`;
    return formatHM(secs);
}

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isSameDay(a, b) {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function pickUnit(maxSeconds) {
    if (maxSeconds < 60) return { divisor: 1, unit: 's', label: 'segundos' };
    return { divisor: 60, unit: 'min', label: 'minutos' };
}

// ============================================
// Cálculos
// ============================================

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

// ============================================
// KPIs
// ============================================

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

    kpiToday.textContent = formatSmart(todayTotal);
    kpiWeek.textContent = formatSmart(weekTotal);
    kpiTotal.textContent = formatSmart(total);
    kpiStreak.textContent = calculateStreak();
}

// ============================================
// Gráfico: 7 dias
// ============================================

let weekChartInstance = null;
function renderWeekChart() {
    const data = getDailyTotals(7);
    const labels = data.map(d => d.date.toLocaleDateString('pt-BR', { weekday: 'short' }));
    const maxSecs = Math.max(...data.map(d => d.seconds), 0);
    const { divisor, unit, label } = pickUnit(maxSecs);
    const values = data.map(d => +(d.seconds / divisor).toFixed(2));

    const ctx = document.getElementById('weekChart').getContext('2d');
    if (weekChartInstance) weekChartInstance.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.9)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.6)');
    const suggestedMax = Math.max(values.reduce((a, b) => Math.max(a, b), 0), 1);

    weekChartInstance = new Chart(ctx, {
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
                tooltip: { callbacks: { label: (c) => formatFull(data[c.dataIndex].seconds) } }
            },
            scales: {
                y: { beginAtZero: true, suggestedMax, ticks: { callback: v => v + unit } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ============================================
// Gráfico: por matéria
// ============================================

let subjectChartInstance = null;
function renderSubjectChart() {
    const entries = Object.entries(subjectTotals);

    if (entries.length === 0) {
        document.getElementById('subjectChart').parentElement.innerHTML =
            '<div class="empty-history">Sem dados</div>';
        return;
    }

    const labels = [];
    const values = [];
    const colors = [];

    for (const [id, info] of entries) {
        labels.push(info.name || 'Sem matéria');
        values.push(Number(info.totalSegundos) || 0);
        colors.push(info.color || '#999');
    }

    const ctx = document.getElementById('subjectChart').getContext('2d');
    if (subjectChartInstance) subjectChartInstance.destroy();

    subjectChartInstance = new Chart(ctx, {
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
                    labels: { padding: 12, usePointStyle: true, pointStyle: 'circle' }
                },
                tooltip: {
                    callbacks: {
                        label: (c) => formatFull(values[c.dataIndex])
                    }
                }
            }
        }
    });
}

// ============================================
// Ranking de matérias
// ============================================

function renderRanking() {
    const entries = Object.entries(subjectTotals)
        .map(([id, info]) => ({
            id: id,
            seconds: Number(info.totalSegundos) || 0,
            name: info.name || 'Sem matéria',
            color: info.color || '#999'
        }))
        .filter(e => e.seconds > 0)
        .sort((a, b) => b.seconds - a.seconds);

    if (entries.length === 0) {
        rankingList.innerHTML = '<div class="empty-history">Sem dados</div>';
        return;
    }

    const max = entries[0].seconds;
    rankingList.innerHTML = '';

    entries.forEach((entry, i) => {
        const pct = max > 0 ? (entry.seconds / max) * 100 : 0;
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <div class="ranking-position top-${i + 1}">${i + 1}</div>
            <div class="ranking-info">
                <div class="ranking-name">
                    <span class="ranking-dot" style="background: ${entry.color}"></span>
                    ${entry.name}
                </div>
                <div class="ranking-bar">
                    <div class="ranking-bar-fill" style="width: ${pct}%; background: ${entry.color}"></div>
                </div>
            </div>
            <div class="ranking-time">${formatSmart(entry.seconds)}</div>
        `;
        rankingList.appendChild(item);
    });
}

// ============================================
// Gráfico: 30 dias
// ============================================

let monthChartInstance = null;
function renderMonthChart() {
    const data = getDailyTotals(30);
    const labels = data.map(d => d.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    const maxSecs = Math.max(...data.map(d => d.seconds), 0);
    const { divisor, unit, label } = pickUnit(maxSecs);
    const values = data.map(d => +(d.seconds / divisor).toFixed(2));

    const ctx = document.getElementById('monthChart').getContext('2d');
    if (monthChartInstance) monthChartInstance.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.35)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
    const suggestedMax = Math.max(values.reduce((a, b) => Math.max(a, b), 0), 1);

    monthChartInstance = new Chart(ctx, {
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
                tooltip: { callbacks: { label: (c) => formatFull(data[c.dataIndex].seconds) } }
            },
            scales: {
                y: { beginAtZero: true, suggestedMax, ticks: { callback: v => v + unit } },
                x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 }, grid: { display: false } }
            }
        }
    });
}

// ============================================
// Tabela por matéria
// ============================================

function renderSubjectTable() {
    const entries = Object.entries(subjectTotals)
        .map(([id, info]) => ({
            id: id,
            seconds: Number(info.totalSegundos) || 0,
            name: info.name || 'Sem matéria',
            color: info.color || '#999'
        }))
        .filter(e => e.seconds > 0)
        .sort((a, b) => b.seconds - a.seconds);

    if (entries.length === 0) {
        subjectTable.innerHTML = '<div class="empty-history">Sem dados</div>';
        return;
    }

    const grandTotal = entries.reduce((sum, e) => sum + e.seconds, 0);
    const uniqueDays = new Set(
        sessions.map(s => startOfDay(new Date(s.date)).getTime())
    ).size;
    const safeDays = Math.max(1, uniqueDays);

    subjectTable.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'table-row header-row';
    header.innerHTML = `
        <span>Matéria</span>
        <span style="text-align: right;">Total</span>
        <span style="text-align: right;">Média/dia</span>
        <span style="text-align: right;">%</span>
    `;
    subjectTable.appendChild(header);

    for (const entry of entries) {
        const pct = ((entry.seconds / grandTotal) * 100).toFixed(1);
        const dailyAvg = entry.seconds / safeDays;

        const row = document.createElement('div');
        row.className = 'table-row';
        row.style.borderLeftColor = entry.color;
        row.innerHTML = `
            <div class="table-subject">
                <span class="table-dot" style="background: ${entry.color}"></span>
                ${entry.name}
            </div>
            <span class="table-value highlight">${formatSmart(entry.seconds)}</span>
            <span class="table-value">${formatSmart(dailyAvg)}</span>
            <span class="table-value">${pct}%</span>
        `;
        subjectTable.appendChild(row);
    }
}

// ============================================
// Carregamento do Firestore
// ============================================

async function loadStatsFromFirestore() {
    if (!currentUserStats) return;

    try {
        const uid = currentUserStats.uid;

        const sessionsSnap = await db.collection('users')
            .doc(uid).collection('sessions')
            .orderBy('date', 'desc')
            .limit(1000)
            .get();

        sessions = [];
        sessionsSnap.forEach(doc => {
            const data = doc.data();
            sessions.push({
                duration: Number(data.duration) || 0,
                date: data.date || new Date().toISOString(),
                subjectId: data.subjectId || ''
            });
        });

        const subjectsSnap = await db.collection('users')
            .doc(uid).collection('subjects')
            .get();

        subjectTotals = {};
        subjectsSnap.forEach(doc => {
            const data = doc.data();
            subjectTotals[doc.id] = {
                name: data.name || 'Sem matéria',
                color: data.color || '#999',
                totalSegundos: Number(data.totalSegundos) || 0
            };
        });

        renderKPIs();
        renderWeekChart();
        renderSubjectChart();
        renderRanking();
        renderMonthChart();
        renderSubjectTable();

        console.log('☁️ Estatísticas carregadas:', {
            sessoes: sessions.length,
            materias: Object.keys(subjectTotals).length
        });
    } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        document.body.insertAdjacentHTML('afterbegin',
            '<div style="background:#fee;color:#c00;padding:15px;text-align:center;border-radius:12px;margin-bottom:20px;font-weight:600;">' +
            'Erro ao carregar estatísticas. Verifique o console (F12).' +
            '</div>'
        );
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não carregou.');
        return;
    }

    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        currentUserStats = user;
        loadStatsFromFirestore();
    });
});