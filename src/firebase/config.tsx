import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBC3MTssV5lPRkkuf2Sct_UtGjWX1PfYzk",
  authDomain: "celeone-e5843.firebaseapp.com",
  projectId: "celeone-e5843",
  storageBucket: "celeone-e5843.firebasestorage.app",
  messagingSenderId: "275960060318",
  appId: "1:275960060318:web:489485dc1e2be2c1eade8f",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
