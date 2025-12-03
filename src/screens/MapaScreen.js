// screens/MapaScreen.js
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const MapaScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef(null);

  const initialRegion = {
    latitude: 13.6929,
    longitude: -89.2182,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const testMarkers = [
    { id: 1, title: 'San Salvador', coordinate: { latitude: 13.6929, longitude: -89.2182 } },
    { id: 2, title: 'Acajutla', coordinate: { latitude: 13.592, longitude: -89.827 } },
    { id: 3, title: 'Santa Ana', coordinate: { latitude: 13.994, longitude: -89.556 } },
  ];

  useEffect(() => {
    console.log('🗺️ Probando Google Maps en Expo');
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🗺️ Mapa</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          provider="google"
          onMapReady={() => console.log('✅ Mapa listo')}
          onError={(error) => {
            console.error('❌ Error:', error.nativeEvent?.message);
            setMapError('Error cargando el mapa. Verifica la API Key.');
          }}
        >
          {testMarkers.map(marker => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
            />
          ))}
        </MapView>
      </View>

      {mapError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{mapError}</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => mapRef.current?.animateToRegion(initialRegion, 1000)}
        >
          <Text style={styles.buttonText}>📍 Centrar mapa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 16,
    color: '#4285F4',
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mapContainer: {
    flex: 1,
    padding: 15,
  },
  map: {
    flex: 1,
    borderRadius: 10,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 15,
    marginHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  controls: {
    padding: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MapaScreen;