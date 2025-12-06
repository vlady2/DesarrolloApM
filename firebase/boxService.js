// firebase/boxService.js
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore';
import { db } from './auth';

// Obtener todas las cajas de una mudanza (desde la subcolección)
export const getBoxesByMoveId = async (moveId) => {
  try {
    

    // Acceder a la subcolección: mudanzas/{moveId}/cajas
    const cajasRef = collection(db, 'mudanzas', moveId, 'cajas');
    const q = query(cajasRef, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const boxesList = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      boxesList.push({
        id: doc.id,
        ...data
      });
    });

    
    return boxesList;
  } catch (error) {
    console.error('❌ Error getting boxes for move', moveId, ':', error);
    // Retornar array vacío en lugar de lanzar error
    return [];
  }
};

// ✅ FUNCIÓN: Obtener TODAS las cajas de TODAS las mudanzas del usuario
export const getAllUserBoxes = async () => {
  try {
    
    
    // Primero obtener todas las mudanzas del usuario
    const { getUserMoves } = await import('./moveService');
    const userMoves = await getUserMoves();
    
    console.log('📋 Mudanzas encontradas:', userMoves.length);
    
    // Obtener cajas de cada mudanza
    const allBoxes = [];
    
    for (const move of userMoves) {
      try {
        const moveBoxes = await getBoxesByMoveId(move.id);
        
        // Agregar información de la mudanza a cada caja
        const boxesWithMoveInfo = moveBoxes.map(box => ({
          ...box,
          moveId: move.id,
          moveName: move.nombre || `${move.origin} → ${move.destination}`,
          moveOrigin: move.origin,
          moveDestination: move.destination,
          moveDate: move.moveDate,
          moveType: move.moveType || 'mudanza',
          moveNotes: move.notes
        }));
        
        allBoxes.push(...boxesWithMoveInfo);
        
      } catch (error) {
        console.error(`❌ Error obteniendo cajas de la mudanza ${move.id}:`, error);
      }
    }
    
    
    return allBoxes;
    
  } catch (error) {
    console.error('❌ Error obteniendo todas las cajas:', error);
    return [];
  }
};

// ✅ FUNCIÓN: Eliminar una caja
export const deleteBox = async (moveId, boxId) => {
  try {
    console.log('🟡 Eliminando caja:', boxId, 'de la mudanza:', moveId);
    
    const boxRef = doc(db, 'mudanzas', moveId, 'cajas', boxId);
    
    await deleteDoc(boxRef);
    console.log('🟢 Caja eliminada correctamente');
    
    return true;
  } catch (error) {
    console.error('❌ Error eliminando caja:', error);
    throw error;
  }
};

// ✅ FUNCIÓN: Actualizar una caja existente
export const updateBox = async (moveId, boxId, boxData) => {
  try {
    console.log('🟡 Actualizando caja:', boxId, 'de la mudanza:', moveId);
    console.log('📝 Datos a actualizar:', boxData);
    
    const boxRef = doc(db, 'mudanzas', moveId, 'cajas', boxId);
    
    await updateDoc(boxRef, {
      ...boxData,
      updatedAt: new Date()
    });
    
    console.log('🟢 Caja actualizada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error actualizando caja:', error);
    throw error;
  }
};

// ✅ FUNCIÓN: Obtener estadísticas de cajas de una mudanza
export const getMoveBoxesStats = async (moveId) => {
  try {
    
    
    const boxes = await getBoxesByMoveId(moveId);
    
    const stats = {
      totalBoxes: boxes.length,
      boxesByType: {},
      boxesByRoom: {},
      boxesByStatus: {},
      totalItems: 0,
      fragileBoxes: 0,
      heavyBoxes: 0,
      estimatedWeight: 0
    };
    
    boxes.forEach(box => {
      // Contar por tipo de caja
      const type = box.tipo || 'unknown';
      stats.boxesByType[type] = (stats.boxesByType[type] || 0) + 1;
      
      // Contar por habitación
      const room = box.habitacion || 'unknown';
      stats.boxesByRoom[room] = (stats.boxesByRoom[room] || 0) + 1;
      
      // Contar por estado
      const status = box.status || 'packed';
      stats.boxesByStatus[status] = (stats.boxesByStatus[status] || 0) + 1;
      
      // Contar items totales
      if (box.items && Array.isArray(box.items)) {
        stats.totalItems += box.items.length;
      }
      
      // Contar cajas frágiles
      if (box.isFragile) {
        stats.fragileBoxes += 1;
      }
      
      // Sumar peso estimado
      if (box.peso) {
        stats.estimatedWeight += parseFloat(box.peso) || 0;
        if (box.peso > 20) {
          stats.heavyBoxes += 1;
        }
      }
    });
    
  
    return stats;
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      totalBoxes: 0,
      boxesByType: {},
      boxesByRoom: {},
      boxesByStatus: {},
      totalItems: 0,
      fragileBoxes: 0,
      heavyBoxes: 0,
      estimatedWeight: 0
    };
  }
};

// ✅ FUNCIÓN: Obtener estadísticas globales de todas las mudanzas
export const getUserBoxesStats = async () => {
  try {
    
    
    const allBoxes = await getAllUserBoxes();
    
    const stats = {
      totalBoxes: allBoxes.length,
      totalMoves: new Set(allBoxes.map(box => box.moveId)).size,
      boxesByType: {},
      boxesByRoom: {},
      totalItems: 0,
      totalFragile: 0,
      totalWeight: 0,
      recentBoxes: allBoxes.slice(0, 5) // Últimas 5 cajas
    };
    
    allBoxes.forEach(box => {
      // Contar por tipo de caja
      const type = box.tipo || 'unknown';
      stats.boxesByType[type] = (stats.boxesByType[type] || 0) + 1;
      
      // Contar por habitación
      const room = box.habitacion || 'unknown';
      stats.boxesByRoom[room] = (stats.boxesByRoom[room] || 0) + 1;
      
      // Contar items totales
      if (box.items && Array.isArray(box.items)) {
        stats.totalItems += box.items.length;
      }
      
      // Contar cajas frágiles
      if (box.isFragile) {
        stats.totalFragile += 1;
      }
      
      // Sumar peso
      if (box.peso) {
        stats.totalWeight += parseFloat(box.peso) || 0;
      }
    });
    
    // Calcular promedios
    stats.avgBoxesPerMove = stats.totalMoves > 0 ? (stats.totalBoxes / stats.totalMoves).toFixed(1) : 0;
    stats.avgItemsPerBox = stats.totalBoxes > 0 ? (stats.totalItems / stats.totalBoxes).toFixed(1) : 0;
    
    
    return stats;
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas globales:', error);
    return {
      totalBoxes: 0,
      totalMoves: 0,
      boxesByType: {},
      boxesByRoom: {},
      totalItems: 0,
      totalFragile: 0,
      totalWeight: 0,
      avgBoxesPerMove: 0,
      avgItemsPerBox: 0,
      recentBoxes: []
    };
  }
};

// ✅ FUNCIÓN: Buscar cajas por término de búsqueda
export const searchBoxes = async (searchTerm) => {
  try {
    
    
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }
    
    const allBoxes = await getAllUserBoxes();
    const term = searchTerm.toLowerCase().trim();
    
    const filteredBoxes = allBoxes.filter(box => {
      // Buscar en nombre de la caja
      if (box.nombre && box.nombre.toLowerCase().includes(term)) {
        return true;
      }
      
      // Buscar en items
      if (box.items && Array.isArray(box.items)) {
        const foundInItems = box.items.some(item => {
          if (typeof item === 'string') {
            return item.toLowerCase().includes(term);
          } else if (item.nombre) {
            return item.nombre.toLowerCase().includes(term);
          }
          return false;
        });
        if (foundInItems) return true;
      }
      
      // Buscar en descripción
      if (box.descripcion && box.descripcion.toLowerCase().includes(term)) {
        return true;
      }
      
      // Buscar en habitación
      if (box.habitacion && box.habitacion.toLowerCase().includes(term)) {
        return true;
      }
      
      // Buscar en información de la mudanza
      if (box.moveOrigin && box.moveOrigin.toLowerCase().includes(term)) {
        return true;
      }
      
      if (box.moveDestination && box.moveDestination.toLowerCase().includes(term)) {
        return true;
      }
      
      return false;
    });
    
    
    return filteredBoxes;
    
  } catch (error) {
    console.error('❌ Error buscando cajas:', error);
    return [];
  }
};

// ✅ FUNCIÓN: Obtener cajas por habitación
export const getBoxesByRoom = async (room) => {
  try {
    
    
    const allBoxes = await getAllUserBoxes();
    
    const filteredBoxes = allBoxes.filter(box => 
      box.habitacion && box.habitacion.toLowerCase() === room.toLowerCase()
    );
    
    
    return filteredBoxes;
    
  } catch (error) {
    console.error('❌ Error obteniendo cajas por habitación:', error);
    return [];
  }
};

// ✅ FUNCIÓN: Obtener cajas por estado
export const getBoxesByStatus = async (status) => {
  try {
    
    
    const allBoxes = await getAllUserBoxes();
    
    const filteredBoxes = allBoxes.filter(box => 
      box.status && box.status.toLowerCase() === status.toLowerCase()
    );
    
    
    return filteredBoxes;
    
  } catch (error) {
    console.error('❌ Error obteniendo cajas por estado:', error);
    return [];
  }
};