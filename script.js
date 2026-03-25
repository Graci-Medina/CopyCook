import { auth } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');

// Avatar colors — must match signup.js exactly
const avatarColors = [
    '#D4A5A5', '#9FB19F', '#A5B4D4', '#D4C4A5',
    '#B4A5D4', '#A5D4C4', '#D4A5B4', '#C4D4A5'
];

function getAvatarColor(letter) {
    const index = letter.toUpperCase().charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
}

function saveAvatarToLocalStorage(user) {
    const name = user.displayName;
    if (name) {
        const initial = name.charAt(0).toUpperCase();
        localStorage.setItem('userDisplayName', name);
        localStorage.setItem('userInitial', initial);
        localStorage.setItem('userAvatarColor', getAvatarColor(initial));
    }
    // Save UID so other pages (e.g. Saved page) can make Firestore calls
    localStorage.setItem('userUID', user.uid);
}

loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Save avatar data and UID from Firebase profile to localStorage
        saveAvatarToLocalStorage(userCredential.user);

        showMessage('Login successful! Welcome back!', 'success');
        loginForm.reset();

        setTimeout(() => {
            window.location.href = 'Home page/home.html';
        }, 1500);

    } catch (error) {
        console.error('Authentication error:', error);
        let errorMessage = 'An error occurred. Please try again.';

        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email. Please sign up.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many attempts. Please try again later.';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Invalid email or password. Please try again.';
                break;
        }

        showMessage(errorMessage, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in:', user.email);
    } else {
        console.log('User is signed out');
    }
});

function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}

function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.style.display = 'none';
}

const inputs = document.querySelectorAll('#loginForm input');
inputs.forEach(input => {
    input.addEventListener('input', clearMessage);

    input.addEventListener('focus', function () {
        this.style.transform = 'scale(1.02)';
        this.style.transition = 'transform 0.2s';
    });

    input.addEventListener('blur', function () {
        this.style.transform = 'scale(1)';
    });
});

// ── Forgot Password Modal ────────────────────────────────────────────────────
const forgotModal     = document.getElementById('forgotModal');
const forgotLink      = document.getElementById('forgotPasswordLink');
const modalCloseBtn   = document.getElementById('modalCloseBtn');
const cancelResetBtn  = document.getElementById('cancelResetBtn');
const sendResetBtn    = document.getElementById('sendResetBtn');
const resetEmailInput = document.getElementById('resetEmail');
const resetMessage    = document.getElementById('resetMessage');

function openForgotModal() {
    forgotModal.classList.add('active');
    resetEmailInput.value = emailInput.value.trim(); // pre-fill if already typed
    resetMessage.className = 'modal-message';
    resetMessage.textContent = '';
}

function closeForgotModal() {
    forgotModal.classList.remove('active');
}

forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    openForgotModal();
});

modalCloseBtn.addEventListener('click', closeForgotModal);
cancelResetBtn.addEventListener('click', closeForgotModal);

// Close when clicking the dark backdrop
forgotModal.addEventListener('click', (e) => {
    if (e.target === forgotModal) closeForgotModal();
});

sendResetBtn.addEventListener('click', async () => {
    const email = resetEmailInput.value.trim();
    if (!email) {
        showResetMessage('Please enter your email address.', 'error');
        return;
    }

    sendResetBtn.disabled = true;
    sendResetBtn.textContent = 'Sending…';

    try {
        const isDev = window.location.hostname === 'localhost';
        const actionCodeSettings = {
            url: isDev
                ? 'http://localhost:3000/reset-password.html'
                : 'https://copycook-f596a.web.app/reset-password.html',
            handleCodeInApp: false,
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        showResetMessage('Reset link sent! Check your inbox.', 'success');
        sendResetBtn.textContent = 'Sent!';
    } catch (error) {
        let msg = 'Something went wrong. Please try again.';
        if (error.code === 'auth/user-not-found')  msg = 'No account found with that email.';
        if (error.code === 'auth/invalid-email')   msg = 'Please enter a valid email address.';
        showResetMessage(msg, 'error');
        sendResetBtn.disabled = false;
        sendResetBtn.textContent = 'Send Reset Link';
    }
});

function showResetMessage(text, type) {
    resetMessage.textContent = text;
    resetMessage.className = `modal-message ${type}`;
}
// ─────────────────────────────────────────────────────────────────────────────

window.logout = async function () {
    try {
        await signOut(auth);
        showMessage('Logged out successfully', 'success');
    } catch (error) {
        showMessage('Error logging out', 'error');
    }
};