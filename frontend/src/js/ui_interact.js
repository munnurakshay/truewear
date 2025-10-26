document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Sidebar Toggle Logic ---
    const sidebar = document.querySelector('.sidebar');
    const toggleButton = document.getElementById('sidebar-toggle');
    const isMobile = window.innerWidth <= 768;

    if (toggleButton) {
        // Start collapsed on larger screens, always collapsed on mobile
        if (!isMobile) {
            sidebar.classList.add('collapsed');
            toggleButton.querySelector('i').classList.add('fa-chevron-right');
        }

        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const icon = toggleButton.querySelector('i');
            if (sidebar.classList.contains('collapsed')) {
                 icon.classList.remove('fa-chevron-left');
                 icon.classList.add('fa-chevron-right');
            } else {
                 icon.classList.remove('fa-chevron-right');
                 icon.classList.add('fa-chevron-left');
            }
        });
    }

    // --- 2. Dark/Light Mode Switch Logic ---
    const themeToggle = document.getElementById('checkbox');
    const html = document.documentElement;

    // Check saved preference on load
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark'; 

    themeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            html.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
});