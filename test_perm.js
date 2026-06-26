import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0714545458",
  appId: "1:1016052928963:web:78cb16108e90e326d92d76",
  apiKey: "AIzaSyDwGfdNlH6HrWRH4h9OaRW-fHLLmJz3R3c",
  authDomain: "gen-lang-client-0714545458.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-9401913b-d80d-49ae-a4dd-7554bc0bede9");

async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    console.log("Success! Found", querySnapshot.size, "users.");
    
    // Test write
    await addDoc(collection(db, "test_perm"), { test: 1 });
    console.log("Write success!");
  } catch (err) {
    console.error("Firebase Error:", err.message);
  }
}
run();
