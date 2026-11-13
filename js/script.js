// ============================================
// STUDY TRACKER - Lógica principal (Firestore)
// ============================================

// ===== Estado =====
let isRunning = false;
let startTime = null;
let elapsedSeconds = 0;
let timerInterval = null;
let lastSubjectId = null;
let currentUser = null;
let appInitialized = false;

// ===== Matérias fixas do Ensino Médio =====
const SUBJECTS = [
    { id: 'mat-portugues', name: 'Português', color: '#f5576c' },
    { id: 'mat-matematica', name: 'Matemática', color: '#667eea' },
    { id: 'mat-biologia', name: 'Biologia', color: '#38ef7d' },
    { id: 'mat-fisica', name: 'Física', color: '#06b6d4' },
    { id: 'mat-quimica', name: 'Química', color: '#a855f7' },
    { id: 'mat-historia', name: 'História', color: '#f5a623' },
    { id: 'mat-geografia', name: 'Geografia', color: '#14b8a6' },
    { id: 'mat-filosofia', name: 'Filosofia', color: '#8b5cf6' },
    { id: 'mat-sociologia', name: 'Sociologia', color: '#ec4899' },
    { id: 'mat-ingles', name: 'Inglês', color: '#84cc16' },
    { id: 'mat-espanhol', name: 'Espanhol', color: '#f97316' },
    { id: 'mat-redacao', name: 'Redação', color: '#ef4444' },
    { id: 'mat-literatura', name: 'Literatura', color: '#d946ef' },
    { id: 'mat-artes', name: 'Artes', color: '#f43f5e' },
    { id: 'mat-educacao-fisica', name: 'Educação Física', color: '#22c55e' },
    { id: 'mat-projeto-vida', name: 'Projeto de Vida', color: '#0ea5e9' },
    { id: 'mat-tecnologia', name: 'Tecnologia', color: '#6366f1' },
    { id: 'mat-outros', name: 'Outros', color: '#64748b' }
];

// ===== Dados em memória =====
let subjects = [...SUBJECTS];
let sessions = [];

// ===== Elementos DOM =====
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const todayTimeEl = document.getElementById('todayTime');
const totalTimeEl = document.getElementById('totalTime');
const historyList = document.getElementById('historyList');
const clearBtn = document.getElementById('clearBtn');
const subjectSelect = document.getElementById('subjectSelect');
const activeSubjectEl = document.getElementById('activeSubject');
const dayTotalEl = document.getElementById('dayTotal');
const daySubjectsEl = document.getElementById('daySubjects');

// ============================================
// Frases
// ============================================

const QUOTES = [
    { text: "Penso, logo existo.", author: "René Descartes" },
    { text: "O homem é a medida de todas as coisas.", author: "Protágoras" },
    { text: "Conhece-te a ti mesmo.", author: "Sócrates" },
    { text: "Só sei que nada sei.", author: "Sócrates" },
    { text: "A vida não examinada não vale a pena ser vivida.", author: "Sócrates" },
    { text: "O ignorante afirma, o sábio duvida, o sensato reflete.", author: "Aristóteles" },
    { text: "A educação tem raízes amargas, mas os seus frutos são doces.", author: "Aristóteles" },
    { text: "O ser humano é um animal político.", author: "Aristóteles" },
    { text: "Nada existe fora da natureza.", author: "Baruch Spinoza" },
    { text: "O homem nasce livre, e por toda parte encontra-se acorrentado.", author: "Jean-Jacques Rousseau" },
    { text: "A liberdade dos homens sob a autoridade não é a de fazer o que querem, mas a de querer o que devem.", author: "Jean-Jacques Rousseau" },
    { text: "Sapere aude! Ousa saber!", author: "Immanuel Kant" },
    { text: "Aja de tal modo que a máxima de tua ação possa tornar-se lei universal.", author: "Immanuel Kant" },
    { text: "O homem é o lobo do homem.", author: "Thomas Hobbes" },
    { text: "A dúvida é o princípio da sabedoria.", author: "Aristóteles" },
    { text: "A imaginação é mais importante que o conhecimento.", author: "Albert Einstein" },
    { text: "Tudo o que existe no universo é fruto do acaso e da necessidade.", author: "Demócrito" },
    { text: "Não há vento favorável para quem não sabe aonde vai.", author: "Sêneca" },
    { text: "Enquanto se pode fazer algo, é preciso querer fazê-lo.", author: "Sêneca" },
    { text: "A ignorância é a noite da mente, uma noite sem lua e sem estrelas.", author: "Confúcio" },
    { text: "Não importa o quanto você vai devagar, desde que não pare.", author: "Confúcio" },
    { text: "Aquele que não lê não vive apenas a sua própria vida; ele vive todas as vidas.", author: "George R. R. Martin" },
    { text: "A leitura é para a mente o que o exercício é para o corpo.", author: "Joseph Addison" },
    { text: "O conhecimento é a única virtude, e a ignorância é o único vício.", author: "Sócrates" },
    { text: "O sábio não diz tudo o que pensa, mas pensa tudo o que diz.", author: "Aristóteles" },
    { text: "A educação é a arma mais poderosa que você pode usar para mudar o mundo.", author: "Nelson Mandela" },
    { text: "Penso que a educação é o caminho que transforma as pessoas e consequentemente o mundo.", author: "Paulo Freire" },
    { text: "A leitura do mundo precede a leitura da palavra.", author: "Paulo Freire" },
    { text: "A civilização é a vitória da persuasão sobre a força.", author: "Sigmund Freud" },
    { text: "O mundo é uma representação.", author: "Arthur Schopenhauer" },
    { text: "Deus está morto.", author: "Friedrich Nietzsche" },
    { text: "Aquele que tem um porquê para viver pode suportar quase tudo.", author: "Friedrich Nietzsche" },
    { text: "O homem é um ser condenado a ser livre.", author: "Jean-Paul Sartre" },
    { text: "O inferno são os outros.", author: "Jean-Paul Sartre" },
    { text: "No meio da dificuldade encontra-se a oportunidade.", author: "Albert Einstein" },
    { text: "A única coisa que sei é que nada sei.", author: "Sócrates" },
    { text: "O amor é a única força capaz de transformar um inimigo em amigo.", author: "Martin Luther King Jr." },
    { text: "Eu tenho um sonho.", author: "Martin Luther King Jr." },
    { text: "A injustiça em qualquer lugar é uma ameaça à justiça em todo lugar.", author: "Martin Luther King Jr." },
    { text: "A esperança é o sonho do homem acordado.", author: "Aristóteles" }
];

// ============================================
// Utilitárias
// ============================================

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getSubjectById(id) {
    return subjects.find(s => s.id === id);
}

// ============================================
// Renderização
// ============================================

function renderSubjectSelect() {
    subjectSelect.innerHTML = '';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
    });
    updateActiveSubjectLabel();
}

function updateActiveSubjectLabel() {
    const subject = getSubjectById(subjectSelect.value);
    if (subject) {
        activeSubjectEl.textContent = `📖 ${subject.name}`;
        activeSubjectEl.style.color = subject.color;
    } else {
        activeSubjectEl.textContent = 'Selecione uma matéria';
    }
}

function updateDisplay() {
    timerDisplay.textContent = formatTime(elapsedSeconds);
}

function updateStats() {
    const today = new Date().toDateString();
    let todaySeconds = 0;
    let totalSeconds = 0;

    sessions.forEach(session => {
        totalSeconds += session.duration;
        if (new Date(session.date).toDateString() === today) {
            todaySeconds += session.duration;
        }
    });

    todayTimeEl.textContent = formatTime(todaySeconds);
    totalTimeEl.textContent = formatTime(totalSeconds);
}

function renderDaySummary() {
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(
        s => new Date(s.date).toDateString() === today
    );

    let totalToday = 0;
    const bySubject = {};

    todaySessions.forEach(session => {
        totalToday += session.duration;
        if (!bySubject[session.subjectId]) {
            bySubject[session.subjectId] = 0;
        }
        bySubject[session.subjectId] += session.duration;
    });

    dayTotalEl.textContent = formatTime(totalToday);

    if (Object.keys(bySubject).length === 0) {
        daySubjectsEl.innerHTML = '<div class="empty-day">Nenhuma sessão hoje ainda</div>';
        return;
    }

    daySubjectsEl.innerHTML = '';
    Object.entries(bySubject).forEach(([subjectId, seconds]) => {
        const subject = getSubjectById(subjectId);
        const chip = document.createElement('div');
        chip.className = 'day-subject-chip';
        chip.innerHTML = `
            <span class="dot" style="background: ${subject ? subject.color : '#999'}"></span>
            <span>${subject ? subject.name : 'Desconhecida'}</span>
            <span class="chip-time">${formatTime(seconds)}</span>
        `;
        daySubjectsEl.appendChild(chip);
    });
}

function renderHistory() {
    if (sessions.length === 0) {
        historyList.innerHTML = '<div class="empty-history">Nenhuma sessão registrada ainda</div>';
        return;
    }

    historyList.innerHTML = '';
    [...sessions].reverse().forEach(session => {
        const subject = getSubjectById(session.subjectId);
        const date = new Date(session.date);
        const dateStr = date.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const item = document.createElement('div');
        item.className = 'history-item';
        item.style.borderLeftColor = subject ? subject.color : '#667eea';
        item.innerHTML = `
            <div class="left">
                <span class="subject-name">
                    <span class="dot" style="background: ${subject ? subject.color : '#999'}"></span>
                    ${subject ? subject.name : 'Sem matéria'}
                </span>
                <span class="date">${dateStr}</span>
            </div>
            <span class="duration">⏱ ${formatTime(session.duration)}</span>
        `;
        historyList.appendChild(item);
    });
}

function renderAll() {
    updateStats();
    renderDaySummary();
    renderHistory();
}

// ============================================
// Timer
// ============================================

function startTimer() {
    if (isRunning) return;
    if (!subjectSelect.value) {
        alert('Selecione uma matéria primeiro!');
        return;
    }
    isRunning = true;
    startTime = Date.now() - (elapsedSeconds * 1000);
    timerDisplay.classList.add('running');
    subjectSelect.disabled = true;

    timerInterval = setInterval(() => {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        updateDisplay();
    }, 1000);

    startBtn.disabled = true;
    pauseBtn.disabled = false;
}

function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerInterval);
    timerDisplay.classList.remove('running');
    subjectSelect.disabled = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;

    if (elapsedSeconds > 0) {
        saveSession(elapsedSeconds, subjectSelect.value);
        elapsedSeconds = 0;
        updateDisplay();
    }
}

function resetTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
        timerDisplay.classList.remove('running');
    }
    if (elapsedSeconds > 0) {
        saveSession(elapsedSeconds, subjectSelect.value);
    }
    elapsedSeconds = 0;
    updateDisplay();
    subjectSelect.disabled = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

function saveSession(duration, subjectId) {
    const session = {
        duration: duration,
        date: new Date().toISOString(),
        subjectId: subjectId
    };
    sessions.push(session);
    renderAll();

    if (currentUser && duration > 0) {
        const uid = currentUser.uid;
        const subject = getSubjectById(subjectId);

        // 1) Total geral do usuário
        db.collection('users').doc(uid).set({
            email: currentUser.email,
            totalSegundos: firebase.firestore.FieldValue.increment(duration)
        }, { merge: true }).catch(err => console.warn('Erro total:', err));

        // 2) Sessão individual
        db.collection('users').doc(uid).collection('sessions').add({
            duration: duration,
            date: session.date,
            subjectId: subjectId
        }).catch(err => console.warn('Erro sessão:', err));

        // 3) Tempo acumulado por matéria
        if (subject) {
            db.collection('users').doc(uid).collection('subjects').doc(subjectId).set({
                name: subject.name,
                color: subject.color,
                totalSegundos: firebase.firestore.FieldValue.increment(duration)
            }, { merge: true }).catch(err => console.warn('Erro matéria:', err));
        }
    }
}

function clearHistory() {
    if (sessions.length === 0) return;
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
        if (currentUser) {
            const uid = currentUser.uid;
            const batch = db.batch();

            db.collection('users').doc(uid).collection('sessions')
                .get().then(snap => {
                    snap.forEach(doc => batch.delete(doc.ref));
                    return db.collection('users').doc(uid).collection('subjects').get();
                })
                .then(snap => {
                    snap.forEach(doc => batch.delete(doc.ref));
                    return batch.commit();
                })
                .catch(err => console.warn('Erro ao limpar nuvem:', err));
        }
        sessions = [];
        renderAll();
    }
}

// ============================================
// Troca de matéria
// ============================================

function handleSubjectChange() {
    const previousSubjectId = lastSubjectId;
    const currentSubjectId = subjectSelect.value;

    if (previousSubjectId === currentSubjectId) {
        updateActiveSubjectLabel();
        return;
    }

    if (isRunning && elapsedSeconds > 0) {
        saveSession(elapsedSeconds, previousSubjectId);
        isRunning = false;
        clearInterval(timerInterval);
        timerDisplay.classList.remove('running');
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        subjectSelect.disabled = false;
    }

    elapsedSeconds = 0;
    updateDisplay();
    lastSubjectId = currentSubjectId;
    updateActiveSubjectLabel();
}

// ============================================
// Frase do dia
// ============================================

function initDailyQuote() {
    const quoteTextEl = document.getElementById('quoteText');
    const quoteAuthorEl = document.getElementById('quoteAuthor');
    if (!quoteTextEl || !quoteAuthorEl) return;

    function getDailyQuoteIndex() {
        const today = new Date();
        const baseDate = new Date(2024, 0, 1);
        const diffDays = Math.floor((today - baseDate) / (1000 * 60 * 60 * 24));
        return ((diffDays % QUOTES.length) + QUOTES.length) % QUOTES.length;
    }

    function renderQuote() {
        const quote = QUOTES[getDailyQuoteIndex()];
        quoteTextEl.textContent = `"${quote.text}"`;
        quoteAuthorEl.textContent = `— ${quote.author}`;
    }

    renderQuote();

    let lastDay = new Date().toDateString();
    setInterval(() => {
        const currentDay = new Date().toDateString();
        if (currentDay !== lastDay) {
            lastDay = currentDay;
            renderQuote();
        }
    }, 60 * 1000);
}

// ============================================
// Carrega histórico do Firestore
// ============================================

async function loadHistoryFromFirestore() {
    if (!currentUser) return;

    try {
        const snap = await db.collection('users')
            .doc(currentUser.uid)
            .collection('sessions')
            .orderBy('date', 'desc')
            .limit(1000)
            .get();

        sessions = [];
        snap.forEach(doc => {
            const data = doc.data();
            sessions.push({
                duration: Number(data.duration) || 0,
                date: data.date || new Date().toISOString(),
                subjectId: data.subjectId || ''
            });
        });

        renderAll();
        console.log('☁️ Histórico carregado:', sessions.length, 'sessões');
    } catch (err) {
        console.warn('Erro ao carregar histórico:', err);
    }
}

// ============================================
// Inicialização
// ============================================

function initApp() {
    renderSubjectSelect();
    lastSubjectId = subjectSelect.value;
    updateDisplay();
    renderAll();
    initDailyQuote();
    loadHistoryFromFirestore();
}

// ============================================
// Event listeners
// ============================================

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
clearBtn.addEventListener('click', clearHistory);
subjectSelect.addEventListener('change', handleSubjectChange);

window.addEventListener('beforeunload', () => {
    if (isRunning && elapsedSeconds > 0) {
        saveSession(elapsedSeconds, subjectSelect.value);
    }
});

// ============================================
// Proteção de login
// ============================================

auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    if (!appInitialized) {
        appInitialized = true;
        initApp();

        const headerTop = document.querySelector('.header');
        if (headerTop && !document.getElementById('logoutBtn')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.textContent = 'Sair';
            logoutBtn.className = 'logout-btn';
            logoutBtn.addEventListener('click', () => {
                if (confirm('Deseja sair?')) {
                    auth.signOut().then(() => {
                        window.location.href = 'login.html';
                    });
                }
            });
            headerTop.appendChild(logoutBtn);
        }
    }
});