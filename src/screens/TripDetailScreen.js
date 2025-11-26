import { useEffect, useState } from 'react';
import {
  BackHandler,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getLuggageByTripId } from '../../firebase/luggageService';

const TripDetailScreen = ({ route, navigation }) => {
  const { trip } = route.params;
  const [luggage, setLuggage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLuggage, setSelectedLuggage] = useState(null);
  const [showLuggageModal, setShowLuggageModal] = useState(false);
  
  const insets = useSafeAreaInsets();

  // ✅ CORREGIDO: Manejar el botón físico de back
  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
        navigation.navigate('MyTrips');
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
    loadLuggage();
  }, [trip.id]);

  const loadLuggage = async () => {
    try {
      console.log('🟡 Buscando maletas para tripId:', trip.id);
      const luggageList = await getLuggageByTripId(trip.id);
      console.log('🟢 Total maletas encontradas:', luggageList.length, 'para tripId:', trip.id);
      setLuggage(luggageList);
    } catch (error) {
      console.log('❌ Error cargando maletas:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN MEJORADA: Formatear fechas con manejo robusto
  const formatDate = (dateString) => {
    console.log('📅 Fecha recibida en formatDate:', dateString);
    
    if (!dateString || dateString === 'undefined' || dateString === 'null') {
      return 'No especificada';
    }
    
    try {
      let date;
      
      // Verificar si ya es una fecha formateada
      if (dateString.includes('/') && dateString.split('/').length === 3) {
        const [day, month, year] = dateString.split('/');
        // Validar que los componentes sean números válidos
        if (day && month && year && !isNaN(day) && !isNaN(month) && !isNaN(year)) {
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          return 'Fecha inválida';
        }
      } else {
        // Intentar parsear como fecha ISO
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error('❌ Error formateando fecha:', error, 'Fecha:', dateString);
      return 'Fecha inválida';
    }
  };

  // ✅ FUNCIÓN MEJORADA: Determinar estado del viaje
  const getTripStatus = () => {
    console.log('📅 Verificando estado del viaje - startDate:', trip.startDate, 'endDate:', trip.endDate);
    
    if (!trip.startDate || trip.startDate === 'undefined') {
      return { status: 'Planificado', color: '#FFA500' };
    }
    
    const today = new Date();
    let startDate, endDate;
    
    try {
      if (trip.startDate.includes('/') && trip.startDate.split('/').length === 3) {
        const [day, month, year] = trip.startDate.split('/');
        startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        startDate = new Date(trip.startDate);
      }
      
      if (trip.endDate && trip.endDate !== 'undefined' && trip.endDate.includes('/') && trip.endDate.split('/').length === 3) {
        const [day, month, year] = trip.endDate.split('/');
        endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else if (trip.endDate && trip.endDate !== 'undefined') {
        endDate = new Date(trip.endDate);
      }
    } catch (error) {
      console.error('❌ Error procesando fechas:', error);
      return { status: 'Planificado', color: '#FFA500' };
    }
    
    if (isNaN(startDate.getTime())) return { status: 'Planificado', color: '#FFA500' };
    
    if (today < startDate) return { status: 'Pendiente', color: '#FFA500' };
    if (endDate && !isNaN(endDate.getTime()) && today > endDate) return { status: 'Completado', color: '#888' };
    if (today >= startDate && (!endDate || today <= endDate)) {
      return { status: 'En curso', color: '#4CAF50' };
    }
    
    return { status: 'Planificado', color: '#FFA500' };
  };

  // ✅ CALCULAR TOTAL DE ARTÍCULOS
  const getTotalItems = () => {
    return luggage.reduce((total, luggageItem) => {
      return total + (luggageItem.articulos?.length || 0);
    }, 0);
  };

  // ✅ ABRIR MODAL CON TODOS LOS ARTÍCULOS
  const openLuggageModal = (luggageItem) => {
    setSelectedLuggage(luggageItem);
    setShowLuggageModal(true);
  };

  // ✅ CERRAR MODAL
  const closeLuggageModal = () => {
    setShowLuggageModal(false);
    setSelectedLuggage(null);
  };

  // ✅ CORREGIDO: Navegación sin replace
  const goBack = () => {
    navigation.navigate('MyTrips');
  };

  // ✅ CORREGIDO: Navegación con origen
  const navigateToEditTrip = () => {
    navigation.navigate('EditTrip', { 
      trip,
      origin: 'TripDetail' 
    });
  };

  // ✅ CORREGIDO: Pasar el trip completo a NewMaleta
  const navigateToNewMaleta = () => {
    console.log('🟡 Navegando a NewMaleta con trip completo');
    navigation.navigate('NewMaleta', { 
      tripId: trip.id, 
      destination: trip.destination, 
      purpose: trip.purpose,
      origin: 'TripDetail',
      trip: trip // 👈 PASAR EL TRIP COMPLETO
    });
  };

  const tripStatus = getTripStatus();
  const totalItems = getTotalItems();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Viaje</Text>
        <TouchableOpacity onPress={navigateToEditTrip}>
          <Ionicons name="create" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Título Principal */}
        <View style={styles.mainTitleSection}>
          <Text style={styles.mainTitle}>
            {trip.purpose || trip.destination || 'Viaje sin nombre'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: tripStatus.color }]}>
            <Text style={styles.statusText}>{tripStatus.status}</Text>
          </View>
        </View>

        {/* Información del Viaje */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Fechas del Viaje</Text>
          <View style={styles.infoCard}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Inicio</Text>
                <Text style={styles.dateValue}>{formatDate(trip.startDate)}</Text>
              </View>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="calendar" size={20} color="#FF6B6B" />
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Fin</Text>
                <Text style={styles.dateValue}>{formatDate(trip.endDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Destino */}
        {trip.destination && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Destino</Text>
            <View style={styles.infoCard}>
              <View style={styles.destinationRow}>
                <Ionicons name="location" size={20} color="#2196F3" />
                <Text style={styles.destinationText}>{trip.destination}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Maletas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                🎒 Maletas ({luggage.length})
              </Text>
              <Text style={styles.totalItems}>
                {totalItems} artículo{totalItems !== 1 ? 's' : ''} en total
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={navigateToNewMaleta}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
          
          {luggage.length > 0 ? (
            luggage.map((luggageItem, index) => (
              <TouchableOpacity
                key={luggageItem.id || index}
                style={styles.luggageCard}
                onPress={() => openLuggageModal(luggageItem)}
              >
                <View style={styles.luggageHeader}>
                  <Text style={styles.luggageCategory}>
                    {luggageItem.categoria || 'Sin categoría'}
                  </Text>
                  <Text style={styles.luggageItemCount}>
                    {luggageItem.articulos?.length || 0} artículos
                  </Text>
                </View>
                
                {/* Vista previa de artículos (máximo 3) */}
                {luggageItem.articulos?.slice(0, 3).map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.itemRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
                
                {/* Mostrar mensaje si hay más artículos */}
                {luggageItem.articulos?.length > 3 && (
                  <View style={styles.moreItemsContainer}>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#BB86FC" />
                    <Text style={styles.moreItems}>
                      Ver {luggageItem.articulos.length - 3} artículo{luggageItem.articulos.length - 3 !== 1 ? 's' : ''} más...
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bag-outline" size={50} color="#666" />
              <Text style={styles.emptyStateText}>No hay maletas agregadas</Text>
              <Text style={styles.emptyStateSubtext}>
                Agrega maletas para organizar tus artículos
              </Text>
            </View>
          )}
        </View>

        {/* Información adicional */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Información Adicional</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Propósito:</Text>
              <Text style={styles.value}>{trip.purpose || 'No especificado'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Creado:</Text>
              <Text style={styles.value}>
                {trip.createdAt?.toDate ? 
                  trip.createdAt.toDate().toLocaleDateString('es-ES') : 
                  'Fecha no disponible'
                }
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal para ver todos los artículos de una maleta */}
      <Modal
        visible={showLuggageModal}
        transparent
        animationType="slide"
        onRequestClose={closeLuggageModal}
      >
        <TouchableWithoutFeedback onPress={closeLuggageModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Header del Modal */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedLuggage?.categoria || 'Maleta'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedLuggage?.articulos?.length || 0} artículos
                  </Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={closeLuggageModal}
                  >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Lista de todos los artículos */}
                <ScrollView style={styles.modalList}>
                  {selectedLuggage?.articulos?.map((item, index) => (
                    <View key={index} style={styles.modalItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.modalItemText}>{item}</Text>
                    </View>
                  ))}
                  
                  {(!selectedLuggage?.articulos || selectedLuggage.articulos.length === 0) && (
                    <View style={styles.modalEmpty}>
                      <Ionicons name="alert-circle" size={40} color="#666" />
                      <Text style={styles.modalEmptyText}>No hay artículos en esta maleta</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Footer del Modal */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.modalActionButton}
                    onPress={closeLuggageModal}
                  >
                    <Text style={styles.modalActionText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
  content: {
    flex: 1,
    padding: 20,
  },
  mainTitleSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalItems: {
    fontSize: 14,
    color: '#BB86FC',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateInfo: {
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destinationText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  luggageCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  luggageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  luggageCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  luggageItemCount: {
    fontSize: 14,
    color: '#888',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 4,
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  moreItemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderRadius: 8,
  },
  moreItems: {
    color: '#BB86FC',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  label: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 2,
    textAlign: 'right',
  },
  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#2A2A2A',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#BB86FC',
    textAlign: 'center',
    marginTop: 4,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalList: {
    maxHeight: 400,
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  modalEmpty: {
    alignItems: 'center',
    padding: 40,
  },
  modalEmptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  modalActionButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TripDetailScreen;