// MaletasScreen.js - VERSIÓN CORREGIDA
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { deleteBox, getAllUserBoxes } from '../../firebase/boxService';
import { deleteLuggage, getAllUserLuggage } from '../../firebase/luggageService';

// ✅ Categorías combinadas (maletas + cajas)
const CATEGORIAS_COMBINADAS = [
  { id: 'bolson', nombre: 'Bolson', icon: 'bag-outline', type: 'luggage' },
  { id: 'mano', nombre: 'Maleta de Mano', icon: 'briefcase-outline', type: 'luggage' },
  { id: 'mediana', nombre: 'Maleta Mediana', icon: 'business-outline', type: 'luggage' },
  { id: 'grande', nombre: 'Maleta Grande', icon: 'archive-outline', type: 'luggage' },
  { id: 'extra_grande', nombre: 'Maleta Extra Grande', icon: 'cube-outline', type: 'luggage' },
  { id: 'caja', nombre: 'Caja', icon: 'cube-outline', type: 'box' },
  { id: 'fragile', nombre: 'Caja Frágil', icon: 'warning-outline', type: 'box' },
  { id: 'small', nombre: 'Caja Pequeña', icon: 'cube-outline', type: 'box' },
  { id: 'medium', nombre: 'Caja Mediana', icon: 'cube', type: 'box' },
  { id: 'large', nombre: 'Caja Grande', icon: 'archive-outline', type: 'box' },
  { id: 'wardrobe', nombre: 'Caja Ropero', icon: 'shirt-outline', type: 'box' }
];

// ✅ FUNCIÓN AUXILIAR: Verificar si una caja tiene items válidos
const hasBoxValidItems = (box) => {
  const items = box.items;
  if (!items) return false;
  
  if (Array.isArray(items) && items.length > 0) {
    return true;
  } else if (typeof items === 'string' && items.trim() !== '') {
    return true;
  } else if (typeof items === 'object' && items !== null) {
    return Object.keys(items).length > 0;
  }
  return false;
};

// ✅ FUNCIÓN CORREGIDA: Verificar estado del viaje o mudanza
const getItemStatus = (item, allBoxes = []) => {
  const isBox = item.itemType === 'box' || item.type === 'caja';
  
  // Para cajas (mudanzas)
  if (isBox) {
    if (!item.moveDate) {
      return { 
        status: 'Planificada', 
        color: '#FFA500', 
        icon: 'calendar-outline', 
        canEdit: true, 
        canDelete: true
      };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let moveDate;
    
    try {
      if (item.moveDate.includes('/')) {
        const [day, month, year] = item.moveDate.split('/');
        moveDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        moveDate.setHours(0, 0, 0, 0);
      } else {
        moveDate = new Date(item.moveDate);
        moveDate.setHours(0, 0, 0, 0);
      }
    } catch (error) {
      return { 
        status: 'Planificada', 
        color: '#FFA500', 
        icon: 'calendar-outline', 
        canEdit: true, 
        canDelete: true
      };
    }
    
    if (isNaN(moveDate.getTime())) {
      return { 
        status: 'Planificada', 
        color: '#FFA500', 
        icon: 'calendar-outline', 
        canEdit: true, 
        canDelete: true
      };
    }
    
    // ✅ Verificar si hay cajas con items
    const boxesWithItems = allBoxes.filter(box => hasBoxValidItems(box)).length;
    const totalBoxes = allBoxes.length;
    const hasNoBoxesAtAll = totalBoxes === 0;
    const hasEmptyBoxes = totalBoxes > 0 && boxesWithItems === 0;
    
    const todayTime = today.getTime();
    const moveDateTime = moveDate.getTime();
    
    // 🟡 HOY: Mudanza en curso o fallida
    if (todayTime === moveDateTime) {
      if (hasNoBoxesAtAll || hasEmptyBoxes) {
        return { 
          status: 'Fallida', 
          color: hasEmptyBoxes ? '#FF9800' : '#DC3545',
          icon: hasEmptyBoxes ? 'alert-circle' : 'close-circle',
          canEdit: false, 
          canDelete: false
        };
      }
      return { 
        status: 'En curso', 
        color: '#4CAF50', 
        icon: 'business', 
        canEdit: false, 
        canDelete: false
      };
    }
    
    // 📅 FECHA FUTURA: Pendiente
    if (todayTime < moveDateTime) {
      return { 
        status: 'Pendiente', 
        color: '#FFA500', 
        icon: 'time-outline', 
        canEdit: true, 
        canDelete: true
      };
    }
    
    // ✅ FECHA PASADA: Completada o Fallida
    if (todayTime > moveDateTime) {
      if (hasNoBoxesAtAll || hasEmptyBoxes) {
        return { 
          status: 'Fallida', 
          color: hasEmptyBoxes ? '#FF9800' : '#DC3545',
          icon: hasEmptyBoxes ? 'alert-circle' : 'close-circle',
          canEdit: false, 
          canDelete: true
        };
      }
      return { 
        status: 'Completada', 
        color: '#888', 
        icon: 'checkmark-done', 
        canEdit: false, 
        canDelete: true
      };
    }
  }
  
  // ✅ PARA MALETAS (VIAJES) - VERSIÓN CORREGIDA
  if (!item.startDate) {
    return { 
      status: 'Planificado', 
      color: '#FFA500', 
      icon: 'calendar-outline', 
      canEdit: true, 
      canDelete: true
    };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let startDate, endDate;
  
  try {
    // Formato DD/MM/YYYY
    if (item.startDate.includes('/')) {
      const [day, month, year] = item.startDate.split('/');
      startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Formato YYYY-MM-DD o timestamp
      startDate = new Date(item.startDate);
      startDate.setHours(0, 0, 0, 0);
    }
    
    if (item.endDate) {
      if (item.endDate.includes('/')) {
        const [day, month, year] = item.endDate.split('/');
        endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        endDate.setHours(0, 0, 0, 0);
      } else {
        endDate = new Date(item.endDate);
        endDate.setHours(0, 0, 0, 0);
      }
    }
    
  } catch (error) {
    return { 
      status: 'Planificado', 
      color: '#FFA500', 
      icon: 'calendar-outline', 
      canEdit: true, 
      canDelete: true
    };
  }
  
  if (isNaN(startDate.getTime())) {
    return { 
      status: 'Planificado', 
      color: '#FFA500', 
      icon: 'calendar-outline', 
      canEdit: true, 
      canDelete: true
    };
  }
  
  // Convertir a tiempos comparables
  const todayTime = today.getTime();
  const startDateTime = startDate.getTime();
  const endDateTime = endDate ? endDate.getTime() : null;
  
  // 🟡 HOY es el día de inicio
  if (todayTime === startDateTime) {
    return { 
      status: 'Hoy', 
      color: '#F44336', 
      icon: 'warning', 
      canEdit: false, 
      canDelete: false
    };
  }
  
  // 📅 FECHA FUTURA: El viaje no ha empezado
  if (todayTime < startDateTime) {
    return { 
      status: 'Pendiente', 
      color: '#FFA500', 
      icon: 'time-outline', 
      canEdit: true, 
      canDelete: true
    };
  }
  
  // ✅ FECHA PASADA: Viaje completado (si tiene fecha de fin)
  if (endDateTime && todayTime > endDateTime) {
    return { 
      status: 'Completado', 
      color: '#888', 
      icon: 'checkmark-done', 
      canEdit: false, 
      canDelete: false
    };
  }
  
  // 🟢 EN CURSO: Hoy está entre startDate y endDate
  if (todayTime >= startDateTime && (!endDate || todayTime <= endDateTime)) {
    return { 
      status: 'En curso', 
      color: '#4CAF50', 
      icon: 'airplane', 
      canEdit: false, 
      canDelete: false
    };
  }
  
  // Si no hay fecha de fin pero la fecha de inicio ya pasó
  if (!endDate && todayTime > startDateTime) {
    return { 
      status: 'Completado', 
      color: '#888', 
      icon: 'checkmark-done', 
      canEdit: false, 
      canDelete: false
    };
  }
  
  return { 
    status: 'Planificado', 
    color: '#FFA500', 
    icon: 'calendar-outline', 
    canEdit: true, 
    canDelete: true
  };
};

const MaletasScreen = ({ navigation }) => {
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
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
    loadAllItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [allItems, activeFilter]);

  const loadAllItems = async () => {
    try {
      setLoading(true);
      
      const [luggage, boxes] = await Promise.all([
        getAllUserLuggage().catch(() => []),
        getAllUserBoxes().catch(() => [])
      ]);
      
      const combinedItems = [
        ...luggage.map(item => ({ 
          ...item, 
          itemType: 'luggage',
          categoria: item.categoria || 'caja',
          // ✅ Asegurarnos de que las maletas tengan startDate y endDate
          startDate: item.startDate || item.tripDates?.start,
          endDate: item.endDate || item.tripDates?.end
        })),
        ...boxes.map(item => ({ 
          ...item, 
          itemType: 'box',
          categoria: item.tipo || 'caja',
          articulos: item.items || [],
          tripName: item.moveName || 'Mudanza',
          tripDestination: `${item.moveOrigin || ''} → ${item.moveDestination || ''}`,
          tripDates: { start: item.moveDate }
        }))
      ];
      
      console.log('📦 Total elementos cargados:', combinedItems.length);
      console.log('📦 Maletas con fechas:', combinedItems
        .filter(item => item.itemType === 'luggage')
        .map(item => ({
          nombre: item.tripName,
          startDate: item.startDate,
          endDate: item.endDate,
          estado: getItemStatus(item).status
        }))
      );
      
      setAllItems(combinedItems);
    } catch (error) {
      console.log('❌ Error cargando elementos:', error);
      Alert.alert('Error', 'No se pudieron cargar los elementos');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    if (activeFilter === 'all') {
      setFilteredItems(allItems);
    } else {
      const filtered = allItems.filter(item => item.categoria === activeFilter);
      setFilteredItems(filtered);
    }
  };

  const getCounters = () => {
    const totalAll = allItems.length;
    const currentCount = filteredItems.length;

    const countersByType = {};
    CATEGORIAS_COMBINADAS.forEach(cat => {
      countersByType[cat.id] = allItems.filter(item => item.categoria === cat.id).length;
    });

    let text = '';
    if (activeFilter === 'all') {
      const luggageCount = allItems.filter(item => item.itemType === 'luggage').length;
      const boxCount = allItems.filter(item => item.itemType === 'box').length;
      text = `${currentCount} elementos (${luggageCount} maletas, ${boxCount} cajas)`;
    } else {
      const categoria = CATEGORIAS_COMBINADAS.find(cat => cat.id === activeFilter);
      text = `${currentCount} de ${countersByType[activeFilter]} ${categoria?.nombre.toLowerCase()}`;
    }

    return {
      current: currentCount,
      total: totalAll,
      text,
      countersByType
    };
  };

  // ✅ FUNCIÓN MEJORADA: Obtener estado con todas las cajas de la misma mudanza
  const getItemStatusFromItem = (item) => {
    if (item.itemType === 'box' && item.moveId) {
      const boxesFromSameMove = allItems.filter(
        i => i.itemType === 'box' && i.moveId === item.moveId
      );
      return getItemStatus(item, boxesFromSameMove);
    }
    return getItemStatus(item);
  };

  const handleEditItem = (item) => {
    const itemStatus = getItemStatusFromItem(item);
    
    if (!itemStatus.canEdit) {
      Alert.alert(
        `Elemento ${itemStatus.status}`,
        `No puedes editar ${item.itemType === 'box' ? 'cajas' : 'maletas'} de ${item.itemType === 'box' ? 'mudanzas' : 'viajes'} que están ${itemStatus.status.toLowerCase()}.`,
        [{ text: 'Entendido' }]
      );
      return;
    }
    
    closeModal();
    
    if (item.itemType === 'box') {
      navigation.navigate('NewBox', { 
        moveId: item.moveId,
        origin: item.moveOrigin,
        destination: item.moveDestination,
        moveType: item.moveType,
        originScreen: 'Maletas',
        boxToEdit: item,
        mode: 'edit'
      });
    } else {
      navigation.navigate('NewMaleta', { 
        tripId: item.tripId,
        destination: item.tripDestination,
        purpose: item.tripName,
        trip: {
          id: item.tripId,
          destination: item.tripDestination,
          purpose: item.tripName,
          startDate: item.startDate,
          endDate: item.endDate
        },
        luggageToEdit: item,
        mode: 'edit'
      });
    }
  };

  const openItemModal = (item) => {
    console.log('🔍 Abriendo modal para:', {
      nombre: item.tripName,
      tipo: item.itemType,
      startDate: item.startDate,
      endDate: item.endDate,
      estado: getItemStatusFromItem(item).status
    });
    
    setSelectedItem(item);
    setModalVisible(true);
    setDeleting(false);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setDeleting(false);
  };

  const handleDeleteItem = (item) => {
    const itemStatus = getItemStatusFromItem(item);

    if (!itemStatus.canDelete) {
      Alert.alert(
        `Elemento ${itemStatus.status}`,
        `No puedes eliminar ${item.itemType === 'box' ? 'cajas' : 'maletas'} de ${item.itemType === 'box' ? 'mudanzas' : 'viajes'} que están ${itemStatus.status.toLowerCase()}.`,
        [{ text: 'Entendido' }]
      );
      return;
    }
    
    closeModal();

    setTimeout(() => {
      Alert.alert(
        'Eliminar Elemento',
        `¿Estás seguro de eliminar esta ${getCategoriaNombre(item.categoria)}?`,
        [
          { 
            text: 'Cancelar', 
            style: 'cancel',
            onPress: () => {
              console.log('✅ Eliminación cancelada por el usuario');
            }
          },
          { 
            text: 'Eliminar', 
            style: 'destructive',
            onPress: async () => {
              console.log('✅ Usuario confirmó eliminación');
              await performDeleteItem(item);
            }
          }
        ],
        { cancelable: false }
      );
    }, 100);
  };

  const performDeleteItem = async (item) => {
    try {
      setDeleting(true);
      
      if (item.itemType === 'box') {
        console.log('🟡 Eliminando caja:', item.id, 'de mudanza:', item.moveId);
        await deleteBox(item.moveId, item.id);
        console.log('🟢 Caja eliminada');
      } else {
        console.log('🟡 Eliminando maleta:', item.id, 'de viaje:', item.tripId);
        await deleteLuggage(item.tripId, item.id);
        console.log('🟢 Maleta eliminada');
      }
      
      setAllItems(prevItems => prevItems.filter(i => i.id !== item.id));
      
      Alert.alert('✅', 'Elemento eliminado correctamente');
      
    } catch (error) {
      console.error('❌ Error eliminando elemento:', error);
      Alert.alert('Error', 'No se pudo eliminar el elemento');
    } finally {
      setDeleting(false);
    }
  };

  const getCategoriaNombre = (categoriaId) => {
    const categoria = CATEGORIAS_COMBINADAS.find(cat => cat.id === categoriaId);
    return categoria?.nombre || 'Elemento';
  };

  const getCategoriaIcon = (categoriaId) => {
    const categoria = CATEGORIAS_COMBINADAS.find(cat => cat.id === categoriaId);
    return categoria?.icon || 'bag-outline';
  };

  const getItemIcon = (item) => {
    if (item.itemType === 'box') {
      return item.isFragile ? 'warning' : 'cube';
    } else {
      const categoria = CATEGORIAS_COMBINADAS.find(cat => cat.id === item.categoria);
      return categoria?.icon || 'bag-outline';
    }
  };

  const goBack = () => {
    navigation.navigate('Home');
  };

  const renderItem = ({ item }) => {
    const categoriaNombre = getCategoriaNombre(item.categoria);
    const itemIcon = getItemIcon(item);
    const itemStatus = getItemStatusFromItem(item);
    const isBox = item.itemType === 'box';
    const destination = isBox 
      ? item.tripDestination 
      : item.tripDestination;
    const name = isBox 
      ? item.moveName || 'Mudanza'
      : item.tripName || 'Viaje';

    return (
      <TouchableOpacity 
        style={[styles.item, isBox && styles.boxItem]}
        onPress={() => openItemModal(item)}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.typeBadge, isBox && styles.boxBadge]}>
            <Ionicons 
              name={itemIcon} 
              size={16} 
              color={isBox ? '#FF6B6B' : '#2196F3'} 
            />
            <Text style={[styles.typeText, isBox && styles.boxText]}>
              {isBox ? 'Caja' : 'Maleta'}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: itemStatus.color }]}>
            <Ionicons name={itemStatus.icon} size={10} color="#FFFFFF" />
            <Text style={styles.statusText}>{itemStatus.status}</Text>
          </View>
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{name}</Text>
          
          {destination && (
            <View style={styles.destinationRow}>
              <Ionicons name="location" size={14} color="#888" />
              <Text style={styles.destination}>{destination}</Text>
            </View>
          )}

          <View style={styles.footerRow}>
            <Text style={styles.articleCount}>
              {item.articulos?.length || 0} artículos
            </Text>
            {isBox && item.isFragile && (
              <View style={styles.fragileBadge}>
                <Ionicons name="warning" size={12} color="#FFA500" />
                <Text style={styles.fragileText}>Frágil</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderModalActions = (item) => {
    const itemStatus = getItemStatusFromItem(item);
    const canEdit = itemStatus.canEdit;
    const canDelete = itemStatus.canDelete;
    const isBox = item.itemType === 'box';

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.editButton,
            !canEdit && styles.disabledButton
          ]}
          onPress={() => {
            console.log('✏️ Editando elemento:', item.id);
            handleEditItem(item);
          }}
          disabled={!canEdit || deleting}
        >
          <Ionicons 
            name="create" 
            size={20} 
            color={!canEdit ? "#666" : "#FFFFFF"} 
          />
          <Text style={[
            styles.actionButtonText,
            !canEdit && styles.disabledText
          ]}>
            {!canEdit ? `${isBox ? 'Mudanza' : 'Viaje'} ${itemStatus.status}` : 'Editar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.deleteButton,
            (!canDelete || deleting) && styles.disabledButton
          ]}
          onPress={() => {
            console.log('🗑️ Solicitando eliminación de elemento:', item.id);
            handleDeleteItem(item);
          }}
          disabled={!canDelete || deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons 
              name="trash" 
              size={20} 
              color={!canDelete ? "#666" : "#FFFFFF"} 
            />
          )}
          <Text style={[
            styles.actionButtonText,
            (!canDelete || deleting) && styles.disabledText
          ]}>
            {!canDelete ? `${isBox ? 'Mudanza' : 'Viaje'} ${itemStatus.status}` : 
             deleting ? 'Eliminando...' : 'Eliminar'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar backgroundColor="#121212" barStyle="light-content" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#BB86FC" />
          <Text style={styles.loadingText}>Cargando elementos...</Text>
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
        <Text style={styles.headerTitle}>Mis Maletas & Cajas</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>{counters.text}</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            activeFilter === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Ionicons 
            name="grid" 
            size={16} 
            color={activeFilter === 'all' ? '#FFFFFF' : '#BB86FC'} 
          />
          <Text style={[
            styles.filterText, 
            activeFilter === 'all' && styles.filterTextActive
          ]}>
            Todos
          </Text>
        </TouchableOpacity>
        
        {CATEGORIAS_COMBINADAS.slice(0, 5).map((categoria) => (
          <TouchableOpacity 
            key={categoria.id}
            style={[
              styles.filterButton, 
              activeFilter === categoria.id && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter(categoria.id)}
          >
            <Ionicons 
              name={categoria.icon} 
              size={16} 
              color={activeFilter === categoria.id ? '#FFFFFF' : '#2196F3'} 
            />
          </TouchableOpacity>
        ))}
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="cube-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>
            {activeFilter === 'all' 
              ? 'No tienes maletas ni cajas guardadas' 
              : `No tienes ${getCategoriaNombre(activeFilter).toLowerCase()}s`
            }
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('MyTrips')}
          >
            <Text style={styles.createButtonText}>
              Ir a Mis Viajes
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadAllItems}
          style={styles.flatList}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedItem ? getCategoriaNombre(selectedItem.categoria) : ''}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.itemInfoModal}>
                <Text style={styles.itemNameModal}>
                  {selectedItem.itemType === 'box' 
                    ? (selectedItem.moveName || 'Mudanza') 
                    : (selectedItem.tripName || 'Viaje')}
                </Text>
                <Text style={styles.itemDestinationModal}>
                  {selectedItem.itemType === 'box'
                    ? `${selectedItem.moveOrigin || ''} → ${selectedItem.moveDestination || ''}`
                    : selectedItem.tripDestination}
                </Text>
                <View style={[styles.statusBadgeModal, { backgroundColor: getItemStatusFromItem(selectedItem).color }]}>
                  <Ionicons name={getItemStatusFromItem(selectedItem).icon} size={12} color="#FFFFFF" />
                  <Text style={styles.statusTextModal}>{getItemStatusFromItem(selectedItem).status}</Text>
                </View>
                {selectedItem.isFragile && selectedItem.itemType === 'box' && (
                  <View style={styles.fragileModalBadge}>
                    <Ionicons name="warning" size={14} color="#FFA500" />
                    <Text style={styles.fragileModalText}>Caja Frágil</Text>
                  </View>
                )}
              </View>
            )}

            {selectedItem && (
              <View style={styles.articlesSection}>
                <Text style={styles.articlesTitle}>
                  Artículos ({selectedItem.articulos?.length || 0})
                </Text>
                <FlatList
                  data={selectedItem.articulos || []}
                  renderItem={({ item }) => (
                    <View style={styles.articleItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.articleText}>{item}</Text>
                    </View>
                  )}
                  keyExtractor={(item, index) => index.toString()}
                  style={styles.articlesList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {selectedItem && renderModalActions(selectedItem)}
          </View>
        </View>
      </Modal>
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
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    fontSize: 12,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  flatList: {
    flex: 1,
  },
  item: {
    backgroundColor: '#1E1E1E',
    marginBottom: 15,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  boxItem: {
    borderLeftColor: '#FF6B6B',
  },
  itemHeader: {
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
  boxBadge: {
    backgroundColor: '#2A2A2A',
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  boxText: {
    color: '#FF6B6B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusBadgeModal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusTextModal: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  destination: {
    fontSize: 14,
    color: '#888',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  articleCount: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  fragileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  fragileText: {
    fontSize: 10,
    color: '#FFA500',
    fontWeight: '500',
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
  disabledButton: {
    backgroundColor: '#666',
  },
  disabledText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 0,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  itemInfoModal: {
    padding: 20,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    margin: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  itemNameModal: {
    color: '#BB86FC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDestinationModal: {
    color: '#BB86FC',
    fontSize: 14,
  },
  fragileModalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  fragileModalText: {
    fontSize: 12,
    color: '#FFA500',
    fontWeight: '500',
  },
  articlesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  articlesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  articlesList: {
    maxHeight: 200,
  },
  articleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  articleText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MaletasScreen;