import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/**
 * Firebase Yapılandırması
 * Sağlanan google-services.json verileriyle %100 uyumludur.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBL5pq7eOGfBJNgVa73Gm5r8u1tCZmPpcw",
  authDomain: "siteyonetp.firebaseapp.com",
  projectId: "siteyonetp",
  storageBucket: "siteyonetp.firebasestorage.app",
  messagingSenderId: "195065788097",
  appId: "1:195065788097:android:c783facc76b19f260b8640",
  databaseURL: "https://siteyonetp-default-rtdb.firebaseio.com"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Servisleri dışa aktar
export const firestore = getFirestore(app);
export const auth = getAuth(app);