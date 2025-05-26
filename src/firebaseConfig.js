// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth'; // 👈 Lägg till detta
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8RB2zhcoeWQpPtBJQ78erQLPXNwmqe_M",
  authDomain: "peoplemeet-2b16f.firebaseapp.com",
  projectId: "peoplemeet-2b16f",
  storageBucket: "peoplemeet-2b16f.firebasestorage.app",
  messagingSenderId: "372843933204",
  appId: "1:372843933204:web:fe3ca4d2eb564ddc598101",
  measurementId: "G-2LWL0GQZRG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app); // 👈 Lägg till
const auth = getAuth(app); // 👈 Lägg till detta

export { db, storage, auth }; // 👈 Exportera auth



