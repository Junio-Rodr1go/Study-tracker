// ============================================
// STUDY TRACKER - Agenda (Firestore)
// ============================================

let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;
let deletingTaskId = null;
let currentUserAgenda = null;

// ===== Elementos =====
const totalTasksEl = document.getElementById('totalTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const doneTasksEl = document.getElementById('doneTasks');
const lateTasksEl = document.getElementById('lateTasks');
const tasksListEl = document.getElementById('tasksList');
const newTaskBtn = document.getElementById('newTaskBtn');
const taskModal = document.getElementById('taskModal');
const modalTitle = document.getElementById('modalTitle');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskDeadlineInput = document.getElementById('taskDeadlineInput');
const taskDescInput = document.getElementById('taskDescInput');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const saveTaskBtn = document.getElementById('saveTaskBtn');
const deleteModal = document.getElementById('deleteModal');
const deleteTaskTitle = document.getElementById('deleteTaskTitle');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// ============================================
// Helpers
// ============================================

function generateId() {
    return 'task-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function getDeadlineStatus(task) {
    if (task.done) return 'done';
    if (!task.deadline) return 'future';

    const now = new Date();
    const deadline = new Date(task.deadline);
    const diffMs = deadline - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffMs < 0) return 'late';
    if (diffDays < 1 && deadline.toDateString() === now.toDateString()) return 'today';
    if (diffHours < 24) return 'today';
    if (diffDays <= 3) return 'soon';
    return 'future';
}

function formatDeadline(task) {
    if (!task.deadline) return 'Sem prazo';
    const deadline = new Date(task.deadline);
    const now = new Date();
    const status = getDeadlineStatus(task);

    const dateStr = deadline.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const timeStr = deadline.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit'
    });

    if (status === 'done') return `✓ ${dateStr} ${timeStr}`;
    if (status === 'late') {
        const diffDays = Math.ceil((now - deadline) / (1000 * 60 * 60 * 24));
        return `⚠ Atrasada há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }
    if (status === 'today') {
        const diffHours = Math.ceil((deadline - now) / (1000 * 60 * 60));
        if (diffHours <= 1) return '⏰ Vence em breve!';
        return `⏰ Hoje, ${timeStr}`;
    }
    if (status === 'soon') {
        const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        return `📅 Em ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }
    return `📅 ${dateStr} ${timeStr}`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================
// Cálculos
// ============================================

function getTaskStats() {
    const now = new Date();
    let total = tasks.length;
    let pending = 0;
    let done = 0;
    let late = 0;

    tasks.forEach(t => {
        if (t.done) {
            done++;
        } else {
            pending++;
            if (t.deadline && new Date(t.deadline) < now) {
                late++;
            }
        }
    });

    return { total, pending, done, late };
}

// ============================================
// Renderização
// ============================================

function renderStats() {
    const { total, pending, done, late } = getTaskStats();
    totalTasksEl.textContent = total;
    pendingTasksEl.textContent = pending;
    doneTasksEl.textContent = done;
    lateTasksEl.textContent = late;
}

function getFilteredTasks() {
    const now = new Date();

    return tasks.filter(t => {
        if (currentFilter === 'pending') return !t.done;
        if (currentFilter === 'done') return t.done;
        if (currentFilter === 'late') return !t.done && t.deadline && new Date(t.deadline) < now;
        return true;
    });
}

function sortTasks(list) {
    return [...list].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
    });
}

function renderTasks() {
    const filtered = sortTasks(getFilteredTasks());

    if (filtered.length === 0) {
        let emptyMsg = 'Nenhuma tarefa ainda';
        let emptyText = 'Clique em "Nova Tarefa" para começar';

        if (currentFilter === 'pending') {
            emptyMsg = 'Nenhuma tarefa pendente';
            emptyText = 'Você está em dia! 🎉';
        } else if (currentFilter === 'done') {
            emptyMsg = 'Nenhuma tarefa concluída';
            emptyText = 'Conclua uma tarefa para vê-la aqui';
        } else if (currentFilter === 'late') {
            emptyMsg = 'Nenhuma tarefa atrasada';
            emptyText = 'Tudo em ordem! ✅';
        }

        tasksListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div class="empty-title">${emptyMsg}</div>
                <div class="empty-text">${emptyText}</div>
            </div>
        `;
        return;
    }

    tasksListEl.innerHTML = '';

    filtered.forEach(task => {
        const status = getDeadlineStatus(task);
        const card = document.createElement('div');
        card.className = 'task-card priority-' + status;
        card.dataset.id = task.id;

        card.innerHTML = `
            <div class="task-check ${task.done ? 'checked' : ''}" data-action="toggle">
                ${task.done ? '✓' : ''}
            </div>
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="task-deadline ${status}">
                        ${formatDeadline(task)}
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" data-action="edit" title="Editar">✏️</button>
                <button class="task-action-btn delete" data-action="delete" title="Excluir">🗑️</button>
            </div>
        `;

        tasksListEl.appendChild(card);
    });
}

function renderAll() {
    renderStats();
    renderTasks();
}

// ============================================
// Firestore
// ============================================

function syncTaskToFirestore(task) {
    if (!currentUserAgenda || !task) return;

    db.collection('users')
        .doc(currentUserAgenda.uid)
        .collection('tasks')
        .doc(task.id)
        .set({
            title: task.title,
            deadline: task.deadline || null,
            description: task.description || '',
            done: !!task.done,
            createdAt: task.createdAt || new Date().toISOString()
        }, { merge: true })
        .catch(err => console.warn('Erro ao sync tarefa:', err));
}

function deleteTaskFromFirestore(taskId) {
    if (!currentUserAgenda || !taskId) return;

    db.collection('users')
        .doc(currentUserAgenda.uid)
        .collection('tasks')
        .doc(taskId)
        .delete()
        .catch(err => console.warn('Erro ao deletar tarefa:', err));
}

async function loadTasksFromFirestore() {
    if (!currentUserAgenda) return;

    try {
        const snap = await db.collection('users')
            .doc(currentUserAgenda.uid)
            .collection('tasks')
            .get();

        tasks = [];
        snap.forEach(doc => {
            const data = doc.data();
            tasks.push({
                id: doc.id,
                title: data.title || '',
                deadline: data.deadline || null,
                description: data.description || '',
                done: !!data.done,
                createdAt: data.createdAt || new Date().toISOString()
            });
        });

        renderAll();
        console.log('☁️ Agenda carregada:', tasks.length, 'tarefas');
    } catch (err) {
        console.warn('Erro ao carregar agenda:', err);
    }
}

// ============================================
// Ações
// ============================================

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.done = !task.done;
    renderAll();
    syncTaskToFirestore(task);
}

function openTaskModal(taskId = null) {
    editingTaskId = taskId;

    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        modalTitle.textContent = 'Editar Tarefa';
        taskTitleInput.value = task.title;
        taskDeadlineInput.value = task.deadline || '';
        taskDescInput.value = task.description || '';
    } else {
        modalTitle.textContent = 'Nova Tarefa';
        taskTitleInput.value = '';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        taskDeadlineInput.value = tomorrow.toISOString().slice(0, 16);
        taskDescInput.value = '';
    }

    taskModal.classList.add('active');
    setTimeout(() => taskTitleInput.focus(), 100);
}

function closeTaskModal() {
    taskModal.classList.remove('active');
    editingTaskId = null;
}

function saveTask() {
    const title = taskTitleInput.value.trim();
    if (!title) {
        taskTitleInput.focus();
        taskTitleInput.style.borderColor = '#ef4444';
        setTimeout(() => { taskTitleInput.style.borderColor = ''; }, 1500);
        return;
    }

    const deadline = taskDeadlineInput.value || null;
    const description = taskDescInput.value.trim();

    if (editingTaskId) {
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.title = title;
            task.deadline = deadline;
            task.description = description;
            syncTaskToFirestore(task);
        }
    } else {
        const newTask = {
            id: generateId(),
            title: title,
            deadline: deadline,
            description: description,
            done: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        syncTaskToFirestore(newTask);
    }

    renderAll();
    closeTaskModal();
}

function openDeleteModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    deletingTaskId = id;
    deleteTaskTitle.textContent = `"${task.title}"`;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    deletingTaskId = null;
}

function confirmDelete() {
    if (!deletingTaskId) return;
    const id = deletingTaskId;
    tasks = tasks.filter(t => t.id !== id);
    renderAll();
    deleteTaskFromFirestore(id);
    closeDeleteModal();
}

// ============================================
// Event listeners
// ============================================

newTaskBtn.addEventListener('click', () => openTaskModal(null));
cancelTaskBtn.addEventListener('click', closeTaskModal);
saveTaskBtn.addEventListener('click', saveTask);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);
confirmDeleteBtn.addEventListener('click', confirmDelete);

taskTitleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveTask();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTaskModal();
        closeDeleteModal();
    }
});

taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

tasksListEl.addEventListener('click', (e) => {
    const card = e.target.closest('.task-card');
    if (!card) return;
    const id = card.dataset.id;
    const action = e.target.closest('[data-action]')?.dataset.action;

    if (action === 'toggle') toggleTask(id);
    else if (action === 'edit') openTaskModal(id);
    else if (action === 'delete') openDeleteModal(id);
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// ============================================
// Init com autenticação
// ============================================

renderAll();

auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUserAgenda = user;
    loadTasksFromFirestore();

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

setInterval(() => {
    renderStats();
    renderTasks();
}, 30 * 1000);