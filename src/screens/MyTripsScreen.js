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
import { getLuggageByTripId } from '../../firebase/luggageService';
import { deleteTrip, getUserTrips } from '../../firebase/tripService';

// ✅ FUNCIÓN CENTRAL MEJORADA: Verificar estado del viaje con permisos
const getTripStatus = (trip) => {
  if (!trip.startDate) {
    return { 
      status: 'Planificado', 
      color: '#FFA500', 
      icon: 'calendar-outline', 
      canEdit: true, 
      canDelete: true,
      canEditLuggage: true,
      canDeleteLuggage: true
    };
  }
  
  const today = new Date();
  let startDate, endDate;
  
  try {
    if (trip.startDate.includes('/')) {
      const [day, month, year] = trip.startDate.split('/');
      startDate = new Date(year, month - 1, day);
    } else {
      startDate = new Date(trip.startDate);
    }
    
    if (trip.endDate && trip.endDate.includes('/')) {
      const [day, month, year] = trip.endDate.split('/');
      endDate = new Date(year, month - 1, day);
    } else if (trip.endDate) {
      endDate = new Date(trip.endDate);
    }
  } catch (error) {
    return { 
      status: 'Planificado', 
      color: '#FFA500', 
      icon: 'calendar-outline', 
      canEdit: true, 
      canDelete: true,
      canEditLuggage: true,
      canDeleteLuggage: true
    };
  }
  
  if (isNaN(startDate.getTime())) {
    return { 
      status: 'Planificado', 
      color: '#FFA500', 
      icon: 'calendar-outline', 
      canEdit: true, 
      canDelete: true,
      canEditLuggage: true,
      canDeleteLuggage: true
    };
  }
  
  if (today < startDate) {
    return { 
      status: 'Pendiente', 
      color: '#FFA500', 
      icon: 'time-outline', 
      canEdit: true, 
      canDelete: true,
      canEditLuggage: true,
      canDeleteLuggage: true
    };
  }
  
  if (endDate && !isNaN(endDate.getTime()) && today > endDate) {
    return { 
      status: 'Completado', 
      color: '#888', 
      icon: 'checkmark-done', 
      canEdit: false, 
      canDelete: false,
      canEditLuggage: false,
      canDeleteLuggage: false
    };
  }
  
  if (today >= startDate && (!endDate || today <= endDate)) {
    return { 
      status: 'En curso', 
      color: '#4CAF50', 
      icon: 'airplane', 
      canEdit: false, 
      canDelete: false,
      canEditLuggage: false,
      canDeleteLuggage: false
    };
  }
  
  return { 
    status: 'Planificado', 
    color: '#FFA500', 
    icon: 'calendar-outline', 
    canEdit: true, 
    canDelete: true,
    canEditLuggage: true,
    canDeleteLuggage: true
  };
};

const MyTripsScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [luggageCounts, setLuggageCounts] = useState({});
  
  const insets = useSafeAreaInsets();

  // ✅ SOLUCIÓN CORRECTA: Manejar solo el botón físico de Android
  useEffect(() => {
    const backAction = () => {
      // Solo manejar el back físico, no el navigation normal
      if (navigation.isFocused()) {
        navigation.navigate('Home');
        return true; // Prevenir el comportamiento por defecto
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
    loadTrips();
  }, []);

  useEffect(() => {
    filterTrips();
  }, [trips, activeFilter, activeStatusFilter]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const userTrips = await getUserTrips();
      setTrips(userTrips);
      
      await loadLuggageCounts(userTrips);
      
    } catch (error) {
      console.log('❌ Error cargando viajes:', error);
      Alert.alert('Error', 'No se pudieron cargar los viajes');
    } finally {
      setLoading(false);
    }
  };

  const loadLuggageCounts = async (tripsList) => {
    const counts = {};
    
    for (const trip of tripsList) {
      try {
        const luggageList = await getLuggageByTripId(trip.id);
        counts[trip.id] = luggageList.length; 
      } catch (error) {
        console.log(`❌ Error cargando maletas para viaje ${trip.id}:`, error);
        counts[trip.id] = 0;
      }
    }
    
    setLuggageCounts(counts);
  };

  // ✅ FUNCIÓN MEJORADA: Filtrar por tipo y estado
  const filterTrips = () => {
    let filtered = [...trips];

    // Primero filtrar por tipo (viaje/mudanza)
    if (activeFilter === 'trips') {
      filtered = filtered.filter(trip => 
        trip.type === 'viaje' || trip.type === 'trips'
      );
    } else if (activeFilter === 'moving') {
      filtered = filtered.filter(trip => 
        trip.type === 'mudanza' || trip.type === 'moving'
      );
    }

    // Luego filtrar por estado
    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter(trip => {
        const tripStatus = getTripStatusForItem(trip);
        return tripStatus.status.toLowerCase() === activeStatusFilter.toLowerCase();
      });
    }

    setFilteredTrips(filtered);
  };

  // ✅ NUEVA FUNCIÓN: Obtener contador para estados
  const getStatusCount = (status) => {
    return trips.filter(trip => {
      const tripStatus = getTripStatusForItem(trip);
      return tripStatus.status.toLowerCase() === status.toLowerCase();
    }).length;
  };

  // ✅ NUEVA FUNCIÓN: Obtener texto del filtro de estado seleccionado
  const getStatusFilterText = () => {
    switch(activeStatusFilter) {
      case 'all': return 'Todos los estados';
      case 'pendiente': return 'Pendientes';
      case 'en curso': return 'En curso';
      case 'completado': return 'Completados';
      case 'planificado': return 'Planificados';
      default: return 'Todos los estados';
    }
  };

  // ✅ NUEVA FUNCIÓN: Obtener color para el filtro de estado
  const getStatusFilterColor = () => {
    switch(activeStatusFilter) {
      case 'pendiente': return '#FFA500';
      case 'en curso': return '#4CAF50';
      case 'completado': return '#888';
      case 'planificado': return '#FFA500';
      default: return '#BB86FC';
    }
  };

  // ✅ NUEVA FUNCIÓN: Obtener icono para el filtro de estado
  const getStatusFilterIcon = () => {
    switch(activeStatusFilter) {
      case 'pendiente': return 'time-outline';
      case 'en curso': return 'airplane';
      case 'completado': return 'checkmark-done';
      case 'planificado': return 'calendar-outline';
      default: return 'filter';
    }
  };

  // ✅ NUEVA FUNCIÓN: Calcular contadores mejorada
  const getCounters = () => {
    const totalTrips = trips.filter(trip => 
      trip.type === 'viaje' || trip.type === 'trips'
    ).length;
    
    const totalMovings = trips.filter(trip => 
      trip.type === 'mudanza' || trip.type === 'moving'
    ).length;
    
    const totalAll = trips.length;
    
    let text = '';
    if (activeStatusFilter !== 'all') {
      const statusText = getStatusFilterText().toLowerCase();
      text = `${filteredTrips.length} ${statusText}`;
    } else {
      switch(activeFilter) {
        case 'all':
          text = `${filteredTrips.length} de ${totalAll} elementos`;
          break;
        case 'trips':
          text = `${filteredTrips.length} de ${totalTrips} viajes`;
          break;
        case 'moving':
          text = `${filteredTrips.length} de ${totalMovings} mudanzas`;
          break;
        default:
          text = `${filteredTrips.length} de ${totalAll} elementos`;
      }
    }
    
    return {
      current: filteredTrips.length,
      total: totalAll,
      text: text
    };
  };

  const getLuggageCount = (tripId) => {
    return luggageCounts[tripId] || 0;
  };

  const getDisplayType = (trip) => {
    const type = trip.type;
    if (type === 'viaje' || type === 'trips') return 'trips';
    if (type === 'mudanza' || type === 'moving') return 'moving';
    return 'trips';
  };

  // ✅ FUNCIÓN CORREGIDA: Usar nombre diferente para evitar recursión
  const getTripStatusForItem = (trip) => {
    return getTripStatus(trip);
  };

  // ✅ FUNCIÓN MEJORADA: Eliminar viaje con verificación de estado
  const handleDeleteTrip = async (tripId, tripName) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    const tripStatus = getTripStatusForItem(trip);
    
    if (!tripStatus.canDelete) {
      Alert.alert(
        `Viaje ${tripStatus.status}`,
        `No puedes eliminar viajes que están ${tripStatus.status.toLowerCase()}.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    Alert.alert(
      'Eliminar',
      `¿Estás seguro de eliminar "${tripName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: async () => {
            try {
              await deleteTrip(tripId);
              setTrips(trips.filter(trip => trip.id !== tripId));
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // ✅ NAVEGACIÓN NORMAL - Sin replace
  const navigateToTripDetail = (trip) => {
    navigation.navigate('TripDetail', { trip });
  };

  // ✅ FUNCIÓN MEJORADA: Navegar a editar viaje con verificación de estado
  const navigateToEditTrip = (trip) => {
    const tripStatus = getTripStatusForItem(trip);
    
    if (!tripStatus.canEdit) {
      Alert.alert(
        `Viaje ${tripStatus.status}`,
        `No puedes editar viajes que están ${tripStatus.status.toLowerCase()}.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    navigation.navigate('EditTrip', { 
      trip, 
      origin: 'MyTrips'
    });
  };

  const navigateToNewTrip = () => {
    navigation.navigate('NewTrip');
  };

  // ✅ Botón de back personalizado - Navegación normal
  const goBack = () => {
    navigation.navigate('Home');
  };

  const renderTripItem = ({ item }) => {
    const displayType = getDisplayType(item);
    const tripStatus = getTripStatusForItem(item);
    const isMoving = displayType === 'moving';
    const mainTitle = item.purpose || item.destination || (isMoving ? 'Mudanza' : 'Viaje');
    const luggageCount = getLuggageCount(item.id);

    return (
      <TouchableOpacity 
        style={styles.tripItem}
        onPress={() => navigateToTripDetail(item)}
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
          <View style={[styles.statusBadge, { backgroundColor: tripStatus.color }]}>
            <Ionicons name={tripStatus.icon} size={12} color="#FFFFFF" />
            <Text style={styles.statusText}>{tripStatus.status}</Text>
          </View>
        </View>

        <View style={styles.tripInfo}>
          <Text style={styles.tripTitle}>{mainTitle}</Text>
          
          {item.destination ? (
            <View style={styles.destinationRow}>
              <Ionicons name="location" size={14} color="#888" />
              <Text style={styles.tripDestination}>{item.destination}</Text>
            </View>
          ) : null}

          <View style={styles.datesRow}>
            <Ionicons name="calendar" size={14} color="#888" />
            <Text style={styles.tripDates}>
              {item.startDate} {item.endDate ? `- ${item.endDate}` : ''}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.luggageInfo}>
              <Ionicons name="bag" size={14} color="#888" />
              <Text style={styles.tripLuggage}>
                {luggageCount} maleta{luggageCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tripActions}>
          {/* ✅ BOTÓN EDITAR CORREGIDO */}
          <TouchableOpacity 
            style={[
              styles.actionButton,
              !tripStatus.canEdit && styles.disabledButton
            ]}
            onPress={() => navigateToEditTrip(item)}
            disabled={!tripStatus.canEdit}
          >
            <Ionicons 
              name="create" 
              size={20} 
              color={!tripStatus.canEdit ? "#666" : "#2196F3"} 
            />
          </TouchableOpacity>
          
          {/* ✅ BOTÓN ELIMINAR */}
          <TouchableOpacity 
            style={[
              styles.actionButton,
              !tripStatus.canDelete && styles.disabledButton
            ]}
            onPress={() => handleDeleteTrip(item.id, mainTitle)}
            disabled={!tripStatus.canDelete}
          >
            <Ionicons 
              name="trash" 
              size={20} 
              color={!tripStatus.canDelete ? "#666" : "#F44336"} 
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
          <Text style={styles.loadingText}>Cargando viajes...</Text>
        </View>
      </View>
    );
  }

  const counters = getCounters();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      {/* ✅ Header con navegación normal */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Viajes y Mudanzas</Text>
        <View style={styles.placeholder} />
      </View>

      {/* ✅ CONTADOR DE ELEMENTOS */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>{counters.text}</Text>
      </View>

      {/* ✅ FILTROS POR TIPO */}
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

      {/* ✅ NUEVO: FILTRO POR ESTADO - LISTA DESPLEGABLE */}
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
            {['all', 'pendiente', 'en curso', 'completado', 'planificado'].map((status) => (
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

      {filteredTrips.length === 0 ? (
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
            onPress={navigateToNewTrip}
          >
            <Text style={styles.createButtonText}>
              Crear {activeFilter === 'moving' ? 'Mudanza' : 'Viaje'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadTrips}
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
  // ✅ NUEVO ESTILO: Contador
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
  // ✅ NUEVOS ESTILOS: Filtro por estado
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
  // ✅ NUEVO ESTILO: Botón deshabilitado
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