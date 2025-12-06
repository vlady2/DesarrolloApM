// MyTripsScreen.js - CÓDIGO COMPLETO SIN LOGS
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getBoxesByMoveId } from '../../firebase/boxService';
import { getLuggageByTripId } from '../../firebase/luggageService';
import { deleteMove, getAllUserItems } from '../../firebase/moveService';
import { deleteTrip } from '../../firebase/tripService';

// ✅ FUNCIÓN MEJORADA: Obtener items de un contenedor (compatible con ambos formatos)
const getContainerItems = (container) => {
  const items = container.items || container.articulos;
  
  if (Array.isArray(items)) {
    return items;
  } else if (typeof items === 'string') {
    return items.trim() ? [items] : [];
  } else if (typeof items === 'object' && items !== null) {
    return Object.values(items);
  }
  
  return [];
};

// ✅ FUNCIÓN MEJORADA: Verificar EXACTAMENTE si el item tiene items
const hasValidItems = async (item, isMoving) => {
  try {
    if (isMoving) {
      const boxes = await getBoxesByMoveId(item.id);
      if (boxes.length === 0) return false;
      
      for (const box of boxes) {
        const items = getContainerItems(box);
        if (items.length > 0) return true;
      }
      return false;
      
    } else {
      const luggageList = await getLuggageByTripId(item.id);
      if (luggageList.length === 0) return false;
      
      for (const luggage of luggageList) {
        const items = getContainerItems(luggage);
        if (items.length > 0) return true;
      }
      return false;
    }
  } catch (error) {
    return false;
  }
};

// ✅ FUNCIÓN: Contar maletas/cajas CON items
const countValidItems = async (item, isMoving) => {
  try {
    if (isMoving) {
      const boxes = await getBoxesByMoveId(item.id);
      let count = 0;
      
      for (const box of boxes) {
        const items = getContainerItems(box);
        if (items.length > 0) count++;
      }
      return count;
      
    } else {
      const luggageList = await getLuggageByTripId(item.id);
      let count = 0;
      
      for (const luggage of luggageList) {
        const items = getContainerItems(luggage);
        if (items.length > 0) count++;
      }
      return count;
    }
  } catch (error) {
    return 0;
  }
};

// ✅ FUNCIÓN: Contar total de items
const countTotalItems = async (item, isMoving) => {
  try {
    if (isMoving) {
      const boxes = await getBoxesByMoveId(item.id);
      let total = 0;
      
      for (const box of boxes) {
        const items = getContainerItems(box);
        total += items.length;
      }
      return total;
      
    } else {
      const luggageList = await getLuggageByTripId(item.id);
      let total = 0;
      
      for (const luggage of luggageList) {
        const items = getContainerItems(luggage);
        total += items.length;
      }
      return total;
    }
  } catch (error) {
    return 0;
  }
};

// ✅ FUNCIÓN: Contar total de maletas/cajas
const countTotalContainers = async (item, isMoving) => {
  try {
    if (isMoving) {
      const boxes = await getBoxesByMoveId(item.id);
      return boxes.length;
    } else {
      const luggageList = await getLuggageByTripId(item.id);
      return luggageList.length;
    }
  } catch (error) {
    return 0;
  }
};

// ✅ FUNCIÓN: Verificar estado del viaje/mudanza
const getItemStatus = (item, hasValidItems = true, boxesWithItems = 0, totalBoxes = 0) => {
  const isMoving = item.itemType === 'move';
  
  const hasEmptyItems = totalBoxes > 0 && boxesWithItems === 0;
  const hasNoItemsAtAll = totalBoxes === 0;
  
  if (isMoving) {
    if (!item.moveDate) {
      return { 
        status: 'Pendiente', 
        color: '#FFA500', 
        icon: 'time-outline', 
        canEdit: true, 
        canDelete: true,
        canEditItems: true,
        hasValidItems: hasValidItems,
        hasEmptyItems: hasEmptyItems,
        hasNoItemsAtAll: hasNoItemsAtAll,
        reason: hasNoItemsAtAll ? 'Sin cajas agregadas' : (hasEmptyItems ? `${totalBoxes} caja${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}` : '')
      };
    }
    
    const today = new Date();
    let moveDate;
    
    try {
      if (item.moveDate.includes('/')) {
        const [day, month, year] = item.moveDate.split('/');
        moveDate = new Date(year, month - 1, day);
      } else {
        moveDate = new Date(item.moveDate);
      }
    } catch (error) {
      return { 
        status: 'Pendiente', 
        color: '#FFA500', 
        icon: 'time-outline', 
        canEdit: true, 
        canDelete: true,
        canEditItems: true,
        hasValidItems: hasValidItems,
        hasEmptyItems: hasEmptyItems,
        hasNoItemsAtAll: hasNoItemsAtAll,
        reason: hasNoItemsAtAll ? 'Sin cajas agregadas' : (hasEmptyItems ? `${totalBoxes} caja${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}` : '')
      };
    }
    
    if (isNaN(moveDate.getTime())) {
      return { 
        status: 'Pendiente', 
        color: '#FFA500', 
        icon: 'time-outline', 
        canEdit: true, 
        canDelete: true,
        canEditItems: true,
        hasValidItems: hasValidItems,
        hasEmptyItems: hasEmptyItems,
        hasNoItemsAtAll: hasNoItemsAtAll,
        reason: hasNoItemsAtAll ? 'Sin cajas agregadas' : (hasEmptyItems ? `${totalBoxes} caja${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}` : '')
      };
    }
    
    const todayStr = today.toDateString();
    const moveDateStr = moveDate.toDateString();
    
    if (todayStr === moveDateStr) {
      if (!hasValidItems) {
        return { 
          status: 'Fallido', 
          color: hasEmptyItems ? '#FF9800' : '#DC3545',
          icon: hasEmptyItems ? 'alert-circle' : 'close-circle', 
          canEdit: false, 
          canDelete: false,
          canEditItems: true,
          hasValidItems: false,
          hasEmptyItems: hasEmptyItems,
          hasNoItemsAtAll: hasNoItemsAtAll,
          reason: hasNoItemsAtAll ? 'Sin cajas agregadas' : `${totalBoxes} caja${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}`
        };
      }
      return { 
        status: 'En curso', 
        color: '#4CAF50', 
        icon: 'business', 
        canEdit: false, 
        canDelete: false,
        canEditItems: false,
        hasValidItems: true,
        hasEmptyItems: false,
        hasNoItemsAtAll: false
      };
    }
    
    if (today > moveDate) {
      if (!hasValidItems) {
        return { 
          status: 'Fallido', 
          color: hasEmptyItems ? '#FF9800' : '#DC3545',
          icon: hasEmptyItems ? 'alert-circle' : 'close-circle', 
          canEdit: false, 
          canDelete: true,
          canEditItems: false,
          hasValidItems: false,
          hasEmptyItems: hasEmptyItems,
          hasNoItemsAtAll: hasNoItemsAtAll,
          reason: hasNoItemsAtAll ? 'Sin cajas agregadas' : `${totalBoxes} caja${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}`
        };
      }
      return { 
        status: 'Completada', 
        color: '#888', 
        icon: 'checkmark-done', 
        canEdit: false, 
        canDelete: true,
        canEditItems: false,
        hasValidItems: true,
        hasEmptyItems: false,
        hasNoItemsAtAll: false
      };
    }
    
    if (today < moveDate) {
      return { 
        status: 'Pendiente', 
        color: '#FFA500', 
        icon: 'time-outline', 
        canEdit: true, 
        canDelete: true,
        canEditItems: true,
        hasValidItems: hasValidItems,
        hasEmptyItems: hasEmptyItems,
        hasNoItemsAtAll: hasNoItemsAtAll,
        reason: hasNoItemsAtAll ? 'Sin cajas agregadas' : (hasEmptyItems ? `${totalBoxes} caja${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}` : '')
      };
    }
  }
  
  if (!item.startDate) {
    return { 
      status: 'Pendiente', 
      color: '#FFA500', 
      icon: 'time-outline', 
      canEdit: true, 
      canDelete: true,
      canEditItems: true,
      hasValidItems: hasValidItems,
      hasEmptyItems: hasEmptyItems,
      hasNoItemsAtAll: hasNoItemsAtAll,
      reason: hasNoItemsAtAll ? 'Sin maletas agregadas' : (hasEmptyItems ? `${totalBoxes} maleta${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}` : '')
    };
  }
  
  const today = new Date();
  let startDate, endDate;
  
  try {
    if (item.startDate.includes('/')) {
      const [day, month, year] = item.startDate.split('/');
      startDate = new Date(year, month - 1, day);
    } else {
      startDate = new Date(item.startDate);
    }
    
    if (item.endDate && item.endDate.includes('/')) {
      const [day, month, year] = item.endDate.split('/');
      endDate = new Date(year, month - 1, day);
    } else if (item.endDate) {
      endDate = new Date(item.endDate);
    }
  } catch (error) {
    return { 
      status: 'Pendiente', 
      color: '#FFA500', 
      icon: 'time-outline', 
      canEdit: true, 
      canDelete: true,
      canEditItems: true,
      hasValidItems: hasValidItems,
      hasEmptyItems: hasEmptyItems,
      hasNoItemsAtAll: hasNoItemsAtAll,
      reason: hasNoItemsAtAll ? 'Sin maletas agregadas' : (hasEmptyItems ? `${totalBoxes} maleta${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}` : '')
    };
  }
  
  if (isNaN(startDate.getTime())) {
    return { 
      status: 'Pendiente', 
      color: '#FFA500', 
      icon: 'time-outline', 
      canEdit: true, 
      canDelete: true,
      canEditItems: true,
      hasValidItems: hasValidItems,
      hasEmptyItems: hasEmptyItems,
      hasNoItemsAtAll: hasNoItemsAtAll,
      reason: hasNoItemsAtAll ? 'Sin maletas agregadas' : (hasEmptyItems ? `${totalBoxes} maleta${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}` : '')
    };
  }
  
  const todayStr = today.toDateString();
  const startDateStr = startDate.toDateString();
  const endDateStr = endDate ? endDate.toDateString() : null;
  
  if (todayStr === startDateStr || (today >= startDate && (!endDate || today <= endDate))) {
    if (!hasValidItems) {
      return { 
        status: 'Fallido', 
        color: hasEmptyItems ? '#FF9800' : '#DC3545',
        icon: hasEmptyItems ? 'alert-circle' : 'close-circle', 
        canEdit: false, 
        canDelete: false,
        canEditItems: true,
        hasValidItems: false,
        hasEmptyItems: hasEmptyItems,
        hasNoItemsAtAll: hasNoItemsAtAll,
        reason: hasNoItemsAtAll ? 'Sin maletas agregadas' : `${totalBoxes} maleta${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}`
      };
    }
    return { 
      status: 'En curso', 
      color: '#4CAF50', 
      icon: 'airplane', 
      canEdit: false, 
      canDelete: false,
      canEditItems: false,
      hasValidItems: true,
      hasEmptyItems: false,
      hasNoItemsAtAll: false
    };
  }
  
  if (today < startDate) {
    return { 
      status: 'Pendiente', 
      color: '#FFA500', 
      icon: 'time-outline', 
      canEdit: true, 
      canDelete: true,
      canEditItems: true,
      hasValidItems: hasValidItems,
      hasEmptyItems: hasEmptyItems,
      hasNoItemsAtAll: hasNoItemsAtAll,
      reason: hasNoItemsAtAll ? 'Sin maletas agregadas' : (hasEmptyItems ? `${totalBoxes} maleta${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}` : '')
    };
  }
  
  if (endDate && !isNaN(endDate.getTime()) && today > endDate) {
    if (!hasValidItems) {
      return { 
        status: 'Fallido', 
        color: hasEmptyItems ? '#FF9800' : '#DC3545',
        icon: hasEmptyItems ? 'alert-circle' : 'close-circle', 
        canEdit: false, 
        canDelete: true,
        canEditItems: false,
        hasValidItems: false,
        hasEmptyItems: hasEmptyItems,
        hasNoItemsAtAll: hasNoItemsAtAll,
        reason: hasNoItemsAtAll ? 'Sin maletas agregadas' : `${totalBoxes} maleta${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}`
      };
    }
    return { 
      status: 'Completado', 
      color: '#888', 
      icon: 'checkmark-done', 
      canEdit: false, 
      canDelete: true,
      canEditItems: false,
      hasValidItems: true,
      hasEmptyItems: false,
      hasNoItemsAtAll: false
    };
  }
  
  return { 
    status: 'Pendiente', 
    color: '#FFA500', 
    icon: 'time-outline', 
    canEdit: true, 
    canDelete: true,
    canEditItems: true,
    hasValidItems: hasValidItems,
    hasEmptyItems: hasEmptyItems,
    hasNoItemsAtAll: hasNoItemsAtAll,
    reason: hasNoItemsAtAll ? 'Sin maletas agregadas' : (hasEmptyItems ? `${totalBoxes} maleta${totalBoxes !== 1 ? 's' : ''} vacía${totalBoxes !== 1 ? 's' : ''}` : '')
  };
};

const MyTripsScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [luggageCounts, setLuggageCounts] = useState({});
  const [boxCounts, setBoxCounts] = useState({});
  const [validLuggageCounts, setValidLuggageCounts] = useState({});
  const [validBoxCounts, setValidBoxCounts] = useState({});
  const [totalItemsCounts, setTotalItemsCounts] = useState({});
  const [itemsWithContent, setItemsWithContent] = useState({});
  
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
        navigation.navigate('Home');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, activeFilter, activeStatusFilter, itemsWithContent]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const allItems = await getAllUserItems();
      
      const luggageCountsTemp = {};
      const boxCountsTemp = {};
      const validLuggageCountsTemp = {};
      const validBoxCountsTemp = {};
      const totalItemsCountsTemp = {};
      const itemsWithContentTemp = {};
      
      for (const item of allItems) {
        const isMoving = item.itemType === 'move';
        const hasValid = await hasValidItems(item, isMoving);
        itemsWithContentTemp[item.id] = hasValid;
        
        try {
          if (isMoving) {
            const totalBoxes = await countTotalContainers(item, isMoving);
            boxCountsTemp[item.id] = totalBoxes;
            luggageCountsTemp[item.id] = 0;
            
            const validBoxesCount = await countValidItems(item, isMoving);
            validBoxCountsTemp[item.id] = validBoxesCount;
            validLuggageCountsTemp[item.id] = 0;
            
            const totalItems = await countTotalItems(item, isMoving);
            totalItemsCountsTemp[item.id] = totalItems;
            
          } else {
            const totalLuggage = await countTotalContainers(item, isMoving);
            luggageCountsTemp[item.id] = totalLuggage;
            boxCountsTemp[item.id] = 0;
            
            const validLuggageCount = await countValidItems(item, isMoving);
            validLuggageCountsTemp[item.id] = validLuggageCount;
            validBoxCountsTemp[item.id] = 0;
            
            const totalItems = await countTotalItems(item, isMoving);
            totalItemsCountsTemp[item.id] = totalItems;
          }
        } catch (error) {
          luggageCountsTemp[item.id] = 0;
          boxCountsTemp[item.id] = 0;
          validLuggageCountsTemp[item.id] = 0;
          validBoxCountsTemp[item.id] = 0;
          totalItemsCountsTemp[item.id] = 0;
        }
      }
      
      setItems(allItems);
      setItemsWithContent(itemsWithContentTemp);
      setLuggageCounts(luggageCountsTemp);
      setBoxCounts(boxCountsTemp);
      setValidLuggageCounts(validLuggageCountsTemp);
      setValidBoxCounts(validBoxCountsTemp);
      setTotalItemsCounts(totalItemsCountsTemp);
      
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los elementos');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    if (activeFilter === 'trips') {
      filtered = filtered.filter(item => item.itemType === 'trip');
    } else if (activeFilter === 'moving') {
      filtered = filtered.filter(item => item.itemType === 'move');
    }

    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const hasItems = itemsWithContent[item.id] || false;
        const isMoving = item.itemType === 'move';
        const validCount = isMoving ? validBoxCounts[item.id] || 0 : validLuggageCounts[item.id] || 0;
        const totalCount = isMoving ? boxCounts[item.id] || 0 : luggageCounts[item.id] || 0;
        const itemStatus = getItemStatus(item, hasItems, validCount, totalCount);
        
        if (activeStatusFilter === 'pendiente') {
          return itemStatus.status === 'Pendiente';
        } else if (activeStatusFilter === 'en curso') {
          return itemStatus.status === 'En curso';
        } else if (activeStatusFilter === 'completado') {
          return itemStatus.status === 'Completado' || itemStatus.status === 'Completada';
        } else if (activeStatusFilter === 'fallido') {
          return itemStatus.status === 'Fallido';
        }
        
        return false;
      });
    }

    setFilteredItems(filtered);
  };

  const getStatusCount = (status) => {
    return items.filter(item => {
      const hasItems = itemsWithContent[item.id] || false;
      const isMoving = item.itemType === 'move';
      const validCount = isMoving ? validBoxCounts[item.id] || 0 : validLuggageCounts[item.id] || 0;
      const totalCount = isMoving ? boxCounts[item.id] || 0 : luggageCounts[item.id] || 0;
      const itemStatus = getItemStatus(item, hasItems, validCount, totalCount);
      
      if (status === 'pendiente') {
        return itemStatus.status === 'Pendiente';
      } else if (status === 'en curso') {
        return itemStatus.status === 'En curso';
      } else if (status === 'completado') {
        return itemStatus.status === 'Completado' || itemStatus.status === 'Completada';
      } else if (status === 'fallido') {
        return itemStatus.status === 'Fallido';
      }
      
      return false;
    }).length;
  };

  const getStatusFilterText = () => {
    switch(activeStatusFilter) {
      case 'all': return 'Todos los estados';
      case 'pendiente': return 'Pendientes';
      case 'en curso': return 'En curso';
      case 'completado': return 'Completados';
      case 'fallido': return 'Fallidos';
      default: return 'Todos los estados';
    }
  };

  const getStatusFilterColor = () => {
    switch(activeStatusFilter) {
      case 'pendiente': return '#FFA500';
      case 'en curso': return '#4CAF50';
      case 'completado': return '#888';
      case 'fallido': return '#DC3545';
      default: return '#BB86FC';
    }
  };

  const getStatusFilterIcon = () => {
    switch(activeStatusFilter) {
      case 'pendiente': return 'time-outline';
      case 'en curso': return 'airplane';
      case 'completado': return 'checkmark-done';
      case 'fallido': return 'close-circle';
      default: return 'filter';
    }
  };

  const getCounters = () => {
    const totalTrips = items.filter(item => item.itemType === 'trip').length;
    const totalMovings = items.filter(item => item.itemType === 'move').length;
    const totalAll = items.length;
    
    let text = '';
    if (activeStatusFilter !== 'all') {
      const statusText = getStatusFilterText().toLowerCase();
      text = `${filteredItems.length} ${statusText}`;
    } else {
      switch(activeFilter) {
        case 'all':
          text = `${filteredItems.length} de ${totalAll} elementos`;
          break;
        case 'trips':
          text = `${filteredItems.length} de ${totalTrips} viajes`;
          break;
        case 'moving':
          text = `${filteredItems.length} de ${totalMovings} mudanzas`;
          break;
        default:
          text = `${filteredItems.length} de ${totalAll} elementos`;
      }
    }
    
    return { current: filteredItems.length, total: totalAll, text: text };
  };

  const getItemCounts = (item) => {
    const isMoving = item.itemType === 'move';
    
    if (isMoving) {
      const totalBoxes = boxCounts[item.id] || 0;
      const boxesWithItems = validBoxCounts[item.id] || 0;
      const totalItems = totalItemsCounts[item.id] || 0;
      
      return {
        total: totalBoxes,
        withItems: boxesWithItems,
        totalItems: totalItems,
        hasValidItems: boxesWithItems > 0,
        hasEmptyItems: totalBoxes > 0 && boxesWithItems === 0,
        hasNoItemsAtAll: totalBoxes === 0
      };
    } else {
      const totalLuggage = luggageCounts[item.id] || 0;
      const luggageWithItems = validLuggageCounts[item.id] || 0;
      const totalItems = totalItemsCounts[item.id] || 0;
      
      return {
        total: totalLuggage,
        withItems: luggageWithItems,
        totalItems: totalItems,
        hasValidItems: luggageWithItems > 0,
        hasEmptyItems: totalLuggage > 0 && luggageWithItems === 0,
        hasNoItemsAtAll: totalLuggage === 0
      };
    }
  };

  const handleDeleteItem = async (item) => {
    const isMoving = item.itemType === 'move';
    const counts = getItemCounts(item);
    const hasItems = itemsWithContent[item.id] || false;
    const itemStatus = getItemStatus(item, hasItems, counts.withItems, counts.total);
    
    if (!itemStatus.canDelete) {
      let message = `No puedes eliminar ${isMoving ? 'mudanzas' : 'viajes'} que están ${itemStatus.status.toLowerCase()}.`;
      
      if (itemStatus.status === 'Fallido' && (counts.hasEmptyItems || counts.hasNoItemsAtAll)) {
        message = `Este ${isMoving ? 'mudanza' : 'viaje'} no se completó porque ${itemStatus.reason}. ¿Deseas agregar items primero?`;
        
        Alert.alert(
          `${isMoving ? 'Mudanza Fallida' : 'Viaje Fallido'}`,
          message,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Agregar Items', 
              onPress: () => {
                if (isMoving) {
                  navigation.navigate('NewBox', { 
                    moveId: item.id,
                    origin: item.origin,
                    destination: item.destination,
                    moveType: item.moveType,
                    originScreen: 'MyTrips',
                    forceBoxes: true
                  });
                } else {
                  navigation.navigate('NewMaleta', { 
                    tripId: item.id,
                    forceLuggage: true
                  });
                }
              }
            },
            { 
              text: 'Eliminar Igual', 
              style: 'destructive',
              onPress: () => confirmDelete(item)
            }
          ]
        );
        return;
      }
      
      Alert.alert(
        `${isMoving ? 'Mudanza' : 'Viaje'} ${itemStatus.status}`,
        message,
        [{ text: 'Entendido' }]
      );
      return;
    }

    confirmDelete(item);
  };

  const confirmDelete = async (item) => {
    const isMoving = item.itemType === 'move';
    const mainTitle = item.purpose || item.destination || 
                     (isMoving ? (item.nombre || 'Mudanza') : 'Viaje');
    
    Alert.alert(
      'Eliminar',
      `¿Estás seguro de eliminar "${mainTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: async () => {
            try {
              if (isMoving) {
                await deleteMove(item.id);
              } else {
                await deleteTrip(item.id);
              }
              setItems(items.filter(t => t.id !== item.id));
            } catch (error) {
              Alert.alert('Error', `No se pudo eliminar la ${isMoving ? 'mudanza' : 'viaje'}`);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const navigateToItemDetail = (item) => {
    const isMoving = item.itemType === 'move';
    const counts = getItemCounts(item);
    const hasItems = itemsWithContent[item.id] || false;
    const itemStatus = getItemStatus(item, hasItems, counts.withItems, counts.total);
    
    if (itemStatus.status === 'Fallido' && itemStatus.canEditItems) {
      Alert.alert(
        `${isMoving ? 'Mudanza Fallida' : 'Viaje Fallido'}`,
        itemStatus.reason || `Este ${isMoving ? 'mudanza' : 'viaje'} no tiene ${isMoving ? 'cajas' : 'maletas'}. ¿Deseas agregarlas ahora?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Agregar', 
            onPress: () => {
              if (isMoving) {
                navigation.navigate('NewBox', { 
                  moveId: item.id,
                  origin: item.origin,
                  destination: item.destination,
                  moveType: item.moveType,
                  originScreen: 'MyTrips',
                  forceBoxes: true
                });
              } else {
                navigation.navigate('NewMaleta', { 
                  tripId: item.id,
                  forceLuggage: true
                });
              }
            }
          }
        ]
      );
      return;
    }
    
    if (isMoving) {
      navigation.navigate('MoveDetail', { 
        moveId: item.id,
        moveOrigin: item.origin,
        moveDestination: item.destination,
        moveType: item.moveType,
        moveDate: item.moveDate,
        origin: 'MyTrips'
      });
    } else {
      navigation.navigate('TripDetail', { trip: item });
    }
  };

  const navigateToEditItem = (item) => {
    const isMoving = item.itemType === 'move';
    const counts = getItemCounts(item);
    const hasItems = itemsWithContent[item.id] || false;
    const itemStatus = getItemStatus(item, hasItems, counts.withItems, counts.total);
    
    if (!itemStatus.canEdit) {
      Alert.alert(
        `${isMoving ? 'Mudanza' : 'Viaje'} ${itemStatus.status}`,
        `No puedes editar ${isMoving ? 'mudanzas' : 'viajes'} que están ${itemStatus.status.toLowerCase()}.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    if (isMoving) {
      navigation.navigate('EditMove', { 
        moveId: item.id,
        moveOrigin: item.origin,
        moveDestination: item.destination,
        moveType: item.moveType,
        origin: 'MyTrips'
      });
    } else {
      navigation.navigate('EditTrip', { 
        trip: item, 
        origin: 'MyTrips'
      });
    }
  };

  const navigateToNewTrip = () => {
    navigation.navigate('NewTrip');
  };

  const navigateToNewMove = () => {
    navigation.navigate('NewMove');
  };

  const goBack = () => {
    navigation.navigate('Home');
  };

  const renderTripItem = ({ item }) => {
    const isMoving = item.itemType === 'move';
    const counts = getItemCounts(item);
    const hasItems = itemsWithContent[item.id] || false;
    const itemStatus = getItemStatus(item, hasItems, counts.withItems, counts.total);
    const mainTitle = item.purpose || item.destination || 
                     (isMoving ? (item.nombre || 'Mudanza') : 'Viaje');
    
    const locationText = isMoving 
      ? `${item.origin || 'Origen'} → ${item.destination || 'Destino'}`
      : item.destination || '';
    
    const dateText = isMoving 
      ? item.moveDate || ''
      : `${item.startDate || ''} ${item.endDate ? `- ${item.endDate}` : ''}`;

    return (
      <TouchableOpacity 
        style={[
          styles.tripItem,
          itemStatus.status === 'Fallido' && styles.failedItem,
          counts.hasEmptyItems && styles.emptyItemsItem
        ]}
        onPress={() => navigateToItemDetail(item)}
      >
        <View style={styles.tripHeader}>
          <View style={[styles.typeBadge, isMoving && styles.movingBadge]}>
            <Ionicons 
              name={isMoving ? 'business' : 'airplane'} 
              size={16} 
              color={isMoving ? '#FF6B6B' : '#2196F3'} 
            />
            <Text style={[styles.typeText, isMoving && styles.movingText]}>
              {isMoving ? 'Mudanza' : 'Viaje'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: itemStatus.color }]}>
            <Ionicons name={itemStatus.icon} size={12} color="#FFFFFF" />
            <Text style={styles.statusText}>{itemStatus.status}</Text>
          </View>
        </View>

        <View style={styles.tripInfo}>
          <Text style={[
            styles.tripTitle,
            itemStatus.status === 'Fallido' && styles.failedTitle,
            counts.hasEmptyItems && styles.emptyItemsTitle
          ]}>
            {mainTitle}
          </Text>
          
          {locationText ? (
            <View style={styles.destinationRow}>
              <Ionicons name="location" size={14} color="#888" />
              <Text style={styles.tripDestination}>{locationText}</Text>
            </View>
          ) : null}

          {dateText ? (
            <View style={styles.datesRow}>
              <Ionicons name="calendar" size={14} color="#888" />
              <Text style={styles.tripDates}>{dateText}</Text>
            </View>
          ) : null}

          {itemStatus.status === 'Fallido' && (
            <View style={[
              styles.failedMessageContainer,
              counts.hasEmptyItems && styles.emptyItemsMessageContainer
            ]}>
              <Ionicons 
                name={counts.hasEmptyItems ? "alert-circle" : "warning"} 
                size={14} 
                color={counts.hasEmptyItems ? "#FF9800" : "#DC3545"} 
              />
              <Text style={[
                styles.failedMessage,
                counts.hasEmptyItems && styles.emptyItemsMessage
              ]}>
                {itemStatus.reason}
              </Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <View style={styles.luggageInfo}>
              <Ionicons 
                name={isMoving ? 'cube' : 'bag'} 
                size={14} 
                color={counts.withItems > 0 ? "#4CAF50" : (counts.hasEmptyItems ? "#FF9800" : "#DC3545")} 
              />
              <View>
                <Text style={[
                  styles.tripLuggage,
                  counts.hasEmptyItems && styles.emptyItemsCount,
                  counts.hasNoItemsAtAll && styles.noItemsText
                ]}>
                  {counts.withItems > 0 
                    ? `${counts.withItems} ${isMoving ? 'caja' : 'maleta'}${counts.withItems !== 1 ? 's' : ''} con items`
                    : `${counts.total} ${isMoving ? 'caja' : 'maleta'}${counts.total !== 1 ? 's' : ''} ${counts.hasEmptyItems ? 'vacía' : ''}${counts.hasEmptyItems && counts.total !== 1 ? 's' : ''}`
                  }
                </Text>
                {counts.totalItems > 0 && (
                  <Text style={styles.itemsCount}>
                    {counts.totalItems} artículo{counts.totalItems !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </View>
            {item.moveType && isMoving && (
              <View style={styles.moveTypeBadge}>
                <Text style={styles.moveTypeText}>
                  {item.moveType === 'residential' ? '🚚 Residencial' :
                   item.moveType === 'office' ? '🏢 Oficina' :
                   item.moveType === 'student' ? '🎓 Estudiantil' :
                   item.moveType === 'international' ? '🌎 Internacional' :
                   item.moveType === 'storage' ? '📦 Almacenamiento' : '🏠 Otro'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.tripActions}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              !itemStatus.canEdit && styles.disabledButton
            ]}
            onPress={() => navigateToEditItem(item)}
            disabled={!itemStatus.canEdit}
          >
            <Ionicons 
              name="create" 
              size={20} 
              color={!itemStatus.canEdit ? "#666" : "#2196F3"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton,
              !itemStatus.canDelete && styles.disabledButton
            ]}
            onPress={() => handleDeleteItem(item)}
            disabled={!itemStatus.canDelete}
          >
            <Ionicons 
              name="trash" 
              size={20} 
              color={!itemStatus.canDelete ? "#666" : "#F44336"} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar backgroundColor="#121212" barStyle="light-content" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#BB86FC" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  const counters = getCounters();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Viajes y Mudanzas</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>{counters.text}</Text>
      </View>

      <View style={styles.filterContainer}>
        {['all', 'trips', 'moving'].map((filter) => (
          <TouchableOpacity 
            key={filter}
            style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
            onPress={() => setActiveFilter(filter)}
          >
            {filter === 'trips' ? (
              <Ionicons name="airplane" size={16} color={activeFilter === filter ? '#FFFFFF' : '#2196F3'} />
            ) : filter === 'moving' ? (
              <Ionicons name="business" size={16} color={activeFilter === filter ? '#FFFFFF' : '#FF6B6B'} />
            ) : null}
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter === 'all' ? 'Todos' : filter === 'trips' ? 'Viajes' : 'Mudanzas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statusFilterContainer}>
        <TouchableOpacity 
          style={[styles.statusFilterButton, { borderLeftColor: getStatusFilterColor() }]}
          onPress={() => setShowStatusDropdown(!showStatusDropdown)}
        >
          <Ionicons 
            name={getStatusFilterIcon()} 
            size={16} 
            color={getStatusFilterColor()} 
          />
          <Text style={styles.statusFilterText}>{getStatusFilterText()}</Text>
          <Ionicons 
            name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#BB86FC" 
          />
        </TouchableOpacity>

        {showStatusDropdown && (
          <View style={styles.statusDropdown}>
            {['all', 'pendiente', 'en curso', 'completado', 'fallido'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  activeStatusFilter === status && styles.statusOptionActive
                ]}
                onPress={() => {
                  setActiveStatusFilter(status);
                  setShowStatusDropdown(false);
                }}
              >
                <View style={styles.statusOptionContent}>
                  <View style={styles.statusIndicatorContainer}>
                    {status !== 'all' && (
                      <View 
                        style={[
                          styles.statusIndicator,
                          { 
                            backgroundColor: 
                              status === 'pendiente' ? '#FFA500' :
                              status === 'en curso' ? '#4CAF50' :
                              status === 'completado' ? '#888' :
                              '#DC3545'
                          }
                        ]} 
                      />
                    )}
                    <Text style={[
                      styles.statusOptionText,
                      activeStatusFilter === status && styles.statusOptionTextActive
                    ]}>
                      {status === 'all' ? 'Todos los estados' :
                       status === 'pendiente' ? `Pendientes (${getStatusCount('pendiente')})` :
                       status === 'en curso' ? `En curso (${getStatusCount('en curso')})` :
                       status === 'completado' ? `Completados (${getStatusCount('completado')})` :
                       `Fallidos (${getStatusCount('fallido')})`}
                    </Text>
                  </View>
                  {activeStatusFilter === status && (
                    <Ionicons name="checkmark" size={16} color="#BB86FC" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons 
            name={activeFilter === 'moving' ? 'business' : 'airplane'} 
            size={64} 
            color="#666" 
          />
          <Text style={styles.emptyText}>
            {activeFilter === 'all' && activeStatusFilter === 'all' 
              ? 'No tienes viajes ni mudanzas' 
              : `No tienes ${activeFilter === 'trips' ? 'viajes' : activeFilter === 'moving' ? 'mudanzas' : 'elementos'} ${activeStatusFilter !== 'all' ? getStatusFilterText().toLowerCase() : ''}`}
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={activeFilter === 'moving' ? navigateToNewMove : navigateToNewTrip}
          >
            <Text style={styles.createButtonText}>
              Crear {activeFilter === 'moving' ? 'Mudanza' : 'Viaje'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadItems}
          style={styles.flatList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 24,
  },
  counterContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  counterText: {
    fontSize: 16,
    color: '#BB86FC',
    fontWeight: '600',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusFilterContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    position: 'relative',
    zIndex: 1000,
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    gap: 8,
  },
  statusFilterText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statusDropdown: {
    position: 'absolute',
    top: '100%',
    left: 15,
    right: 15,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginTop: 5,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1001,
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  statusOptionActive: {
    backgroundColor: '#333',
  },
  statusOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  statusOptionTextActive: {
    color: '#BB86FC',
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  flatList: {
    flex: 1,
  },
  tripItem: {
    backgroundColor: '#1E1E1E',
    marginBottom: 15,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  failedItem: {
    borderLeftColor: '#DC3545',
    backgroundColor: 'rgba(220, 53, 69, 0.05)',
  },
  emptyItemsItem: {
    borderLeftColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  movingBadge: {
    backgroundColor: '#2A2A2A',
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  movingText: {
    color: '#FF6B6B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tripInfo: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  failedTitle: {
    color: '#DC3545',
  },
  emptyItemsTitle: {
    color: '#FF9800',
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  tripDestination: {
    fontSize: 14,
    color: '#888',
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  tripDates: {
    fontSize: 14,
    color: '#BB86FC',
  },
  failedMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    gap: 6,
  },
  emptyItemsMessageContainer: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  failedMessage: {
    color: '#DC3545',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  emptyItemsMessage: {
    color: '#FF9800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  luggageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripLuggage: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyItemsCount: {
    color: '#FF9800',
  },
  noItemsText: {
    color: '#DC3545',
  },
  itemsCount: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 2,
  },
  moveTypeBadge: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moveTypeText: {
    fontSize: 10,
    color: '#BB86FC',
    fontWeight: '500',
  },
  tripActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    padding: 8,
  },
  addItemsButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 6,
    marginRight: 'auto',
  },
  emptyItemsButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});

export default MyTripsScreen;