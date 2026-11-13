// ============================================
// Firebase - Configuração (v9 compat)
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyCUtkHD2Vr8xMhSvyh8v4qWp-waamzXoWA",
    authDomain: "studytracker-ec526.firebaseapp.com",
    projectId: "studytracker-ec526",
    storageBucket: "studytracker-ec526.firebasestorage.app",
    messagingSenderId: "846212102314",
    appId: "1:846212102314:web:1e9cfbead549552c9578d3",
    measurementId: "G-EWPP4KYG0N"
};

// Inicializa Firebase (só se ainda não foi inicializado)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();