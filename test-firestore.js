// Test simple para verificar conexión a Firestore
require('dotenv').config({ path: '.env.local' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Configuración de Firebase (deberíamos usar la misma que en el proyecto)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('Config Firebase:', firebaseConfig);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirestore() {
  try {
    console.log('Intentando conectar a Firestore...');
    const snapshot = await getDocs(collection(db, 'pre-clientes'));
    console.log('Conexión exitosa!');
    console.log('Documentos encontrados:', snapshot.size);
    
    snapshot.docs.forEach(doc => {
      console.log(`Doc ID: ${doc.id}, Data:`, doc.data());
    });
  } catch (error) {
    console.error('Error conectando a Firestore:', error);
  }
}

testFirestore();
