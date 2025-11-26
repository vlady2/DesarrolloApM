import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../../firebase/auth';
import { getTripById, updateTrip } from '../../firebase/tripService';

const EditTripScreen = ({ route, navigation }) => {
  const { trip, origin = 'TripDetail' } = route.params; // 👈 ORIGEN CON VALOR POR DEFECTO
  
  const [editedTrip, setEditedTrip] = useState({
    destination: trip.destination || '',
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    purpose: trip.purpose || '',
    type: trip.type || 'viaje'
  });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const insets = useSafeAreaInsets();

  // ✅ CORREGIDO: BackHandler INTELIGENTE según el origen
  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
        handleGoBack();
        return true; // Prevenir el comportamiento por defecto
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, trip, origin]); // 👈 INCLUIR ORIGEN EN LAS DEPENDENCIAS

  // ✅ CORREGIDO: Función de navegación INTELIGENTE
  const handleGoBack = () => {
    console.log('🟡 Navegando desde EditTrip - Origen:', origin);
    
    switch(origin) {
      case 'MyTrips':
        console.log('🔵 Regresando a MyTrips');
        navigation.navigate('MyTrips');
        break;
      case 'TripDetail':
        console.log('🔵 Regresando a TripDetail');
        navigation.navigate('TripDetail', { trip });
        break;
      default:
        console.log('🔵 Regresando a TripDetail (default)');
        navigation.navigate('TripDetail', { trip });
    }
  };

  // Cargar datos actualizados si es necesario
  useEffect(() => {
    if (trip.id) {
      loadTripData();
    }
  }, [trip.id]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      const tripData = await getTripById(trip.id);
      
      setEditedTrip({
        destination: tripData.destination || '',
        startDate: tripData.startDate || '',
        endDate: tripData.endDate || '',
        purpose: tripData.purpose || '',
        type: tripData.type || 'viaje'
      });
      
    } catch (error) {
      console.error('Error cargando datos del viaje:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del viaje');
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear fecha
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Manejar selección de fecha
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      const formattedDate = formatDate(selectedDate);
      
      if (datePickerMode === 'start') {
        setEditedTrip({...editedTrip, startDate: formattedDate});
      } else {
        setEditedTrip({...editedTrip, endDate: formattedDate});
      }
    }
  };

  // Abrir date picker para fecha de inicio
  const openStartDateCalendar = () => {
    setDatePickerMode('start');
    setSelectedDate(editedTrip.startDate ? new Date(editedTrip.startDate.split('/').reverse().join('-')) : new Date());
    setShowDatePicker(true);
  };

  // Abrir date picker para fecha de fin
  const openEndDateCalendar = () => {
    setDatePickerMode('end');
    setSelectedDate(editedTrip.endDate ? new Date(editedTrip.endDate.split('/').reverse().join('-')) : new Date());
    setShowDatePicker(true);
  };

  // Selección de destino (igual que en NewTripScreen)
  const openMap = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      const options = [
        {
          text: 'Usar mi ubicación actual',
          onPress: async () => {
            if (status === 'granted') {
              let location = await Location.getCurrentPositionAsync({});
              let geocode = await Location.reverseGeocodeAsync(location.coords);
              if (geocode[0]) {
                setEditedTrip({
                  ...editedTrip, 
                  destination: `${geocode[0].city || geocode[0].region}, ${geocode[0].country}`
                });
              }
            }
          }
        },
        {
          text: 'Ciudad de México',
          onPress: () => setEditedTrip({...editedTrip, destination: 'Ciudad de México, México'})
        },
        {
          text: 'Madrid',
          onPress: () => setEditedTrip({...editedTrip, destination: 'Madrid, España'})
        },
        {
          text: 'Nueva York',
          onPress: () => setEditedTrip({...editedTrip, destination: 'Nueva York, USA'})
        },
        {
          text: 'Escribir manualmente',
          onPress: () => {
            Alert.prompt(
              'Destino',
              'Escribe tu destino:',
              (text) => {
                if (text) setEditedTrip({...editedTrip, destination: text});
              }
            );
          }
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ];

      Alert.alert('Seleccionar Destino', 'Elige tu destino:', options);
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    }
  };

  // Validar fechas
  const validateDates = () => {
    if (editedTrip.startDate && editedTrip.endDate) {
      const start = new Date(editedTrip.startDate.split('/').reverse().join('-'));
      const end = new Date(editedTrip.endDate.split('/').reverse().join('-'));
      
      if (end < start) {
        Alert.alert('Error', 'La fecha de fin no puede ser anterior a la fecha de inicio');
        setEditedTrip({...editedTrip, endDate: ''});
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    validateDates();
  }, [editedTrip.startDate, editedTrip.endDate]);

  // ✅ CORREGIDO: Función de actualización MEJORADA con navegación inteligente
  const updateTripInFirebase = async () => {
    console.log('🟡 Botón presionado - Iniciando actualización...');
    console.log('📍 Origen de navegación:', origin);
    
    // Validación de campos obligatorios
    if (!editedTrip.destination) {
      console.log('❌ Validación fallida: destino vacío');
      Alert.alert('Error', 'Por favor selecciona un destino');
      return;
    }

    if (!editedTrip.startDate) {
      console.log('❌ Validación fallida: fecha de inicio vacía');
      Alert.alert('Error', 'Por favor selecciona una fecha de inicio');
      return;
    }

    if (!validateDates()) {
      console.log('❌ Validación fallida: fechas inválidas');
      return;
    }

    if (!auth.currentUser) {
      console.log('❌ Validación fallida: usuario no autenticado');
      Alert.alert('Error', 'Debes iniciar sesión para editar viajes');
      return;
    }

    console.log('🔵 Todas las validaciones pasadas - Actualizando viaje:', trip.id);
    console.log('📝 Datos a actualizar:', editedTrip);
    
    setSaving(true);
    
    try {
      const tripData = {
        destination: editedTrip.destination,
        startDate: editedTrip.startDate,
        endDate: editedTrip.endDate,
        purpose: editedTrip.purpose,
        type: 'viaje',
        status: trip.status || 'planning',
        updatedAt: new Date()
      };

      console.log('🟡 Enviando datos a Firebase...', tripData);
      
      // ✅ LLAMADA DIRECTA A updateTrip
      await updateTrip(trip.id, tripData);
      console.log('🟢 Viaje actualizado correctamente en Firebase');
      
      // ✅ CORREGIDO: Navegación INTELIGENTE según el origen
      Alert.alert(
        '✅ Éxito', 
        'Viaje actualizado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('🟡 Navegando según origen:', origin);
              
              // Navegar según el origen
              if (origin === 'MyTrips') {
                console.log('🔵 Navegando a MyTrips');
                navigation.navigate('MyTrips');
              } else {
                console.log('🔵 Navegando a TripDetail');
                navigation.navigate('TripDetail', { trip: { ...trip, ...editedTrip } });
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error completo actualizando viaje:', error);
      console.error('❌ Mensaje de error:', error.message);
      console.error('❌ Stack:', error.stack);
      
      let errorMessage = 'No se pudo actualizar el viaje. Error desconocido.';
      
      if (error.message) {
        if (error.message.includes('permission')) {
          errorMessage = 'Error de permisos. Verifica las reglas de Firestore.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu internet.';
        } else if (error.message.includes('not-found')) {
          errorMessage = 'El viaje no existe o fue eliminado.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      Alert.alert('❌ Error', errorMessage);
    } finally {
      console.log('🔵 Finalizando proceso de guardado...');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar backgroundColor="#121212" barStyle="light-content" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#BB86FC" />
          <Text style={styles.loadingText}>Cargando viaje...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Viaje</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información del Viaje</Text>
          
          {/* Selector de Destino */}
          <TouchableOpacity style={styles.inputWithIcon} onPress={openMap}>
            <Text style={editedTrip.destination ? styles.inputText : styles.placeholderText}>
              {editedTrip.destination || 'Seleccionar destino *'}
            </Text>
            <Ionicons name="map-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          {/* Selector de Fecha de Inicio */}
          <TouchableOpacity style={styles.inputWithIcon} onPress={openStartDateCalendar}>
            <Text style={editedTrip.startDate ? styles.inputText : styles.placeholderText}>
              {editedTrip.startDate || 'Fecha de inicio *'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          {/* Selector de Fecha de Fin */}
          <TouchableOpacity style={styles.inputWithIcon} onPress={openEndDateCalendar}>
            <Text style={editedTrip.endDate ? styles.inputText : styles.placeholderText}>
              {editedTrip.endDate || 'Fecha de fin'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          {/* Propósito */}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Propósito del viaje (vacaciones, trabajo, etc.)"
            placeholderTextColor="#888"
            value={editedTrip.purpose}
            onChangeText={(text) => setEditedTrip({...editedTrip, purpose: text})}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Información */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#BB86FC" />
          <Text style={styles.infoText}>
            Los artículos se gestionan en la sección de maletas.
          </Text>
        </View>

        {/* ✅ BOTÓN ACTUALIZAR */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={updateTripInFirebase}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {saving ? 'Actualizando...' : 'Actualizar Viaje'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal transparent animationType="slide" visible={showDatePicker}>
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.datePickerContainer}>
                  <Text style={styles.datePickerTitle}>
                    Seleccionar {datePickerMode === 'start' ? 'Fecha de Inicio' : 'Fecha de Fin'}
                  </Text>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    style={styles.datePicker}
                  />
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerButtonText}>Listo</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

// Los estilos se mantienen igual...
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
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
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
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 15,
    color: '#FFFFFF',
    marginBottom: 15,
    fontSize: 16,
  },
  inputWithIcon: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#BB86FC',
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    alignItems: 'center',
  },
  datePickerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  datePicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#1E1E1E',
  },
  datePickerButton: {
    backgroundColor: '#BB86FC',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  datePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditTripScreen;