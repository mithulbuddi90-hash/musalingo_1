/* ============================================================
   Musalingo — firebase.js (v2, with Friends + Live Chess)
   ============================================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    OAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    onSnapshot,
    serverTimestamp,
    arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "UR API HERE",
    authDomain: "logthu-in-app-99d1f.firebaseapp.com",
    databaseURL: "https://log-in-app-99d1f-default-rtdb.firebaseio.com",
    projectId: "logthu-in-app-99d1f",
    storageBucket: "logthu-in-app-99d1f.firebasestorage.app",
    messagingSenderId: "870479641576",
    appId: "1:870479641576:web:46add0ffb4cc72f999025d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const MUSALINGO_KEYS = {
    guest: 'MusalingoGuest',
    loggedIn: 'MusalingoLoggedIn',
    user: 'MusalingoUser',
    uid: 'MusalingoUid',
    profile: 'MusalingoProfile'
};

export { app, auth, db };

/* ============ AUTH / PROFILE CORE ============ */

export function normalizeEmail(value = '') {
    return String(value || '').trim().toLowerCase();
}

export function isGuestMode() {
    const guestFlag = localStorage.getItem(MUSALINGO_KEYS.guest) === 'true';
    const loggedInFlag = localStorage.getItem(MUSALINGO_KEYS.loggedIn) === 'true';
    return guestFlag || (!loggedInFlag && !auth.currentUser);
}

export function setGuestMode() {
    localStorage.setItem(MUSALINGO_KEYS.guest, 'true');
    localStorage.setItem(MUSALINGO_KEYS.loggedIn, 'false');
    localStorage.removeItem(MUSALINGO_KEYS.user);
    localStorage.removeItem(MUSALINGO_KEYS.uid);
}

export function clearGuestMode() {
    localStorage.removeItem(MUSALINGO_KEYS.guest);
    localStorage.setItem(MUSALINGO_KEYS.loggedIn, 'true');
}

export function loadLocalProfile() {
    try {
        const profile = JSON.parse(localStorage.getItem(MUSALINGO_KEYS.profile) || 'null') || {};
        return {
            uid: localStorage.getItem(MUSALINGO_KEYS.uid) || profile.uid || '',
            email: normalizeEmail(profile.email || localStorage.getItem(MUSALINGO_KEYS.user) || ''),
            name: profile.name || 'Learner',
            streak: Number(profile.streak) || 0,
            diamonds: Number(profile.diamonds) || 0,
            friends: Array.isArray(profile.friends) ? profile.friends : [],
            courses: Array.isArray(profile.courses) ? profile.courses : [],
            inventory: Array.isArray(profile.inventory) ? profile.inventory : [],
            ...profile
        };
    } catch {
        return {
            uid: '',
            email: '',
            name: 'Learner',
            streak: 0,
            diamonds: 0,
            friends: [],
            courses: [],
            inventory: []
        };
    }
}

export function saveLocalProfile(profile) {
    const safeProfile = {
        ...loadLocalProfile(),
        ...profile,
        friends: Array.isArray(profile?.friends) ? profile.friends : [],
        courses: Array.isArray(profile?.courses) ? profile.courses : [],
        inventory: Array.isArray(profile?.inventory) ? profile.inventory : []
    };
    localStorage.setItem(MUSALINGO_KEYS.profile, JSON.stringify(safeProfile));
    if (safeProfile.uid) localStorage.setItem(MUSALINGO_KEYS.uid, safeProfile.uid);
    if (safeProfile.email) localStorage.setItem(MUSALINGO_KEYS.user, safeProfile.email);
    return safeProfile;
}

export function getCurrentSignedInUser() {
    const user = auth.currentUser;
    if (user) return user;
    const savedEmail = normalizeEmail(localStorage.getItem(MUSALINGO_KEYS.user));
    const savedUid = localStorage.getItem(MUSALINGO_KEYS.uid);
    return savedEmail ? { email: savedEmail, uid: savedUid || 'guest' } : null;
}

/* ============ USER DOCUMENT (with bidirectional friends merge) ============ */

export async function upsertSignedInUserDocument(uid, email, extraProfile = {}) {
    if (!uid || !email) return null;

    const localProfile = loadLocalProfile();

    // Read remote first so we can merge friends bidirectionally
    let remote = null;
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) remote = snap.data();
    } catch (e) {
        console.warn('[firebase] could not read remote profile:', e);
    }

    // Union of friends from remote + local (deduped, remote wins on conflict)
    const mergedFriends = [...new Set([
        ...(remote?.friends || []),
        ...(extraProfile.friends || []),
        ...(localProfile.friends || [])
    ])];

    const profile = {
        ...localProfile,
        ...(remote || {}),
        ...extraProfile,
        uid,
        email: normalizeEmail(email),
        name: extraProfile.name || remote?.name || localProfile.name || 'Learner',
        streak: Number(extraProfile.streak) || Number(remote?.streak) || Number(localProfile.streak) || 0,
        diamonds: Number(extraProfile.diamonds) || Number(remote?.diamonds) || Number(localProfile.diamonds) || 0,
        friends: mergedFriends,
        courses: Array.isArray(extraProfile.courses)
            ? extraProfile.courses
            : (remote?.courses || localProfile.courses || []),
        inventory: Array.isArray(extraProfile.inventory)
            ? extraProfile.inventory
            : (remote?.inventory || localProfile.inventory || []),
        updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', uid), profile, { merge: true });
    saveLocalProfile(profile);
    localStorage.setItem(MUSALINGO_KEYS.user, profile.email);
    localStorage.setItem(MUSALINGO_KEYS.uid, uid);
    localStorage.setItem(MUSALINGO_KEYS.loggedIn, 'true');
    localStorage.removeItem(MUSALINGO_KEYS.guest);

    return profile;
}

export async function loadUserDocument(uid) {
    if (!uid) return null;
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
}

export async function findUserByEmail(email) {
    const cleanedEmail = normalizeEmail(email);
    if (!cleanedEmail) return null;
    const q = query(collection(db, 'users'), where('email', '==', cleanedEmail), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function findUserByUid(uid) {
    if (!uid) return null;
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { uid, ...snap.data() } : null;
}

export function listenToUserDocument(uid, callback) {
    if (!uid) return () => { };
    return onSnapshot(doc(db, 'users', uid), (snap) => {
        callback(snap.exists() ? { uid, ...snap.data() } : null);
    });
}

/* ============ AUTH PROVIDERS ============ */

export function createGoogleProvider() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
}

export function createMicrosoftProvider() {
    return new OAuthProvider('microsoft.com');
}

export function createPhoneVerifier(containerId = 'recaptcha-container') {
    return new RecaptchaVerifier(auth, containerId, {
        size: 'normal',
        callback: () => { },
        'expired-callback': () => { }
    });
}

export function signInWithGooglePopup() {
    return signInWithPopup(auth, createGoogleProvider());
}

export function signInWithMicrosoftPopup() {
    return signInWithPopup(auth, createMicrosoftProvider());
}

export function startPhoneSignIn(phoneNumber, verifier) {
    return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export function listenForAuthChanges(callback) {
    return onAuthStateChanged(auth, callback);
}

/* ============ FRIENDS ============ */

/**
 * Send a friend request to another user.
 * Returns { status: 'sent' | 'already_friends' | 'already_pending' | 'error', message? }
 */
export async function sendFriendRequest({ fromUid, fromEmail, fromName, toEmail }) {
    if (!fromUid) return { status: 'error', message: 'Sign in first.' };

    const target = await findUserByEmail(toEmail);
    if (!target || !target.uid) {
        return { status: 'error', message: 'No Musalingo account found for that email.' };
    }
    if (target.uid === fromUid) {
        return { status: 'error', message: 'You cannot add yourself.' };
    }

    const myDoc = await loadUserDocument(fromUid);
    if ((myDoc?.friends || []).includes(target.uid)) {
        return { status: 'already_friends' };
    }

    // Check for existing pending request either direction
    const pendingOut = await getDocs(query(
        collection(db, 'friendRequests'),
        where('fromUid', '==', fromUid),
        where('toUid', '==', target.uid),
        where('status', '==', 'pending')
    ));
    if (!pendingOut.empty) return { status: 'already_pending' };

    // If there's already a pending incoming request from them, auto-accept
    const pendingIn = await getDocs(query(
        collection(db, 'friendRequests'),
        where('fromUid', '==', target.uid),
        where('toUid', '==', fromUid),
        where('status', '==', 'pending')
    ));
    if (!pendingIn.empty) {
        await acceptFriendRequest(pendingIn.docs[0].id, fromUid, target.uid);
        return { status: 'auto_accepted' };
    }

    await addDoc(collection(db, 'friendRequests'), {
        fromUid,
        fromEmail: normalizeEmail(fromEmail),
        fromName: fromName || 'Learner',
        toUid: target.uid,
        toEmail: target.email || normalizeEmail(toEmail),
        status: 'pending',
        createdAt: serverTimestamp()
    });

    return { status: 'sent', targetName: target.name || toEmail };
}

export async function acceptFriendRequest(requestId, accepterUid, requesterUid) {
    // Add each other to friends
    await updateDoc(doc(db, 'users', accepterUid), {
        friends: arrayUnion(requesterUid)
    });
    await updateDoc(doc(db, 'users', requesterUid), {
        friends: arrayUnion(accepterUid)
    });
    await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
    });
}

export async function declineFriendRequest(requestId) {
    await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'declined',
        declinedAt: serverTimestamp()
    });
}

export async function removeFriend(myUid, friendUid) {
    if (!myUid || !friendUid) return;
    const myDoc = await loadUserDocument(myUid);
    const friendDoc = await loadUserDocument(friendUid);
    const myFriends = (myDoc?.friends || []).filter((u) => u !== friendUid);
    const theirFriends = (friendDoc?.friends || []).filter((u) => u !== myUid);
    await updateDoc(doc(db, 'users', myUid), { friends: myFriends });
    await updateDoc(doc(db, 'users', friendUid), { friends: theirFriends });
}

/**
 * Realtime listener for incoming pending friend requests.
 * Returns unsubscribe.
 */
export function listenToIncomingRequests(myUid, callback) {
    if (!myUid) return () => { };
    const q = query(
        collection(db, 'friendRequests'),
        where('toUid', '==', myUid),
        where('status', '==', 'pending')
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
}

/**
 * Realtime listener for outgoing pending requests (so sender can see "Request sent").
 */
export function listenToOutgoingRequests(myUid, callback) {
    if (!myUid) return () => { };
    const q = query(
        collection(db, 'friendRequests'),
        where('fromUid', '==', myUid),
        where('status', '==', 'pending')
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
}

/**
 * Load full profiles for my friends.
 * Returns [] on error.
 */
export async function loadFriendsProfiles(myUid) {
    if (!myUid) return [];
    const me = await loadUserDocument(myUid);
    const friendUids = Array.isArray(me?.friends) ? me.friends : [];
    if (!friendUids.length) return [];

    const profiles = await Promise.all(friendUids.map(async (fuid) => {
        try {
            const snap = await getDoc(doc(db, 'users', fuid));
            return snap.exists() ? { uid: fuid, ...snap.data() } : null;
        } catch {
            return null;
        }
    }));

    return profiles.filter(Boolean);
}

/* ============ LIVE CHESS (FRIEND GAMES) ============ */

const CHESS_GAMES = 'chessGames';
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Create a pending chess game with a friend.
 * Returns the gameId.
 */
export async function createFriendChessGame({
    myUid, myEmail, myName,
    friendUid, friendEmail, friendName,
    myColor = 'white',
    fen = START_FEN
}) {
    if (!myUid || !friendUid) throw new Error('Missing uid');
    const me = { uid: myUid, email: normalizeEmail(myEmail || ''), name: myName || 'Player' };
    const them = { uid: friendUid, email: normalizeEmail(friendEmail || ''), name: friendName || 'Friend' };
    const white = myColor === 'white' ? me : them;
    const black = myColor === 'black' ? me : them;

    const ref = await addDoc(collection(db, CHESS_GAMES), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'pending',
        white,
        black,
        inviterUid: myUid,
        invitedFriendUid: friendUid,
        fen,
        turn: 'w',
        moves: [],
        result: null,
        resultReason: null,
        drawOfferFrom: null
    });

    // Notify the friend via a field on their user doc
    await updateDoc(doc(db, 'users', friendUid), {
        pendingChessGameId: ref.id
    });

    return ref.id;
}

export async function acceptFriendChessGame(gameId, myUid) {
    await updateDoc(doc(db, CHESS_GAMES, gameId), {
        status: 'active',
        updatedAt: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', myUid), {
        pendingChessGameId: null
    });
}

export async function abortFriendChessGame(gameId, myUid) {
    await updateDoc(doc(db, CHESS_GAMES, gameId), {
        status: 'aborted',
        updatedAt: serverTimestamp()
    });
    if (myUid) {
        try {
            await updateDoc(doc(db, 'users', myUid), { pendingChessGameId: null });
        } catch { }
    }
}

/**
 * Push one move to a live game.
 * { from, to, promo, san, fen, turn } — turn is the *next* side to move.
 */
export async function pushChessMove(gameId, { from, to, promo, san, fen, turn, by }) {
    await updateDoc(doc(db, CHESS_GAMES, gameId), {
        fen,
        turn,
        moves: arrayUnion({
            from, to,
            promo: promo || null,
            san: san || '',
            by: by || null,
            at: Date.now()
        }),
        updatedAt: serverTimestamp()
    });
}

export async function finishChessGame(gameId, { result, reason }) {
    await updateDoc(doc(db, CHESS_GAMES, gameId), {
        status: 'finished',
        result,
        resultReason: reason,
        updatedAt: serverTimestamp()
    });
}

export async function offerChessDraw(gameId, fromUid) {
    await updateDoc(doc(db, CHESS_GAMES, gameId), {
        drawOfferFrom: fromUid,
        updatedAt: serverTimestamp()
    });
}

export async function clearChessDrawOffer(gameId) {
    await updateDoc(doc(db, CHESS_GAMES, gameId), {
        drawOfferFrom: null,
        updatedAt: serverTimestamp()
    });
}

export function listenToChessGame(gameId, callback) {
    if (!gameId) return () => { };
    return onSnapshot(doc(db, CHESS_GAMES, gameId), (snap) => {
        callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
}

export function listenToMyChessInvites(myUid, callback) {
    if (!myUid) return () => { };
    const q = query(
        collection(db, CHESS_GAMES),
        where('invitedFriendUid', '==', myUid),
        where('status', '==', 'pending')
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
}

/**
 * Recent finished games between me and my friends — for stats on streak.html etc.
 */
export async function loadMyRecentChessResults(myUid, max = 20) {
    if (!myUid) return [];
    const q = query(
        collection(db, CHESS_GAMES),
        where('status', '==', 'finished'),
        orderBy('updatedAt', 'desc'),
        limit(max)
    );
    const snap = await getDocs(q);
    const games = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((g) =>
            g.white?.uid === myUid || g.black?.uid === myUid
        );
    return games;
}

/* ============ LEARNING PROGRESS ============ */

export async function saveLearningProgress(courseId, lessonId, payload = {}) {
    const user = auth.currentUser;
    if (!user || isGuestMode()) {
        const profile = loadLocalProfile();
        const courseIndex = profile.courses.findIndex((course) => course.id === courseId);
        const courseData = courseIndex >= 0 ? profile.courses[courseIndex] : { id: courseId, lessons: [] };
        const lessonIndex = courseData.lessons?.findIndex((lesson) => lesson.id === lessonId) ?? -1;

        if (!courseData.lessons) courseData.lessons = [];
        const lessonEntry = { id: lessonId, ...payload, updatedAt: new Date().toISOString() };

        if (lessonIndex >= 0) {
            courseData.lessons[lessonIndex] = { ...courseData.lessons[lessonIndex], ...lessonEntry };
        } else {
            courseData.lessons.push(lessonEntry);
        }

        if (courseIndex >= 0) profile.courses[courseIndex] = courseData;
        else profile.courses.push(courseData);

        saveLocalProfile(profile);
        return profile;
    }

    const ref = doc(db, 'users', user.uid);
    const existing = await loadUserDocument(user.uid);
    const profile = { ...(existing || loadLocalProfile()) };
    const courses = Array.isArray(profile.courses) ? profile.courses : [];
    const courseIndex = courses.findIndex((course) => course.id === courseId);
    const courseData = courseIndex >= 0 ? courses[courseIndex] : { id: courseId, lessons: [] };

    if (!Array.isArray(courseData.lessons)) courseData.lessons = [];

    const lessonIndex = courseData.lessons.findIndex((lesson) => lesson.id === lessonId);
    const lessonEntry = { id: lessonId, ...payload, updatedAt: new Date().toISOString() };

    if (lessonIndex >= 0) courseData.lessons[lessonIndex] = { ...courseData.lessons[lessonIndex], ...lessonEntry };
    else courseData.lessons.push(lessonEntry);

    if (courseIndex >= 0) courses[courseIndex] = courseData;
    else courses.push(courseData);

    profile.courses = courses;
    await updateDoc(ref, { courses, updatedAt: serverTimestamp() });
    saveLocalProfile(profile);
    return profile;
}

export default app;
