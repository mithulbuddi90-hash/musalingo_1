(function applySavedShadowColor() {
    const themeSettings = JSON.parse(localStorage.getItem('MusalingoSettings') || '{}');
    const darkMode = themeSettings.theme === 'dark';
    const accent = /^#[0-9a-f]{6}$/i.test(themeSettings.accent || '') ? themeSettings.accent : '#EC96C7';

    function darkenAccent(hex, amount) {
        if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#bd78a0';
        const channels = [1, 3, 5].map(index =>
            Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(index, index + 2), 16) * (1 - amount))))
        );
        return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
    }

    const root = document.documentElement;
    const shadowColor = /^#[0-9a-f]{6}$/i.test(themeSettings.shadow || '')
        ? themeSettings.shadow
        : darkenAccent(accent, 0.2);

    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-dark', darkenAccent(accent, 0.2));
    root.style.setProperty('--accent-shadow', shadowColor);
    root.style.setProperty('--accent-soft', 'color-mix(in srgb, var(--accent) 20%, white)');
    root.style.setProperty('--bg', darkMode ? '#111827' : '#f7f8fc');
    root.style.setProperty('--card', darkMode ? '#1f2937' : '#ffffff');
    root.style.setProperty('--panel', darkMode ? '#1f2937' : '#ffffff');
    root.style.setProperty('--panel-2', darkMode ? '#273449' : '#f3f6fb');
    root.style.setProperty('--text', darkMode ? '#e5e7eb' : '#1f2937');
    root.style.setProperty('--muted', darkMode ? '#aeb9ca' : '#6b7280');

    if (document.body) {
        document.body.classList.toggle('dark-mode', darkMode);
        document.body.classList.toggle('light-mode', !darkMode);
        if (darkMode) {
            document.body.style.backgroundColor = '#111827';
            document.body.style.backgroundImage = 'none';
        }
    }
})();
