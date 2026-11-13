// ============================================
// Autenticação Firebase
// ============================================

const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const submitBtn = document.getElementById('submitBtn');
const errorMsg = document.getElementById('errorMsg');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginSubtitle = document.getElementById('loginSubtitle');

let mode = 'login';
let isSubmitting = false;

function setMode(newMode) {
    mode = newMode;
    errorMsg.classList.remove('show');
    tabLogin.classList.toggle('active', mode === 'login');
    tabRegister.classList.toggle('active', mode === 'register');
    submitBtn.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
    loginSubtitle.textContent = mode === 'login'
        ? 'Entre para continuar seus estudos'
        : 'Crie sua conta para começar';
}

tabLogin.addEventListener('click', () => setMode('login'));
tabRegister.addEventListener('click', () => setMode('register'));

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('show');
    console.error(msg);
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.remove('show');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('Preencha todos os campos.');
        return;
    }

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Aguarde...';

    try {
        let uid;

        if (mode === 'login') {
            const cred = await auth.signInWithEmailAndPassword(email, password);
            uid = cred.user.uid;
            console.log('✅ Login OK:', uid);
        } else {
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            uid = cred.user.uid;
            console.log('✅ Cadastro OK:', uid);
        }

        await db.collection('users').doc(uid).set({
            email: email,
            totalSegundos: firebase.firestore.FieldValue.increment(0)
        }, { merge: true });

        console.log('✅ Firestore OK:', uid);
        window.location.href = 'index.html';

    } catch (err) {
        isSubmitting = false;
        console.error('❌ Erro:', err);
        showError(err.code || err.message || 'Erro desconhecido');
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
    }
});

auth.onAuthStateChanged((user) => {
    if (user && !isSubmitting) {
        window.location.href = 'index.html';
    }
});