// moveService.js
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

// Colección para las mudanzas
const MOVES_COLLECTION = 'mudanzas';
const BOXES_SUBCOLLECTION = 'cajas';

// Guardar una nueva mudanza
export const saveMove = async (moveData) => {
  try {
    // ✅ VERIFICACIÓN MEJORADA
    if (!auth) {
      console.error('❌ Auth no está definido en moveService');
      throw new Error('Error de configuración: Auth no disponible');
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const moveWithUser = {
      ...moveData,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('🟡 Guardando mudanza en Firestore...');
    console.log('👤 User ID:', user.uid);
    console.log('📝 Datos de la mudanza:', {
      moveName: moveData.moveName,
      origin: moveData.origin,
      destination: moveData.destination,
      moveDate: moveData.moveDate
    });
    
    // ✅ VERIFICACIÓN EXPLÍCITA DE LA COLECCIÓN
    const movesCollection = collection(db, MOVES_COLLECTION);
    console.log('📂 Intentando guardar en colección:', MOVES_COLLECTION);
    
    const docRef = await addDoc(movesCollection, moveWithUser);
    
    console.log('🟢 ✅ MUDANZA GUARDADA EXITOSAMENTE');
    console.log('📄 ID del documento:', docRef.id);
    console.log('🎉 Mudanza guardada correctamente en Firestore');
    
    return { id: docRef.id, ...moveWithUser };
  } catch (error) {
    console.error('❌ ERROR CRÍTICO guardando mudanza:', error);
    console.error('🔍 Detalles del error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // ✅ MENSAJES DE ERROR ESPECÍFICOS
    let errorMessage = 'Error al guardar la mudanza';
    
    if (error.code === 'failed-precondition') {
      errorMessage = 'La colección no existe. Por favor crea la colección "mudanzas" en Firestore Console.';
    } else if (error.code === 'permission-denied') {
      errorMessage = 'No tienes permisos para escribir en Firestore. Verifica las reglas de seguridad.';
    } else if (error.code === 'not-found') {
      errorMessage = 'La colección "mudanzas" no existe. Crea la colección en Firebase Console.';
    } else if (error.code === 'unavailable') {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    } else if (error.message.includes('auth')) {
      errorMessage = 'Error de autenticación. Vuelve a iniciar sesión.';
    }
    
    throw new Error(errorMessage);
  }
};
// En firebase/moveService.js, agrega esta función:

// ✅ FUNCIÓN: Obtener TODOS los elementos del usuario (viajes + mudanzas)
export const getAllUserItems = async () => {
  try {
    console.log('🟡 Buscando todos los elementos del usuario...');
    
    // Importar dinámicamente para evitar dependencias circulares
    const { getUserTrips } = await import('./tripService');
    
    // Obtener viajes y mudanzas en paralelo
    const [trips, moves] = await Promise.all([
      getUserTrips().catch(() => []),
      getUserMoves().catch(() => [])
    ]);
    
    console.log('📋 Viajes encontrados:', trips.length);
    console.log('📋 Mudanzas encontradas:', moves.length);
    
    // Combinar y agregar tipo para diferenciar
    const allItems = [
      ...trips.map(trip => ({ ...trip, itemType: 'trip' })),
      ...moves.map(move => ({ ...move, itemType: 'move' }))
    ];
    
    // Ordenar por fecha de creación (más recientes primero)
    allItems.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
    
    console.log('🟢 Total elementos encontrados:', allItems.length);
    return allItems;
    
  } catch (error) {
    console.error('❌ Error obteniendo todos los elementos:', error);
    return [];
  }
};

// Guardar una caja en una mudanza
export const saveBox = async (moveId, boxData) => {
  try {
    console.log('🟡 Guardando caja para mudanza:', moveId);

    // Verificar que el usuario esté autenticado
    if (!auth) {
      throw new Error('Error de configuración: Auth no disponible');
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Referencia a la subcolección 'cajas' de la mudanza
    const boxesRef = collection(db, MOVES_COLLECTION, moveId, BOXES_SUBCOLLECTION);
    
    const boxWithData = {
      ...boxData,
      userId: user.uid, // Asignar el usuario actual
      moveId: moveId,   // Referencia a la mudanza padre
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Eliminar el campo 'id' si existe, ya que Firestore lo generará automáticamente
    delete boxWithData.id;

    const docRef = await addDoc(boxesRef, boxWithData);
    console.log('🟢 Caja guardada con ID:', docRef.id);
    
    return { id: docRef.id, ...boxWithData };
  } catch (error) {
    console.error('❌ Error guardando caja:', error);
    
    let errorMessage = 'Error al guardar la caja';
    
    if (error.code === 'permission-denied') {
      errorMessage = 'No tienes permisos para escribir en Firestore. Verifica las reglas de seguridad.';
    } else if (error.code === 'not-found') {
      errorMessage = 'La mudanza no existe.';
    } else if (error.code === 'unavailable') {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    }
    
    throw new Error(errorMessage);
  }
};

// Obtener todas las cajas de una mudanza
export const getBoxesByMove = async (moveId) => {
  try {
    console.log('🟡 Obteniendo cajas para mudanza:', moveId);

    const boxesRef = collection(db, MOVES_COLLECTION, moveId, BOXES_SUBCOLLECTION);
    const q = query(boxesRef, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const boxes = [];
    
    querySnapshot.forEach((doc) => {
      boxes.push({ id: doc.id, ...doc.data() });
    });

    console.log('🟢 Cajas obtenidas:', boxes.length);
    return boxes;
  } catch (error) {
    console.error('❌ Error obteniendo cajas:', error);
    throw error;
  }
};

// Obtener todas las mudanzas del usuario actual
export const getUserMoves = async () => {
  try {
    if (!auth) {
      throw new Error('Error de configuración: Auth no disponible');
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('🟡 Obteniendo mudanzas para usuario:', user.uid);

    const q = query(
      collection(db, MOVES_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const moves = [];
    
    querySnapshot.forEach((doc) => {
      moves.push({ id: doc.id, ...doc.data() });
    });

    console.log('🟢 Mudanzas obtenidas:', moves.length);
    return moves;
  } catch (error) {
    console.error('❌ Error obteniendo mudanzas:', error);
    
    if (error.code === 'failed-precondition') {
      throw new Error('La colección "mudanzas" no existe. Crea la colección en Firebase Console.');
    }
    
    throw error;
  }
};

// Actualizar una mudanza existente
export const updateMove = async (moveId, moveData) => {
  try {
    console.log('🟡 Actualizando mudanza:', moveId);
    
    const moveRef = doc(db, MOVES_COLLECTION, moveId);
    await updateDoc(moveRef, {
      ...moveData,
      updatedAt: new Date()
    });
    
    console.log('🟢 Mudanza actualizada correctamente');
  } catch (error) {
    console.error('❌ Error actualizando mudanza:', error);
    throw error;
  }
};

// Eliminar una mudanza
export const deleteMove = async (moveId) => {
  try {
    console.log('🟡 Eliminando mudanza:', moveId);
    
    const moveRef = doc(db, MOVES_COLLECTION, moveId);
    await deleteDoc(moveRef);
    
    console.log('🟢 Mudanza eliminada correctamente');
  } catch (error) {
    console.error('❌ Error eliminando mudanza:', error);
    throw error;
  }
};

// Obtener una mudanza específica
export const getMoveById = async (moveId) => {
  try {
    console.log('🟡 Obteniendo mudanza:', moveId);
    
    const moveRef = doc(db, MOVES_COLLECTION, moveId);
    const moveDoc = await getDoc(moveRef);
    
    if (moveDoc.exists()) {
      console.log('🟢 Mudanza encontrada');
      return { id: moveDoc.id, ...moveDoc.data() };
    } else {
      console.log('❌ Mudanza no encontrada');
      throw new Error('Mudanza no encontrada');
    }
  } catch (error) {
    console.error('❌ Error obteniendo mudanza:', error);
    throw error;
  }
};

// Actualizar una caja existente
export const updateBox = async (moveId, boxId, boxData) => {
  try {
    console.log('🟡 Actualizando caja:', boxId, 'en mudanza:', moveId);
    
    const boxRef = doc(db, MOVES_COLLECTION, moveId, BOXES_SUBCOLLECTION, boxId);
    await updateDoc(boxRef, {
      ...boxData,
      updatedAt: new Date()
    });
    
    console.log('🟢 Caja actualizada correctamente');
  } catch (error) {
    console.error('❌ Error actualizando caja:', error);
    throw error;
  }
};

// Eliminar una caja
export const deleteBox = async (moveId, boxId) => {
  try {
    console.log('🟡 Eliminando caja:', boxId, 'de mudanza:', moveId);
    
    const boxRef = doc(db, MOVES_COLLECTION, moveId, BOXES_SUBCOLLECTION, boxId);
    await deleteDoc(boxRef);
    
    console.log('🟢 Caja eliminada correctamente');
  } catch (error) {
    console.error('❌ Error eliminando caja:', error);
    throw error;
  }
};

// Obtener una caja específica
export const getBoxById = async (moveId, boxId) => {
  try {
    console.log('🟡 Obteniendo caja:', boxId, 'de mudanza:', moveId);
    
    const boxRef = doc(db, MOVES_COLLECTION, moveId, BOXES_SUBCOLLECTION, boxId);
    const boxDoc = await getDoc(boxRef);
    
    if (boxDoc.exists()) {
      console.log('🟢 Caja encontrada');
      return { id: boxDoc.id, ...boxDoc.data() };
    } else {
      console.log('❌ Caja no encontrada');
      throw new Error('Caja no encontrada');
    }
  } catch (error) {
    console.error('❌ Error obteniendo caja:', error);
    throw error;
  }
};

// Verificar conexión con Firestore (específico para mudanzas)
export const checkFirestoreConnection = async () => {
  try {
    console.log('🔍 Verificando conexión con Firestore para mudanzas...');
    
    if (!db) {
      throw new Error('Firestore no está inicializado');
    }
    
    // Intentar una operación simple de lectura
    const testQuery = query(collection(db, MOVES_COLLECTION), where('userId', '==', 'test'));
    await getDocs(testQuery);
    
    console.log('✅ Conexión con Firestore para mudanzas: OK');
    return true;
  } catch (error) {
    console.log('❌ Conexión con Firestore para mudanzas: FALLÓ', error);
    return false;
  }
};

// Obtener estadísticas de una mudanza (contar cajas, etc.)
export const getMoveStats = async (moveId) => {
  try {
    console.log('🟡 Obteniendo estadísticas para mudanza:', moveId);
    
    // Obtener las cajas de la mudanza
    const boxes = await getBoxesByMove(moveId);
    
    // Calcular estadísticas
    const stats = {
      totalBoxes: boxes.length,
      boxesByStatus: {},
      boxesByRoom: {},
      totalItems: 0,
      fragileBoxes: 0,
      heavyBoxes: 0
    };
    
    boxes.forEach(box => {
      // Contar por estado
      const status = box.status || 'pending';
      stats.boxesByStatus[status] = (stats.boxesByStatus[status] || 0) + 1;
      
      // Contar por habitación
      const room = box.room || 'other';
      stats.boxesByRoom[room] = (stats.boxesByRoom[room] || 0) + 1;
      
      // Contar items totales
      if (box.items && Array.isArray(box.items)) {
        stats.totalItems += box.items.length;
      }
      
      // Contar cajas frágiles
      if (box.isFragile) {
        stats.fragileBoxes += 1;
      }
      
      // Contar cajas pesadas (ejemplo: peso > 20kg)
      if (box.weight && box.weight > 20) {
        stats.heavyBoxes += 1;
      }
    });
    
    console.log('🟢 Estadísticas obtenidas:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
};