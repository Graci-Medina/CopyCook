import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const signupForm = document.getElementById('signupForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');
const passwordWarning = document.getElementById('passwordWarning');

// Avatar background colors — pick one based on first letter
const avatarColors = [
    '#D4A5A5', '#9FB19F', '#A5B4D4', '#D4C4A5',
    '#B4A5D4', '#A5D4C4', '#D4A5B4', '#C4D4A5'
];

function getAvatarColor(letter) {
    const index = letter.toUpperCase().charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
}

// Real-time password match validation
function checkPasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password && confirmPassword) {
        if (password === confirmPassword) {
            confirmPasswordInput.classList.remove('password-mismatch');
            confirmPasswordInput.classList.add('password-match');
            passwordWarning.classList.remove('show');
            return true;
        } else {
            confirmPasswordInput.classList.remove('password-match');
            confirmPasswordInput.classList.add('password-mismatch');
            passwordWarning.classList.add('show');
            return false;
        }
    } else {
        confirmPasswordInput.classList.remove('password-match', 'password-mismatch');
        passwordWarning.classList.remove('show');
        return false;
    }
}

passwordInput.addEventListener('input', checkPasswordMatch);
confirmPasswordInput.addEventListener('input', checkPasswordMatch);

signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        confirmPasswordInput.focus();
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Save display name to Firebase Auth profile
        await updateProfile(userCredential.user, { displayName: name });

        // Write user doc to Firestore so they appear in messaging search
        const firstLetter = name.charAt(0).toUpperCase();
        const avatarColor = getAvatarColor(firstLetter);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid:         userCredential.user.uid,
            displayName: name,
            email:       email,
            avatarColor: avatarColor
        });

        // Save avatar info to localStorage for instant use on home page
        localStorage.setItem('userDisplayName', name);
        localStorage.setItem('userInitial', firstLetter);
        localStorage.setItem('userAvatarColor', avatarColor);
        localStorage.setItem('userUID', userCredential.user.uid);

        showMessage('Account created successfully! Redirecting...', 'success');

        signupForm.reset();
        confirmPasswordInput.classList.remove('password-match', 'password-mismatch');
        passwordWarning.classList.remove('show');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        console.error('Signup error:', error);
        let errorMessage = 'An error occurred. Please try again.';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered. Please login instead.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many attempts. Please try again later.';
                break;
        }

        showMessage(errorMessage, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
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

const inputs = document.querySelectorAll('#signupForm input');
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