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

    const tripWithUser = {
      ...tripData,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('🟡 Guardando viaje en Firestore...');
    console.log('👤 User ID:', user.uid);
    console.log('📝 Datos del viaje:', {
      tripName: tripData.tripName,
      destination: tripData.destination,
      itemsCount: tripData.items ? tripData.items.length : 0
    });
    
    // ✅ VERIFICACIÓN EXPLÍCITA DE LA COLECCIÓN
    const tripsCollection = collection(db, TRIPS_COLLECTION);
    console.log('📂 Intentando guardar en colección:', TRIPS_COLLECTION);
    
    const docRef = await addDoc(tripsCollection, tripWithUser);
    
    console.log('🟢 ✅ VIAJE GUARDADO EXITOSAMENTE');
    console.log('📄 ID del documento:', docRef.id);
    console.log('🎉 Viaje guardado correctamente en Firestore');
    
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
    
    const tripRef = doc(db, TRIPS_COLLECTION, tripId);
    await updateDoc(tripRef, {
      ...tripData,
      updatedAt: new Date()
    });
    
    console.log('🟢 Viaje actualizado correctamente');
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