import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Get form elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const messageDiv = document.getElementById('message');

// Handle form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Basic validation
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    // Disable button while processing
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        // Sign in existing user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showMessage('Login successful! Welcome back!', 'success');
        console.log('User logged in:', userCredential.user);
        
        // Clear form
        loginForm.reset();
        
        // Redirect to home page after login
setTimeout(() => {
    window.location.href = 'Home page/home.html';
}, 1500);
        
    } catch (error) {
        console.error('Authentication error:', error);
        
        // Handle specific Firebase errors
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
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is signed in:', user.email);
        // You can update UI here for logged-in users
    } else {
        console.log('User is signed out');
    }
});

// Function to show messages
function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}

// Function to clear messages
function clearMessage() {
    messageDiv.textContent = '';
    messageDiv.style.display = 'none';
}

// Clear message when user starts typing
const inputs = document.querySelectorAll('#loginForm input');

inputs.forEach(input => {
    input.addEventListener('input', clearMessage);
    
    input.addEventListener('focus', function() {
        this.style.transform = 'scale(1.02)';
        this.style.transition = 'transform 0.2s';
    });
    
    input.addEventListener('blur', function() {
        this.style.transform = 'scale(1)';
    });
});

// Optional: Logout function (you can add a logout button later)
window.logout = async function() {
    try {
        await signOut(auth);
        showMessage('Logged out successfully', 'success');
        console.log('User logged out');
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Error logging out', 'error');
    }
};