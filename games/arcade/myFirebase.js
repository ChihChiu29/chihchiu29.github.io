// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js'
import { getFirestore, doc, collection, addDoc, getDoc, getDocs, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmT6lI6u6lonVMuYgN8ur_OVTXMn6dsXc",
  authDomain: "fallingcats-564f2.firebaseapp.com",
  projectId: "fallingcats-564f2",
  storageBucket: "fallingcats-564f2.appspot.com",
  messagingSenderId: "658079935325",
  appId: "1:658079935325:web:dc5c4dd715fe7f5edbd6b4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const RECORD_NAME = 'fallingCatsHighScores';
const RECORD_KEY = 'highScores';
const docRecord = doc(db, RECORD_NAME, RECORD_KEY);

// window.qapp_readHighScores = async function readHighScores() {
//   return await getDocs(collection(db, RECORD_NAME)).then((result) => {
//     return result.docs[0].data().highScores;
//   });
// }

// See: https://firebase.google.com/docs/firestore/query-data/get-data
window.qapp_readHighScores = async function readHighScores() {
  return await getDoc(docRecord).then((result) => {
    const data = result.data();
    return data ? data[RECORD_KEY] : [];
  });
}

// window.qapp_writeHighScores = async function writeHighScore(highScores) {
//   return await addDoc(collection(db, RECORD_NAME), {
//     highScores: highScores,
//   });
// }

// See: https://firebase.google.com/docs/firestore/query-data/get-data
window.qapp_writeHighScores = async function writeHighScore(highScores) {
  return await setDoc(docRecord, {
    highScores: highScores,
  });
}
