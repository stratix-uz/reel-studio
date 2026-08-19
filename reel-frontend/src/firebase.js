import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7-8QLRkvuBkT2OuDWJsRZuvZgECs6tvU",
  authDomain: "reel-studio-44e58.firebaseapp.com",
  projectId: "reel-studio-44e58",
  storageBucket: "reel-studio-44e58.firebasestorage.app",
  messagingSenderId: "477488503651",
  appId: "1:477488503651:web:3410c5fe8f5f369eb69156",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);