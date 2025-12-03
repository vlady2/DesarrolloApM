// En MyTripsScreen.js, reemplaza las importaciones y funciones:

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
import { deleteMove, getAllUserItems } from '../../firebase/moveService'; // ✅ NUEVA IMPORTACIÓN
import { deleteTrip } from '../../firebase/tripService';

// ✅ FUNCIÓN CENTRAL MEJORADA: Verificar estado del viaje o mudanza
const getItemStatus = (item) => {
  const isMoving = item.itemType === 'move' || item.type === 'mudanza' || item.type === 'moving';
  
  // Para mudanzas
  if (isMoving) {
    if (!item.moveDate) {
      return { 
        status: 'Planificada', 
        color: '#FFA500', 
        icon: 'calendar-outline', 
        canEdit: true, 
        canDelete: true,
        canEditItems: true,
        canDeleteItems: true
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
        status: 'Planificada', 
        color: '#FFA500', 
        icon: 'calendar-outline', 
        canEdit: true, 
        canDelete: true,
        canEditItems: true,
        canDeleteItems: true
      };
    }
    
    if (isNaN(moveDate.getTime())) {
      return { 
        status: 'Planificada', 
        color: '#FFA500', 
        icon: 'calendar-outline', 
        canEdit: true, 
        canDelete: true,
        canEditItems: true,
        canDeleteItems: true
      };
    }
    
    const todayStr = today.toDateString();
    const moveDateStr = moveDate.toDateString();
    
    if (todayStr === moveDateStr) {
      return { 
        status: 'Hoy', 
        color: '#F44336', 
        icon: 'warning', 
        canEdit: false, 
        canDelete: false,
        canEditItems: false,
        canDeleteItems: false
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
        canDeleteItems: true
      };
    }
    
    if (today > moveDate) {
      return { 
        status: 'Completada', 
        color: '#888', 
        icon: 'checkmark-done', 
        canEdit: false, 
        canDelete: false,
        canEditItems: false,
        canDeleteItems: false
      };
    }
    
    return { 
      status: 'Planificada', 
      color: '#FFA500', 
      icon: 'calendar-outline', 
      canEdit: true, 
      canDelete: true,
      canEditItems: true,
      canDeleteItems: true
    };
  }
  
  // Para viajes
  if (!item.startDate) {
    return { 
      status: 'Planificado', 
      color: '#FFA500', 
      icon: 'calendar-outline', 
      canEdit: true, 
      canDelete: true,
      canEditItems: true,
      canDeleteItems: true
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
      status: 'Planificado', 
      color: '#FFA500', 
      icon: 'calendar-outline', 
      canEdit: true, 
      canDelete: true,
      canEditItems: true,
      canDeleteItems: true
    };
  }
  
  if (isNaN(startDate.getTime())) {
    return { 
      status: 'Planificado', 
      color: '#FFA500', 
      icon: 'calendar-outline', 
      canEdit: true, 
      canDelete: true,
      canEditItems: true,
      canDeleteItems: true
    };
  }
  
  const todayStr = today.toDateString();
  const startDateStr = startDate.toDateString();
  const endDateStr = endDate ? endDate.toDateString() : null;
  
  if (todayStr === startDateStr) {
    return { 
      status: 'Hoy', 
      color: '#F44336', 
      icon: 'warning', 
      canEdit: false, 
      canDelete: false,
      canEditItems: false,
      canDeleteItems: false
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
      canDeleteItems: true
    };
  }
  
  if (endDate && !isNaN(endDate.getTime()) && today > endDate) {
    return { 
      status: 'Completado', 
      color: '#888', 
      icon: 'checkmark-done', 
      canEdit: false, 
      canDelete: false,
      canEditItems: false,
      canDeleteItems: false
    };
  }
  
  if (today >= startDate && (!endDate || today <= endDate)) {
    return { 
      status: 'En curso', 
      color: '#4CAF50', 
      icon: 'airplane', 
      canEdit: false, 
      canDelete: false,
      canEditItems: false,
      canDeleteItems: false
    };
  }
  
  return { 
    status: 'Planificado', 
    color: '#FFA500', 
    icon: 'calendar-outline', 
    canEdit: true, 
    canDelete: true,
    canEditItems: true,
    canDeleteItems: true
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
  }, [items, activeFilter, activeStatusFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const allItems = await getAllUserItems();
      setItems(allItems);
      
      await loadItemCounts(allItems);
      
    } catch (error) {
      console.log('❌ Error cargando elementos:', error);
      Alert.alert('Error', 'No se pudieron cargar los elementos');
    } finally {
      setLoading(false);
    }
  };

  const loadItemCounts = async (itemsList) => {
    const luggageCountsTemp = {};
    const boxCountsTemp = {};
    
    for (const item of itemsList) {
      const isMoving = item.itemType === 'move';
      
      try {
        if (isMoving) {
          const boxesList = await getBoxesByMoveId(item.id);
          boxCountsTemp[item.id] = boxesList.length;
          luggageCountsTemp[item.id] = 0;
        } else {
          const luggageList = await getLuggageByTripId(item.id);
          luggageCountsTemp[item.id] = luggageList.length;
          boxCountsTemp[item.id] = 0;
        }
      } catch (error) {
        console.log(`❌ Error cargando conteo para ${isMoving ? 'mudanza' : 'viaje'} ${item.id}:`, error);
        luggageCountsTemp[item.id] = 0;
        boxCountsTemp[item.id] = 0;
      }
    }
    
    setLuggageCounts(luggageCountsTemp);
    setBoxCounts(boxCountsTemp);
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
        const itemStatus = getItemStatus(item);
        return itemStatus.status.toLowerCase() === activeStatusFilter.toLowerCase();
      });
    }

    setFilteredItems(filtered);
  };

  const getStatusCount = (status) => {
    return items.filter(item => {
      const itemStatus = getItemStatus(item);
      return itemStatus.status.toLowerCase() === status.toLowerCase();
    }).length;
  };

  const getStatusFilterText = () => {
    switch(activeStatusFilter) {
      case 'all': return 'Todos los estados';
      case 'pendiente': return 'Pendientes';
      case 'en curso': return 'En curso';
      case 'completado': 
      case 'completada': return 'Completados';
      case 'hoy': return 'Hoy';
      case 'planificado': 
      case 'planificada': return 'Planificados';
      default: return 'Todos los estados';
    }
  };

  const getStatusFilterColor = () => {
    switch(activeStatusFilter) {
      case 'pendiente': return '#FFA500';
      case 'en curso': return '#4CAF50';
      case 'completado': 
      case 'completada': return '#888';
      case 'hoy': return '#F44336';
      case 'planificado': 
      case 'planificada': return '#FFA500';
      default: return '#BB86FC';
    }
  };

  const getStatusFilterIcon = () => {
    switch(activeStatusFilter) {
      case 'pendiente': return 'time-outline';
      case 'en curso': return 'airplane';
      case 'completado': 
      case 'completada': return 'checkmark-done';
      case 'hoy': return 'warning';
      case 'planificado': 
      case 'planificada': return 'calendar-outline';
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

  const getItemCount = (item) => {
    const isMoving = item.itemType === 'move';
    
    if (isMoving) {
      return boxCounts[item.id] || 0;
    } else {
      return luggageCounts[item.id] || 0;
    }
  };

  const getDisplayType = (item) => {
    return item.itemType === 'move' ? 'moving' : 'trips';
  };

  const handleDeleteItem = async (item) => {
    const isMoving = item.itemType === 'move';
    const itemStatus = getItemStatus(item);
    
    if (!itemStatus.canDelete) {
      Alert.alert(
        `${isMoving ? 'Mudanza' : 'Viaje'} ${itemStatus.status}`,
        `No puedes eliminar ${isMoving ? 'mudanzas' : 'viajes'} que están ${itemStatus.status.toLowerCase()}.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

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
    
    if (isMoving) {
      navigation.navigate('MoveDetail', { 
        moveId: item.id,
        moveOrigin: item.origin,
        moveDestination: item.destination,
        moveType: item.moveType
      });
    } else {
      navigation.navigate('TripDetail', { trip: item });
    }
  };

  const navigateToEditItem = (item) => {
    const isMoving = item.itemType === 'move';
    const itemStatus = getItemStatus(item);
    
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
    const itemStatus = getItemStatus(item);
    const mainTitle = item.purpose || item.destination || 
                     (isMoving ? (item.nombre || 'Mudanza') : 'Viaje');
    const itemCount = getItemCount(item);
    
    const locationText = isMoving 
      ? `${item.origin || 'Origen'} → ${item.destination || 'Destino'}`
      : item.destination || '';
    
    const dateText = isMoving 
      ? item.moveDate || ''
      : `${item.startDate || ''} ${item.endDate ? `- ${item.endDate}` : ''}`;

    return (
      <TouchableOpacity 
        style={styles.tripItem}
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
          <Text style={styles.tripTitle}>{mainTitle}</Text>
          
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

          <View style={styles.footerRow}>
            <View style={styles.luggageInfo}>
              <Ionicons 
                name={isMoving ? 'cube' : 'bag'} 
                size={14} 
                color="#888" 
              />
              <Text style={styles.tripLuggage}>
                {itemCount} {isMoving ? 'caja' : 'maleta'}{itemCount !== 1 ? 's' : ''}
              </Text>
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
            {['all', 'pendiente', 'en curso', 'hoy', 'completado', 'planificado'].map((status) => (
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
                              status === 'hoy' ? '#F44336' :
                              status === 'completado' ? '#888' :
                              '#FFA500'
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
                       status === 'hoy' ? `Hoy (${getStatusCount('hoy')})` :
                       status === 'completado' ? `Completados (${getStatusCount('completado')})` :
                       `Planificados (${getStatusCount('planificado')})`}
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

// Los estilos se mantienen exactamente iguales
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
    color: '#FF9800',
    fontWeight: '500',
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