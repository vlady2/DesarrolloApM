// EditMoveScreen.js
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
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
import { getMoveById, getUserMoves, updateMove } from '../../firebase/moveService';

const EditMoveScreen = ({ route, navigation }) => {
  const { moveId, moveOrigin, moveDestination, moveType, origin = 'MoveDetail' } = route.params;
  
  const [editedMove, setEditedMove] = useState({
    origin: moveOrigin || '',
    destination: moveDestination || '',
    moveDate: '',
    moveType: moveType || 'residential',
    notes: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [existingMoves, setExistingMoves] = useState([]);
  
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
  }, [navigation, moveId, origin]);

  useEffect(() => {
    if (moveId) {
      loadMoveData();
    }
    loadExistingMoves();
  }, [moveId]);

  const loadExistingMoves = async () => {
    try {
      if (auth.currentUser) {
        const moves = await getUserMoves();
        // Filtrar la mudanza actual para no compararla consigo misma
        const otherMoves = moves.filter(m => m.id !== moveId);
        setExistingMoves(otherMoves);
      }
    } catch (error) {
      console.log('Error cargando mudanzas existentes:', error);
    }
  };

  const handleGoBack = () => {
    switch(origin) {
      case 'MyTrips':
        navigation.navigate('MyTrips');
        break;
      case 'MoveDetail':
        navigation.navigate('MoveDetail', { 
          moveId,
          moveOrigin: editedMove.origin,
          moveDestination: editedMove.destination,
          moveType: editedMove.moveType
        });
        break;
      default:
        navigation.navigate('MoveDetail', { 
          moveId,
          moveOrigin: editedMove.origin,
          moveDestination: editedMove.destination,
          moveType: editedMove.moveType
        });
    }
  };

  const loadMoveData = async () => {
    try {
      setLoading(true);
      const moveData = await getMoveById(moveId);
      
      setEditedMove({
        origin: moveData.origin || '',
        destination: moveData.destination || '',
        moveDate: moveData.moveDate || '',
        moveType: moveData.moveType || 'residential',
        notes: moveData.notes || ''
      });
      
    } catch (error) {
      console.error('Error cargando datos de la mudanza:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de la mudanza');
    } finally {
      setLoading(false);
    }
  };

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
      setEditedMove({...editedMove, moveDate: formattedDate});
    }
  };

  const openDateCalendar = () => {
    setShowDatePicker(true);
  };

  const getCurrentDateForPicker = () => {
    return editedMove.moveDate ? parseDateString(editedMove.moveDate) : new Date();
  };

  const getMinimumDateForPicker = () => {
    return getToday();
  };

  const checkDateOverlap = (moveDate) => {
    if (!moveDate) return { hasOverlap: false };
    
    const newDate = parseDateString(moveDate);
    
    for (const existingMove of existingMoves) {
      if (existingMove.moveDate) {
        const existingDate = parseDateString(existingMove.moveDate);
        
        if (newDate.getTime() === existingDate.getTime()) {
          return {
            hasOverlap: true,
            conflictingMove: existingMove
          };
        }
      }
    }
    
    return { hasOverlap: false };
  };

  const validateAllDateRestrictions = () => {
    if (!editedMove.moveDate) {
      return true;
    }

    const today = getToday();
    const moveDate = parseDateString(editedMove.moveDate);

    if (!moveDate) {
      Alert.alert('Error', 'Formato de fecha inválido');
      return false;
    }

    if (moveDate < today) {
      Alert.alert('Error', 'La fecha de mudanza no puede ser una fecha pasada.');
      return false;
    }

    const overlapCheck = checkDateOverlap(editedMove.moveDate);
    if (overlapCheck.hasOverlap) {
      Alert.alert(
        'Conflicto de Fechas', 
        'Ya tienes una mudanza programada para esta fecha. Por favor elige otra fecha.'
      );
      return false;
    }

    return true;
  };

  const selectLocation = async (type) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      const options = [
        {
          text: 'Usar mi ubicación actual',
          onPress: async () => {
            if (status === 'granted') {
              let location = await Location.getCurrentPositionAsync({});
              let geocode = await Location.reverseGeocodeAsync(location.coords);
              if (geocode[0]) {
                const address = `${geocode[0].street || ''} ${geocode[0].city || ''}, ${geocode[0].region || ''}`.trim();
                if (type === 'origin') {
                  setEditedMove({...editedMove, origin: address || 'Mi ubicación actual'});
                } else {
                  setEditedMove({...editedMove, destination: address || 'Mi ubicación actual'});
                }
              }
            }
          }
        },
        {
          text: 'Buscar en el mapa',
          onPress: () => {
            Alert.prompt(
              type === 'origin' ? 'Dirección de Origen' : 'Dirección de Destino',
              'Escribe la dirección:',
              (text) => {
                if (text) {
                  if (type === 'origin') {
                    setEditedMove({...editedMove, origin: text});
                  } else {
                    setEditedMove({...editedMove, destination: text});
                  }
                }
              }
            );
          }
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ];

      Alert.alert(
        type === 'origin' ? 'Seleccionar Origen' : 'Seleccionar Destino',
        '¿Cómo quieres seleccionar la dirección?',
        options
      );
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    }
  };

  const selectMoveType = () => {
    const moveTypes = [
      { label: '🚚 Mudanza Residencial', value: 'residential' },
      { label: '🏢 Mudanza de Oficina', value: 'office' },
      { label: '🎓 Mudanza Estudiantil', value: 'student' },
      { label: '🌎 Mudanza Internacional', value: 'international' },
      { label: '📦 Solo Almacenamiento', value: 'storage' },
      { label: '🏠 Otro tipo', value: 'other' }
    ];

    const options = moveTypes.map(type => ({
      text: type.label,
      onPress: () => setEditedMove({...editedMove, moveType: type.value})
    }));

    options.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert('Tipo de Mudanza', 'Selecciona el tipo de mudanza:', options);
  };

  const getMoveTypeLabel = () => {
    const types = {
      'residential': '🚚 Mudanza Residencial',
      'office': '🏢 Mudanza de Oficina',
      'student': '🎓 Mudanza Estudiantil',
      'international': '🌎 Mudanza Internacional',
      'storage': '📦 Solo Almacenamiento',
      'other': '🏠 Otro tipo'
    };
    return types[editedMove.moveType] || 'Seleccionar tipo de mudanza';
  };

  const handleAddBox = () => {
    navigation.navigate('NewBox', { 
      moveId: moveId,
      origin: editedMove.origin,
      destination: editedMove.destination,
      moveType: editedMove.moveType,
      originScreen: 'EditMove'
    });
  };

  const updateMoveInFirebase = async () => {
    if (!editedMove.origin) {
      Alert.alert('Error', 'Por favor selecciona una dirección de origen');
      return;
    }

    if (!editedMove.destination) {
      Alert.alert('Error', 'Por favor selecciona una dirección de destino');
      return;
    }

    if (!editedMove.moveDate) {
      Alert.alert('Error', 'Por favor selecciona una fecha de mudanza');
      return;
    }

    if (!validateAllDateRestrictions()) {
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para editar mudanzas');
      return;
    }

    setSaving(true);
    
    try {
      const moveData = {
        origin: editedMove.origin,
        destination: editedMove.destination,
        moveDate: editedMove.moveDate,
        moveType: editedMove.moveType,
        notes: editedMove.notes,
        updatedAt: new Date()
      };

      await updateMove(moveId, moveData);
      
      Alert.alert(
        '✅ Éxito', 
        'Mudanza actualizada correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              if (origin === 'MyTrips') {
                navigation.navigate('MyTrips');
              } else {
                navigation.navigate('MoveDetail', { 
                  moveId,
                  moveOrigin: editedMove.origin,
                  moveDestination: editedMove.destination,
                  moveType: editedMove.moveType
                });
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error actualizando mudanza:', error);
      
      let errorMessage = 'No se pudo actualizar la mudanza.';
      
      if (error.message) {
        if (error.message.includes('permission')) {
          errorMessage = 'Error de permisos. Verifica las reglas de Firestore.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu internet.';
        } else if (error.message.includes('not-found')) {
          errorMessage = 'La mudanza no existe o fue eliminada.';
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
          <Text style={styles.loadingText}>Cargando mudanza...</Text>
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
        <Text style={styles.headerTitle}>Editar Mudanza</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información de la Mudanza</Text>
          
          <TouchableOpacity 
            style={styles.inputWithIcon} 
            onPress={() => selectLocation('origin')}
          >
            <Text style={editedMove.origin ? styles.inputText : styles.placeholderText}>
              {editedMove.origin || 'Dirección de origen *'}
            </Text>
            <Ionicons name="home-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.inputWithIcon} 
            onPress={() => selectLocation('destination')}
          >
            <Text style={editedMove.destination ? styles.inputText : styles.placeholderText}>
              {editedMove.destination || 'Dirección de destino *'}
            </Text>
            <Ionicons name="business-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.inputWithIcon} 
            onPress={selectMoveType}
          >
            <Text style={styles.inputText}>
              {getMoveTypeLabel()}
            </Text>
            <Ionicons name="chevron-down-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.inputWithIcon} 
            onPress={openDateCalendar}
          >
            <Text style={editedMove.moveDate ? styles.inputText : styles.placeholderText}>
              {editedMove.moveDate || 'Fecha de mudanza *'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notas adicionales (piso, ascensor, objetos especiales, etc.)"
            placeholderTextColor="#888"
            value={editedMove.notes}
            onChangeText={(text) => setEditedMove({...editedMove, notes: text})}
            multiline
            numberOfLines={3}
          />
        </View>

        

        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#BB86FC" />
          <Text style={styles.infoText}>
            Las cajas se gestionan en su propia sección. Puedes agregar, editar o eliminar cajas desde aquí.
            {existingMoves.length > 0 && '\n\n⚠️ Las fechas no deben coincidir con otras mudanzas existentes.'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={updateMoveInFirebase}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {saving ? 'Actualizando...' : 'Actualizar Mudanza'}
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
  boxesSection: {
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
  boxesButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  boxesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#FF6B6B',
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
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

export default EditMoveScreen;