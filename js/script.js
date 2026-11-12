// ============================================
// STUDY TRACKER - Lógica com matérias
// ============================================

// ===== Estado da aplicação =====
let isRunning = false;
let startTime = null;
let elapsedSeconds = 0;
let timerInterval = null;
let selectedColor = '#667eea';
let lastSubjectId = null;

// ===== Paleta de cores para matérias =====
const COLOR_PALETTE = [
    '#667eea', '#f5576c', '#38ef7d', '#f5a623',
    '#a855f7', '#06b6d4', '#ec4899', '#84cc16',
    '#f97316', '#8b5cf6', '#14b8a6', '#ef4444'
];

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
const addSubjectBtn = document.getElementById('addSubjectBtn');
const modalOverlay = document.getElementById('modalOverlay');
const subjectNameInput = document.getElementById('subjectNameInput');
const colorOptionsEl = document.getElementById('colorOptions');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const confirmModalBtn = document.getElementById('confirmModalBtn');

// ===== Dados persistidos =====
let subjects = JSON.parse(localStorage.getItem('studySubjects')) || [
    { id: 'default-1', name: 'Matemática', color: '#667eea' },
    { id: 'default-2', name: 'Português', color: '#f5576c' },
    { id: 'default-3', name: 'História', color: '#38ef7d' }
];

let sessions = JSON.parse(localStorage.getItem('studySessions')) || [];

// ============================================
// Funções utilitárias
// ============================================

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function saveSubjects() {
    localStorage.setItem('studySubjects', JSON.stringify(subjects));
}

function saveSessions() {
    localStorage.setItem('studySessions', JSON.stringify(sessions));
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
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
// Controle do timer
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
    saveSessions();
    renderAll();
}

function clearHistory() {
    if (sessions.length === 0) return;
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
        sessions = [];
        saveSessions();
        renderAll();
    }
}

// ============================================
// Troca de matéria reseta o timer
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
// Modal de nova matéria
// ============================================

function openModal() {
    subjectNameInput.value = '';
    selectedColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
    renderColorOptions();
    modalOverlay.classList.add('active');
    setTimeout(() => subjectNameInput.focus(), 100);
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

function renderColorOptions() {
    colorOptionsEl.innerHTML = '';
    COLOR_PALETTE.forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-option' + (color === selectedColor ? ' selected' : '');
        div.style.background = color;
        div.addEventListener('click', () => {
            selectedColor = color;
            renderColorOptions();
        });
        colorOptionsEl.appendChild(div);
    });
}

function addSubject() {
    const name = subjectNameInput.value.trim();
    if (!name) {
        subjectNameInput.focus();
        return;
    }

    if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert('Já existe uma matéria com esse nome!');
        return;
    }

    const newSubject = {
        id: 'subj-' + Date.now(),
        name: name,
        color: selectedColor
    };

    subjects.push(newSubject);
    saveSubjects();
    renderSubjectSelect();
    subjectSelect.value = newSubject.id;
    lastSubjectId = newSubject.id;
    updateActiveSubjectLabel();
    closeModal();
}

// ============================================
// Event listeners
// ============================================
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
clearBtn.addEventListener('click', clearHistory);
addSubjectBtn.addEventListener('click', openModal);
cancelModalBtn.addEventListener('click', closeModal);
confirmModalBtn.addEventListener('click', addSubject);

subjectSelect.addEventListener('change', handleSubjectChange);

subjectNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSubject();
});

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

window.addEventListener('beforeunload', () => {
    if (isRunning && elapsedSeconds > 0) {
        saveSession(elapsedSeconds, subjectSelect.value);
    }
});

// ============================================
// Inicialização principal
// ============================================
saveSubjects();
renderSubjectSelect();
lastSubjectId = subjectSelect.value;
updateDisplay();
renderAll();

// ============================================
// Frase do dia (roda DEPOIS de tudo, com segurança)
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

function initDailyQuote() {
    // ⚠️ Só roda se os elementos existirem na página
    const quoteTextEl = document.getElementById('quoteText');
    const quoteAuthorEl = document.getElementById('quoteAuthor');

    if (!quoteTextEl || !quoteAuthorEl) {
        // Não é a página com a frase — sai silenciosamente
        return;
    }

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

    // Atualiza à meia-noite
    let lastDay = new Date().toDateString();
    setInterval(() => {
        const currentDay = new Date().toDateString();
        if (currentDay !== lastDay) {
            lastDay = currentDay;
            renderQuote();
        }
    }, 60 * 1000);
}

// Executa a frase DEPOIS de tudo inicializado, sem quebrar o resto se falhar
try {
    initDailyQuote();
} catch (e) {
    console.warn('Aviso: não foi possível carregar a frase do dia:', e);
}