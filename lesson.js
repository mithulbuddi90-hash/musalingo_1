/* ============================================================
   Musalingo — lesson.js (Complete)
   ============================================================ */

const savedTheme = JSON.parse(localStorage.getItem('MusalingoSettings') || '{}');
document.body.classList.toggle('dark-mode', savedTheme.theme === 'dark');

// ---------- URL PARAMS ----------
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('courseId');
const lessonId = urlParams.get('lessonId');
const isReview = urlParams.get('review') === '1';
const level = Number(urlParams.get('level')) || 1;

// ---------- SAFE AUDIO WRAPPER ----------
function playSound(name, arg) {
    try {
        if (typeof window.SFX !== 'undefined' && typeof window.SFX[name] === 'function') {
            if (arg !== undefined) window.SFX[name](arg);
            else window.SFX[name]();
        } else {
            console.warn(`[lesson.js] SFX.${name}() is missing. Check sounds.js`);
        }
    } catch (e) {
        console.warn(`[lesson.js] Sound failed: ${name}`, e);
    }
}

// ---------- JUMP MEMORY ----------
(function rememberJump() {
    try {
        const jumpSection = Number(urlParams.get('section')) || null;
        const jumpUnit = Number(urlParams.get('unit')) || null;
        const jumpCourse = courseId;
        const combine = urlParams.get('combine') === '1';
        if (combine && jumpSection && jumpUnit && jumpCourse) {
            sessionStorage.setItem('MusalingoJumpState', JSON.stringify({
                courseId: jumpCourse, section: jumpSection, unit: jumpUnit, combine, at: Date.now()
            }));
        }
    } catch (e) { }
})();

/* ============ SHARED HELPERS ============ */

function squareName(r, c) { return "abcdefgh"[c] + (8 - r); }

function fitBoards() {
    document.querySelectorAll('.board-wrap').forEach(function (wrap) {
        var cont = wrap.querySelector('.board-container');
        if (!cont) return;
        var w = wrap.clientWidth, h = wrap.clientHeight;
        if (w <= 0) return;
        var s = (h > 0) ? Math.min(w, h) : w;
        if (s < 100) return;
        cont.style.width = s + 'px';
        cont.style.height = s + 'px';
        cont.style.maxWidth = '100%';
    });
}
window.addEventListener('resize', fitBoards);
window.addEventListener('orientationchange', () => {
    setTimeout(fitBoards, 150); setTimeout(fitBoards, 400);
});

/* ============ SVG PIECES ============ */

const SVG_PIECES = {
    wK: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" fill="#fff"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#000"/></g></svg>`,
    wQ: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM33 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z" stroke-linecap="butt"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/><path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none"/></g></svg>`,
    wR: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M11 14h23" fill="none" stroke-linejoin="miter"/></g></svg>`,
    wB: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#fff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke-linejoin="miter"/></g></svg>`,
    wN: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill="#fff"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 0 1 .866.5z" fill="#000" stroke="#000"/></g></svg>`,
    wP: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    bK: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#000" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" fill="#000"/><path d="M20 8h5" stroke-linejoin="miter"/><path d="M32 29.5s8.5-4 6.03-9.65C34.15 14 25 18 22.5 24.5l.01 2.1-.01-2.1C20 18 9.906 14 6.997 19.85c-2.497 5.65 4.853 9 4.853 9M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#fff"/></g></svg>`,
    bQ: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#000" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#000" stroke="none"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/></g><path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z" stroke-linecap="butt"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/><path d="M11 38.5a35 35 0 0 1 23 0" fill="none" stroke-linecap="butt"/><path d="M11 29a35 35 0 0 1 23 0M12.5 31.5h20M11.5 34.5a35 35 0 0 1 22 0M10.5 37.5a35 35 0 0 1 24 0" fill="none" stroke="#fff"/></g></svg>`,
    bR: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="#000" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z" stroke-linecap="butt"/><path d="M14 29.5v-13h17v13H14z" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z" stroke-linecap="butt"/><path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="miter"/></g></svg>`,
    bB: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#000" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke="#fff" stroke-linejoin="miter"/></g></svg>`,
    bN: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#000"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill="#000"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 0 1 .866.5z" fill="#fff" stroke="#fff"/><path d="M24.55 10.4l-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34-2.37-4.49-5.79-6.64-9.19-7.16l-.51-.1z" fill="#fff" stroke="none"/></g></svg>`,
    bP: `<svg viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#000" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`
};

/* ============ FALLBACK QUESTIONS ============ */

function generateLocalFallbackQuestions(language, topic, count = 10) {
    const normalizedLanguage = String(language || 'Spanish').trim();
    const fallbackLanguage = /hindi|हिंदी|हिन्दी/i.test(normalizedLanguage) ? 'Hindi' : normalizedLanguage;
    const fallbackTopic = String(topic || 'daily practice');

    if (fallbackLanguage === 'Chess') {
        const boardQuestions = [];
        const samples = [
            { fen: '7k/8/8/8/4K3/8/8/8 w - - 0 1', from: 'e4', answer: 'e5', prompt: 'The king is highlighted. Tap a square where it can move.', hint: 'The king moves one square in any direction.' },
            { fen: 'k7/8/8/8/3Q4/8/8/7K w - - 0 1', from: 'd4', answer: 'd5', prompt: 'The queen is highlighted. Tap a square where it can move.', hint: 'The queen moves in straight or diagonal lines.' },
            { fen: '7k/8/8/8/8/8/8/K5N1 w - - 0 1', from: 'g1', answer: 'f3', prompt: 'The knight is highlighted. Tap a square where it can move.', hint: 'A knight moves in an L-shape.' }
        ];
        for (let i = 0; i < count; i++) {
            const sample = samples[i % samples.length];
            boardQuestions.push({ type: 'find-move', fen: sample.fen, from: sample.from, answer: sample.answer, prompt: sample.prompt, hint: sample.hint });
        }
        return boardQuestions;
    }

    if (fallbackLanguage === 'Math') {
        const result = [];
        for (let i = 0; i < count; i++) {
            const a = 2 + i, b = 3 + i, answer = a + b;
            if (i % 3 === 0) result.push({ type: 'multiple-choice', question: `${a} + ${b} = ?`, answer: String(answer), distractors: [String(answer - 1), String(answer + 2), String(answer + 5)], hint: 'Add the numbers.' });
            else if (i % 3 === 1) {
                const first = a + 1, second = first + 1, third = second + 1, fourth = third + 1;
                result.push({
                    type: 'match-pairs', pairs: [
                        { left: `${first} + ${first}`, right: String(first * 2) },
                        { left: `${second} + ${second}`, right: String(second * 2) },
                        { left: `${third} + ${third}`, right: String(third * 2) },
                        { left: `${fourth} + ${fourth}`, right: String(fourth * 2) }
                    ], hint: 'Solve each expression, then match equal values.'
                });
            } else result.push({ type: 'slider', question: `Set the answer: ${a} + ${b} = ?`, answer, min: 0, max: answer + 5, step: 1, hint: 'Add the numbers.' });
        }
        return result;
    }

    const languageSamples = {
        Japanese: [
            { phrase: 'こんにちは', pronunciation: 'konnichiwa', answer: 'こんにちは', distractors: ['ありがとう', '学校', '猫'], translationMap: { 'こんにちは': 'hello', 'ありがとう': 'thanks', '学校': 'school', '猫': 'cat' } },
            { phrase: 'ありがとう', pronunciation: 'arigatou', answer: 'ありがとう', distractors: ['水', '友達', '本'], translationMap: { 'ありがとう': 'thanks', '水': 'water', '友達': 'friend', '本': 'book' } },
            { phrase: '学校', pronunciation: 'gakkou', answer: '学校', distractors: ['食べ物', '家', '朝'], translationMap: { '学校': 'school', '食べ物': 'food', '家': 'home', '朝': 'morning' } },
            { phrase: '友達', pronunciation: 'tomodachi', answer: '友達', distractors: ['車', '音楽', '夜'], translationMap: { '友達': 'friend', '車': 'car', '音楽': 'music', '夜': 'night' } },
            { phrase: '本', pronunciation: 'hon', answer: '本', distractors: ['水', '雨', '元気'], translationMap: { '本': 'book', '水': 'water', '雨': 'rain', '元気': 'wellness' } }
        ],
        Spanish: [
            { phrase: 'hola', pronunciation: 'hello', answer: 'hola', distractors: ['adios', 'libro', 'feliz'], translationMap: { hola: 'hello', adios: 'goodbye', libro: 'book', feliz: 'happy' } },
            { phrase: 'gracias', pronunciation: 'thank you', answer: 'gracias', distractors: ['amigo', 'agua', 'casa'], translationMap: { gracias: 'thank you', amigo: 'friend', agua: 'water', casa: 'house' } },
            { phrase: 'amigo', pronunciation: 'friend', answer: 'amigo', distractors: ['mesa', 'agua', 'casa'], translationMap: { amigo: 'friend', mesa: 'table', agua: 'water', casa: 'house' } },
            { phrase: 'escuela', pronunciation: 'school', answer: 'escuela', distractors: ['manzana', 'feliz', 'correr'], translationMap: { escuela: 'school', manzana: 'apple', feliz: 'happy', correr: 'run' } },
            { phrase: 'libro', pronunciation: 'book', answer: 'libro', distractors: ['puerta', 'hola', 'sol'], translationMap: { libro: 'book', puerta: 'door', hola: 'hello', sol: 'sun' } }
        ],
        French: [
            { phrase: 'bonjour', pronunciation: 'hello', answer: 'bonjour', distractors: ['merci', 'livre', 'maison'], translationMap: { bonjour: 'hello', merci: 'thank you', livre: 'book', maison: 'house' } },
            { phrase: 'merci', pronunciation: 'thank you', answer: 'merci', distractors: ['ami', 'eau', 'porte'], translationMap: { merci: 'thank you', ami: 'friend', eau: 'water', porte: 'door' } },
            { phrase: 'ami', pronunciation: 'friend', answer: 'ami', distractors: ['livre', 'porte', 'soleil'], translationMap: { ami: 'friend', livre: 'book', porte: 'door', soleil: 'sun' } },
            { phrase: 'ecole', pronunciation: 'school', answer: 'ecole', distractors: ['pomme', 'ami', 'voiture'], translationMap: { ecole: 'school', pomme: 'apple', ami: 'friend', voiture: 'car' } },
            { phrase: 'livre', pronunciation: 'book', answer: 'livre', distractors: ['porte', 'bonjour', 'maison'], translationMap: { livre: 'book', porte: 'door', bonjour: 'hello', maison: 'house' } }
        ],
        German: [
            { phrase: 'hallo', pronunciation: 'hello', answer: 'hallo', distractors: ['danke', 'buch', 'freund'], translationMap: { hallo: 'hello', danke: 'thank you', buch: 'book', freund: 'friend' } },
            { phrase: 'danke', pronunciation: 'thank you', answer: 'danke', distractors: ['wasser', 'schule', 'haus'], translationMap: { danke: 'thank you', wasser: 'water', schule: 'school', haus: 'house' } },
            { phrase: 'freund', pronunciation: 'friend', answer: 'freund', distractors: ['buch', 'tafel', 'musik'], translationMap: { freund: 'friend', buch: 'book', tafel: 'table', musik: 'music' } },
            { phrase: 'schule', pronunciation: 'school', answer: 'schule', distractors: ['apfel', 'laufen', 'sonne'], translationMap: { schule: 'school', apfel: 'apple', laufen: 'run', sonne: 'sun' } },
            { phrase: 'buch', pronunciation: 'book', answer: 'buch', distractors: ['tur', 'hallo', 'musik'], translationMap: { buch: 'book', tur: 'door', hallo: 'hello', musik: 'music' } }
        ],
        Italian: [
            { phrase: 'ciao', pronunciation: 'hello', answer: 'ciao', distractors: ['grazie', 'libro', 'amico'], translationMap: { ciao: 'hello', grazie: 'thank you', libro: 'book', amico: 'friend' } },
            { phrase: 'grazie', pronunciation: 'thank you', answer: 'grazie', distractors: ['acqua', 'scuola', 'casa'], translationMap: { grazie: 'thank you', acqua: 'water', scuola: 'school', casa: 'house' } },
            { phrase: 'amico', pronunciation: 'friend', answer: 'amico', distractors: ['mela', 'musica', 'porta'], translationMap: { amico: 'friend', mela: 'apple', musica: 'music', porta: 'door' } },
            { phrase: 'scuola', pronunciation: 'school', answer: 'scuola', distractors: ['mela', 'corre', 'sole'], translationMap: { scuola: 'school', mela: 'apple', corre: 'run', sole: 'sun' } },
            { phrase: 'libro', pronunciation: 'book', answer: 'libro', distractors: ['porta', 'ciao', 'sole'], translationMap: { libro: 'book', porta: 'door', ciao: 'hello', sole: 'sun' } }
        ],
        Arabic: [
            { phrase: 'مرحبا', pronunciation: 'hello', answer: 'مرحبا', distractors: ['شكرا', 'كتاب', 'بيت'], translationMap: { 'مرحبا': 'hello', 'شكرا': 'thank you', 'كتاب': 'book', 'بيت': 'house' } },
            { phrase: 'شكرا', pronunciation: 'thank you', answer: 'شكرا', distractors: ['ماء', 'صديق', 'مدرسة'], translationMap: { 'شكرا': 'thank you', 'ماء': 'water', 'صديق': 'friend', 'مدرسة': 'school' } },
            { phrase: 'صديق', pronunciation: 'friend', answer: 'صديق', distractors: ['كتاب', 'نافذة', 'قمر'], translationMap: { 'صديق': 'friend', 'كتاب': 'book', 'نافذة': 'window', 'قمر': 'moon' } },
            { phrase: 'مدرسة', pronunciation: 'school', answer: 'مدرسة', distractors: ['تفاحة', 'أحب', 'سماء'], translationMap: { 'مدرسة': 'school', 'تفاحة': 'apple', 'أحب': 'love', 'سماء': 'sky' } },
            { phrase: 'كتاب', pronunciation: 'book', answer: 'كتاب', distractors: ['باب', 'مرحبا', 'شمس'], translationMap: { 'كتاب': 'book', 'باب': 'door', 'مرحبا': 'hello', 'شمس': 'sun' } }
        ],
        Hindi: [
            { phrase: 'नमस्ते', pronunciation: 'namaste', answer: 'नमस्ते', distractors: ['धन्यवाद', 'किताब', 'मित्र'], translationMap: { 'नमस्ते': 'hello', 'धन्यवाद': 'thank you', 'किताब': 'book', 'मित्र': 'friend' } },
            { phrase: 'धन्यवाद', pronunciation: 'thank you', answer: 'धन्यवाद', distractors: ['पानी', 'विद्यालय', 'घर'], translationMap: { 'धन्यवाद': 'thank you', 'पानी': 'water', 'विद्यालय': 'school', 'घर': 'house' } },
            { phrase: 'मित्र', pronunciation: 'friend', answer: 'मित्र', distractors: ['किताब', 'दरवाज़ा', 'सूरज'], translationMap: { 'मित्र': 'friend', 'किताब': 'book', 'दरवाज़ा': 'door', 'सूरज': 'sun' } },
            { phrase: 'विद्यालय', pronunciation: 'school', answer: 'विद्यालय', distractors: ['सेब', 'दोस्ती', 'आकाश'], translationMap: { 'विद्यालय': 'school', 'सेब': 'apple', 'दोस्ती': 'friendship', 'आकाश': 'sky' } },
            { phrase: 'किताब', pronunciation: 'book', answer: 'किताब', distractors: ['दरवाज़ा', 'नमस्ते', 'चाँद'], translationMap: { 'किताब': 'book', 'दरवाज़ा': 'door', 'नमस्ते': 'hello', 'चाँद': 'moon' } }
        ],
        Korean: [
            { phrase: '안녕하세요', pronunciation: 'hello', answer: '안녕하세요', distractors: ['고맙습니다', '책', '친구'], translationMap: { '안녕하세요': 'hello', '고맙습니다': 'thank you', '책': 'book', '친구': 'friend' } },
            { phrase: '고맙습니다', pronunciation: 'thank you', answer: '고맙습니다', distractors: ['물', '학교', '집'], translationMap: { '고맙습니다': 'thank you', '물': 'water', '학교': 'school', '집': 'house' } },
            { phrase: '친구', pronunciation: 'friend', answer: '친구', distractors: ['책', '문', '해'], translationMap: { '친구': 'friend', '책': 'book', '문': 'door', '해': 'sun' } },
            { phrase: '학교', pronunciation: 'school', answer: '학교', distractors: ['사과', '친구들', '하늘'], translationMap: { '학교': 'school', '사과': 'apple', '친구들': 'friends', '하늘': 'sky' } },
            { phrase: '책', pronunciation: 'book', answer: '책', distractors: ['문', '안녕하세요', '달'], translationMap: { '책': 'book', '문': 'door', '안녕하세요': 'hello', '달': 'moon' } }
        ],
        Telugu: [
            { phrase: 'హలో', pronunciation: 'hello', answer: 'హలో', distractors: ['ధన్యవాదాలు', 'పుస్తకం', 'స్నేహితుడు'], translationMap: { 'హలో': 'hello', 'ధన్యవాదాలు': 'thank you', 'పుస్తకం': 'book', 'స్నేహితుడు': 'friend' } },
            { phrase: 'ధన్యవాదాలు', pronunciation: 'thank you', answer: 'ధన్యవాదాలు', distractors: ['నీళ్ళు', 'పాఠశాల', 'ఇల్లు'], translationMap: { 'ధన్యవాదాలు': 'thank you', 'నీళ్ళు': 'water', 'పాఠశాల': 'school', 'ఇల్లు': 'house' } },
            { phrase: 'స్నేహితుడు', pronunciation: 'friend', answer: 'స్నేహితుడు', distractors: ['పుస్తకం', 'తలుపు', 'సూర్యుడు'], translationMap: { 'స్నేహితుడు': 'friend', 'పుస్తకం': 'book', 'తలుపు': 'door', 'సూర్యుడు': 'sun' } },
            { phrase: 'పాఠశాల', pronunciation: 'school', answer: 'పాఠశాల', distractors: ['యాపిల్', 'పరుగు', 'ఆకాశం'], translationMap: { 'పాఠశాల': 'school', 'యాపిల్': 'apple', 'పరుగు': 'run', 'ఆకాశం': 'sky' } },
            { phrase: 'పుస్తకం', pronunciation: 'book', answer: 'పుస్తకం', distractors: ['తలుపు', 'హలో', 'చంద్రుడు'], translationMap: { 'పుస్తకం': 'book', 'తలుపు': 'door', 'హలో': 'hello', 'చంద్రుడు': 'moon' } }
        ]
    };

    const selectedSet = languageSamples[fallbackLanguage] || languageSamples.Spanish;
    const result = [];
    for (let i = 0; i < count; i++) {
        const sample = selectedSet[i % selectedSet.length];
        const type = i % 5;
        if (type === 0) result.push({ type: 'multiple-choice', phrase: sample.phrase, pronunciation: sample.pronunciation, answer: sample.answer, distractors: sample.distractors, translationMap: sample.translationMap, hint: `Practice ${fallbackTopic} words.` });
        else if (type === 1) result.push({ type: 'listen', phrase: sample.phrase, answer: sample.answer, distractors: sample.distractors, translationMap: sample.translationMap, hint: `Listen carefully and choose the ${fallbackTopic} word.` });
        else if (type === 2) result.push({ type: 'spell', phrase: sample.phrase, english: sample.pronunciation, hint: `Listen and spell a ${fallbackTopic} word.` });
        else if (type === 3) result.push({ type: 'speak', phrase: sample.phrase, english: sample.pronunciation, hint: `Say the ${fallbackTopic} word aloud.` });
        else {
            const picked = [];
            const usedRight = new Set();
            for (let k = 0; k < 4; k++) {
                const sample2 = selectedSet[(i + k) % selectedSet.length];
                if (usedRight.has(sample2.pronunciation)) continue;
                usedRight.add(sample2.pronunciation);
                picked.push({ left: sample2.phrase, right: sample2.pronunciation });
                if (picked.length === 4) break;
            }
            if (picked.length < 4) result.push({ type: 'multiple-choice', phrase: sample.phrase, pronunciation: sample.pronunciation, answer: sample.answer, distractors: sample.distractors, translationMap: sample.translationMap, hint: `Practice ${fallbackTopic} words.` });
            else result.push({ type: 'match-pairs', pairs: picked, hint: `Match each ${fallbackTopic} word to its pronunciation.` });
        }
    }
    return result;
}

async function fetchAIQuestions(topic, language, count = 10, level = 1) {
    try {
        const res = await fetch('/api/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, language, count, level, noNonsense: savedTheme.noNonsense === true })
        });
        if (!res.ok) { console.warn('AI fallback:', res.status); return generateLocalFallbackQuestions(language, topic, count); }
        const data = await res.json();
        if (Array.isArray(data) && data.length) return data;
        return generateLocalFallbackQuestions(language, topic, count);
    } catch (error) {
        console.warn('AI fetch failed:', error);
        return generateLocalFallbackQuestions(language, topic, count);
    }
}

/* ============ PROFILE ============ */

function createDefaultProfile() {
    return { email: '', name: 'Guest learner', streak: 0, diamonds: 100, hearts: 5, lastActiveDate: null, lastLessonDate: null, streakStatus: 'inactive', selectedCourse: null, courses: [], inventory: [] };
}
function loadProfile() {
    const s = localStorage.getItem('MusalingoProfile');
    if (!s) return createDefaultProfile();
    try {
        const p = JSON.parse(s);
        if (!p) return createDefaultProfile();
        p.courses = Array.isArray(p.courses) ? p.courses : [];
        p.inventory = Array.isArray(p.inventory) ? p.inventory : [];
        const d = Number(p.diamonds); p.diamonds = Number.isFinite(d) ? Math.max(0, Math.floor(d)) : 100;
        const h = Number(p.hearts); p.hearts = Number.isFinite(h) ? Math.max(0, Math.floor(h)) : 5;
        return p;
    } catch { return createDefaultProfile(); }
}
function saveProfile(p) { localStorage.setItem('MusalingoProfile', JSON.stringify(p)); }

const HEART_CAP = 5;
const HEART_REFILL_INTERVAL = 30 * 60 * 1000;
const profile = loadProfile();

function updateHeartRefill(now = Date.now()) {
    const prevH = profile.hearts, prevR = profile.heartRefillAt;
    const hearts = Number(profile.hearts);
    profile.hearts = Number.isFinite(hearts) ? Math.max(0, Math.min(HEART_CAP, Math.floor(hearts))) : HEART_CAP;
    const refillAt = Number(profile.heartRefillAt);
    if (profile.hearts >= HEART_CAP) { profile.hearts = HEART_CAP; delete profile.heartRefillAt; }
    else if (!Number.isFinite(refillAt) || refillAt <= 0) profile.heartRefillAt = now + HEART_REFILL_INTERVAL;
    else if (now >= refillAt) {
        const refilled = Math.floor((now - refillAt) / HEART_REFILL_INTERVAL) + 1;
        profile.hearts = Math.min(HEART_CAP, profile.hearts + refilled);
        if (profile.hearts === HEART_CAP) delete profile.heartRefillAt;
        else profile.heartRefillAt = refillAt + refilled * HEART_REFILL_INTERVAL;
    }
    return prevH !== profile.hearts || prevR !== profile.heartRefillAt;
}

const course = profile?.courses?.find((c) => c.id === courseId);
const lesson = course?.lessons?.find((l) => l.id === lessonId) || course?.lessons?.[0];

const lessonTitle = document.getElementById('lessonTitle');
const lessonSubtitle = document.getElementById('lessonSubtitle');
const promptText = document.getElementById('promptText');
const audioControls = document.getElementById('audioControls');
const normalVoiceBtn = document.getElementById('normalVoiceBtn');
const slowVoiceBtn = document.getElementById('slowVoiceBtn');
const options = document.getElementById('options');
const feedback = document.getElementById('feedback');
const chessActivity = document.getElementById('chessActivity');
const statusText = document.getElementById('statusText');
const exitBtn = document.getElementById('exitBtn');
const checkBtn = document.getElementById('checkBtn');
const nextBtn = document.getElementById('nextBtn');
const finishBtn = document.getElementById('finishBtn');
const hintBtn = document.getElementById('hintBtn');
const completionPanel = document.getElementById('completionPanel');
const completionAccuracy = document.getElementById('completionAccuracy');
const completionXp = document.getElementById('completionXp');

function shuffle(arr) {
    const c = [...arr];
    for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[c[i], c[j]] = [c[j], c[i]]; }
    return c;
}

function normalizeLanguageName(language) {
    const value = String(language || '').trim();
    if (!value) return 'English';
    const map = { telugu: 'Telugu', japanese: 'Japanese', spanish: 'Spanish', french: 'French', german: 'German', italian: 'Italian', arabic: 'Arabic', hindi: 'Hindi', english: 'English', chinese: 'Chinese', korean: 'Korean', portuguese: 'Portuguese', russian: 'Russian', turkish: 'Turkish' };
    return map[value.toLowerCase()] || value;
}

function hasNonLatinText(value) {
    const text = String(value ?? '');
    return /[\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0780-\u07BF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0F00-\u0FFF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\u1100-\u11FF\u1E00-\u1EFF\u2C00-\u2C5F]/.test(text);
}

function usesNonLatinScript(language) {
    const value = normalizeLanguageName(language);
    if (hasNonLatinText(value)) return true;
    return /Japanese|Hindi|Arabic|Chinese|Korean|Thai|Russian|Hebrew|Persian|Urdu|Tamil|Telugu|Malayalam|Kannada|Bengali|Gujarati|Punjabi|Nepali|Marathi|Greek|Vietnamese|Burmese|Laotian|Georgian|Armenian|Yiddish|Uyghur|Kazakh|Ukrainian|Bulgarian|Mongolian|Tibetan|Sinhala|Oriya|Assamese|Pashto|Sindhi|Swahili|Amharic|Tigrinya|Malay|Filipino|Lao|Myanmar/i.test(value);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

const COMMON_ENGLISH_TRANSLATIONS = {
    Japanese: { 'こんにちは': 'hello', 'ありがとう': 'thank you', '学校': 'school', '猫': 'cat', '水': 'water', '友達': 'friend', '本': 'book', '食べ物': 'food', '家': 'home', '朝': 'morning', '車': 'car', '音楽': 'music', '夜': 'night', '雨': 'rain', '元気': 'well' },
    Spanish: { hola: 'hello', adios: 'goodbye', libro: 'book', feliz: 'happy', gracias: 'thank you', 'por favor': 'please', amigo: 'friend', agua: 'water', mesa: 'table', casa: 'house', escuela: 'school', manzana: 'apple', correr: 'run', puerta: 'door', sol: 'sun' },
    French: { bonjour: 'hello', merci: 'thank you', livre: 'book', maison: 'house', ami: 'friend', eau: 'water', porte: 'door', soleil: 'sun', ecole: 'school', pomme: 'apple', voiture: 'car' },
    German: { hallo: 'hello', danke: 'thank you', buch: 'book', freund: 'friend', wasser: 'water', schule: 'school', haus: 'house', tafel: 'table', musik: 'music', apfel: 'apple', laufen: 'run', sonne: 'sun', tur: 'door' },
    Italian: { ciao: 'hello', grazie: 'thank you', libro: 'book', amico: 'friend', acqua: 'water', scuola: 'school', casa: 'house', mela: 'apple', musica: 'music', porta: 'door', sole: 'sun', corre: 'run' },
    Arabic: { 'مرحبا': 'hello', 'شكرا': 'thank you', 'كتاب': 'book', 'بيت': 'house', 'ماء': 'water', 'صديق': 'friend', 'مدرسة': 'school', 'نافذة': 'window', 'قمر': 'moon', 'تفاحة': 'apple', 'أحب': 'love', 'سماء': 'sky', 'باب': 'door', 'شمس': 'sun' },
    Hindi: { 'नमस्ते': 'hello', 'धन्यवाद': 'thank you', 'किताब': 'book', 'मित्र': 'friend', 'पानी': 'water', 'विद्यालय': 'school', 'घर': 'house', 'दरवाज़ा': 'door', 'सूरज': 'sun', 'सेब': 'apple', 'दोस्ती': 'friendship', 'आकाश': 'sky', 'चाँद': 'moon' },
    Korean: { '안녕하세요': 'hello', '고맙습니다': 'thank you', '책': 'book', '친구': 'friend', '물': 'water', '학교': 'school', '집': 'house', '문': 'door', '해': 'sun' },
    Telugu: { 'హలో': 'hello', 'ధన్యవాదాలు': 'thank you', 'పుస్తకం': 'book', 'స్నేహితుడు': 'friend', 'నీళ్ళు': 'water', 'పాఠశాల': 'school', 'ఇల్లు': 'house', 'తలుపు': 'door', 'సూర్యుడు': 'sun', 'యాపిల్': 'apple', 'పరుగు': 'run', 'ఆకాశం': 'sky', 'చంద్రుడు': 'moon' }
};

function formatDisplayText(value, language, pronunciationOverride, includePronunciation = false) {
    const text = String(value ?? '').trim();
    if (!text) return '';
    const normalizedLanguage = normalizeLanguageName(language);
    const romanization = String(pronunciationOverride || '').trim();
    if (includePronunciation && (usesNonLatinScript(normalizedLanguage) || hasNonLatinText(text)) && romanization) return text + ' (' + romanization + ')';
    return text;
}

function getChoiceDisplayLabel(value, question, language) {
    const rawValue = String(value ?? '').trim();
    if (!rawValue) return '';
    const normalizedLanguage = normalizeLanguageName(language);
    if (question) {
        const translationMap = question.translationMap || {};
        const translation = translationMap[rawValue] || translationMap[rawValue.toLowerCase()];
        if (translation && !hasNonLatinText(translation)) return String(translation);
    }
    const known = COMMON_ENGLISH_TRANSLATIONS[normalizedLanguage]?.[rawValue] || COMMON_ENGLISH_TRANSLATIONS[normalizedLanguage]?.[rawValue.toLowerCase()];
    if (known) return known;
    return rawValue;
}

function renderHeartGate() {
    lessonTitle.textContent = 'Out of hearts';
    lessonSubtitle.textContent = 'You need at least one heart to start a lesson.';
    promptText.textContent = 'Buy a heart with diamonds or wait 30 minutes for one heart to refill.';
    audioControls.style.display = 'none';
    chessActivity.hidden = true;
    checkBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    finishBtn.style.display = 'none';
    hintBtn.style.display = 'none';
    exitBtn.textContent = 'Back to dashboard';
    statusText.textContent = `Hearts: ${profile.hearts}/${HEART_CAP} • Diamonds: ${profile.diamonds}`;
    options.innerHTML = `
        <div class="heart-gate">
            <button class="btn" id="buyOneHeartBtn" type="button">Buy 1 heart — 10 diamonds</button>
            <button class="btn secondary" id="buyFiveHeartsBtn" type="button">Refill to 5 hearts — 50 diamonds</button>
            <p id="heartRefillMessage" role="status"></p>
            <button class="btn" id="continueLessonBtn" type="button" hidden>Continue to lesson</button>
        </div>`;
    const refillMessage = document.getElementById('heartRefillMessage');
    const continueButton = document.getElementById('continueLessonBtn');
    const buyHearts = (requestedAmount) => {
        if (updateHeartRefill()) saveProfile(profile);
        const amount = Math.min(requestedAmount, HEART_CAP - profile.hearts);
        const cost = amount * 10;
        if (amount <= 0) { window.location.reload(); return; }
        if (profile.diamonds < cost) { refillMessage.textContent = `Need ${cost - profile.diamonds} more diamonds.`; SFX.error(); return; }
        profile.diamonds -= cost;
        profile.hearts += amount;
        if (profile.hearts === HEART_CAP) delete profile.heartRefillAt;
        saveProfile(profile);
        SFX.gemEarned();
        window.location.reload();
    };
    document.getElementById('buyOneHeartBtn').addEventListener('click', () => buyHearts(1));
    document.getElementById('buyFiveHeartsBtn').addEventListener('click', () => buyHearts(HEART_CAP));
    continueButton.addEventListener('click', () => window.location.reload());
    const renderCountdown = () => {
        if (updateHeartRefill()) saveProfile(profile);
        statusText.textContent = `Hearts: ${profile.hearts}/${HEART_CAP} • Diamonds: ${profile.diamonds}`;
        if (profile.hearts > 0) { refillMessage.textContent = 'A heart is ready.'; continueButton.hidden = false; return; }
        const remainingSeconds = Math.max(0, Math.ceil((profile.heartRefillAt - Date.now()) / 1000));
        const m = Math.floor(remainingSeconds / 60);
        const s = String(remainingSeconds % 60).padStart(2, '0');
        refillMessage.textContent = `Next heart in ${m}:${s}`;
    };
    renderCountdown();
    window.setInterval(renderCountdown, 1000);
}

if (!course || !lesson) {
    lessonTitle.textContent = 'Lesson not found';
    lessonSubtitle.textContent = 'Please go back and pick a course again.';
    promptText.textContent = 'This lesson is missing.';
    statusText.textContent = 'No lesson available.';
    finishBtn.disabled = true;
} else {
    const heartsDisabled = savedTheme.noHearts || savedTheme.noGamification;
    if (!heartsDisabled && updateHeartRefill()) saveProfile(profile);
    if (!heartsDisabled && profile.hearts === 0) {
        renderHeartGate();
    } else {
        (async () => {
            let practice;
            promptText.textContent = 'Generating lesson questions…';
            statusText.textContent = 'Asking the AI for fresh questions…';
            try {
                const selectedLanguage = course.id === 'japanese' ? 'Japanese' : course.name;
                const aiQuestions = await fetchAIQuestions(lesson.title || course.name, selectedLanguage, 10, level);
                if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) throw new Error('No questions');
                practice = { language: selectedLanguage, title: lesson.title, questions: aiQuestions };
            } catch (err) {
                console.error('AI generation failed:', err);
                promptText.textContent = 'Could not load questions. Check the server.';
                feedback.textContent = String(err.message || err);
                feedback.style.color = '#b91c1c';
                finishBtn.disabled = true;
                return;
            }
            lessonTitle.textContent = practice.title || lesson.title;
            lessonSubtitle.textContent = `${course.name} • AI-generated practice`;

            const questions = practice.questions.slice(0, 10);
            const results = [];
            let currentIndex = 0;
            let selectedAnswer = null;
            let questionPhrase = '';
            let questionSpeechLanguage = practice.language;
            let translationQuestionIndex = 0;
            let activeRecognition = null;
            let matchPairsState = null;

            const isChess = course.id === 'chess';
            const isMath = course.id === 'math';

            function answeredCount() { return results.filter((r) => typeof r === 'boolean').length; }

            function deductHeart() {
                if (savedTheme.noGamification || savedTheme.noHearts) return;
                updateHeartRefill();
                profile.hearts = Math.max(0, profile.hearts - 1);
                if (!profile.heartRefillAt) profile.heartRefillAt = Date.now() + HEART_REFILL_INTERVAL;
                saveProfile(profile);
            }

            function recordAnswer(correct) {
                results[currentIndex] = correct;
                if (!correct) { deductHeart(); playSound('heartsLost'); }
            }

            function pronounceText(text, rate = 0.85, language = practice.language) {
                return window.SFX?.pronounce ? window.SFX.pronounce(text, { lang: language, rate: rate }) : false;
            }
            function pronounceQuestion(r) { if (window.SFX?.pronounce) window.SFX.pronounce(questionPhrase, { lang: questionSpeechLanguage, rate: r }); }

            function normalizeAnswerText(v) { return String(v ?? '').normalize('NFKC').trim().toLocaleLowerCase().replace(/\s+/g, ' '); }

            function matchesQuestionAnswer(q, value) {
                const actual = normalizeAnswerText(value);
                const native = q.type === 'spell' ? q.phrase : q.type === 'listen' ? (q.answer || q.phrase) : q.answer;
                const accepts = hasNonLatinText(native);
                const candidates = [native];
                if (accepts) { candidates.push(q.pronunciation); if (q.type === 'spell') candidates.push(q.english); }
                return candidates.some((c) => c && normalizeAnswerText(c) === actual);
            }

            /* ============ RENDERERS ============ */

            function renderMultipleChoice(q) {
                const targetLanguage = normalizeLanguageName(practice.language || course.name || 'English');
                const translateFromEnglish = Boolean(q.phrase && !q.question && !isMath) && translationQuestionIndex++ % 2 === 1;
                const phraseLabel = q.phrase ? `<div><strong>${escapeHtml(formatDisplayText(q.phrase, targetLanguage, q.pronunciation, true))}</strong></div>` : '';
                const pronunciationLabel = q.pronunciation && !usesNonLatinScript(targetLanguage) ? `<div class="pronunciation">(${q.pronunciation})</div>` : '';
                const englishPrompt = getChoiceDisplayLabel(q.answer, q, targetLanguage);
                questionPhrase = q.phrase && !isMath ? q.phrase : q.question || englishPrompt;
                questionSpeechLanguage = q.phrase && !isMath ? targetLanguage : 'English';
                promptText.innerHTML = q.question ? `${escapeHtml(q.question)}${pronunciationLabel}`
                    : translateFromEnglish ? `Translate into ${escapeHtml(targetLanguage)}: <strong>${escapeHtml(englishPrompt)}</strong>`
                        : `Translate into English: ${phraseLabel}${pronunciationLabel}`;
                const choices = shuffle([q.answer, ...(q.distractors || [])]);
                options.innerHTML = choices.map(c => {
                    const label = translateFromEnglish ? String(c) : getChoiceDisplayLabel(c, q, targetLanguage);
                    const speechLanguage = translateFromEnglish ? targetLanguage : 'English';
                    return `<button class="answer-btn" data-answer="${escapeHtml(c)}" data-speech-language="${escapeHtml(speechLanguage)}">${escapeHtml(label)}</button>`;
                }).join('');
                wireAnswerButtons();
                if (q.phrase && !isMath) window.setTimeout(() => pronounceText(q.phrase, 1, targetLanguage), 100);
            }

            function wireAnswerButtons() {
                options.querySelectorAll('.answer-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        options.querySelectorAll('.answer-btn').forEach(o => o.classList.remove('selected'));
                        btn.classList.add('selected');
                        selectedAnswer = btn.getAttribute('data-answer');
                        checkBtn.style.display = 'inline-block';
                        pronounceText(btn.textContent.trim(), 0.85, btn.dataset.speechLanguage || practice.language);
                    });
                });
            }

            function renderArrange(q) {
                const targetLanguage = normalizeLanguageName(practice.language || course.name || 'English');
                promptText.innerHTML = `Arrange: <em>${escapeHtml(formatDisplayText(q.english || '', targetLanguage, q.pronunciation || q.english, true))}</em>`;
                const words = shuffle(q.words);
                options.innerHTML = `
                    <div id="arrangeTarget" class="arrange-target"></div>
                    <div id="arrangePool" class="arrange-pool">
                        ${words.map(w => `<button class="arrange-word" data-word="${escapeHtml(w)}">${escapeHtml(formatDisplayText(w, targetLanguage, q.pronunciation || q.english, false))}</button>`).join('')}
                    </div>`;
                const target = document.getElementById('arrangeTarget');
                const pool = document.getElementById('arrangePool');
                pool.querySelectorAll('.arrange-word').forEach(b => { b.addEventListener('click', () => { target.appendChild(b); b.classList.add('in-target'); checkArrange(); }); });
                target.addEventListener('click', e => { if (e.target.classList.contains('arrange-word')) { pool.appendChild(e.target); e.target.classList.remove('in-target'); checkArrange(); } });
                function checkArrange() {
                    const placed = [...target.querySelectorAll('.arrange-word')].map(b => b.dataset.word);
                    selectedAnswer = placed.join(' ');
                    checkBtn.style.display = placed.length === q.words.length ? 'inline-block' : 'none';
                }
            }

            function renderListen(q) {
                const targetLanguage = normalizeLanguageName(practice.language || course.name || 'English');
                promptText.textContent = 'What did you hear?';
                const choices = shuffle([q.answer, ...q.distractors]);
                options.innerHTML = choices.map(c => {
                    const label = formatDisplayText(c, targetLanguage, q.pronunciation, false);
                    return `<button class="answer-btn" data-answer="${escapeHtml(c)}" data-speech-language="${escapeHtml(targetLanguage)}">${escapeHtml(label)}</button>`;
                }).join('') + `<input id="listenInput" class="spell-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Or type what you heard in ${escapeHtml(targetLanguage)} or its pronunciation" />`;
                wireAnswerButtons();
                document.getElementById('listenInput').addEventListener('input', (event) => {
                    options.querySelectorAll('.answer-btn').forEach(button => button.classList.remove('selected'));
                    selectedAnswer = event.target.value.trim() || null;
                    checkBtn.style.display = selectedAnswer ? 'inline-block' : 'none';
                });
                window.setTimeout(() => pronounceText(q.phrase, 0.85), 300);
            }

            function renderSpeak(q) {
                const targetLanguage = normalizeLanguageName(practice.language || course.name || 'English');
                const phraseDisplay = formatDisplayText(q.phrase, targetLanguage, q.pronunciation || q.english, true);
                promptText.innerHTML = `Say: <strong>${escapeHtml(phraseDisplay)}</strong><br><small>${escapeHtml(q.english ? `(${q.english})` : '')}</small>`;
                options.innerHTML = `
                    <div class="speak-wrap">
                        <button class="btn" id="speakBtn" type="button">🎤 Start speaking</button>
                        <button class="btn secondary" id="cantSpeakBtn" type="button">I can't speak</button>
                        <div id="speakResult" class="message"></div>
                    </div>`;
                const btn = document.getElementById('speakBtn');
                const cantSpeakBtn = document.getElementById('cantSpeakBtn');
                const speechResult = document.getElementById('speakResult');
                btn.addEventListener('click', () => {
                    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                    if (!SR) { speechResult.textContent = 'Speech recognition is not supported here.'; speechResult.style.color = '#b91c1c'; return; }
                    if (activeRecognition) return;
                    let rec;
                    try { rec = new SR(); } catch (error) { speechResult.textContent = `Could not initialize microphone: ${error.message || error}`; speechResult.style.color = '#b91c1c'; return; }
                    rec.lang = { Japanese: 'ja-JP', Spanish: 'es-ES', French: 'fr-FR', Hindi: 'hi-IN', German: 'de-DE', Italian: 'it-IT', Arabic: 'ar-SA' }[targetLanguage] || 'en-US';
                    rec.interimResults = false; rec.maxAlternatives = 1;
                    speechResult.textContent = 'Listening…'; speechResult.style.color = 'var(--accent-dark)';
                    btn.disabled = true; activeRecognition = rec;
                    rec.onresult = (e) => {
                        if (activeRecognition !== rec) return;
                        const said = e.results[0][0].transcript.toLowerCase().trim();
                        const rawTargets = [q.phrase, q.pronunciation || '', q.english || '', q.answer || ''];
                        const targets = [...new Set(rawTargets.map(t => String(t || '').toLowerCase().trim()).filter(Boolean))];
                        const correct = targets.some((target) => said.includes(target) || target.includes(said) || similarity(said, target) > 0.7);
                        recordAnswer(correct);
                        activeRecognition = null; btn.disabled = false; cantSpeakBtn.disabled = true;
                        speechResult.textContent = correct ? `✅ You said: "${said}"` : `❌ You said: "${said}" — expected "${targets.join(' / ')}"`;
                        speechResult.style.color = correct ? '#278a44' : '#b91c1c';
                        correct ? playSound('correct') : playSound('wrong');
                        nextBtn.style.display = currentIndex < questions.length - 1 ? 'inline-block' : 'none';
                        finishBtn.disabled = answeredCount() < questions.length;
                        if (currentIndex === questions.length - 1 && !finishBtn.disabled) finishBtn.click();
                    };
                    rec.onerror = (e) => {
                        if (activeRecognition !== rec) return;
                        activeRecognition = null;
                        const errors = { 'not-allowed': 'Microphone access is blocked.', 'service-not-allowed': 'Speech recognition is blocked.', 'audio-capture': 'No microphone was found.', 'no-speech': 'No speech was detected.', network: 'Speech recognition needs a network connection.', aborted: 'Listening stopped.' };
                        speechResult.textContent = errors[e.error] || `Microphone error: ${e.error}`;
                        speechResult.style.color = '#b91c1c';
                        btn.disabled = false;
                    };
                    rec.onend = () => { if (activeRecognition === rec) activeRecognition = null; btn.disabled = false; };
                    try { rec.start(); } catch (error) { activeRecognition = null; btn.disabled = false; speechResult.textContent = `Could not start microphone: ${error.message || error}`; speechResult.style.color = '#b91c1c'; }
                });
                cantSpeakBtn.addEventListener('click', () => {
                    const recognition = activeRecognition;
                    activeRecognition = null;
                    if (recognition) { try { recognition.abort(); } catch (e) { } }
                    results[currentIndex] = false; playSound('heartsLost'); deductHeart();
                    finishBtn.disabled = answeredCount() < questions.length;
                    if (currentIndex === questions.length - 1) { if (!finishBtn.disabled) finishBtn.click(); return; }
                    currentIndex += 1; renderQuestion();
                });
            }

            function similarity(a, b) {
                if (!a || !b) return 0;
                const longer = a.length > b.length ? a : b;
                const shorter = a.length > b.length ? b : a;
                if (!longer.length) return 1;
                let m = 0;
                for (let i = 0; i < shorter.length; i++) if (longer[i] === shorter[i]) m++;
                return m / longer.length;
            }

            function renderSpell(q) {
                promptText.textContent = 'Listen and spell:';
                options.innerHTML = `<input id="spellInput" class="spell-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type what you hear…" />`;
                const input = document.getElementById('spellInput');
                window.setTimeout(() => pronounceText(q.phrase, 0.7), 300);
                input.addEventListener('input', () => {
                    selectedAnswer = input.value.trim();
                    checkBtn.style.display = selectedAnswer ? 'inline-block' : 'none';
                });
                input.focus();
            }

            function renderMatchPairs(q) {
                const targetLanguage = normalizeLanguageName(practice.language || course.name || 'English');
                promptText.innerHTML = 'Match the pairs';
                const seenRight = new Set();
                const sanitizedPairs = [];
                for (const pair of q.pairs) {
                    if (!pair || pair.left == null || pair.right == null) continue;
                    const key = String(pair.right);
                    if (seenRight.has(key)) continue;
                    seenRight.add(key);
                    sanitizedPairs.push({ left: pair.left, right: pair.right });
                }
                if (sanitizedPairs.length < 2) {
                    promptText.textContent = 'This question could not be shown.';
                    options.innerHTML = `<div class="message" style="color:#b91c1c;">Skipping broken question…</div>`;
                    results[currentIndex] = false;
                    finishBtn.disabled = answeredCount() < questions.length;
                    nextBtn.style.display = currentIndex < questions.length - 1 ? 'inline-block' : 'none';
                    if (currentIndex === questions.length - 1 && !finishBtn.disabled) { setTimeout(() => finishBtn.click(), 200); }
                    return;
                }
                matchPairsState = { selL: null, selR: null, matched: 0, total: sanitizedPairs.length, shakeTimer: null };
                const left = shuffle(sanitizedPairs.map(p => p.left));
                const right = shuffle(sanitizedPairs.map(p => p.right));
                const correctMap = new Map(sanitizedPairs.map(p => [p.left, p.right]));
                const state = matchPairsState;
                options.innerHTML = `
                    <div class="match-grid">
                        <div class="match-col" id="matchLeft">
                            ${left.map(w => `<button class="match-item" data-side="left" data-value="${escapeHtml(w)}">${escapeHtml(formatDisplayText(w, targetLanguage, q.pronunciation || q.english, false))}</button>`).join('')}
                        </div>
                        <div class="match-col" id="matchRight">
                            ${right.map(w => `<button class="match-item" data-side="right" data-value="${escapeHtml(w)}">${escapeHtml(formatDisplayText(w, targetLanguage, q.pronunciation || q.english, false))}</button>`).join('')}
                        </div>
                    </div>
                    <div class="message" id="matchMsg">Tap a left item, then its match on the right.</div>
                    <div style="margin-top:12px;">
                        <button class="btn secondary" id="matchSkipBtn" type="button" style="font-size:0.9rem;">Skip this question</button>
                    </div>`;
                document.getElementById('matchSkipBtn').addEventListener('click', () => {
                    if (state.shakeTimer) { clearTimeout(state.shakeTimer); state.shakeTimer = null; }
                    results[currentIndex] = false; playSound('heartsLost'); deductHeart();
                    finishBtn.disabled = answeredCount() < questions.length;
                    if (currentIndex === questions.length - 1) { if (!finishBtn.disabled) finishBtn.click(); return; }
                    currentIndex += 1; renderQuestion();
                });
                options.querySelectorAll('.match-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (btn.disabled) return;
                        if (state.shakeTimer) return;
                        const side = btn.dataset.side;
                        if (side === 'left') { if (state.selL) state.selL.classList.remove('selected'); state.selL = btn; btn.classList.add('selected'); }
                        else { if (state.selR) state.selR.classList.remove('selected'); state.selR = btn; btn.classList.add('selected'); }
                        if (state.selL && state.selR) {
                            const leftVal = state.selL.dataset.value;
                            const rightVal = state.selR.dataset.value;
                            const ok = correctMap.get(leftVal) === rightVal;
                            if (ok) {
                                state.selL.classList.add('matched'); state.selR.classList.add('matched');
                                state.selL.disabled = true; state.selR.disabled = true;
                                state.matched++; playSound('correct');
                                document.getElementById('matchMsg').textContent = `✓ Matched (${state.matched}/${state.total})`;
                                if (state.matched === state.total) {
                                    results[currentIndex] = true;
                                    promptText.innerHTML = '✅ All pairs matched!';
                                    document.getElementById('matchMsg').textContent = 'Great job!';
                                    nextBtn.style.display = currentIndex < questions.length - 1 ? 'inline-block' : 'none';
                                    finishBtn.disabled = answeredCount() < questions.length;
                                    if (currentIndex === questions.length - 1 && !finishBtn.disabled) finishBtn.click();
                                }
                            } else {
                                playSound('wrong'); deductHeart(); playSound('heartsLost');
                                const lBtn = state.selL, rBtn = state.selR;
                                lBtn.classList.add('shake'); rBtn.classList.add('shake');
                                state.shakeTimer = setTimeout(() => {
                                    try { lBtn.classList.remove('shake', 'selected'); rBtn.classList.remove('shake', 'selected'); } catch (e) { }
                                    state.selL = null; state.selR = null; state.shakeTimer = null;
                                }, 400);
                                document.getElementById('matchMsg').textContent = 'Not a match. Try again.';
                                return;
                            }
                            state.selL = null; state.selR = null;
                        }
                    });
                });
            }

            function renderSlider(q) {
                promptText.innerHTML = q.question;
                options.innerHTML = `
                    <div class="slider-wrap">
                        <input type="range" id="sliderInput" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.min}" />
                        <div class="slider-value"><span id="sliderVal">${q.min}</span>${q.unit ? ' ' + q.unit : ''}</div>
                    </div>`;
                const input = document.getElementById('sliderInput');
                const val = document.getElementById('sliderVal');
                input.addEventListener('input', () => {
                    val.textContent = input.value;
                    selectedAnswer = Number(input.value);
                    checkBtn.style.display = 'inline-block';
                });
            }

            function renderGraph(q) {
                promptText.innerHTML = q.question;
                const size = 320, pad = 30;
                const range = Math.max(Math.abs(q.min), Math.abs(q.max));
                const scale = (size - pad * 2) / (range * 2);
                options.innerHTML = `
                    <div class="graph-wrap">
                        <svg id="graphSvg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                            ${Array.from({ length: 9 }, (_, i) => {
                    const v = q.min + (q.max - q.min) * (i / 8);
                    const p = pad + ((v + range) / (2 * range)) * (size - pad * 2);
                    return `<line x1="${p}" y1="${pad}" x2="${p}" y2="${size - pad}" stroke="#e5e7eb" /><line x1="${pad}" y1="${p}" x2="${size - pad}" y2="${p}" stroke="#e5e7eb" />`;
                }).join('')}
                            <line x1="${pad}" y1="${size / 2}" x2="${size - pad}" y2="${size / 2}" stroke="#6b7280" stroke-width="2" />
                            <line x1="${size / 2}" y1="${pad}" x2="${size / 2}" y2="${size - pad}" stroke="#6b7280" stroke-width="2" />
                            <circle id="graphDot" cx="${size / 2}" cy="${size / 2}" r="10" fill="var(--accent)" opacity="0" />
                        </svg>
                        <div class="slider-value"><span id="graphVal">—</span>${q.unit ? ' ' + q.unit : ''}</div>
                    </div>`;
                const svg = document.getElementById('graphSvg');
                const dot = document.getElementById('graphDot');
                const val = document.getElementById('graphVal');
                svg.addEventListener('click', (e) => {
                    const rect = svg.getBoundingClientRect();
                    const x = e.clientX - rect.left, y = e.clientY - rect.top;
                    dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('opacity', '1');
                    const value = (x - size / 2) / scale;
                    const snapped = Math.round(value / q.step) * q.step;
                    selectedAnswer = snapped;
                    val.textContent = snapped.toFixed(q.step < 1 ? 1 : 0);
                    checkBtn.style.display = 'inline-block';
                });
            }

            /* ============ CHESS LESSON BOARD ============ */

            function renderChessQuestion(q) {
                audioControls.style.display = 'none';
                options.innerHTML = '';
                feedback.textContent = '';
                promptText.textContent = q.prompt || 'Tap the piece, then tap where it should move.';

                const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                const board = {};
                const placement = String(q.fen || '').split(' ')[0] || '';
                let rank = 8;
                let fileIdx = 0;

                for (const ch of placement) {
                    if (ch === '/') { rank -= 1; fileIdx = 0; continue; }
                    if (/\d/.test(ch)) { fileIdx += Number(ch); continue; }
                    if (fileIdx > 7) continue;
                    const square = `${files[fileIdx]}${rank}`;
                    const color = ch === ch.toUpperCase() ? 'w' : 'b';
                    board[square] = `${color}${ch.toLowerCase()}`;
                    fileIdx += 1;
                }

                chessActivity.hidden = false;
                chessActivity.innerHTML = `
                    <div class="chess-lesson-layout" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start;width:100%;">
                        <div class="board-wrap" style="display:flex;justify-content:center;align-items:center;width:100%;">
                            <div class="board-container" style="
                                display:grid;
                                grid-template-columns:14px minmax(0,1fr);
                                grid-template-rows:minmax(0,1fr) 14px;
                                gap:2px;
                                width:100%;
                                max-width:400px;
                                aspect-ratio:1/1;
                            ">
                                <div class="board-ranks" id="lessonBoardRanks" style="
                                    grid-row:1;grid-column:1;
                                    display:grid;grid-template-rows:repeat(8,1fr);align-items:center;
                                "></div>
                                <div class="board" id="lessonBoard" style="
                                    grid-column:2;grid-row:1;
                                    width:100%;height:100%;
                                    display:grid;
                                    grid-template-columns:repeat(8,1fr);
                                    grid-template-rows:repeat(8,1fr);
                                    border-radius:4px;overflow:hidden;
                                    box-shadow:0 8px 32px rgba(0,0,0,0.5);
                                    background:#739552;
                                "></div>
                                <div class="board-files" id="lessonBoardFiles" style="
                                    grid-column:2;grid-row:2;
                                    display:grid;grid-template-columns:repeat(8,1fr);text-align:center;align-items:center;
                                "></div>
                            </div>
                        </div>
                        <div>
                            <p class="board-copy" id="boardPrompt" style="margin:0 0 8px;font-weight:700;">${escapeHtml(q.prompt || '')}</p>
                            <p class="board-feedback" id="boardFeedback" style="margin:0;font-weight:700;">Tap the piece, then tap its destination.</p>
                        </div>
                    </div>`;

                const ranksEl = document.getElementById('lessonBoardRanks');
                ranksEl.innerHTML = '';
                for (let r = 0; r < 8; r++) {
                    const d = document.createElement('div');
                    d.className = 'coord-text';
                    d.style.cssText = 'font-size:10px;font-weight:700;text-align:center;color:var(--muted,#8b8987);line-height:1;';
                    d.textContent = String(8 - r);
                    ranksEl.appendChild(d);
                }

                const filesEl = document.getElementById('lessonBoardFiles');
                filesEl.innerHTML = '';
                for (let c = 0; c < 8; c++) {
                    const d = document.createElement('div');
                    d.className = 'coord-text';
                    d.style.cssText = 'font-size:10px;font-weight:700;text-align:center;color:var(--muted,#8b8987);line-height:1;';
                    d.textContent = 'abcdefgh'[c];
                    filesEl.appendChild(d);
                }

                const boardEl = document.getElementById('lessonBoard');
                boardEl.innerHTML = '';
                const bf = document.getElementById('boardFeedback');
                let locked = false;
                let selectedSquare = null;

                const LIGHT = getComputedStyle(document.documentElement).getPropertyValue('--light').trim() || '#ebecd0';
                const DARK = getComputedStyle(document.documentElement).getPropertyValue('--dark').trim() || '#739552';

                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        const sq = squareName(r, c);
                        const isLight = (r + c) % 2 === 0;
                        const s = document.createElement('div');
                        s.className = 'square ' + (isLight ? 'light' : 'dark');
                        s.dataset.square = sq;

                        s.style.cssText = `
                            position:relative;
                            cursor:pointer;
                            background:${isLight ? LIGHT : DARK};
                            transition:box-shadow 0.12s ease, filter 0.12s ease;
                            width:100%;
                            height:100%;
                        `;

                        if (sq === q.from) {
                            s.style.boxShadow = 'inset 0 0 0 3px #2b70c9';
                            s.title = 'Piece to move';
                        }

                        const pc = board[sq];
                        if (pc && SVG_PIECES[pc]) {
                            // FIX: Use absolute positioning with inset to force it to fill the square perfectly
                            const wrap = document.createElement('div');
                            wrap.className = 'piece';
                            wrap.style.cssText = 'position:absolute;inset:0;display:flex;justify-content:center;align-items:center;pointer-events:none;';
                            wrap.innerHTML = SVG_PIECES[pc];

                            // Force the SVG itself to scale inside the absolute wrapper
                            const svg = wrap.querySelector('svg');
                            if (svg) {
                                svg.style.width = '85%';
                                svg.style.height = '85%';
                                svg.style.display = 'block';
                            }

                            s.appendChild(wrap);
                        }

                        s.addEventListener('click', () => {
                            if (locked) return;

                            // STEP 1 — select a piece
                            if (!selectedSquare) {
                                if (!board[sq]) {
                                    playSound('click');
                                    bf.textContent = 'Tap a piece first.';
                                    bf.style.color = '#b45309';
                                    return;
                                }
                                selectedSquare = sq;
                                s.style.boxShadow = 'inset 0 0 0 4px #facc15';
                                s.style.filter = 'brightness(1.08)';
                                playSound('tap');
                                bf.textContent = `Selected ${sq}. Now tap where it should move.`;
                                bf.style.color = 'var(--muted)';
                                return;
                            }

                            // Deselect on same square
                            if (sq === selectedSquare) {
                                const sel = boardEl.querySelector(`[data-square="${selectedSquare}"]`);
                                if (sel) {
                                    if (selectedSquare === q.from) sel.style.boxShadow = 'inset 0 0 0 3px #2b70c9';
                                    else sel.style.boxShadow = '';
                                    sel.style.filter = '';
                                }
                                selectedSquare = null;
                                playSound('click');
                                bf.textContent = 'Tap the piece, then tap its destination.';
                                bf.style.color = 'var(--muted)';
                                return;
                            }

                            // STEP 2 — commit answer
                            locked = true;
                            const correct = sq === q.answer;
                            const selEl = boardEl.querySelector(`[data-square="${selectedSquare}"]`);
                            if (selEl) selEl.style.filter = '';

                            s.style.background = correct ? '#bbf7d0' : '#fecaca';
                            s.style.boxShadow = correct
                                ? 'inset 0 0 0 3px #22c55e'
                                : 'inset 0 0 0 3px #ef4444';

                            if (!correct) {
                                boardEl.querySelectorAll('.square').forEach((cell) => {
                                    if (cell.dataset.square === q.answer) {
                                        cell.style.background = '#bbf7d0';
                                        cell.style.boxShadow = 'inset 0 0 0 3px #22c55e';
                                    }
                                });
                            }

                            bf.textContent = correct
                                ? `Correct! ${q.answer} is right.`
                                : `Not quite — the answer is ${q.answer}.`;
                            bf.style.color = correct ? '#278a44' : '#b91c1c';

                            const capturedPiece = board[q.answer]?.[1];
                            if (correct) {
                                playSound('correct');
                                if (capturedPiece) {
                                    setTimeout(() => playSound('capture', capturedPiece), 150);
                                }
                            } else {
                                playSound('wrong');
                            }

                            recordAnswer(correct);
                            nextBtn.style.display = currentIndex < questions.length - 1 ? 'inline-block' : 'none';
                            finishBtn.disabled = answeredCount() < questions.length;
                            if (currentIndex === questions.length - 1 && !finishBtn.disabled) finishBtn.click();
                        });

                        boardEl.appendChild(s);
                    }
                }

                requestAnimationFrame(fitBoards);
                setTimeout(fitBoards, 50);
                setTimeout(fitBoards, 250);
            }
             

            /* ============ DISPATCHER ============ */

            function renderQuestion() {
                if (activeRecognition) { try { activeRecognition.abort(); } catch (e) { } activeRecognition = null; }
                if (matchPairsState && matchPairsState.shakeTimer) { clearTimeout(matchPairsState.shakeTimer); matchPairsState = null; }

                const q = questions[currentIndex];
                questionPhrase = q.phrase || q.question || q.english || '';
                questionSpeechLanguage = practice.language;
                feedback.textContent = '';
                feedback.style.color = 'var(--accent-dark)';
                statusText.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
                selectedAnswer = null;
                audioControls.style.display = '';
                checkBtn.style.display = 'none';
                nextBtn.style.display = 'none';
                finishBtn.disabled = answeredCount() < questions.length;
                hintBtn.style.display = (isChess || isMath) ? 'inline-block' : 'none';

                if (isChess) return renderChessQuestion(q);

                switch (q.type) {
                    case 'arrange': return renderArrange(q);
                    case 'listen': return renderListen(q);
                    case 'speak': return renderSpeak(q);
                    case 'spell': return renderSpell(q);
                    case 'match-pairs': return renderMatchPairs(q);
                    case 'slider': return renderSlider(q);
                    case 'graph': return renderGraph(q);
                    default: return renderMultipleChoice(q);
                }
            }

            /* ============ BUTTON WIRING ============ */

            normalVoiceBtn.addEventListener('click', () => pronounceQuestion(1));
            slowVoiceBtn.addEventListener('click', () => pronounceQuestion(0.5));

            hintBtn.addEventListener('click', () => {
                const q = questions[currentIndex];
                if (!q) return;
                feedback.textContent = '💡 ' + (q.hint || 'Take your time.');
                feedback.style.color = 'var(--blue)';
            });

            checkBtn.addEventListener('click', () => {
                const q = questions[currentIndex];
                if (q.type === 'movement') return;
                if (selectedAnswer === null) { feedback.textContent = 'Choose an answer first.'; feedback.style.color = '#b91c1c'; return; }

                let isCorrect = false;
                if (q.type === 'spell' || q.type === 'listen') isCorrect = matchesQuestionAnswer(q, selectedAnswer);
                else if (q.type === 'slider' || q.type === 'graph') isCorrect = Math.abs(Number(selectedAnswer) - Number(q.answer)) < 0.001;
                else isCorrect = selectedAnswer === q.answer;

                const selectedButton = options.querySelector('.answer-btn.selected');
                if (selectedButton) { selectedButton.classList.remove('selected'); selectedButton.classList.add(isCorrect ? 'correct' : 'wrong'); }

                isCorrect ? playSound('correct') : playSound('wrong');
                options.querySelectorAll('.answer-btn').forEach(o => o.disabled = true);

                recordAnswer(isCorrect);
                feedback.textContent = isCorrect ? 'Correct! Great job.' : `Not quite — correct answer: ${q.answer || q.phrase}`;
                feedback.style.color = isCorrect ? 'var(--accent-dark)' : '#b91c1c';

                checkBtn.style.display = 'none';
                nextBtn.style.display = currentIndex < questions.length - 1 ? 'inline-block' : 'none';
                finishBtn.disabled = answeredCount() < questions.length;
                selectedAnswer = null;
                if (currentIndex === questions.length - 1 && !finishBtn.disabled) finishBtn.click();
            });

            nextBtn.addEventListener('click', () => {
                if (results[currentIndex] === undefined) { feedback.textContent = 'Answer first.'; feedback.style.color = '#b91c1c'; return; }
                currentIndex += 1;
                if (currentIndex < questions.length) renderQuestion();
            });

            finishBtn.addEventListener('click', () => {
                if (answeredCount() < questions.length) { feedback.textContent = 'Finish all questions first.'; feedback.style.color = '#b91c1c'; return; }

                lesson.completed = true;
                const completedCount = course.lessons.filter(i => i.completed).length;
                course.progress = Math.min(100, Math.round((completedCount / course.lessons.length) * 100));

                const rewardXp = isReview ? 5 : 20;
                const today = new Date().toISOString().slice(0, 10);
                const accuracy = Math.round((results.filter(Boolean).length / questions.length) * 100);

                if (!savedTheme.noGamification) profile.xp = (Number(profile.xp) || 0) + rewardXp;

                if (!isReview) {
                    if (!savedTheme.noGamification) { profile.diamonds += 20; playSound('gemEarned'); }
                    profile.practiceMinutes = (Number(profile.practiceMinutes) || 0) + 10;
                    if (!savedTheme.noStreaks && profile.streakStatus !== 'paused') {
                        if (!profile.lastLessonDate) profile.streak = 1;
                        else {
                            const lastLesson = new Date(profile.lastLessonDate);
                            const diff = Math.round((new Date(today) - lastLesson) / 86400000);
                            if (diff === 1) profile.streak += 1;
                            else if (diff >= 2) profile.streak = 1;
                        }
                        profile.lastLessonDate = today; profile.lastActiveDate = today; profile.streakStatus = 'active';
                    }
                }

                profile.lessonDates = Array.isArray(profile.lessonDates) ? profile.lessonDates : [];
                if (!profile.lessonDates.includes(today)) profile.lessonDates.push(today);

                if (profile.dailyQuestDate !== today) {
                    profile.dailyQuestDate = today;
                    profile.dailyQuestProgress = { lessons: 0, xp: 0, practice: 0, accuracy: 0, streak: 0 };
                }
                const qp = profile.dailyQuestProgress;
                qp.lessons = (qp.lessons || 0) + 1;
                qp.xp = (qp.xp || 0) + rewardXp;
                qp.practice = (qp.practice || 0) + 10;
                qp.accuracy = Math.max(qp.accuracy || 0, accuracy);
                qp.streak = Math.max(qp.streak || 0, profile.streak > 0 ? 1 : 0);

                saveProfile(profile);

                let advanceTimer = null;
                try {
                    const curriculum = window.MUSALINGO_CURRICULUM;
                    const sectionNo = Number(urlParams.get('section')) || 1;
                    if (curriculum && course) {
                        const sectionIndex = sectionNo - 1;
                        const sectionLessons = course.lessons.filter(l => (l.sectionIndex ?? 0) === sectionIndex);
                        const allDone = sectionLessons.length > 0 && sectionLessons.every(l => l.completed);
                        const lastLesson = sectionLessons[sectionLessons.length - 1];
                        const isLastOfSection = lastLesson && lesson.id === lastLesson.id;
                        const sectionsForCourse = curriculum.sections?.[course.id];
                        const totalSections = Array.isArray(sectionsForCourse) ? sectionsForCourse.length : (curriculum.courses?.[course.id]?.totalSections || 7);
                        if (allDone && isLastOfSection && sectionNo < totalSections) {
                            const nextSectionUrl = `course.html?courseId=${encodeURIComponent(course.id)}&section=${sectionNo + 1}`;
                            advanceTimer = window.setTimeout(() => { if (document.visibilityState === 'visible') window.location.href = nextSectionUrl; }, 1200);
                        }
                    }
                } catch (err) { console.warn('Auto-advance failed:', err); }

                playSound('cancelSpeech');
                playSound('complete');

                completionAccuracy.textContent = `${accuracy}%`;
                completionXp.textContent = `+${rewardXp}`;
                completionPanel.hidden = false;
                audioControls.style.display = 'none';
                exitBtn.style.display = 'none';
                hintBtn.style.display = 'none';
                options.innerHTML = '';
                chessActivity.hidden = true;
                promptText.textContent = 'You finished all the questions.';
                feedback.textContent = '';
                nextBtn.style.display = 'none';
                finishBtn.style.display = 'none';
                statusText.textContent = savedTheme.noGamification ? 'Lesson complete. Your learning progress has been saved.' : 'Your lesson results are ready.';

                if (advanceTimer) {
                    const cancelAdvance = () => { if (advanceTimer) { window.clearTimeout(advanceTimer); advanceTimer = null; } };
                    completionPanel.addEventListener('click', cancelAdvance, { once: true });
                    completionPanel.addEventListener('touchstart', cancelAdvance, { once: true });
                }
            });

            window.addEventListener('pagehide', () => {
                if (activeRecognition) { try { activeRecognition.abort(); } catch (e) { } activeRecognition = null; }
                if (matchPairsState && matchPairsState.shakeTimer) { clearTimeout(matchPairsState.shakeTimer); matchPairsState = null; }
                if (window.SFX?.cancelSpeech) window.SFX.cancelSpeech();
            });

            renderQuestion();
        })();
    }
}