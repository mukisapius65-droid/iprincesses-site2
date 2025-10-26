// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBew9lr38dVJj_T7qpdvNWvATJeder5tjU",
  authDomain: "iprincesses3.firebaseapp.com",
  projectId: "iprincesses3",
  storageBucket: "iprincesses3.firebasestorage.app",
  messagingSenderId: "215534469686",
  appId: "1:215534469686:web:7ab0d356105efeb015ce97",
  measurementId: "G-RZQKK5QKHF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
