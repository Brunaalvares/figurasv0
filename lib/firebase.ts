import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyD995cU7-SuyTbAME9W8SMrloSvhWRLTbo",
  authDomain: "sistema-figuras.firebaseapp.com",
  projectId: "sistema-figuras",
  storageBucket: "sistema-figuras.firebasestorage.app",
  messagingSenderId: "110106643382",
  appId: "1:110106643382:web:aa07266b28d17a939a4f17",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
