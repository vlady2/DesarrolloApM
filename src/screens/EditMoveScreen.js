// EditMoveScreen.js - VERSIÓN ACTUALIZADA CON MODAL DE TIPOS
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { getMoveById, getUserMoves, updateMove } from '../../firebase/moveService';

const EditMoveScreen = ({ route, navigation }) => {
  const { 
    moveId, 
    moveOrigin, 
    moveDestination, 
    moveType, 
    moveDate: initialMoveDate, 
    notes: initialNotes, 
    origin = 'MoveDetail' 
  } = route.params;
  
  const [editedMove, setEditedMove] = useState({
    origin: moveOrigin || '',
    destination: moveDestination || '',
    moveDate: initialMoveDate || '',
    moveType: moveType || 'residential',
    notes: initialNotes || ''
  });
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [existingMoves, setExistingMoves] = useState([]);
  const [showMoveTypeModal, setShowMoveTypeModal] = useState(false); // ✅ Nuevo estado para modal
  
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
  }, [navigation, moveId, origin, editedMove]);

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
        const otherMoves = moves.filter(m => m.id !== moveId);
        setExistingMoves(otherMoves);
      }
    } catch (error) {
      console.log('Error cargando mudanzas existentes:', error);
    }
  };

  const handleGoBack = () => {
  Alert.alert(
    '¿Descartar cambios?',
    'Si regresas ahora, perderás los cambios no guardados.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          switch(origin) {
            case 'MyTrips':
              navigation.navigate('MyTrips');
              break;
            case 'MoveDetail':
            default:
              // ✅ SIMPLEMENTE regresar, MoveDetailScreen ya se recargará sola
              navigation.goBack();
          }
        }
      }
    ]
  );
};

  const loadMoveData = async () => {
    try {
      setLoading(true);
      const moveData = await getMoveById(moveId);
      
      if (moveData) {
        setEditedMove({
          origin: moveData.origin || moveOrigin || '',
          destination: moveData.destination || moveDestination || '',
          moveDate: moveData.moveDate || initialMoveDate || '',
          moveType: moveData.moveType || moveType || 'residential',
          notes: moveData.notes || initialNotes || ''
        });
      }
      
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
      Alert.alert('Error', 'Por favor selecciona una fecha de mudanza');
      return false;
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

  const selectLocation = (type) => {
    navigation.navigate('MapPickerMove', {
      addressType: type,
      currentAddress: type === 'origin' ? editedMove.origin : editedMove.destination,
      onSelectAddress: (address, addressType) => {
        console.log('📍 Dirección seleccionada en EditMove:', address, 'para:', addressType);
        if (addressType === 'origin') {
          setEditedMove(prev => ({...prev, origin: address}));
        } else {
          setEditedMove(prev => ({...prev, destination: address}));
        }
      },
      originScreen: 'EditMove',
      moveId: moveId
    });
  };

  // ✅ MODIFICADA: Usar Modal como en NewMoveScreen
  const selectMoveType = () => {
    setShowMoveTypeModal(true);
  };

  // ✅ Función para seleccionar tipo desde modal
  const handleSelectMoveType = (type, label) => {
    setEditedMove({...editedMove, moveType: type});
    setShowMoveTypeModal(false);
  };

  const getMoveTypeLabel = () => {
    const types = {
      'office': '🏢 Mudanza para oficina',
      'residential': '🏠 Mudanza residencial',
      'personal': '👤 Mudanza particular',
      'company': '🏭 Mudanza para empresa',
      'other': '🚚 Otro tipo de mudanza'
    };
    return types[editedMove.moveType] || 'Seleccionar tipo de mudanza';
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

      console.log('🟡 Actualizando mudanza:', moveId, 'con datos:', moveData);
      await updateMove(moveId, moveData);
      
      // ✅ ACTUALIZADO: Pasar todos los datos actualizados
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
                // ✅ CRÍTICO: Pasar todos los datos actualizados
                navigation.navigate('MoveDetail', { 
                  moveId,
                  moveOrigin: editedMove.origin, // ✅ Usar los valores editados
                  moveDestination: editedMove.destination, // ✅ Usar los valores editados
                  moveType: editedMove.moveType, // ✅ Usar los valores editados
                  moveDate: editedMove.moveDate, // ✅ Asegurar que se pase la fecha
                  notes: editedMove.notes // ✅ Pasar también las notas
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

  // ✅ Modal para seleccionar tipo de mudanza (MISMO que en NewMoveScreen)
  const renderMoveTypeModal = () => (
    <Modal
      visible={showMoveTypeModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMoveTypeModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowMoveTypeModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Tipo de Mudanza</Text>
              <Text style={styles.modalSubtitle}>Selecciona el tipo de mudanza:</Text>
              
              {/* Opción 1: Mudanza para oficina */}
              <TouchableOpacity
                style={[styles.typeOption, editedMove.moveType === 'office' && styles.typeOptionSelected]}
                onPress={() => handleSelectMoveType('office', '🏢 Mudanza para Oficina')}
              >
                <View style={styles.typeIcon}>
                  <Text style={styles.typeIconText}>🏢</Text>
                </View>
                <View style={styles.typeTextContainer}>
                  <Text style={[styles.typeText, editedMove.moveType === 'office' && styles.typeTextSelected]}>
                    Mudanza para Oficina
                  </Text>
                  <Text style={[styles.typeDescription, editedMove.moveType === 'office' && styles.typeDescriptionSelected]}>
                    Oficinas y espacios de trabajo
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Opción 2: Mudanza para empresa */}
              <TouchableOpacity
                style={[styles.typeOption, editedMove.moveType === 'company' && styles.typeOptionSelected]}
                onPress={() => handleSelectMoveType('company', '🏭 Mudanza para empresa')}
              >
                <View style={styles.typeIcon}>
                  <Text style={styles.typeIconText}>🏭</Text>
                </View>
                <View style={styles.typeTextContainer}>
                  <Text style={[styles.typeText, editedMove.moveType === 'company' && styles.typeTextSelected]}>
                    Mudanza para empresa
                  </Text>
                  <Text style={[styles.typeDescription, editedMove.moveType === 'company' && styles.typeDescriptionSelected]}>
                    Almacenes y empresas
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Opción 3: Mudanza residencial */}
              <TouchableOpacity
                style={[styles.typeOption, editedMove.moveType === 'residential' && styles.typeOptionSelected]}
                onPress={() => handleSelectMoveType('residential', '🏠 Mudanza residencial')}
              >
                <View style={styles.typeIcon}>
                  <Text style={styles.typeIconText}>🏠</Text>
                </View>
                <View style={styles.typeTextContainer}>
                  <Text style={[styles.typeText, editedMove.moveType === 'residential' && styles.typeTextSelected]}>
                    Mudanza residencial
                  </Text>
                  <Text style={[styles.typeDescription, editedMove.moveType === 'residential' && styles.typeDescriptionSelected]}>
                    Casas, apartamentos, hogares
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Opción 4: Mudanza particular */}
              <TouchableOpacity
                style={[styles.typeOption, editedMove.moveType === 'personal' && styles.typeOptionSelected]}
                onPress={() => handleSelectMoveType('personal', '👤 Mudanza particular')}
              >
                <View style={styles.typeIcon}>
                  <Text style={styles.typeIconText}>👤</Text>
                </View>
                <View style={styles.typeTextContainer}>
                  <Text style={[styles.typeText, editedMove.moveType === 'personal' && styles.typeTextSelected]}>
                    Mudanza particular
                  </Text>
                  <Text style={[styles.typeDescription, editedMove.moveType === 'personal' && styles.typeDescriptionSelected]}>
                    Traslados personales, pocos objetos
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Opción 5: Otro tipo */}
              <TouchableOpacity
                style={[styles.typeOption, editedMove.moveType === 'other' && styles.typeOptionSelected]}
                onPress={() => handleSelectMoveType('other', '🚚 Otro tipo de mudanza')}
              >
                <View style={styles.typeIcon}>
                  <Text style={styles.typeIconText}>🚚</Text>
                </View>
                <View style={styles.typeTextContainer}>
                  <Text style={[styles.typeText, editedMove.moveType === 'other' && styles.typeTextSelected]}>
                    Otro tipo de mudanza
                  </Text>
                  <Text style={[styles.typeDescription, editedMove.moveType === 'other' && styles.typeDescriptionSelected]}>
                    Otro tipo no especificado
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Botón Cancelar */}
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowMoveTypeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

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
            <Ionicons name="map-outline" size={20} color="#BB86FC" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.inputWithIcon} 
            onPress={() => selectLocation('destination')}
          >
            <Text style={editedMove.destination ? styles.inputText : styles.placeholderText}>
              {editedMove.destination || 'Dirección de destino *'}
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
            Usa el ícono de mapa 🗺️ para seleccionar direcciones precisas.
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

      {renderMoveTypeModal()}
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
  datePicker: {
    backgroundColor: '#1E1E1E',
  },
  // Estilos para el Modal de Tipo de Mudanza (igual que NewMoveScreen)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#BB86FC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  typeOptionSelected: {
    backgroundColor: '#BB86FC',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIconText: {
    fontSize: 20,
  },
  typeTextContainer: {
    flex: 1,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  typeTextSelected: {
    color: '#000000',
    fontWeight: 'bold',
  },
  typeDescription: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  typeDescriptionSelected: {
    color: '#444',
  },
  cancelButton: {
    marginTop: 10,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditMoveScreen;