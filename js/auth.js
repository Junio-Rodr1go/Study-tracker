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
            // TENTATIVA DE LOGIN
            const cred = await auth.signInWithEmailAndPassword(email, password);
            uid = cred.user.uid;
            console.log('✅ Login OK:', uid);
        } else {
            // TENTATIVA DE CADASTRO
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            uid = cred.user.uid;
            console.log('✅ Cadastro OK:', uid);
        }

        // Cria/atualiza o documento no banco de dados (apenas para garantir que o perfil exista)
        await db.collection('users').doc(uid).set({
            email: email,
            totalSegundos: firebase.firestore.FieldValue.increment(0)
        }, { merge: true });

        console.log('✅ Firestore OK:', uid);
        
        // Redireciona para o app
        window.location.href = 'index.html';

    } catch (err) {
        isSubmitting = false;
        console.error('❌ Erro:', err);

        // Traduz os erros mais comuns do Firebase para o usuário
        let msg = 'Ocorreu um erro. Tente novamente.';
        
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            msg = 'E-mail ou senha incorretos, ou a conta não existe. Vá em "Cadastrar" para criar uma conta.';
        } else if (err.code === 'auth/wrong-password') {
            msg = 'Senha incorreta.';
        } else if (err.code === 'auth/email-already-in-use') {
            msg = 'Este e-mail já está cadastrado. Tente entrar.';
        } else if (err.code === 'auth/weak-password') {
            msg = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (err.code === 'auth/invalid-email') {
            msg = 'Formato de e-mail inválido.';
        }

        showError(msg);
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
    }
});

auth.onAuthStateChanged((user) => {
    if (user && !isSubmitting) {
        window.location.href = 'index.html';
    }
});