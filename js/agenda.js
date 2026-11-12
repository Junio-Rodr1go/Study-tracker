// ============================================
// STUDY TRACKER - Agenda de Tarefas
// ============================================

// ===== Estado =====
let tasks = JSON.parse(localStorage.getItem('studyTasks')) || [];
let currentFilter = 'all';
let editingTaskId = null;
let deletingTaskId = null;

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

function saveTasks() {
    localStorage.setItem('studyTasks', JSON.stringify(tasks));
}

function generateId() {
    return 'task-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

/**
 * Retorna o status de prazo de uma tarefa:
 * 'late' | 'today' | 'soon' | 'future' | 'done'
 */
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

/**
 * Formata a data de prazo de forma legível
 */
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
        return true; // 'all'
    });
}

/**
 * Ordena: primeiro tarefas não concluídas por prazo, depois concluídas
 */
function sortTasks(list) {
    return [...list].sort((a, b) => {
        // Concluídas sempre no final
        if (a.done !== b.done) return a.done ? 1 : -1;

        // Sem prazo vai pro final
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;

        // Por prazo crescente
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

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function renderAll() {
    renderStats();
    renderTasks();
}

// ============================================
// Ações de tarefas
// ============================================

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.done = !task.done;
    saveTasks();
    renderAll();
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
        // Sugere amanhã às 18h por padrão
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        const iso = tomorrow.toISOString().slice(0, 16);
        taskDeadlineInput.value = iso;
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
        // Editar
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.title = title;
            task.deadline = deadline;
            task.description = description;
        }
    } else {
        // Nova
        tasks.push({
            id: generateId(),
            title: title,
            deadline: deadline,
            description: description,
            done: false,
            createdAt: new Date().toISOString()
        });
    }

    saveTasks();
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
    tasks = tasks.filter(t => t.id !== deletingTaskId);
    saveTasks();
    renderAll();
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

// Enter no título salva
taskTitleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveTask();
    }
});

// Esc fecha modais
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTaskModal();
        closeDeleteModal();
    }
});

// Click fora fecha modais
taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeTaskModal();
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
});

// Delegação de eventos na lista
tasksListEl.addEventListener('click', (e) => {
    const card = e.target.closest('.task-card');
    if (!card) return;
    const id = card.dataset.id;
    const action = e.target.closest('[data-action]')?.dataset.action;

    if (action === 'toggle') toggleTask(id);
    else if (action === 'edit') openTaskModal(id);
    else if (action === 'delete') openDeleteModal(id);
});

// Filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// ============================================
// Init
// ============================================
renderAll();

// Atualiza a cada 30s para refletir mudanças de prazo
setInterval(() => {
    renderStats();
    renderTasks();
}, 30 * 1000);