import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import { getUserTrips } from '../../firebase/tripService';

// ✅ Base de datos de artículos prohibidos (la misma que usas en NewMaletaScreen)
const ARTICULOS_PROHIBIDOS_POR_PAIS = {
  'méxico': ['Frutas y vegetales frescos', 'Semillas sin certificado', 'Carne de res', 'Productos lácteos no pasteurizados'],
  'mexico': ['Frutas y vegetales frescos', 'Semillas sin certificado', 'Carne de res', 'Productos lácteos no pasteurizados'],
  'españa': ['Productos cárnicos de fuera de la UE', 'Plantas sin certificado fitosanitario', 'Drogas recreativas', 'Armas de fuego'],
  'espana': ['Productos cárnicos de fuera de la UE', 'Plantas sin certificado fitosanitario', 'Drogas recreativas', 'Armas de fuego'],
  'estados unidos': ['Frutas tropicales', 'Carne de cerdo', 'Quesos artesanales', 'Productos de CBD'],
  'usa': ['Frutas tropicales', 'Carne de cerdo', 'Quesos artesanales', 'Productos de CBD'],
  'ee.uu.': ['Frutas tropicales', 'Carne de cerdo', 'Quesos artesanales', 'Productos de CBD'],
  'ue': ['Productos transgénicos no autorizados', 'Animales en peligro de extinción', 'Pesticidas prohibidos'],
  'europa': ['Productos transgénicos no autorizados', 'Animales en peligro de extinción', 'Pesticidas prohibidos'],
  'latinoamérica': ['Electrónicos sin factura', 'Juguetes con pilas de litio', 'Productos pirata'],
  'latinoamerica': ['Electrónicos sin factura', 'Juguetes con pilas de litio', 'Productos pirata'],
};

const ARTICULOS_PROHIBIDOS_UNIVERSALES = [
  'Líquidos sobre 100ml en equipaje de mano',
  'Armas de cualquier tipo (incluidas réplicas)',
  'Productos inflamables (aerósoles, gasolina)',
  'Drogas ilegales y sustancias controladas',
  'Animales vivos sin documentación',
  'Comida perecedera sin refrigeración',
  'Material pornográfico ilegal',
  'Productos que infrinjan derechos de autor'
];

const ArticulosProhibidosScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [articulosProhibidos, setArticulosProhibidos] = useState([]);
  
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const userTrips = await getUserTrips();
      
      // Filtrar solo viajes activos (pendientes o en curso)
      const activeTrips = userTrips.filter(trip => {
        const status = getTripStatus(trip);
        return status.status === 'Pendiente' || status.status === 'En curso';
      });
      
      setTrips(activeTrips);
      setFilteredTrips(activeTrips);
      
    } catch (error) {
      console.log('❌ Error cargando viajes:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Función para determinar el estado del viaje (igual que en MyTripsScreen)
  const getTripStatus = (trip) => {
    if (!trip.startDate) return { status: 'Planificado', color: '#FFA500', icon: 'calendar-outline' };
    
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
      console.error('Error procesando fechas:', error);
      return { status: 'Planificado', color: '#FFA500', icon: 'calendar-outline' };
    }
    
    if (isNaN(startDate.getTime())) {
      return { status: 'Planificado', color: '#FFA500', icon: 'calendar-outline' };
    }
    
    if (today < startDate) {
      return { status: 'Pendiente', color: '#FFA500', icon: 'time-outline' };
    }
    
    if (endDate && !isNaN(endDate.getTime()) && today > endDate) {
      return { status: 'Completado', color: '#888', icon: 'checkmark-done' };
    }
    
    if (today >= startDate && (!endDate || today <= endDate)) {
      return { status: 'En curso', color: '#4CAF50', icon: 'airplane' };
    }
    
    return { status: 'Planificado', color: '#FFA500', icon: 'calendar-outline' };
  };

  // ✅ Función para cargar artículos prohibidos según el destino
  const cargarArticulosProhibidos = (trip) => {
    console.log('🟡 Cargando artículos prohibidos para:', trip.destination);
    
    let articulosEspecificos = [];
    
    if (trip.destination) {
      const destinoLower = trip.destination.toLowerCase();
      
      // Buscar coincidencias por país
      Object.keys(ARTICULOS_PROHIBIDOS_POR_PAIS).forEach(pais => {
        if (destinoLower.includes(pais)) {
          console.log(`🔵 Encontrados artículos prohibidos para: ${pais}`);
          articulosEspecificos = [...articulosEspecificos, ...ARTICULOS_PROHIBIDOS_POR_PAIS[pais]];
        }
      });
    }
    
    // Combinar artículos específicos con universales
    const todosLosProhibidos = [
      ...ARTICULOS_PROHIBIDOS_UNIVERSALES,
      ...articulosEspecificos
    ];
    
    console.log(`🟢 Total artículos prohibidos cargados: ${todosLosProhibidos.length}`);
    setArticulosProhibidos(todosLosProhibidos);
  };

  // ✅ Abrir modal con artículos prohibidos del viaje seleccionado
  const openProhibitedModal = (trip) => {
    setSelectedTrip(trip);
    cargarArticulosProhibidos(trip);
    setModalVisible(true);
  };

  // ✅ Cerrar modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedTrip(null);
    setArticulosProhibidos([]);
  };

  // ✅ Navegación normal de regreso
  const goBack = () => {
    navigation.navigate('Home');
  };

  const renderTripItem = ({ item }) => {
    const tripStatus = getTripStatus(item);
    const mainTitle = item.purpose || item.destination || 'Viaje';

    return (
      <TouchableOpacity 
        style={styles.tripItem}
        onPress={() => openProhibitedModal(item)}
      >
        <View style={styles.tripHeader}>
          <View style={styles.typeBadge}>
            <Ionicons name="airplane" size={16} color="#2196F3" />
            <Text style={styles.typeText}>Viaje</Text>
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
        </View>

        <View style={styles.prohibitedIndicator}>
          <Ionicons name="warning" size={16} color="#FFA000" />
          <Text style={styles.prohibitedText}>Ver artículos prohibidos</Text>
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
          <Text style={styles.loadingText}>Cargando viajes activos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artículos Prohibidos</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Información */}
      <View style={styles.infoContainer}>
        <Ionicons name="warning" size={20} color="#FFA000" />
        <Text style={styles.infoText}>
          Viajes activos con restricciones de equipaje
        </Text>
      </View>

      {filteredTrips.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="airplane" size={64} color="#666" />
          <Text style={styles.emptyText}>
            No tienes viajes activos en este momento
          </Text>
          <Text style={styles.emptySubtext}>
            Los viajes pendientes o en curso aparecerán aquí
          </Text>
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

      {/* Modal de Artículos Prohibidos */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                📋 Artículos Prohibidos
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Información del Viaje */}
            {selectedTrip && (
              <View style={styles.tripInfoModal}>
                <Text style={styles.tripDestinationModal}>
                  {selectedTrip.destination}
                </Text>
                <Text style={styles.tripPurposeModal}>
                  {selectedTrip.purpose}
                </Text>
                <Text style={styles.tripDatesModal}>
                  {selectedTrip.startDate} {selectedTrip.endDate ? `- ${selectedTrip.endDate}` : ''}
                </Text>
              </View>
            )}

            {/* Lista de Artículos Prohibidos */}
            <FlatList
              data={articulosProhibidos}
              renderItem={({ item, index }) => (
                <View style={styles.prohibidoItem}>
                  <Ionicons name="close-circle" size={16} color="#F44336" />
                  <Text style={styles.prohibidoItemText}>{item}</Text>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
              style={styles.prohibidosList}
              showsVerticalScrollIndicator={false}
            />

            {/* Advertencia */}
            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={16} color="#2196F3" />
              <Text style={styles.warningText}>
                Lista referencial. Verifica regulaciones actuales con tu aerolínea.
              </Text>
            </View>

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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 160, 0, 0.1)',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  infoText: {
    color: '#FFA000',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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
    borderLeftColor: '#FFA000',
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
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
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
    marginBottom: 10,
  },
  tripTitle: {
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
  prohibitedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 160, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  prohibitedText: {
    color: '#FFA000',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
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
  tripDestinationModal: {
    color: '#BB86FC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tripPurposeModal: {
    color: '#BB86FC',
    fontSize: 14,
    marginBottom: 5,
  },
  tripDatesModal: {
    color: '#BB86FC',
    fontSize: 12,
    fontStyle: 'italic',
  },
  prohibidosList: {
    maxHeight: 300,
    paddingHorizontal: 20,
  },
  prohibidoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  prohibidoItemText: {
    color: '#FFA000',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  warningText: {
    color: '#2196F3',
    fontSize: 12,
    flex: 1,
    fontStyle: 'italic',
  },
});

export default ArticulosProhibidosScreen;