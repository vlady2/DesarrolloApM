// firebase/luggageService.js
import {
    collection,
    getDocs,
    orderBy,
    query
} from 'firebase/firestore';
import { db } from './auth';

// Obtener todas las maletas de un viaje (desde la subcolección)
export const getLuggageByTripId = async (tripId) => {
  try {
    console.log('🟡 Buscando maletas para tripId:', tripId);
    
    // Acceder a la subcolección: trips/{tripId}/maletas
    const maletasRef = collection(db, 'trips', tripId, 'maletas');
    const q = query(maletasRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const luggageList = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📦 Maleta encontrada:', data);
      luggageList.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log('🟢 Total maletas encontradas:', luggageList.length, 'para tripId:', tripId);
    return luggageList;
  } catch (error) {
    console.error('❌ Error getting luggage for trip', tripId, ':', error);
    // Retornar array vacío en lugar de lanzar error
    return [];
  }
};