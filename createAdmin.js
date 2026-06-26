import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0714545458",
  appId: "1:1016052928963:web:78cb16108e90e326d92d76",
  apiKey: "AIzaSyDwGfdNlH6HrWRH4h9OaRW-fHLLmJz3R3c",
  authDomain: "gen-lang-client-0714545458.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-9401913b-d80d-49ae-a4dd-7554bc0bede9");

async function run() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'admin@paauv.system', 'admin123');
    await setDoc(doc(db, 'users', cred.user.uid), {
      username: 'admin',
      name: 'Administrador',
      role: 'admin',
      createdAt: new Date()
    });
    console.log("Admin created successfully!");
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit();
}
run();
