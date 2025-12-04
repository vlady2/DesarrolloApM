// NewMoveScreen.js
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
import { getUserMoves, saveMove } from '../../firebase/moveService';

const NewMoveScreen = ({ route, navigation }) => {
  const { origin = 'Home' } = route.params || {};
  
  const [move, setMove] = useState({
    origin: '',
    destination: '',
    moveDate: '',
    moveType: 'residential',
    notes: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [existingMoves, setExistingMoves] = useState([]);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadExistingMoves();
  }, []);

  const loadExistingMoves = async () => {
    try {
      if (auth.currentUser) {
        const moves = await getUserMoves();
        setExistingMoves(moves);
      }
    } catch (error) {
      console.log('Error cargando mudanzas existentes:', error);
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
        if (isMoveToday()) {
          Alert.alert(
            'Acción requerida',
            'Debes completar las cajas antes de poder salir, ya que tu mudanza es hoy.',
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
  }, [navigation, origin, move.moveDate]);

  const handleGoBack = () => {
    if (isMoveToday()) {
      Alert.alert(
        'Acción requerida',
        'Debes completar las cajas antes de poder salir, ya que tu mudanza es hoy.',
        [{ text: 'Entendido' }]
      );
      return;
    }
    navigation.navigate(origin);
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
      setMove({...move, moveDate: formattedDate});
    }
  };

  const openDateCalendar = () => {
    setShowDatePicker(true);
  };

  const getCurrentDateForPicker = () => {
    return move.moveDate ? parseDateString(move.moveDate) : new Date();
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
    if (!move.moveDate) {
      return true;
    }

    const today = getToday();
    const moveDate = parseDateString(move.moveDate);

    if (!moveDate) {
      Alert.alert('Error', 'Formato de fecha inválido');
      return false;
    }

    if (moveDate < today) {
      Alert.alert('Error', 'La fecha de mudanza no puede ser una fecha pasada.');
      return false;
    }

    const overlapCheck = checkDateOverlap(move.moveDate);
    if (overlapCheck.hasOverlap) {
      Alert.alert(
        'Conflicto de Fechas', 
        'Ya tienes una mudanza programada para esta fecha. Por favor elige otra fecha.'
      );
      return false;
    }

    return true;
  };

  const isMoveToday = () => {
    if (!move.moveDate) return false;
    
    const today = getToday();
    const moveDate = parseDateString(move.moveDate);
    
    if (!moveDate) return false;
    
    return moveDate.getTime() === today.getTime();
  };

  const isMoveInFuture = () => {
    if (!move.moveDate) return false;
    
    const today = getToday();
    const moveDate = parseDateString(move.moveDate);
    
    if (!moveDate) return false;
    
    return moveDate.getTime() > today.getTime();
  };

  const selectLocation = (type) => {
    navigation.navigate('MapPickerMove', {
        addressType: type,
        currentAddress: type === 'origin' ? move.origin : move.destination,
        onSelectAddress: (address, addressType) => {
            if (addressType === 'origin') {
                setMove({...move, origin: address});
            } else {
                setMove({...move, destination: address});
            }
        }
    });
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
      onPress: () => setMove({...move, moveType: type.value})
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
    return types[move.moveType] || 'Seleccionar tipo de mudanza';
  };

  const saveMoveToFirebase = async () => {
    if (!move.origin) {
      Alert.alert('Error', 'Por favor selecciona una dirección de origen');
      return;
    }

    if (!move.destination) {
      Alert.alert('Error', 'Por favor selecciona una dirección de destino');
      return;
    }

    if (!move.moveDate) {
      Alert.alert('Error', 'Por favor selecciona una fecha de mudanza');
      return;
    }

    if (!validateAllDateRestrictions()) {
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para guardar mudanzas');
      return;
    }

    setSaving(true);
    
    try {
      const moveData = {
        origin: move.origin,
        destination: move.destination,
        moveDate: move.moveDate,
        moveType: move.moveType,
        notes: move.notes,
        status: 'planning',
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        isToday: isMoveToday()
      };

      const result = await saveMove(moveData);
      
      const todayMove = isMoveToday();
      
      if (todayMove) {
        Alert.alert(
          '✅ Mudanza Guardada', 
          'Tu mudanza es hoy. Ahora debes agregar las cajas inmediatamente para poder continuar.',
          [
            {
              text: 'Agregar Cajas',
              onPress: () => {
                navigation.replace('NewBox', { 
                  moveId: result.id,
                  origin: move.origin,
                  destination: move.destination,
                  moveType: move.moveType,
                  originScreen: origin,
                  forceBoxes: true,
                  moveIsToday: true
                });
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          '✅ Mudanza Guardada', 
          '¿Deseas agregar cajas para esta mudanza ahora?',
          [
            {
              text: 'Más Tarde',
              style: 'cancel',
              onPress: () => {
                navigation.navigate(origin);
              }
            },
            {
              text: 'Agregar Cajas',
              onPress: () => {
                navigation.navigate('NewBox', { 
                  moveId: result.id,
                  origin: move.origin,
                  destination: move.destination,
                  moveType: move.moveType,
                  originScreen: origin
                });
              }
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ Error guardando mudanza:', error);
      
      let errorMessage = 'No se pudo guardar la mudanza. Error desconocido.';
      
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Mudanza</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información de la Mudanza</Text>
          
          <TouchableOpacity 
    style={styles.inputWithIcon} 
    onPress={() => selectLocation('origin')}
>
    <Text style={move.origin ? styles.inputText : styles.placeholderText}>
        {move.origin || 'Dirección de origen *'}
    </Text>
    <Ionicons name="map-outline" size={20} color="#BB86FC" />
</TouchableOpacity>
          
          <TouchableOpacity 
    style={styles.inputWithIcon} 
    onPress={() => selectLocation('destination')}
>
    <Text style={move.destination ? styles.inputText : styles.placeholderText}>
        {move.destination || 'Dirección de destino *'}
    </Text>
    <Ionicons name="map-outline" size={20} color="#BB86FC" />
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
            <Text style={move.moveDate ? styles.inputText : styles.placeholderText}>
              {move.moveDate || 'Fecha de mudanza *'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          {move.moveDate && (
            <View style={[
              styles.statusSection, 
              isMoveToday() ? styles.warningSection : styles.infoSection
            ]}>
              <Ionicons 
                name={isMoveToday() ? "warning" : "information-circle-outline"} 
                size={16} 
                color={isMoveToday() ? "#FFA500" : "#BB86FC"} 
              />
              <Text style={[
                styles.statusText,
                isMoveToday() ? styles.warningText : styles.infoText
              ]}>
                {isMoveToday() 
                  ? ' Esta mudanza es HOY. Deberás agregar las cajas inmediatamente.'
                  : isMoveInFuture()
                  ? '📅 Esta mudanza está programada para el futuro. Podrás editarla hasta el día de la mudanza.'
                  : 'Selecciona una fecha de mudanza'
                }
              </Text>
            </View>
          )}
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notas adicionales (piso, ascensor, objetos especiales, etc.)"
            placeholderTextColor="#888"
            value={move.notes}
            onChangeText={(text) => setMove({...move, notes: text})}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color="#BB86FC" />
          <Text style={styles.infoText}>
            Después de guardar la mudanza, podrás agregar cajas con sugerencias organizadas por habitación o tipo de objeto.
            {isMoveToday() && '\n\n⚠️ Si la mudanza es hoy, deberás agregar las cajas inmediatamente.'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={saveMoveToFirebase}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isMoveToday() ? 'Guardar Mudanza y Agregar Cajas' : 'Guardar Mudanza'}
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

export default NewMoveScreen;