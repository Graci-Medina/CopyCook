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
}

// ── LOGIN ────────────────────────────────────────────────────────────────────
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

// ── FORGOT PASSWORD MODAL ────────────────────────────────────────────────────
const forgotModal    = document.getElementById('forgotModal');
const resetEmailInput = document.getElementById('resetEmail');
const resetMessage   = document.getElementById('resetMessage');
const sendResetBtn   = document.getElementById('sendResetBtn');

function openForgotModal() {
    resetEmailInput.value = '';
    resetMessage.className = 'modal-message';
    resetMessage.textContent = '';
    sendResetBtn.disabled = false;
    sendResetBtn.textContent = 'Send Reset Link';
    forgotModal.classList.add('active');
    setTimeout(() => resetEmailInput.focus(), 100);
}

function closeForgotModal() {
    forgotModal.classList.remove('active');
}

// Pre-fill email from login field if already typed
document.getElementById('forgotPasswordLink').addEventListener('click', function (e) {
    e.preventDefault();
    const currentEmail = emailInput.value.trim();
    if (currentEmail) resetEmailInput.value = currentEmail;
    openForgotModal();
});

document.getElementById('modalCloseBtn').addEventListener('click', closeForgotModal);
document.getElementById('cancelResetBtn').addEventListener('click', closeForgotModal);

// Close on backdrop click
forgotModal.addEventListener('click', function (e) {
    if (e.target === forgotModal) closeForgotModal();
});

// Send password reset email
sendResetBtn.addEventListener('click', async function () {
    const email = resetEmailInput.value.trim();

    if (!email) {
        showResetMessage('Please enter your email address.', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showResetMessage('Please enter a valid email address.', 'error');
        return;
    }

    sendResetBtn.disabled = true;
    sendResetBtn.textContent = 'Sending...';

    try {
        await sendPasswordResetEmail(auth, email);
        showResetMessage(
            `Reset link sent to ${email}. Check your inbox (and spam folder).`,
            'success'
        );
        sendResetBtn.textContent = 'Sent ✓';
    } catch (error) {
        console.error('Password reset error:', error);
        let msg = 'Something went wrong. Please try again.';

        switch (error.code) {
            case 'auth/user-not-found':
                msg = 'No account found with that email address.';
                break;
            case 'auth/invalid-email':
                msg = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                msg = 'Too many requests. Please wait a moment and try again.';
                break;
            case 'auth/network-request-failed':
                msg = 'Network error. Please check your connection.';
                break;
        }

        showResetMessage(msg, 'error');
        sendResetBtn.disabled = false;
        sendResetBtn.textContent = 'Send Reset Link';
    }
});

// Enter key triggers send
resetEmailInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendResetBtn.click();
});

function showResetMessage(msg, type) {
    resetMessage.textContent = msg;
    resetMessage.className = `modal-message ${type}`;
}

// ── AUTH STATE ───────────────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in:', user.email);
    } else {
        console.log('User is signed out');
    }
});

// ── HELPERS ──────────────────────────────────────────────────────────────────
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

window.logout = async function () {
    try {
        await signOut(auth);
        showMessage('Logged out successfully', 'success');
    } catch (error) {
        showMessage('Error logging out', 'error');
    }
};