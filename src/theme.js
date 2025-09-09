// --- Theme toggle logic ---
function setTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('postperson_theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'light' ? '🌞' : '🌙';
}
function getTheme() {
    return localStorage.getItem('postperson_theme') || 'dark';
}
document.addEventListener('DOMContentLoaded', function() {
    setTheme(getTheme());
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.onclick = function() {
            const newTheme = document.body.classList.contains('light') ? 'dark' : 'light';
            setTheme(newTheme);
        };
    }
});
