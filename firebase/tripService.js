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
import { auth, db } from './auth';
import { geocodeTripDestination } from './geocodingService';

// Colección para los viajes
const TRIPS_COLLECTION = 'trips';

// Guardar un nuevo viaje
export const saveTrip = async (tripData) => {
  try {
    // ✅ VERIFICACIÓN MEJORADA
    if (!auth) {
      console.error('❌ Auth no está definido en tripService');
      throw new Error('Error de configuración: Auth no disponible');
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // 1. GEOPOCODIFICAR DESTINO
    console.log('📍 Geocodificando destino del viaje...');
    const destinationCoords = await geocodeTripDestination(tripData.destination);

    // 2. CREAR OBJETO CON COORDENADAS
     const tripWithUser = {
      ...tripData,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Añadir coordenadas de destino si existen
      ...(tripData.destinationCoords && { destinationCoords: tripData.destinationCoords })
    };

    console.log('🟡 Guardando viaje en Firestore...');
    console.log('👤 User ID:', user.uid);
    console.log('📍 Coordenadas del destino:', 
      destinationCoords 
        ? `${destinationCoords.latitude}, ${destinationCoords.longitude}`
        : 'No disponible'
    );
    console.log('📝 Datos del viaje:', {
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate
    });
    
    // 3. GUARDAR EN FIRESTORE
    const tripsCollection = collection(db, TRIPS_COLLECTION);
    console.log('📂 Intentando guardar en colección:', TRIPS_COLLECTION);
    
    const docRef = await addDoc(tripsCollection, tripWithUser);
    
    console.log('🟢 ✅ VIAJE GUARDADO CON COORDENADAS');
    console.log('📄 ID del documento:', docRef.id);
    
    return { id: docRef.id, ...tripWithUser };
  } catch (error) {
    console.error('❌ ERROR CRÍTICO guardando viaje:', error);
    console.error('🔍 Detalles del error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // ✅ MENSAJES DE ERROR ESPECÍFICOS
    let errorMessage = 'Error al guardar el viaje';
    
    if (error.code === 'failed-precondition') {
      errorMessage = 'La colección no existe. Por favor crea la colección "trips" en Firestore Console.';
    } else if (error.code === 'permission-denied') {
      errorMessage = 'No tienes permisos para escribir en Firestore. Verifica las reglas de seguridad.';
    } else if (error.code === 'not-found') {
      errorMessage = 'La colección "trips" no existe. Crea la colección en Firebase Console.';
    } else if (error.code === 'unavailable') {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    } else if (error.message.includes('auth')) {
      errorMessage = 'Error de autenticación. Vuelve a iniciar sesión.';
    }
    
    throw new Error(errorMessage);
  }
};

// Guardar una maleta en un viaje
export const saveMaleta = async (tripId, maletaData) => {
  try {
    console.log('🟡 Guardando maleta para viaje:', tripId);

    // Verificar que el usuario esté autenticado
    if (!auth) {
      throw new Error('Error de configuración: Auth no disponible');
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Referencia a la subcolección 'maletas' del viaje
    const maletasRef = collection(db, 'trips', tripId, 'maletas');
    
    const maletaConData = {
      ...maletaData,
      userId: user.uid, // Asignar el usuario actual
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Eliminar el campo 'id' si existe, ya que Firestore lo generará automáticamente
    delete maletaConData.id;

    const docRef = await addDoc(maletasRef, maletaConData);
    console.log('🟢 Maleta guardada con ID:', docRef.id);
    
    return { id: docRef.id, ...maletaConData };
  } catch (error) {
    console.error('❌ Error guardando maleta:', error);
    
    let errorMessage = 'Error al guardar la maleta';
    
    if (error.code === 'permission-denied') {
      errorMessage = 'No tienes permisos para escribir en Firestore. Verifica las reglas de seguridad.';
    } else if (error.code === 'not-found') {
      errorMessage = 'El viaje no existe.';
    } else if (error.code === 'unavailable') {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    }
    
    throw new Error(errorMessage);
  }
};

// Obtener todas las maletas de un viaje
export const getMaletasByTrip = async (tripId) => {
  try {
    console.log('🟡 Obteniendo maletas para viaje:', tripId);

    const maletasRef = collection(db, 'trips', tripId, 'maletas');
    const q = query(maletasRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const maletas = [];
    
    querySnapshot.forEach((doc) => {
      maletas.push({ id: doc.id, ...doc.data() });
    });

    console.log('🟢 Maletas obtenidas:', maletas.length);
    return maletas;
  } catch (error) {
    console.error('❌ Error obteniendo maletas:', error);
    throw error;
  }
};

// Obtener todos los viajes del usuario actual
export const getUserTrips = async () => {
  try {
    if (!auth) {
      throw new Error('Error de configuración: Auth no disponible');
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('🟡 Obteniendo viajes para usuario:', user.uid);

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
    
    if (error.code === 'failed-precondition') {
      throw new Error('La colección "trips" no existe. Crea la colección en Firebase Console.');
    }
    
    throw error;
  }
};

// Actualizar un viaje existente
export const updateTrip = async (tripId, tripData) => {
  try {
    console.log('🟡 Actualizando viaje:', tripId);
    
    // Si se actualiza el destino, geocodificar nuevamente
    let coordinatesToUpdate = {};
    
    if (tripData.destination) {
      console.log('📍 Geocodificando destino actualizado...');
      
      const destinationCoords = await geocodeTripDestination(tripData.destination);
      
      if (destinationCoords) {
        coordinatesToUpdate.destinationCoords = destinationCoords;
      }
    }
    
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    await updateDoc(tripRef, {
      ...tripData,
      ...coordinatesToUpdate,
      updatedAt: new Date()
    });
    
    console.log('🟢 Viaje actualizado correctamente con coordenadas');
  } catch (error) {
    console.error('❌ Error actualizando viaje:', error);
    throw error;
  }
};

// Eliminar un viaje
export const deleteTrip = async (tripId) => {
  try {
    console.log('🟡 Eliminando viaje:', tripId);
    
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    await deleteDoc(tripRef);
    
    console.log('🟢 Viaje eliminado correctamente');
  } catch (error) {
    console.error('❌ Error eliminando viaje:', error);
    throw error;
  }
};

// Obtener un viaje específico
export const getTripById = async (tripId) => {
  try {
    console.log('🟡 Obteniendo viaje:', tripId);
    
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    const tripDoc = await getDoc(tripRef);
    
    if (tripDoc.exists()) {
      console.log('🟢 Viaje encontrado');
      return { id: tripDoc.id, ...tripDoc.data() };
    } else {
      console.log('❌ Viaje no encontrado');
      throw new Error('Viaje no encontrado');
    }
  } catch (error) {
    console.error('❌ Error obteniendo viaje:', error);
    throw error;
  }
};

// Verificar conexión con Firestore
export const checkFirestoreConnection = async () => {
  try {
    console.log('🔍 Verificando conexión con Firestore...');
    
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }
    
    // Intentar una operación simple de lectura
    const testQuery = query(collection(db, TRIPS_COLLECTION), where('userId', '==', 'test'));
    await getDocs(testQuery);
    
    console.log('✅ Conexión con Firestore: OK');
    return true;
  } catch (error) {
    console.log('❌ Conexión con Firestore: FALLÓ', error);
    return false;
  }
};
 // Obtener coordenadas de un viaje (útil para mapas)
export const getTripCoordinates = async (tripId) => {
  try {
    console.log('📍 Obteniendo coordenadas del viaje:', tripId);
    
    const trip = await getTripById(tripId);
    
    if (!trip.destinationCoords) {
      console.log('⚠️ El viaje no tiene coordenadas guardadas');
      
      // Si no tiene coordenadas pero tiene destino, geocodificar y guardar
      if (trip.destination) {
        console.log('📍 Geocodificando destino para obtener coordenadas...');
        const destinationCoords = await geocodeTripDestination(trip.destination);
        
        if (destinationCoords) {
          // Actualizar el viaje con las nuevas coordenadas
          await updateDoc(doc(db, TRIPS_COLLECTION, tripId), {
            destinationCoords,
            updatedAt: new Date()
          });
          
          return {
            destination: trip.destination,
            destinationCoords
          };
        }
      }
      
      return {
        destination: trip.destination,
        destinationCoords: null
      };
    }
    
    return {
      destination: trip.destination,
      destinationCoords: trip.destinationCoords
    };
  } catch (error) {
    console.error('❌ Error obteniendo coordenadas del viaje:', error);
    return {
      destination: null,
      destinationCoords: null
    };
  }
};