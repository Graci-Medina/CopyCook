// ── Fade in on load ──
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('pageWrapper').classList.add('visible');
    }, 80);
});

// ── Login button — fade out and redirect ──
document.getElementById('loginBtn').addEventListener('click', () => {
    const wrapper = document.getElementById('pageWrapper');
    wrapper.classList.remove('visible');
    wrapper.classList.add('fading');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 900);
});