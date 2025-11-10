import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // nuevo, para almacenamiento
import firebaseConfig from "./config";

import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Evitar múltiples inicializaciones (por hot reload en Expo)
// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const app =  initializeApp(firebaseConfig);

const storage = getStorage(app); // nuevo, para almacenamiento

// ✅ Auth con persistencia en React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// ✅ Firestore
const db = getFirestore(app);

export { auth, db, storage };