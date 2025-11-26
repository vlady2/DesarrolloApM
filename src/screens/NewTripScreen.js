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
import { saveTrip } from '../../firebase/tripService';

const NewTripScreen = ({ route, navigation }) => {
  const { origin = 'Home' } = route.params || {}; // 👈 RECIBIR ORIGEN CON VALOR POR DEFECTO
  
  const [trip, setTrip] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    purpose: '',
    type: 'viaje'
  });
  const [saving, setSaving] = useState(false);
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
  }, [navigation, origin]); // 👈 INCLUIR ORIGEN EN LAS DEPENDENCIAS

  // ✅ CORREGIDO: Función de navegación INTELIGENTE
  const handleGoBack = () => {
    console.log('🟡 Navegando desde NewTrip - Origen:', origin);
    navigation.navigate(origin); // 👈 NAVEGAR AL ORIGEN ESPECÍFICO
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
        setTrip({...trip, startDate: formattedDate});
      } else {
        setTrip({...trip, endDate: formattedDate});
      }
    }
  };

  // Abrir date picker para fecha de inicio
  const openStartDateCalendar = () => {
    setDatePickerMode('start');
    setSelectedDate(trip.startDate ? new Date(trip.startDate.split('/').reverse().join('-')) : new Date());
    setShowDatePicker(true);
  };

  // Abrir date picker para fecha de fin
  const openEndDateCalendar = () => {
    setDatePickerMode('end');
    setSelectedDate(trip.endDate ? new Date(trip.endDate.split('/').reverse().join('-')) : new Date());
    setShowDatePicker(true);
  };

  // Selección de destino (sin mapa por ahora)
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
                setTrip({
                  ...trip, 
                  destination: `${geocode[0].city || geocode[0].region}, ${geocode[0].country}`
                });
              }
            }
          }
        },
        {
          text: 'Ciudad de México',
          onPress: () => setTrip({...trip, destination: 'Ciudad de México, México'})
        },
        {
          text: 'Madrid',
          onPress: () => setTrip({...trip, destination: 'Madrid, España'})
        },
        {
          text: 'Nueva York',
          onPress: () => setTrip({...trip, destination: 'Nueva York, USA'})
        },
        {
          text: 'Escribir manualmente',
          onPress: () => {
            Alert.prompt(
              'Destino',
              'Escribe tu destino:',
              (text) => {
                if (text) setTrip({...trip, destination: text});
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
    if (trip.startDate && trip.endDate) {
      const start = new Date(trip.startDate.split('/').reverse().join('-'));
      const end = new Date(trip.endDate.split('/').reverse().join('-'));
      
      if (end < start) {
        Alert.alert('Error', 'La fecha de fin no puede ser anterior a la fecha de inicio');
        setTrip({...trip, endDate: ''});
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    validateDates();
  }, [trip.startDate, trip.endDate]);

  // ✅ CORREGIDO: Función de guardado MEJORADA con navegación inteligente
  const saveTripToFirebase = async () => {
    console.log('🟡 Botón presionado - Iniciando guardado de viaje...');
    console.log('📍 Origen de navegación:', origin);
    
    // Validación de campos obligatorios
    if (!trip.destination) {
      console.log('❌ Validación fallida: destino vacío');
      Alert.alert('Error', 'Por favor selecciona un destino');
      return;
    }

    if (!trip.startDate) {
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
      Alert.alert('Error', 'Debes iniciar sesión para guardar viajes');
      return;
    }

    console.log('🔵 Todas las validaciones pasadas - Guardando viaje...');
    console.log('📝 Datos del viaje:', trip);
    
    setSaving(true);
    
    try {
      const tripData = {
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        purpose: trip.purpose,
        type: 'viaje',
        status: 'planning',
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('🟡 Enviando datos a Firebase...', tripData);
      
      const result = await saveTrip(tripData);
      console.log('🟢 Viaje guardado correctamente en Firebase, ID:', result.id);
      
      // ✅ CORREGIDO: Navegación INTELIGENTE según el origen
      Alert.alert(
        '✅ Viaje Guardado', 
        '¿Deseas agregar maletas para este viaje ahora?',
        [
          {
            text: 'Más Tarde',
            style: 'cancel',
            onPress: () => {
              console.log('🟡 Navegando al origen:', origin);
              navigation.navigate(origin); // 👈 NAVEGAR AL ORIGEN
            }
          },
          {
            text: 'Agregar Maletas',
            onPress: () => {
              console.log('🟡 Navegando a NewMaleta con tripId:', result.id);
              console.log('📍 Pasando origen a NewMaleta:', origin);
              navigation.navigate('NewMaleta', { 
                tripId: result.id,
                destination: trip.destination,
                purpose: trip.purpose,
                origin: origin // 👈 PASAR EL ORIGEN A NEWMALETA
              });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error completo guardando viaje:', error);
      console.error('❌ Mensaje de error:', error.message);
      console.error('❌ Stack:', error.stack);
      
      let errorMessage = 'No se pudo guardar el viaje. Error desconocido.';
      
      if (error.message) {
        if (error.message.includes('permission')) {
          errorMessage = 'Error de permisos. Verifica las reglas de Firestore.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu internet.';
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Viaje</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información del Viaje</Text>
          
          {/* Selector de Destino */}
          <TouchableOpacity style={styles.inputWithIcon} onPress={openMap}>
            <Text style={trip.destination ? styles.inputText : styles.placeholderText}>
              {trip.destination || 'Seleccionar destino *'}
            </Text>
            <Ionicons name="map-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          {/* Selector de Fecha de Inicio */}
          <TouchableOpacity style={styles.inputWithIcon} onPress={openStartDateCalendar}>
            <Text style={trip.startDate ? styles.inputText : styles.placeholderText}>
              {trip.startDate || 'Fecha de inicio *'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          {/* Selector de Fecha de Fin */}
          <TouchableOpacity style={styles.inputWithIcon} onPress={openEndDateCalendar}>
            <Text style={trip.endDate ? styles.inputText : styles.placeholderText}>
              {trip.endDate || 'Fecha de fin'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          {/* Propósito */}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Propósito del viaje (vacaciones, trabajo, etc.)"
            placeholderTextColor="#888"
            value={trip.purpose}
            onChangeText={(text) => setTrip({...trip, purpose: text})}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Información */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#BB86FC" />
          <Text style={styles.infoText}>
            Después de guardar el viaje, podrás agregar maletas con sugerencias de IA específicas para tu destino y propósito.
          </Text>
        </View>

        {/* ✅ BOTÓN GUARDAR CORREGIDO */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={saveTripToFirebase}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Viaje y Agregar Maletas</Text>
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
    backgroundColor: '#4CAF50',
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

export default NewTripScreen;