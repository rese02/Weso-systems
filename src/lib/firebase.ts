// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "hotelhub-central",
  "appId": "1:288471095468:web:d0c65390732d2b5ae8a709",
  "storageBucket": "hotelhub-central.firebasestorage.app",
  "apiKey": "AIzaSyD8qwf141kcBE1cadH6kkUs4ezM7hYCjLE",
  "authDomain": "hotelhub-central.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "288471095468"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
