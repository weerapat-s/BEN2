// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDc3VQLpzlSZAcfnMZYNk3msV4kDv0aBMc",
  authDomain: "ben2-71fd5.firebaseapp.com",
  databaseURL: "https://ben2-71fd5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ben2-71fd5",
  storageBucket: "ben2-71fd5.firebasestorage.app",
  messagingSenderId: "1076045314503",
  appId: "1:1076045314503:web:e97a01d3d24fc1b5a901e2",
  measurementId: "G-XC4NM9LY55"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider };
