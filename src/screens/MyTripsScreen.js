import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LogBox,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { deleteTrip, getUserTrips } from '../../firebase/tripService';

// Ignorar warnings específicos (opcional)
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

const MyTripsScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setHasError(false);
      const userTrips = await getUserTrips();
      setTrips(userTrips);
    } catch (error) {
      // Usar console.log en lugar de console.error para evitar que aparezca en rojo
      console.log('Error cargando viajes:', error.message);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId, tripName) => {
    Alert.alert(
      'Eliminar Viaje',
      `¿Estás seguro de eliminar el viaje "${tripName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: async () => {
            try {
              await deleteTrip(tripId);
              setTrips(trips.filter(trip => trip.id !== tripId));
              Alert.alert('Éxito', 'Viaje eliminado correctamente');
            } catch (error) {
              console.log('Error eliminando viaje:', error.message);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // ... el resto de tu código permanece igual
  const renderTripItem = ({ item }) => (
    <TouchableOpacity style={styles.tripItem}>
      <View style={styles.tripInfo}>
        <Text style={styles.tripDestination}>{item.destination}</Text>
        <Text style={styles.tripDates}>
          {item.startDate} {item.endDate ? `- ${item.endDate}` : ''}
        </Text>
        <Text style={styles.tripPurpose}>{item.purpose}</Text>
        <Text style={styles.tripItems}>{item.itemCount} artículos</Text>
      </View>
      <View style={styles.tripActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => console.log('Ver detalle:', item.id)}
        >
          <Ionicons name="eye" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteTrip(item.id, item.destination)}
        >
          <Ionicons name="trash" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BB86FC" />
        <Text style={styles.loadingText}>Cargando viajes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Viajes</Text>
        <Text style={styles.subtitle}>{trips.length} viajes guardados</Text>
      </View>

      {hasError ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="warning" size={64} color="#666" />
          <Text style={styles.emptyText}>No se pudieron cargar los viajes</Text>
          <Text style={styles.emptySubtext}>
            Por favor, intenta nuevamente más tarde
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadTrips}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="airplane" size={64} color="#666" />
          <Text style={styles.emptyText}>No tienes viajes guardados</Text>
          <Text style={styles.emptySubtext}>
            Crea tu primer viaje usando el botón "+" en la pantalla principal
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

// ... tus estilos permanecen igual
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#BB86FC',
    marginTop: 5,
  },
  listContainer: {
    padding: 10,
  },
  tripItem: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripInfo: {
    flex: 1,
  },
  tripDestination: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  tripDates: {
    fontSize: 14,
    color: '#BB86FC',
    marginBottom: 3,
  },
  tripPurpose: {
    fontSize: 14,
    color: '#888',
    marginBottom: 3,
  },
  tripItems: {
    fontSize: 12,
    color: '#4CAF50',
  },
  tripActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#BB86FC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
});

export default MyTripsScreen;