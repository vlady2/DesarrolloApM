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
import { deleteLuggage, getAllUserLuggage } from '../../firebase/luggageService';

// ✅ Categorías de maletas (igual que en NewMaletaScreen)
const CATEGORIAS_MALETAS = [
  { id: 'bolson', nombre: 'Bolson', icon: 'bag-outline' },
  { id: 'mano', nombre: 'Maleta de Mano', icon: 'briefcase-outline' },
  { id: 'mediana', nombre: 'Maleta Mediana', icon: 'business-outline' },
  { id: 'grande', nombre: 'Maleta Grande', icon: 'archive-outline' },
  { id: 'extra_grande', nombre: 'Maleta Extra Grande', icon: 'cube-outline' },
  { id: 'caja', nombre: 'Caja', icon: 'cube-outline' }
];

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

const MaletasScreen = ({ navigation }) => {
  const [allLuggage, setAllLuggage] = useState([]);
  const [filteredLuggage, setFilteredLuggage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLuggage, setSelectedLuggage] = useState(null);
  
  const insets = useSafeAreaInsets();

  // ✅ Manejar back button
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
    loadAllLuggage();
  }, []);

  useEffect(() => {
    filterLuggage();
  }, [allLuggage, activeFilter]);

  const loadAllLuggage = async () => {
    try {
      setLoading(true);
      const luggage = await getAllUserLuggage();
      setAllLuggage(luggage);
    } catch (error) {
      console.log('❌ Error cargando maletas:', error);
      Alert.alert('Error', 'No se pudieron cargar las maletas');
    } finally {
      setLoading(false);
    }
  };

  const filterLuggage = () => {
    if (activeFilter === 'all') {
      setFilteredLuggage(allLuggage);
    } else {
      const filtered = allLuggage.filter(item => item.categoria === activeFilter);
      setFilteredLuggage(filtered);
    }
  };

  // ✅ Calcular contadores (como en MyTripsScreen)
  const getCounters = () => {
    const totalAll = allLuggage.length;
    const currentCount = filteredLuggage.length;

    const countersByType = {};
    CATEGORIAS_MALETAS.forEach(cat => {
      countersByType[cat.id] = allLuggage.filter(item => item.categoria === cat.id).length;
    });

    let text = '';
    if (activeFilter === 'all') {
      text = `${currentCount} de ${totalAll} maletas`;
    } else {
      const categoria = CATEGORIAS_MALETAS.find(cat => cat.id === activeFilter);
      text = `${currentCount} de ${countersByType[activeFilter]} ${categoria?.nombre.toLowerCase()}`;
    }

    return {
      current: currentCount,
      total: totalAll,
      text,
      countersByType
    };
  };

  // ✅ FUNCIÓN ACTUALIZADA: Determinar estado del viaje desde los datos de la maleta
  const getTripStatusFromLuggage = (luggage) => {
    const tripData = {
      startDate: luggage.tripDates?.start,
      endDate: luggage.tripDates?.end
    };
    return getTripStatus(tripData);
  };

  // ✅ FUNCIÓN MEJORADA: Verificar estado del viaje antes de editar
  const handleEditLuggage = (luggage) => {
    const tripStatus = getTripStatusFromLuggage(luggage);
    
    if (!tripStatus.canEditLuggage) {
      Alert.alert(
        `Viaje ${tripStatus.status}`,
        `No puedes editar maletas de viajes que están ${tripStatus.status.toLowerCase()}.`,
        [{ text: 'Entendido' }]
      );
      return;
    }
    
    closeModal();
    navigation.navigate('NewMaleta', { 
      tripId: luggage.tripId,
      destination: luggage.tripDestination,
      purpose: luggage.tripName,
      trip: {
        id: luggage.tripId,
        destination: luggage.tripDestination,
        purpose: luggage.tripName,
        startDate: luggage.tripDates?.start,
        endDate: luggage.tripDates?.end
      },
      luggageToEdit: luggage,
      mode: 'edit'
    });
  };

  // ✅ Abrir modal con maleta seleccionada
  const openLuggageModal = (luggage) => {
    setSelectedLuggage(luggage);
    setModalVisible(true);
  };

  // ✅ Cerrar modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedLuggage(null);
  };

  // ✅ FUNCIÓN MEJORADA: Eliminar maleta con verificación de estado
  const handleDeleteLuggage = async (luggage) => {
    const tripStatus = getTripStatusFromLuggage(luggage);
    
    if (!tripStatus.canDeleteLuggage) {
      Alert.alert(
        `Viaje ${tripStatus.status}`,
        `No puedes eliminar maletas de viajes que están ${tripStatus.status.toLowerCase()}.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    Alert.alert(
      'Eliminar Maleta',
      `¿Estás seguro de eliminar esta ${getCategoriaNombre(luggage.categoria)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: async () => {
            try {
              await deleteLuggage(luggage.tripId, luggage.id);
              setAllLuggage(allLuggage.filter(item => item.id !== luggage.id));
              closeModal();
              Alert.alert('✅', 'Maleta eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la maleta');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // ✅ Obtener nombre de categoría
  const getCategoriaNombre = (categoriaId) => {
    const categoria = CATEGORIAS_MALETAS.find(cat => cat.id === categoriaId);
    return categoria?.nombre || 'Maleta';
  };

  // ✅ Obtener icono de categoría
  const getCategoriaIcon = (categoriaId) => {
    const categoria = CATEGORIAS_MALETAS.find(cat => cat.id === categoriaId);
    return categoria?.icon || 'bag-outline';
  };

  // ✅ Navegación normal de regreso
  const goBack = () => {
    navigation.navigate('Home');
  };

  // ✅ MODIFICADO: Renderizar item de maleta con estado del viaje
  const renderLuggageItem = ({ item }) => {
    const categoriaNombre = getCategoriaNombre(item.categoria);
    const categoriaIcon = getCategoriaIcon(item.categoria);
    const tripStatus = getTripStatusFromLuggage(item);

    return (
      <TouchableOpacity 
        style={styles.luggageItem}
        onPress={() => openLuggageModal(item)}
      >
        <View style={styles.luggageHeader}>
          <View style={styles.typeBadge}>
            <Ionicons name={categoriaIcon} size={16} color="#2196F3" />
            <Text style={styles.typeText}>{categoriaNombre}</Text>
          </View>
          
          {/* ✅ MOSTRAR ESTADO DEL VIAJE */}
          <View style={[styles.statusBadge, { backgroundColor: tripStatus.color }]}>
            <Ionicons name={tripStatus.icon} size={10} color="#FFFFFF" />
            <Text style={styles.statusText}>{tripStatus.status}</Text>
          </View>
        </View>

        <View style={styles.luggageInfo}>
          <Text style={styles.tripName}>{item.tripName}</Text>
          
          <View style={styles.destinationRow}>
            <Ionicons name="location" size={14} color="#888" />
            <Text style={styles.destination}>{item.tripDestination}</Text>
          </View>

          <View style={styles.datesRow}>
            <Ionicons name="calendar" size={14} color="#888" />
            <Text style={styles.dates}>
              {item.tripDates?.start} {item.tripDates?.end ? `- ${item.tripDates.end}` : ''}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.articleCount}>
              {item.articulos?.length || 0} artículos
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ✅ FUNCIÓN ACTUALIZADA: Renderizar botones de acción con verificación de estado
  const renderModalActions = (luggage) => {
    const tripStatus = getTripStatusFromLuggage(luggage);
    const canEdit = tripStatus.canEditLuggage;
    const canDelete = tripStatus.canDeleteLuggage;

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.editButton,
            !canEdit && styles.disabledButton
          ]}
          onPress={() => handleEditLuggage(luggage)}
          disabled={!canEdit}
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
            {!canEdit ? `Viaje ${tripStatus.status}` : 'Editar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.actionButton, 
            styles.deleteButton,
            !canDelete && styles.disabledButton
          ]}
          onPress={() => handleDeleteLuggage(luggage)}
          disabled={!canDelete}
        >
          <Ionicons 
            name="trash" 
            size={20} 
            color={!canDelete ? "#666" : "#FFFFFF"} 
          />
          <Text style={[
            styles.actionButtonText,
            !canDelete && styles.disabledText
          ]}>
            {!canDelete ? `Viaje ${tripStatus.status}` : 'Eliminar'}
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
          <Text style={styles.loadingText}>Cargando maletas...</Text>
        </View>
      </View>
    );
  }

  const counters = getCounters();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Maletas & Cajas</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Contador */}
      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>{counters.text}</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        {CATEGORIAS_MALETAS.map((categoria) => (
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
            <Text style={[
              styles.filterText, 
              activeFilter === categoria.id && styles.filterTextActive
            ]}>
              {categoria.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredLuggage.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="bag-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>
            {activeFilter === 'all' 
              ? 'No tienes maletas guardadas' 
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
          data={filteredLuggage}
          renderItem={renderLuggageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadAllLuggage}
          style={styles.flatList}
        />
      )}

      {/* Modal de Detalles y Acciones */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedLuggage ? getCategoriaNombre(selectedLuggage.categoria) : ''}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Información del Viaje */}
            {selectedLuggage && (
              <View style={styles.tripInfoModal}>
                <Text style={styles.tripNameModal}>{selectedLuggage.tripName}</Text>
                <Text style={styles.tripDestinationModal}>{selectedLuggage.tripDestination}</Text>
                {/* ✅ MOSTRAR ESTADO DEL VIAJE EN MODAL */}
                <View style={[styles.statusBadgeModal, { backgroundColor: getTripStatusFromLuggage(selectedLuggage).color }]}>
                  <Ionicons name={getTripStatusFromLuggage(selectedLuggage).icon} size={12} color="#FFFFFF" />
                  <Text style={styles.statusTextModal}>{getTripStatusFromLuggage(selectedLuggage).status}</Text>
                </View>
              </View>
            )}

            {/* Lista de Artículos */}
            {selectedLuggage && (
              <View style={styles.articlesSection}>
                <Text style={styles.articlesTitle}>
                  Artículos ({selectedLuggage.articulos?.length || 0})
                </Text>
                <FlatList
                  data={selectedLuggage.articulos || []}
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

            {/* ✅ MODIFICADO: Botones de Acción con verificación de estado */}
            {selectedLuggage && renderModalActions(selectedLuggage)}

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
    flexWrap: 'wrap',
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
  luggageItem: {
    backgroundColor: '#1E1E1E',
    marginBottom: 15,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  luggageHeader: {
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
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  // ✅ NUEVOS ESTILOS: Estado del viaje
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
  articleCount: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  luggageInfo: {
    flex: 1,
  },
  tripName: {
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
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dates: {
    fontSize: 14,
    color: '#BB86FC',
  },
  // ✅ NUEVO ESTILO: Footer row
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
  // ✅ NUEVOS ESTILOS: Botones deshabilitados
  disabledButton: {
    backgroundColor: '#666',
  },
  disabledText: {
    color: '#999',
  },
  // Modal Styles
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
  tripInfoModal: {
    padding: 20,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    margin: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  tripNameModal: {
    color: '#BB86FC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tripDestinationModal: {
    color: '#BB86FC',
    fontSize: 14,
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