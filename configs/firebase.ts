// configs/firebase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyBgqr44GBMaxbLAjWlmAZA10RfRv-yjCUM",
  authDomain: "bookcollector-c1395.firebaseapp.com",
  projectId: "bookcollector-c1395",
  storageBucket: "bookcollector-c1395.firebasestorage.app",
  messagingSenderId: "817294318931",
  appId: "1:817294318931:web:e45214c8f039f0101c15a6",
  measurementId: "G-ESHJ6K0JP1"
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

import type { Auth } from "firebase/auth";
let auth: Auth;
if (Platform.OS === "web") {
    auth = getAuth(app);           // เว็บใช้ getAuth ปกติ
} else {
    try {
        auth = initializeAuth(app, { // Native ต้อง initializeAuth + persistence
            persistence: getReactNativePersistence(AsyncStorage),
        });
    } catch {
        auth = getAuth(app);         // กัน fast refresh เรียกซ้ำ
    }
}


const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };



