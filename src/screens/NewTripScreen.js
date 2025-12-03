import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../../firebase/auth';
import { getUserTrips, saveTrip } from '../../firebase/tripService';

const NewTripScreen = ({ route, navigation }) => {
  const { origin = 'Home', selectedLocation } = route.params || {};
  
  // 🔥 IMPORTANTE: Inicializar con la ubicación seleccionada del mapa si existe
  const [trip, setTrip] = useState({
    destination: selectedLocation?.address || '', // Ahora viene como "País, Ciudad"
    startDate: '',
    endDate: '',
    purpose: '',
    type: 'viaje'
  });
  
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start');
  const [existingTrips, setExistingTrips] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(selectedLocation?.country || '');
  const [selectedCity, setSelectedCity] = useState(selectedLocation?.city || '');

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadExistingTrips();
    
    // 🔥 Si viene una ubicación del mapa, extraer país y ciudad
    if (selectedLocation) {
      const { address, country, city } = selectedLocation;
      
      // Si el address viene como "País, Ciudad", ya está en el formato correcto
      console.log('📍 Ubicación recibida:', address);
      console.log('🏙️ Ciudad:', city);
      console.log('🇺🇳 País:', country);
      
      setTrip(prev => ({
        ...prev,
        destination: address || ''
      }));
      
      setSelectedCountry(country || '');
      setSelectedCity(city || '');
    }
  }, [selectedLocation]);

  const loadExistingTrips = async () => {
    try {
      if (auth.currentUser) {
        const trips = await getUserTrips();
        setExistingTrips(trips);
      }
    } catch (error) {
      console.log('Error cargando viajes existentes:', error);
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
        if (isTripStartingToday()) {
          Alert.alert(
            'Acción requerida',
            'Debes completar las maletas antes de poder salir, ya que tu viaje comienza hoy.',
            [{ text: 'Entendido' }]
          );
          return true;
        }
        
        handleGoBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, origin, trip.startDate]);

  const handleGoBack = () => {
    if (isTripStartingToday()) {
      Alert.alert(
        'Acción requerida',
        'Debes completar las maletas antes de poder salir, ya que tu viaje comienza hoy.',
        [{ text: 'Entendido' }]
      );
      return;
    }
    navigation.navigate(origin);
  };

  // ✅ FUNCIÓN CORREGIDA: Formatear fecha sin problemas de zona horaria
  const formatDate = (date) => {
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
    
    const day = utcDate.getUTCDate().toString().padStart(2, '0');
    const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = utcDate.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  // ✅ FUNCIÓN CORREGIDA: Obtener fecha actual sin problemas de zona horaria
  const getToday = () => {
    const now = new Date();
    const today = new Date(Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ));
    return today;
  };

  // ✅ FUNCIÓN: Convertir fecha string a Date object consistentemente
  const parseDateString = (dateString) => {
    if (!dateString) return null;
    
    const parts = dateString.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    return new Date(Date.UTC(year, month, day));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    
    if (event.type === 'set' && selectedDate) {
      const formattedDate = formatDate(selectedDate);
      
      if (datePickerMode === 'start') {
        setTrip({...trip, startDate: formattedDate});
        
        if (trip.endDate) {
          const endDate = parseDateString(trip.endDate);
          const startDate = parseDateString(formattedDate);
          
          if (endDate && startDate && endDate < startDate) {
            setTrip(prev => ({ ...prev, endDate: '' }));
          }
        }
      } else {
        setTrip({...trip, endDate: formattedDate});
      }
    }
  };

  const openStartDateCalendar = () => {
    setDatePickerMode('start');
    setShowDatePicker(true);
  };

  const openEndDateCalendar = () => {
    setDatePickerMode('end');
    setShowDatePicker(true);
  };

  const getCurrentDateForPicker = () => {
    if (datePickerMode === 'start' && trip.startDate) {
      return parseDateString(trip.startDate) || new Date();
    } else if (datePickerMode === 'end' && trip.endDate) {
      return parseDateString(trip.endDate) || new Date();
    }
    return new Date();
  };

  const getMinimumDateForPicker = () => {
    if (datePickerMode === 'start') {
      return getToday();
    } else {
      return trip.startDate 
        ? parseDateString(trip.startDate)
        : getToday();
    }
  };

  const checkDateOverlap = (startDate, endDate) => {
    if (!startDate || !endDate) return { hasOverlap: false };
    
    const newStart = parseDateString(startDate);
    const newEnd = parseDateString(endDate);
    
    for (const existingTrip of existingTrips) {
      if (existingTrip.startDate && existingTrip.endDate) {
        const existingStart = parseDateString(existingTrip.startDate);
        const existingEnd = parseDateString(existingTrip.endDate);
        
        const overlap = (newStart <= existingEnd && newEnd >= existingStart);
        
        if (overlap) {
          return {
            hasOverlap: true,
            conflictingTrip: existingTrip,
            type: getOverlapType(newStart, newEnd, existingStart, existingEnd)
          };
        }
      }
    }
    
    return { hasOverlap: false };
  };

  const getOverlapType = (newStart, newEnd, existingStart, existingEnd) => {
    if (newStart.getTime() === existingStart.getTime() && newEnd.getTime() === existingEnd.getTime()) {
      return 'identical';
    } else if (newStart >= existingStart && newEnd <= existingEnd) {
      return 'within';
    } else if (newStart <= existingStart && newEnd >= existingEnd) {
      return 'contains';
    } else {
      return 'overlap';
    }
  };

  const validateAllDateRestrictions = () => {
    if (!trip.startDate || !trip.endDate) {
      return true;
    }

    const today = getToday();
    const startDate = parseDateString(trip.startDate);
    const endDate = parseDateString(trip.endDate);

    if (!startDate || !endDate) {
      Alert.alert('Error', 'Formato de fecha inválido');
      return false;
    }

    if (startDate < today) {
      Alert.alert('Error', 'La fecha de inicio no puede ser una fecha pasada.');
      return false;
    }

    if (endDate < startDate) {
      Alert.alert('Error', 'La fecha de fin no puede ser anterior a la fecha de inicio.');
      return false;
    }

    const overlapCheck = checkDateOverlap(trip.startDate, trip.endDate);
    if (overlapCheck.hasOverlap) {
      let message = '';
      
      switch (overlapCheck.type) {
        case 'identical':
          message = 'Ya tienes un viaje con fechas idénticas. Por favor elige otras fechas.';
          break;
        case 'within':
          message = 'Este viaje está completamente dentro de las fechas de otro viaje existente. Elige fechas que no coincidan.';
          break;
        case 'contains':
          message = 'Este viaje contiene completamente a otro viaje existente. Elige fechas que no se solapen.';
          break;
        case 'overlap':
          message = 'Las fechas de este viaje coinciden con un viaje existente. Por favor elige otras fechas.';
          break;
      }
      
      Alert.alert('Conflicto de Fechas', message);
      return false;
    }

    return true;
  };

  const isTripStartingToday = () => {
    if (!trip.startDate) return false;
    
    const today = getToday();
    const startDate = parseDateString(trip.startDate);
    
    if (!startDate) return false;
    
    return startDate.getTime() === today.getTime();
  };

  const isTripStartingInFuture = () => {
    if (!trip.startDate) return false;
    
    const today = getToday();
    const startDate = parseDateString(trip.startDate);
    
    if (!startDate) return false;
    
    return startDate.getTime() > today.getTime();
  };

  // 🔥 FUNCIÓN ACTUALIZADA: Abrir el mapa
  const openMap = () => {
    // Navegar al MapPickerScreen
    navigation.navigate('MapPicker', {
      onSelectLocation: (location) => {
        // Esta función se llamará cuando selecciones una ubicación en el mapa
        if (location) {
          const { country, city, address } = location;
          
          console.log('📍 Nueva ubicación seleccionada:', address);
          console.log('🏙️ Ciudad:', city);
          console.log('🇺🇳 País:', country);
          
          setTrip(prev => ({
            ...prev,
            destination: address || `${country}, ${city}`
          }));
          
          setSelectedCountry(country || '');
          setSelectedCity(city || '');
        }
      },
      returnScreen: 'NewTrip'
    });
  };

  // 🔥 FUNCIÓN MEJORADA: Validar destino
  const validateDestination = () => {
    if (!trip.destination || trip.destination.trim() === '') {
      Alert.alert('Error', 'Por favor selecciona un destino');
      return false;
    }
    
    // Verificar que el destino tenga el formato correcto
    if (trip.destination.split(',').length < 2) {
      Alert.alert('Formato incorrecto', 'El destino debe tener el formato: "País, Ciudad"');
      return false;
    }
    
    return true;
  };

  const validateDates = () => {
    if (trip.startDate && trip.endDate) {
      const start = parseDateString(trip.startDate);
      const end = parseDateString(trip.endDate);
      
      if (end && start && end < start) {
        Alert.alert('Error', 'La fecha de fin no puede ser anterior a la fecha de inicio');
        setTrip(prev => ({ ...prev, endDate: '' }));
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    validateDates();
  }, [trip.startDate, trip.endDate]);

  // 🔥 FUNCIÓN ACTUALIZADA: Guardar viaje
  const saveTripToFirebase = async () => {
    // Validar destino primero
    if (!validateDestination()) {
      return;
    }

    if (!trip.startDate) {
      Alert.alert('Error', 'Por favor selecciona una fecha de inicio');
      return;
    }
    
    if (!trip.endDate) {
      Alert.alert('Error', 'Por favor selecciona una fecha de fin');
      return;
    }

    if (!validateAllDateRestrictions()) {
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para guardar viajes');
      return;
    }

    setSaving(true);
    
    try {
      // 🔥 Guardar tanto el destino completo como país y ciudad por separado
      const tripData = {
        destination: trip.destination, // Formato: "País, Ciudad"
        country: selectedCountry || extractCountry(trip.destination),
        city: selectedCity || extractCity(trip.destination),
        startDate: trip.startDate,
        endDate: trip.endDate,
        purpose: trip.purpose,
        type: 'viaje',
        status: 'planning',
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        startsToday: isTripStartingToday()
      };

      console.log('💾 Guardando viaje:', tripData);

      const result = await saveTrip(tripData);
      
      const startsToday = isTripStartingToday();
      
      if (startsToday) {
        Alert.alert(
          '✅ Viaje Guardado', 
          'Tu viaje comienza hoy. Ahora debes agregar las maletas inmediatamente para poder continuar.',
          [
            {
              text: 'Agregar Maletas',
              onPress: () => {
                navigation.replace('NewMaleta', { 
                  tripId: result.id,
                  destination: trip.destination,
                  country: selectedCountry,
                  city: selectedCity,
                  purpose: trip.purpose,
                  origin: origin,
                  forceLuggage: true,
                  tripStartsToday: true
                });
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          '✅ Viaje Guardado', 
          '¿Deseas agregar maletas para este viaje ahora?',
          [
            {
              text: 'Más Tarde',
              style: 'cancel',
              onPress: () => {
                navigation.navigate(origin);
              }
            },
            {
              text: 'Agregar Maletas',
              onPress: () => {
                navigation.navigate('NewMaleta', { 
                  tripId: result.id,
                  destination: trip.destination,
                  country: selectedCountry,
                  city: selectedCity,
                  purpose: trip.purpose,
                  origin: origin
                });
              }
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ Error guardando viaje:', error);
      
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
      setSaving(false);
    }
  };

  // 🔥 FUNCIONES AUXILIARES: Extraer país y ciudad del string
  const extractCountry = (destination) => {
    if (!destination) return '';
    const parts = destination.split(',');
    return parts.length > 0 ? parts[0].trim() : '';
  };

  const extractCity = (destination) => {
    if (!destination) return '';
    const parts = destination.split(',');
    return parts.length > 1 ? parts[1].trim() : parts[0].trim();
  };

  // 🔥 COMPONENTE RENDER
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
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
          
          {/* 🔥 MOSTRAR INFORMACIÓN DE LA UBICACIÓN SI EXISTE */}
          {selectedCountry && selectedCity && (
            <View style={styles.locationInfoBox}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color="#4CAF50" />
              </View>
              <View style={styles.locationDetails}>
                <Text style={styles.locationCountry}>{selectedCountry}</Text>
                <Text style={styles.locationCity}>{selectedCity}</Text>
              </View>
              <TouchableOpacity onPress={openMap}>
                <Ionicons name="pencil" size={18} color="#BB86FC" />
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity style={styles.inputWithIcon} onPress={openMap}>
            <Text style={trip.destination ? styles.inputText : styles.placeholderText}>
              {trip.destination || 'Seleccionar destino en el mapa *'}
            </Text>
            <Ionicons name="map-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.inputWithIcon} onPress={openStartDateCalendar}>
            <Text style={trip.startDate ? styles.inputText : styles.placeholderText}>
              {trip.startDate || 'Fecha de inicio *'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          {trip.startDate && (
            <View style={[
              styles.statusSection, 
              isTripStartingToday() ? styles.warningSection : styles.infoSection
            ]}>
              <Ionicons 
                name={isTripStartingToday() ? "warning" : "information-circle-outline"} 
                size={16} 
                color={isTripStartingToday() ? "#FFA500" : "#BB86FC"} 
              />
              <Text style={[
                styles.statusText,
                isTripStartingToday() ? styles.warningText : styles.infoText
              ]}>
                {isTripStartingToday() 
                  ? ' Este viaje comienza HOY. Deberás agregar las maletas inmediatamente y no podrás editar el viaje después.'
                  : isTripStartingInFuture()
                  ? '📅 Este viaje comienza en el futuro. Podrás editarlo hasta que comience.'
                  : 'Selecciona una fecha de inicio'
                }
              </Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.inputWithIcon} onPress={openEndDateCalendar}>
            <Text style={trip.endDate ? styles.inputText : styles.placeholderText}>
              {trip.endDate || 'Fecha de fin *'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
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

        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#BB86FC" />
          <Text style={styles.infoText}>
            Después de guardar el viaje, podrás agregar maletas con sugerencias de IA específicas para tu destino y propósito.
            {isTripStartingToday() && '\n\n⚠️ Si el viaje comienza hoy, deberás agregar las maletas inmediatamente y no podrás editar el viaje después.'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={saveTripToFirebase}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isTripStartingToday() ? 'Guardar Viaje y Agregar Maletas' : 'Guardar Viaje'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={getCurrentDateForPicker()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={getMinimumDateForPicker()}
        />
      )}
    </View>
  );
};

// 🔽 ESTILOS ACTUALIZADOS 🔽
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
  // 🔥 NUEVO: Estilo para mostrar la ubicación seleccionada
  locationInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationCountry: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationCity: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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
    flex: 1,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  warningSection: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  infoSection: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  warningText: {
    color: '#FFA500',
  },
  infoText: {
    color: '#BB86FC',
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
});

export default NewTripScreen;