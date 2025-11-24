// firebase/config.js - CONFIGURACIÓN CORRECTA
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyCs6fYq57iK0RzQDdBNqKbdQggvo5MQ0EI",
  authDomain: "gmoviles-appfinal.firebaseapp.com",
  projectId: "gmoviles-appfinal",
  storageBucket: "gmoviles-appfinal.firebasestorage.app",
  messagingSenderId: "779603830349",
  appId: "1:779603830349:web:8308fa55b73cc95d4c5e04"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

export default firebaseConfig;
export { app };
