// firebase/luggageService.js
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc // ✅ NUEVA IMPORTACIÓN
} from 'firebase/firestore';
import { db } from './auth';

// Obtener todas las maletas de un viaje (desde la subcolección)
export const getLuggageByTripId = async (tripId) => {
  try {
    

    // Acceder a la subcolección: trips/{tripId}/maletas
    const maletasRef = collection(db, 'trips', tripId, 'maletas');
    const q = query(maletasRef, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const luggageList = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      luggageList.push({
        id: doc.id,
        ...data
      });
    });

    
    return luggageList;
  } catch (error) {
    console.error('❌ Error getting luggage for trip', tripId, ':', error);
    // Retornar array vacío en lugar de lanzar error
    return [];
  }
};

// ✅ NUEVA FUNCIÓN: Obtener TODAS las maletas de TODOS los viajes del usuario
export const getAllUserLuggage = async () => {
  try {
    
    
    // Primero obtener todos los viajes del usuario
    const { getUserTrips } = await import('./tripService');
    const userTrips = await getUserTrips();
    
    console.log('📋 Viajes encontrados:', userTrips.length);
    
    // Obtener maletas de cada viaje
    const allLuggage = [];
    
    for (const trip of userTrips) {
      try {
        const tripLuggage = await getLuggageByTripId(trip.id);
        
        // Agregar información del viaje a cada maleta
        const luggageWithTripInfo = tripLuggage.map(luggage => ({
          ...luggage,
          tripId: trip.id,
          tripName: trip.purpose || trip.destination || 'Viaje sin nombre',
          tripDestination: trip.destination,
          tripDates: {
            start: trip.startDate,
            end: trip.endDate
          },
          tripType: trip.type || 'trips'
        }));
        
        allLuggage.push(...luggageWithTripInfo);
        
      } catch (error) {
        console.error(`❌ Error obteniendo maletas del viaje ${trip.id}:`, error);
      }
    }
    
    console.log('🟢 Total maletas encontradas en todos los viajes:', allLuggage.length);
    return allLuggage;
    
  } catch (error) {
    console.error('❌ Error obteniendo todas las maletas:', error);
    return [];
  }
};

// ✅ NUEVA FUNCIÓN: Eliminar una maleta
export const deleteLuggage = async (tripId, luggageId) => {
  try {
    console.log('🟡 Eliminando maleta:', luggageId, 'del viaje:', tripId);
    
    const luggageRef = doc(db, 'trips', tripId, 'maletas', luggageId);
    
    await deleteDoc(luggageRef);
    console.log('🟢 Maleta eliminada correctamente');
    
    return true;
  } catch (error) {
    console.error('❌ Error eliminando maleta:', error);
    throw error;
  }
};

// ✅ NUEVA FUNCIÓN: Actualizar una maleta existente
export const updateLuggage = async (tripId, luggageId, luggageData) => {
  try {
    console.log('🟡 Actualizando maleta:', luggageId, 'del viaje:', tripId);
    console.log('📝 Datos a actualizar:', luggageData);
    
    const luggageRef = doc(db, 'trips', tripId, 'maletas', luggageId);
    
    await updateDoc(luggageRef, {
      ...luggageData,
      updatedAt: new Date()
    });
    
    console.log('🟢 Maleta actualizada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error actualizando maleta:', error);
    throw error;
  }
};