import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { auth, db } from './config';

// Colección para los viajes
const TRIPS_COLLECTION = 'trips';

// Guardar un nuevo viaje
export const saveTrip = async (tripData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const tripWithUser = {
      ...tripData,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('🟡 Guardando viaje en Firestore...');
    const docRef = await addDoc(collection(db, TRIPS_COLLECTION), tripWithUser);
    console.log('🟢 Viaje guardado con ID:', docRef.id);
    
    return { id: docRef.id, ...tripWithUser };
  } catch (error) {
    console.error('❌ Error guardando viaje:', error);
    throw error;
  }
};

// Obtener todos los viajes del usuario actual
export const getUserTrips = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const q = query(
      collection(db, TRIPS_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const trips = [];
    
    querySnapshot.forEach((doc) => {
      trips.push({ id: doc.id, ...doc.data() });
    });

    console.log('🟢 Viajes obtenidos:', trips.length);
    return trips;
  } catch (error) {
    console.error('❌ Error obteniendo viajes:', error);
    throw error;
  }
};

// Actualizar un viaje existente
export const updateTrip = async (tripId, tripData) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    await updateDoc(tripRef, {
      ...tripData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error actualizando viaje:', error);
    throw error;
  }
};

// Eliminar un viaje
export const deleteTrip = async (tripId) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    await deleteDoc(tripRef);
  } catch (error) {
    console.error('Error eliminando viaje:', error);
    throw error;
  }
};

// Obtener un viaje específico
export const getTripById = async (tripId) => {
  try {
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (tripDoc.exists()) {
      return { id: tripDoc.id, ...tripDoc.data() };
    } else {
      throw new Error('Viaje no encontrado');
    }
  } catch (error) {
    console.error('Error obteniendo viaje:', error);
    throw error;
  }
};