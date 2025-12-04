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
import { getTripById, getUserTrips, updateTrip } from '../../firebase/tripService';

const EditTripScreen = ({ route, navigation }) => {
  const { trip, origin = 'TripDetail' } = route.params;
  
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
  const [existingTrips, setExistingTrips] = useState([]);
  
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
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
  }, [navigation, trip, origin]);

  useEffect(() => {
    if (trip.id) {
      loadTripData();
    }
    loadExistingTrips();
  }, [trip.id]);

  const loadExistingTrips = async () => {
    try {
      if (auth.currentUser) {
        const trips = await getUserTrips();
        const otherTrips = trips.filter(t => t.id !== trip.id);
        setExistingTrips(otherTrips);
      }
    } catch (error) {
      console.log('Error cargando viajes existentes:', error);
    }
  };

  const handleGoBack = () => {
    switch(origin) {
      case 'MyTrips':
        navigation.navigate('MyTrips');
        break;
      case 'TripDetail':
        navigation.navigate('TripDetail', { trip });
        break;
      default:
        navigation.navigate('TripDetail', { trip });
    }
  };

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

  // ✅ FUNCIONES DE MANEJO DE FECHAS
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

  const getToday = () => {
    const now = new Date();
    const today = new Date(Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ));
    return today;
  };

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
        setEditedTrip({...editedTrip, startDate: formattedDate});
        
        if (editedTrip.endDate) {
          const endDate = parseDateString(editedTrip.endDate);
          const startDate = parseDateString(formattedDate);
          
          if (endDate && startDate && endDate < startDate) {
            setEditedTrip(prev => ({ ...prev, endDate: '' }));
          }
        }
      } else {
        setEditedTrip({...editedTrip, endDate: formattedDate});
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
    if (datePickerMode === 'start' && editedTrip.startDate) {
      return parseDateString(editedTrip.startDate) || new Date();
    } else if (datePickerMode === 'end' && editedTrip.endDate) {
      return parseDateString(editedTrip.endDate) || new Date();
    }
    return new Date();
  };

  const getMinimumDateForPicker = () => {
    if (datePickerMode === 'start') {
      return getToday();
    } else {
      return editedTrip.startDate 
        ? parseDateString(editedTrip.startDate)
        : getToday();
    }
  };

  // ✅ FUNCIÓN DE VALIDACIÓN DE SOLAPAMIENTO
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

  // ✅ FUNCIÓN DE VALIDACIÓN COMPLETA
  const validateAllDateRestrictions = () => {
    if (!editedTrip.startDate || !editedTrip.endDate) {
      return true;
    }

    const today = getToday();
    const startDate = parseDateString(editedTrip.startDate);
    const endDate = parseDateString(editedTrip.endDate);

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

    const overlapCheck = checkDateOverlap(editedTrip.startDate, editedTrip.endDate);
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
          message = 'Este viaje contiene completamente a otro viaje existente. Elige fechas que no coincidan.';
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

  // ✅ ABRIR MAPA EN PANTALLA COMPLETA - CON CALLBACK
  const openMap = () => {
    navigation.navigate('MapPicker', {
      onSelectLocation: (locationData) => {
        // ✅ ESTO ES CLAVE: Recibe la ubicación seleccionada y actualiza el estado
        if (locationData && locationData.country && locationData.city) {
          const newDestination = `${locationData.country}, ${locationData.city}`;
          console.log('📍 Destino seleccionado desde mapa:', newDestination);
          setEditedTrip(prev => ({
            ...prev,
            destination: newDestination
          }));
        }
      },
      // Opcional: pasar el destino actual para centrar el mapa
      currentDestination: editedTrip.destination
    });
  };

  const validateDates = () => {
    if (editedTrip.startDate && editedTrip.endDate) {
      const start = parseDateString(editedTrip.startDate);
      const end = parseDateString(editedTrip.endDate);
      
      if (end && start && end < start) {
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

  const updateTripInFirebase = async () => {
    if (!editedTrip.destination) {
      Alert.alert('Error', 'Por favor selecciona un destino');
      return;
    }

    if (!editedTrip.startDate) {
      Alert.alert('Error', 'Por favor selecciona una fecha de inicio');
      return;
    }
    
    if (!editedTrip.endDate) {
      Alert.alert('Error', 'Por favor selecciona una fecha de fin');
      return;
    }

    if (!validateAllDateRestrictions()) {
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para editar viajes');
      return;
    }

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

      await updateTrip(trip.id, tripData);
      
      Alert.alert(
        '✅ Éxito', 
        'Viaje actualizado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              if (origin === 'MyTrips') {
                navigation.navigate('MyTrips');
              } else {
                navigation.navigate('TripDetail', { trip: { ...trip, ...tripData } });
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error actualizando viaje:', error);
      
      let errorMessage = 'No se pudo actualizar el viaje.';
      
      if (error.message) {
        if (error.message.includes('permission')) {
          errorMessage = 'Error de permisos. Verifica las reglas de Firestore.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu internet.';
        } else if (error.message.includes('not-found')) {
          errorMessage = 'El viaje no existe o fue eliminado.';
        }
      }
      
      Alert.alert('❌ Error', errorMessage);
    } finally {
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
          
          {/* ✅ BOTÓN PARA ABRIR MAPA EN PANTALLA COMPLETA */}
          <TouchableOpacity style={styles.inputWithIcon} onPress={openMap}>
            <Text style={editedTrip.destination ? styles.inputText : styles.placeholderText}>
              {editedTrip.destination || 'Seleccionar destino *'}
            </Text>
            <Ionicons name="map-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.inputWithIcon} onPress={openStartDateCalendar}>
            <Text style={editedTrip.startDate ? styles.inputText : styles.placeholderText}>
              {editedTrip.startDate || 'Fecha de inicio *'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.inputWithIcon} onPress={openEndDateCalendar}>
            <Text style={editedTrip.endDate ? styles.inputText : styles.placeholderText}>
              {editedTrip.endDate || 'Fecha de fin *'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
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

        {/* ✅ INFO SECTION */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#BB86FC" />
          <Text style={styles.infoText}>
            Los artículos se gestionan en la sección de maletas.
            {existingTrips.length > 0 && '\n\n⚠️ Las fechas no deben coincidir con otros viajes existentes.'}
          </Text>
        </View>

        {/* ✅ BOTÓN PARA ACTUALIZAR */}
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

      {showDatePicker && (
        <DateTimePicker
          value={getCurrentDateForPicker()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={getMinimumDateForPicker()}
          style={styles.datePicker}
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
  datePicker: {
    backgroundColor: '#1E1E1E',
  },
});

export default EditTripScreen;