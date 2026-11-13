// ============================================
// STUDY TRACKER - Estatísticas (Firestore)
// ============================================

let subjectTotals = {};
let currentUserStats = null;

// ===== Helpers =====

function formatHM(totalSeconds) {
    const secs = Math.floor(Number(totalSeconds) || 0);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatSmart(totalSeconds) {
    const secs = Math.floor(Number(totalSeconds) || 0);
    if (secs < 60) return `${secs}s`;
    return formatHM(secs);
}

// ============================================
// KPIs
// ============================================

function renderKPIs() {
    let total = 0;
    for (const id in subjectTotals) {
        total += subjectTotals[id].totalSegundos;
    }
    
    const kpiTotal = document.getElementById('kpiTotal');
    if (kpiTotal) {
        kpiTotal.textContent = formatSmart(total);
    }
}

// ============================================
// Gráfico: por matéria
// ============================================

let subjectChartInstance = null;
function renderSubjectChart() {
    const entries = Object.entries(subjectTotals)
        .filter(([id, info]) => Number(info.totalSegundos) > 0);

    const canvas = document.getElementById('subjectChart');
    if (!canvas) return;

    if (entries.length === 0) {
        canvas.parentElement.innerHTML = '<div class="empty-history">Sem dados</div>';
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

    const ctx = canvas.getContext('2d');
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
                        label: (c) => formatSmart(values[c.dataIndex])
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
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

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
// Tabela por matéria
// ============================================

function renderSubjectTable() {
    const subjectTable = document.getElementById('subjectTable');
    if (!subjectTable) return;

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

    subjectTable.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'table-row header-row';
    header.innerHTML = `
        <span>Matéria</span>
        <span style="text-align: right;">Total</span>
        <span style="text-align: right;">%</span>
    `;
    subjectTable.appendChild(header);

    for (const entry of entries) {
        const pct = ((entry.seconds / grandTotal) * 100).toFixed(1);

        const row = document.createElement('div');
        row.className = 'table-row';
        row.style.borderLeftColor = entry.color;
        row.innerHTML = `
            <div class="table-subject">
                <span class="table-dot" style="background: ${entry.color}"></span>
                ${entry.name}
            </div>
            <span class="table-value highlight">${formatSmart(entry.seconds)}</span>
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
        renderSubjectChart();
        renderRanking();
        renderSubjectTable();

        console.log('☁️ Estatísticas carregadas:', Object.keys(subjectTotals).length, 'matérias');
    } catch (err) {
        console.error('Erro real ao carregar estatísticas:', err);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        currentUserStats = user;
        loadStatsFromFirestore();
    });
});