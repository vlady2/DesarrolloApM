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

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

const MyTripsScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // DEBUG opcional
  useEffect(() => {
    console.log('🔍 DEBUG - Navigator info:');
    console.log(' - Navigation object:', navigation);
    console.log(' - Parent:', navigation.getParent());
    console.log(' - Can navigate to TripDetail:', navigation.canGoBack());

    const state = navigation.getState();
    console.log(' - Current routes:', state?.routes?.map(r => r.name));
  }, [navigation]);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setHasError(false);
      setErrorMessage('');
      
      console.log('🟡 Cargando viajes desde MyTripsScreen...');
      const userTrips = await getUserTrips();
      
      console.log('🟢 Viajes recibidos:', userTrips.length);
      console.log('📋 Datos de viajes:', userTrips.map(trip => ({
        id: trip.id,
        destination: trip.destination,
        itemCount: trip.itemCount
      })));
      
      setTrips(userTrips);
      
    } catch (error) {
      console.log('❌ Error cargando viajes:', error.message);
      console.log('🔍 Error completo:', error);
      
      setHasError(true);

      if (error.message.includes('índice') || error.code === 'failed-precondition') {
        setErrorMessage('Configuración de base de datos incompleta. Esto se solucionará automáticamente.');
      } else if (error.message.includes('permisos')) {
        setErrorMessage('No tienes permisos para ver los viajes.');
      } else if (error.message.includes('autenticado')) {
        setErrorMessage('Debes iniciar sesión para ver tus viajes.');
      } else {
        setErrorMessage('Error al cargar los viajes: ' + error.message);
      }
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
              Alert.alert('Error', 'No se pudo eliminar el viaje');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // NAVEGACIÓN CORREGIDA
  const navigateToTripDetail = (trip) => {
    console.log('🟡 Navegando a TripDetail...');
    navigation.getParent()?.navigate('TripDetail', { trip });
  };

  const navigateToEditTrip = (trip) => {
    console.log('🟡 Navegando a EditTrip...');
    navigation.getParent()?.navigate('EditTrip', { trip });
  };

  const renderTripItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.tripItem}
      onPress={() => navigateToTripDetail(item)}
    >
      <View style={styles.tripInfo}>
        <Text style={styles.tripDestination}>
          {item.tripName || 'Viaje sin nombre'}
        </Text>
        <Text style={styles.tripDates}>
          {item.startDate} {item.endDate ? `- ${item.endDate}` : ''}
        </Text>
        <Text style={styles.tripPurpose}>
          {item.purpose || 'Sin propósito especificado'}
        </Text>
        <Text style={styles.tripItems}>
          {item.itemCount || 0} artículo{item.itemCount !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.tripId}>
          ID: {item.id?.substring(0, 8)}...
        </Text>
      </View>

      <View style={styles.tripActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigateToEditTrip(item)}
        >
          <Ionicons name="create" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteTrip(item.id, item.tripName || item.destination)}
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
        <Text style={styles.loadingSubtext}>Verificando base de datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Viajes</Text>
        <Text style={styles.subtitle}>
          {trips.length} viaje{trips.length !== 1 ? 's' : ''} guardado{trips.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {hasError ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="warning" size={64} color="#FFA726" />
          <Text style={styles.emptyText}>Error al cargar viajes</Text>
          <Text style={styles.emptySubtext}>
            {errorMessage}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadTrips}
          >
            <Ionicons name="reload" size={16} color="#121212" />
            <Text style={styles.retryButtonText}> Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="airplane" size={64} color="#666" />
          <Text style={styles.emptyText}>No tienes viajes guardados</Text>
          <Text style={styles.emptySubtext}>
            Crea tu primer viaje usando el botón "+" en la pantalla principal
          </Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('NewTrip')}
          >
            <Text style={styles.createButtonText}>Crear Primer Viaje</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadTrips}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  loadingSubtext: {
    color: '#888',
    marginTop: 5,
    fontSize: 12,
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
    alignItems: 'flex-start',
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
    marginBottom: 2,
  },
  tripId: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
  tripActions: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 10,
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
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BB86FC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default MyTripsScreen;
