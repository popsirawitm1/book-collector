import {Platform} from "react-native";
import {initializeApp, getApps} from "firebase/app";
import {getAuth, initializeAuth, getReactNativePersistence} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

let auth;
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

export {app, auth};
