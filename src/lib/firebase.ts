import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0714545458",
  appId: "1:1016052928963:web:78cb16108e90e326d92d76",
  apiKey: "AIzaSyDwGfdNlH6HrWRH4h9OaRW-fHLLmJz3R3c",
  authDomain: "gen-lang-client-0714545458.firebaseapp.com",
  storageBucket: "gen-lang-client-0714545458.firebasestorage.app",
  messagingSenderId: "1016052928963",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-9401913b-d80d-49ae-a4dd-7554bc0bede9");
