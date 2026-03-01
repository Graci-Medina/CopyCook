import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDg3sYf5YBDV7ygDfF-aK_ookkQ-7SBjvk",
    authDomain: "copycook-f596a.firebaseapp.com",
    projectId: "copycook-f596a",
    storageBucket: "copycook-f596a.firebasestorage.app",
    messagingSenderId: "366122548728",
    appId: "1:366122548728:web:b4300be3464e7e07822a0d",
    measurementId: "G-P41J5BYDR0"
  };



const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);