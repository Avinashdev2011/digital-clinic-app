import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDsytPvEMDc6HCJyNNl05oYouqCXzTjvFQ",
    authDomain: "virtual-clinic-db.firebaseapp.com",
    projectId: "virtual-clinic-db",
    storageBucket: "virtual-clinic-db.appspot.com",
    messagingSenderId: "53414902097",
    appId: "1:53414902097:web:37cd76615b8f737a18bb70"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set auth persistence
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

export { auth, db };