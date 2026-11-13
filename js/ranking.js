// ============================================
// STUDY TRACKER - Ranking
// ============================================

const podiumSection = document.getElementById('podiumSection');
const podiumLoading = document.getElementById('podiumLoading');
const rankingList = document.getElementById('rankingList');
const listCount = document.getElementById('listCount');
const myPositionCard = document.getElementById('myPositionCard');
const myRank = document.getElementById('myRank');
const myName = document.getElementById('myName');
const myTime = document.getElementById('myTime');

// ===== Helpers =====

function formatTime(seconds) {
    const s = Math.floor(Number(seconds) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatShort(seconds) {
    const s = Math.floor(Number(seconds) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}min`;
    if (m > 0) return `${m}min`;
    return `${s}s`;
}

function getInitial(email) {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
}

function getDisplayName(email) {
    if (!email) return 'Anônimo';
    return email.split('@')[0];
}

/**
 * Cores determinísticas por usuário (baseado no email)
 */
function getAvatarColor(email) {
    const colors = [
        '#667eea', '#f5576c', '#38ef7d', '#f5a623',
        '#a855f7', '#06b6d4', '#ec4899', '#84cc16',
        '#f97316', '#8b5cf6', '#14b8a6', '#ef4444'
    ];
    if (!email) return colors[0];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = (hash << 5) - hash + email.charCodeAt(i);
        hash |= 0;
    }
    return colors[Math.abs(hash) % colors.length];
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== Renderização do pódio =====

function renderPodium(users, currentUid) {
    if (users.length === 0) {
        podiumSection.innerHTML = '<div class="empty-state">Nenhum usuário cadastrado ainda</div>';
        return;
    }

    const top3 = users.slice(0, 3);
    // Preenche com placeholders se houver menos de 3
    while (top3.length < 3) top3.push(null);

    podiumSection.innerHTML = '';

    const podium = document.createElement('div');
    podium.className = 'podium';

    // Renderiza 2º, 1º, 3º (a ordem visual é feita pelo CSS)
    const order = [1, 0, 2]; // índices no array top3: 1º=segundo, 0=primeiro, 2=terceiro
    order.forEach((idx, visualIdx) => {
        const user = top3[idx];
        const place = idx + 1;
        const isMe = user && user.uid === currentUid;

        const div = document.createElement('div');
        div.className = `podium-place place-${place}${isMe ? ' is-me' : ''}`;

        if (!user) {
            // Placeholder vazio
            div.innerHTML = `
                <div class="podium-avatar" style="background:#e5e7eb;color:#999;">—</div>
                <div class="podium-name">—</div>
                <div class="podium-time">—</div>
                <div class="podium-block">
                    <span class="podium-rank-badge">${place}º</span>
                </div>
            `;
        } else {
            const name = getDisplayName(user.email);
            const initial = getInitial(user.email);
            const color = getAvatarColor(user.email);
            const totalSeg = Number(user.totalSegundos) || 0;

            div.innerHTML = `
                ${place === 1 ? '<div class="podium-crown">👑</div>' : ''}
                <div class="podium-avatar" style="background:${color};">
                    ${initial}
                </div>
                <div class="podium-name" title="${escapeHtml(user.email)}">
                    ${escapeHtml(name)}
                </div>
                <div class="podium-time">${formatShort(totalSeg)}</div>
                <div class="podium-block">
                    <span class="podium-rank-badge">${place}º</span>
                </div>
            `;
        }

        podium.appendChild(div);
    });

    podiumSection.appendChild(podium);
}

// ===== Renderização da lista completa =====

function renderList(users, currentUid) {
    if (users.length === 0) {
        rankingList.innerHTML = '<div class="empty-state">Nenhum usuário ainda</div>';
        listCount.textContent = '0 jogadores';
        return;
    }

    listCount.textContent = `${users.length} jogador${users.length > 1 ? 'es' : ''}`;
    rankingList.innerHTML = '';

    users.forEach((user, i) => {
        const position = i + 1;
        const isMe = user.uid === currentUid;
        const name = getDisplayName(user.email);
        const initial = getInitial(user.email);
        const color = getAvatarColor(user.email);
        const totalSeg = Number(user.totalSegundos) || 0;

        let itemClass = 'rank-item';
        if (position === 1) itemClass += ' top-1';
        else if (position === 2) itemClass += ' top-2';
        else if (position === 3) itemClass += ' top-3';
        if (isMe) itemClass += ' is-me';

        const item = document.createElement('div');
        item.className = itemClass;
        item.innerHTML = `
            <div class="rank-position">${position}</div>
            <div class="rank-avatar" style="background:${color};">${initial}</div>
            <div class="rank-info">
                <div class="rank-name" title="${escapeHtml(user.email)}">
                    ${escapeHtml(name)}
                    ${isMe ? '<span class="rank-you-badge">Você</span>' : ''}
                </div>
            </div>
            <div class="rank-time">${formatShort(totalSeg)}</div>
        `;
        rankingList.appendChild(item);
    });
}

// ===== Sua posição =====

function renderMyPosition(users, currentUid) {
    const myIndex = users.findIndex(u => u.uid === currentUid);
    if (myIndex === -1) {
        myPositionCard.style.display = 'none';
        return;
    }

    const me = users[myIndex];
    const position = myIndex + 1;
    const totalSeg = Number(me.totalSegundos) || 0;

    myRank.textContent = `#${position}`;
    myName.textContent = getDisplayName(me.email);
    myTime.textContent = formatShort(totalSeg);
    myPositionCard.style.display = 'block';
}

// ===== Carregamento dos dados =====

async function loadRanking() {
    try {
        const snapshot = await db.collection('users')
            .orderBy('totalSegundos', 'desc')
            .limit(100)
            .get();

        const users = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            users.push({
                uid: doc.id,
                email: data.email || '',
                totalSegundos: Number(data.totalSegundos) || 0
            });
        });

        // Remove usuários com 0 segundos (opcional)
        // Se quiser mostrar todos, comente a linha abaixo
        const filtered = users.filter(u => u.totalSegundos > 0);

        const list = filtered.length > 0 ? filtered : users;
        const currentUid = auth.currentUser ? auth.currentUser.uid : null;

        renderPodium(list, currentUid);
        renderList(list, currentUid);
        renderMyPosition(list, currentUid);

    } catch (err) {
        console.error('Erro ao carregar ranking:', err);

        let msg = 'Erro ao carregar o ranking.';
        if (err.code === 'failed-precondition') {
            msg = 'O Firestore precisa de um índice. Crie o índice pela mensagem do console (F12).';
        } else if (err.code === 'permission-denied') {
            msg = 'Sem permissão para ler o ranking. Verifique as regras do Firestore.';
        }

        podiumSection.innerHTML = `<div class="empty-state">${msg}</div>`;
        rankingList.innerHTML = `<div class="empty-state">${msg}</div>`;
    }
}

// ===== Init =====

auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    loadRanking();

    // Adiciona botão de logout no header
    const header = document.querySelector('.header');
    if (header && !document.getElementById('logoutBtn')) {
        const btn = document.createElement('button');
        btn.id = 'logoutBtn';
        btn.textContent = 'Sair';
        btn.className = 'logout-btn';
        btn.addEventListener('click', () => {
            if (confirm('Deseja sair?')) {
                auth.signOut().then(() => window.location.href = 'login.html');
            }
        });
        header.style.position = 'relative';
        header.appendChild(btn);
    }
});

// Recarrega a cada 30 segundos para refletir mudanças
setInterval(() => {
    if (auth.currentUser) loadRanking();
}, 30 * 1000);