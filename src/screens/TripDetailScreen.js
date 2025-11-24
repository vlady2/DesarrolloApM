// screens/TripDetailScreen.js
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TripDetailScreen = ({ route, navigation }) => {
  const { trip } = route.params;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Viaje</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditTrip', { trip })}>
          <Ionicons name="create" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Información del Viaje */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Viaje</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{trip.tripName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Destino:</Text>
            <Text style={styles.value}>{trip.destination}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Fecha inicio:</Text>
            <Text style={styles.value}>{trip.startDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Fecha fin:</Text>
            <Text style={styles.value}>{trip.endDate || 'No especificada'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Propósito:</Text>
            <Text style={styles.value}>{trip.purpose || 'No especificado'}</Text>
          </View>
        </View>

        {/* Artículos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Artículos ({trip.items?.length || 0})
          </Text>

          {trip.items?.map((item, index) => (
            <View key={index} style={styles.item}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}

          {!trip.items?.length && (
            <Text style={styles.noItems}>No hay artículos agregados</Text>
          )}
        </View>

        {/* Información adicional */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Adicional</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Estado:</Text>
            <Text style={[styles.value, styles.status]}>
              {trip.status || 'planning'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Creado:</Text>
            <Text style={styles.value}>
              {trip.createdAt?.toDate
                ? trip.createdAt.toDate().toLocaleDateString()
                : 'Fecha no disponible'}
            </Text>
          </View>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
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
    fontSize: 16,
    color: '#888',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 2,
    textAlign: 'right',
  },
  status: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  noItems: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TripDetailScreen;
