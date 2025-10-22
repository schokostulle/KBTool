// firebase.js (ES Module)

// --- Firebase SDK ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// --- Konfiguration: HIER EINTRAGEN ---
const firebaseConfig = {
  apiKey: "AIzaSyAnrHCuag66za4uKAt_o76QCptpvYqvVNs",
  authDomain: "ik-tool.firebaseapp.com",
  projectId: "ik-tool",
  storageBucket: "ik-tool.firebasestorage.app",
  messagingSenderId: "212260982227",
  appId: "1:212260982227:web:84bfe35c83387c1879f326"
};

// --- Init ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// --- Utils ---
const fakeEmail = (name) =>
  name.trim().toLowerCase()
    .replace(/[ä]/g,"ae").replace(/[ö]/g,"oe").replace(/[ü]/g,"ue").replace(/[ß]/g,"ss")
    .replace(/[^\w]+/g,"_") + "@fake.local";

async function ensureUserDoc(user, name) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  // Ist dies der erste User?
  const usersSnap = await getDocs(collection(db, "users"));
  const isFirst = usersSnap.empty;

  const data = {
    name: name || user.displayName || "Unbekannt",
    role: isFirst ? "admin"  : "member",
    status: isFirst ? "active" : "pending"
  };
  await setDoc(ref, data);
  return data;
}

export async function login(name, pass){
  if(!name || !pass) throw new Error("Bitte Name & Passwort eingeben.");
  const email = fakeEmail(name);
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const uref = doc(db,"users",cred.user.uid);
  const u = await getDoc(uref);
  if(!u.exists()) throw new Error("Kein Benutzerprofil gefunden.");
  const d = u.data();
  if(d.status !== "active"){
    await signOut(auth);
    throw new Error("Dein Account ist noch nicht freigeschaltet.");
  }
  location.href = "dashboard.html";
}

export async function register(name, pass){
  if(!name || !pass) throw new Error("Bitte Name & Passwort eingeben.");
  const email = fakeEmail(name);
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const data = await ensureUserDoc(cred.user, name);
  if(data.status !== "active"){
    await signOut(auth);
    throw new Error("Registriert. Ein Admin muss dich freischalten.");
  }
  location.href = "dashboard.html";
}

export async function logout(){
  await signOut(auth);
  location.href = "index.html";
}

export function onIndexReady(){
  onAuthStateChanged(auth, async (user)=>{
    if(!user) return;
    const u = await getDoc(doc(db,"users",user.uid));
    if(u.exists() && u.data().status==="active"){
      location.href = "dashboard.html";
    }
  });
}

export async function protectDashboard(){
  return new Promise((resolve)=>{
    onAuthStateChanged(auth, async (user)=>{
      if(!user){ location.href="index.html"; return; }
      const u = await getDoc(doc(db,"users",user.uid));
      if(!u.exists()){ await signOut(auth); location.href="index.html"; return; }
      const d = u.data();
      if(d.status!=="active"){ await signOut(auth); location.href="index.html"; return; }
      resolve(true);
    });
  });
}

export async function getUserInfo(){
  const user = auth.currentUser;
  if(!user) return { name:"–", role:"–" };
  const u = await getDoc(doc(db,"users",user.uid));
  const d = u.exists()? u.data(): {name:"–",role:"–"};
  return { name:d.name, role:d.role };
}

export async function isAdmin(){
  const { role } = await getUserInfo();
  return role === "admin";
}

// --- Events (Ereignisse) ---
export async function loadEvents(){
  const q = query(collection(db,"events"), orderBy("timestamp","desc"));
  const s = await getDocs(q);
  const arr = [];
  s.forEach(d=> arr.push(d.data()));
  return arr;
}

// --- Theme ---
export function initTheme(rootEl){
  const saved = localStorage.getItem("bf-theme") || "dark";
  rootEl.setAttribute("data-theme", saved);
}
export function toggleTheme(rootEl){
  const now = rootEl.getAttribute("data-theme")==="dark" ? "light" : "dark";
  rootEl.setAttribute("data-theme", now);
  localStorage.setItem("bf-theme", now);
}