// NewBoxScreen.js
import { GROQ_API_KEY } from '@env';
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
import { saveBox, updateBox } from '../../firebase/moveService';

// Tipos de cajas para mudanza
const TIPOS_CAJAS = [
  { id: 'small', nombre: 'Caja Pequeña (30x30x30)', icon: 'cube-outline', capacidad: 'Objetos livianos' },
  { id: 'medium', nombre: 'Caja Mediana (40x40x40)', icon: 'cube', capacidad: 'Objetos generales' },
  { id: 'large', nombre: 'Caja Grande (50x50x50)', icon: 'archive-outline', capacidad: 'Objetos voluminosos' },
  { id: 'extra_large', nombre: 'Caja Extra Grande (60x60x60)', icon: 'layers-outline', capacidad: 'Muebles desarmados' },
  { id: 'fragile', nombre: 'Caja Frágil', icon: 'warning-outline', capacidad: 'Vidrios, cristalería' },
  { id: 'wardrobe', nombre: 'Caja Ropero', icon: 'shirt-outline', capacidad: 'Ropa colgada' }
];

// Habitaciones comunes en una mudanza
const HABITACIONES = [
  { id: 'living', nombre: 'Sala de Estar', icon: 'tv-outline' },
  { id: 'kitchen', nombre: 'Cocina', icon: 'restaurant-outline' },
  { id: 'bedroom', nombre: 'Dormitorio', icon: 'bed-outline' },
  { id: 'bathroom', nombre: 'Baño', icon: 'water-outline' },
  { id: 'office', nombre: 'Oficina', icon: 'desktop-outline' },
  { id: 'garage', nombre: 'Garaje', icon: 'car-outline' },
  { id: 'other', nombre: 'Otra Habitación', icon: 'ellipsis-horizontal' }
];

// Artículos problemáticos para mudanza
const ARTICULOS_PROBLEMATICOS = [
  'Productos químicos (limpieza, pinturas)',
  'Alimentos perecederos',
  'Plantas y tierra',
  'Objetos de valor (joyas, dinero)',
  'Medicamentos refrigerados',
  'Electrónicos sensibles',
  'Líquidos sin sellar',
  'Baterías sueltas'
];

// Sugerencias por tipo de habitación
const SUGERENCIAS_POR_HABITACION = {
  'kitchen': ['Utensilios de cocina', 'Vajilla y cristalería', 'Electrodomésticos pequeños', 'Alimentos no perecederos', 'Tablas de cortar'],
  'living': ['Decoraciones', 'Libros', 'Electrónicos', 'Alfombras', 'Muebles pequeños'],
  'bedroom': ['Ropa', 'Ropa de cama', 'Accesorios personales', 'Joyería', 'Cosméticos'],
  'bathroom': ['Productos de higiene', 'Toallas', 'Botiquín', 'Accesorios de baño', 'Espejos'],
  'office': ['Documentos importantes', 'Material de oficina', 'Libros', 'Electrónicos', 'Archivos'],
  'garage': ['Herramientas', 'Equipo deportivo', 'Artículos de jardín', 'Bicicletas', 'Cajas de almacenamiento'],
  'other': ['Artículos varios', 'Decoraciones', 'Objetos personales', 'Regalos', 'Recuerdos']
};

const NewBoxScreen = ({ route, navigation }) => {
  const { 
    moveId, 
    origin: moveOrigin, 
    destination: moveDestination, 
    moveType,
    originScreen = 'MoveDetail', 
    boxToEdit,
    mode = 'create',
    forceBoxes = false,
    moveIsToday = false
  } = route.params;
  
  const [caja, setCaja] = useState(
    mode === 'edit' && boxToEdit 
      ? {
          tipo: boxToEdit.tipo || '',
          habitacion: boxToEdit.habitacion || '',
          nombre: boxToEdit.nombre || '',
          descripcion: boxToEdit.descripcion || '',
          items: boxToEdit.items ? boxToEdit.items.map(item => 
            typeof item === 'string' ? { id: Date.now().toString() + Math.random(), nombre: item } : item
          ) : [],
          isFragile: boxToEdit.isFragile || false,
          peso: boxToEdit.peso || '',
          color: boxToEdit.color || '#BB86FC'
        }
      : {
          tipo: '',
          habitacion: '',
          nombre: '',
          descripcion: '',
          items: [],
          isFragile: false,
          peso: '',
          color: '#BB86FC'
        }
  );

  const [isEditMode] = useState(mode === 'edit');
  const [boxId] = useState(boxToEdit?.id || null);
  const [itemActual, setItemActual] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [showHabitacionModal, setShowHabitacionModal] = useState(false);
  const [hasSavedBox, setHasSavedBox] = useState(false);

  const insets = useSafeAreaInsets();

  // BackHandler bloqueante cuando forceBoxes es true
  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
        if (forceBoxes && !hasSavedBox) {
          Alert.alert(
            'Acción requerida',
            'Debes completar y guardar al menos una caja antes de poder salir, ya que tu mudanza es hoy.',
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
  }, [navigation, originScreen, forceBoxes, hasSavedBox]);

  // Función de navegación que respeta el originScreen
  const handleGoBack = () => {
    if (forceBoxes && !hasSavedBox) {
      Alert.alert(
        'Acción requerida',
        'Debes completar y guardar al menos una caja antes de poder salir, ya que tu mudanza es hoy.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    console.log('🟡 Navegando desde NewBox - Origen:', originScreen);
    
    switch(originScreen) {
      case 'Home':
        navigation.navigate('Home');
        break;
      case 'MoveDetail':
        navigation.navigate('MoveDetail', { 
          moveId,
          moveOrigin,
          moveDestination,
          moveType
        });
        break;
      case 'EditMove':
        navigation.navigate('EditMove', { 
          moveId,
          moveOrigin,
          moveDestination,
          moveType
        });
        break;
      default:
        navigation.navigate('MoveDetail', { 
          moveId,
          moveOrigin,
          moveDestination,
          moveType
        });
    }
  };

  // Cargar sugerencias basadas en la habitación seleccionada
  useEffect(() => {
    if (caja.habitacion && !isEditMode) {
      cargarSugerenciasPorHabitacion();
    }
  }, [caja.habitacion, isEditMode]);

  const cargarSugerenciasPorHabitacion = () => {
    const sugerenciasHabitacion = SUGERENCIAS_POR_HABITACION[caja.habitacion] || [];
    
    // Agregar sugerencias generales
    const sugerenciasCompletas = [
      ...sugerenciasHabitacion,
      'Documentos importantes',
      'Llaves',
      'Herramientas básicas',
      'Productos de limpieza',
      'Primeros auxilios'
    ];
    
    setSugerencias(sugerenciasCompletas.slice(0, 10));
  };

  const getAISuggestions = async () => {
    if (!caja.habitacion || !moveType) {
      Alert.alert('Info', 'Selecciona una habitación para generar sugerencias específicas');
      return;
    }

    setLoadingAI(true);
    try {
      const API_URL = "https://api.groq.com/openai/v1/chat/completions";

      const prompt = `Como experto en mudanzas, sugiere 10 artículos específicos para empacar en una caja de la habitación ${caja.habitacion} para una mudanza de tipo ${moveType}. 
      Considera artículos importantes, frágiles u olvidados comúnmente.
      Responde SOLO con una lista separada por comas, sin numeración ni explicaciones.`;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "Eres un asistente especializado en mudanzas y organización. Proporcionas listas concisas de artículos específicos para cada tipo de habitación y mudanza."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Respuesta de IA en formato incorrecto');
      }
      
      const aiMessage = data.choices[0].message.content;
      const aiSuggestions = aiMessage.split(',').map(item => item.trim()).filter(item => item);
      
      setSugerencias(aiSuggestions.slice(0, 10));
      
    } catch (error) {
      console.error('Error con IA:', error);
      cargarSugerenciasPorHabitacion();
    } finally {
      setLoadingAI(false);
    }
  };

  const agregarItem = () => {
    if (itemActual.trim()) {
      setCaja({
        ...caja,
        items: [...caja.items, { 
          id: Date.now().toString(), 
          nombre: itemActual.trim() 
        }]
      });
      setItemActual('');
    }
  };

  const eliminarItem = (id) => {
    setCaja({
      ...caja,
      items: caja.items.filter(item => item.id !== id)
    });
  };

  const agregarSugerencia = (sugerencia) => {
    setCaja({
      ...caja,
      items: [...caja.items, { 
        id: Date.now().toString(), 
        nombre: sugerencia 
      }]
    });
    setSugerencias(sugerencias.filter(item => item !== sugerencia));
  };

  const seleccionarTipo = (tipoId) => {
    setCaja({ ...caja, tipo: tipoId });
    setShowTipoModal(false);
  };

  const seleccionarHabitacion = (habitacionId) => {
    setCaja({ ...caja, habitacion: habitacionId });
    setShowHabitacionModal(false);
  };

  const guardarCaja = async () => {
    console.log('🟡 Botón presionado - Modo:', isEditMode ? 'EDITAR' : 'CREAR');
    console.log('🟡 ForceBoxes:', forceBoxes);
    console.log('🟡 Origin:', originScreen);
    
    if (!caja.tipo) {
      Alert.alert('Error', 'Por favor selecciona un tipo de caja');
      return;
    }

    if (!caja.habitacion) {
      Alert.alert('Error', 'Por favor selecciona una habitación');
      return;
    }

    if (caja.items.length === 0) {
      Alert.alert('Error', 'Por favor agrega al menos un artículo a la caja');
      return;
    }

    setSaving(true);
    
    try {
      const cajaData = {
        tipo: caja.tipo,
        habitacion: caja.habitacion,
        nombre: caja.nombre || `Caja de ${HABITACIONES.find(h => h.id === caja.habitacion)?.nombre || 'Mudanza'}`,
        descripcion: caja.descripcion,
        items: caja.items.map(item => item.nombre),
        isFragile: caja.isFragile,
        peso: caja.peso ? parseFloat(caja.peso) : null,
        color: caja.color,
        status: 'packed',
        createdAt: boxToEdit?.createdAt || new Date(),
        updatedAt: new Date()
      };

      console.log('🟡 Enviando datos de caja:', cajaData);
      
      if (isEditMode && boxId) {
        console.log('✏️ Actualizando caja existente:', boxId);
        await updateBox(moveId, boxId, cajaData);
        console.log('🟢 Caja actualizada correctamente');
      } else {
        console.log('🆕 Creando nueva caja');
        await saveBox(moveId, cajaData);
        console.log('🟢 Caja guardada correctamente en Firebase');
      }
      
      setHasSavedBox(true);
      
      if (forceBoxes) {
        Alert.alert(
          '✅ Caja Guardada', 
          'Has completado la caja requerida. ¿Deseas agregar otra caja o finalizar?',
          [
            {
              text: 'Finalizar',
              onPress: () => {
                console.log('🔵 Navegando a HOME desde modo bloqueante');
                navigation.replace('Home');
              }
            },
            {
              text: 'Agregar Otra Caja',
              onPress: () => {
                console.log('🟡 Reiniciando formulario para nueva caja...');
                setCaja({
                  tipo: '',
                  habitacion: '',
                  nombre: '',
                  descripcion: '',
                  items: [],
                  isFragile: false,
                  peso: '',
                  color: '#BB86FC'
                });
                setSugerencias([]);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          isEditMode ? '✅ Caja Actualizada' : '✅ Caja Guardada', 
          isEditMode ? 'Caja actualizada correctamente' : '¿Deseas agregar otra caja para esta mudanza?',
          [
            {
              text: 'Finalizar',
              onPress: () => {
                console.log('🔵 Navegando según ORIGIN:', originScreen);
                
                switch(originScreen) {
                  case 'Home':
                    navigation.navigate('Home');
                    break;
                  case 'MoveDetail':
                    navigation.navigate('MoveDetail', { 
                      moveId,
                      moveOrigin,
                      moveDestination,
                      moveType
                    });
                    break;
                  case 'EditMove':
                    navigation.navigate('EditMove', { 
                      moveId,
                      moveOrigin,
                      moveDestination,
                      moveType
                    });
                    break;
                  default:
                    navigation.navigate('MoveDetail', { 
                      moveId,
                      moveOrigin,
                      moveDestination,
                      moveType
                    });
                }
              }
            },
            ...(isEditMode ? [] : [{
              text: 'Agregar Otra Caja',
              onPress: () => {
                console.log('🟡 Reiniciando formulario para nueva caja...');
                setCaja({
                  tipo: '',
                  habitacion: '',
                  nombre: '',
                  descripcion: '',
                  items: [],
                  isFragile: false,
                  peso: '',
                  color: '#BB86FC'
                });
                setSugerencias([]);
              }
            }])
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ Error guardando caja:', error);
      Alert.alert('❌ Error', `No se pudo ${isEditMode ? 'actualizar' : 'guardar'} la caja: ` + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Editar Caja' : 'Nueva Caja'}
        </Text>
        {forceBoxes && (
          <Text style={styles.requiredText}>* Requerido</Text>
        )}
      </View>
      <View style={styles.placeholder} />
    </View>
  );

  const getTipoNombre = () => {
    return caja.tipo 
      ? TIPOS_CAJAS.find(t => t.id === caja.tipo)?.nombre
      : 'Seleccionar tipo de caja';
  };

  const getHabitacionNombre = () => {
    return caja.habitacion 
      ? HABITACIONES.find(h => h.id === caja.habitacion)?.nombre
      : 'Seleccionar habitación';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      {renderHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* INDICADOR DE MODO BLOQUEANTE */}
        {forceBoxes && (
          <View style={styles.requiredSection}>
            <Ionicons name="warning" size={16} color="#FFA500" />
            <Text style={styles.requiredSectionText}>
              Tu mudanza es hoy. Debes completar al menos una caja antes de continuar.
            </Text>
          </View>
        )}

        {/* Información de la Mudanza */}
        <View style={styles.moveInfo}>
          <Text style={styles.moveTitle}>Mudanza: {moveOrigin} → {moveDestination}</Text>
          <Text style={styles.moveType}>Tipo: {moveType}</Text>
          {isEditMode && (
            <Text style={styles.editModeText}>Modo edición</Text>
          )}
        </View>

        {/* Información Básica de la Caja */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información de la Caja</Text>
          
          {/* Nombre de la caja (opcional) */}
          <TextInput
            style={styles.input}
            placeholder="Nombre de la caja (opcional)"
            placeholderTextColor="#888"
            value={caja.nombre}
            onChangeText={(text) => setCaja({...caja, nombre: text})}
          />

          {/* Tipo de Caja */}
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowTipoModal(true)}
          >
            <Text style={caja.tipo ? styles.selectorText : styles.placeholderText}>
              {getTipoNombre()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#BB86FC" />
          </TouchableOpacity>

          {/* Habitación */}
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowHabitacionModal(true)}
          >
            <Text style={caja.habitacion ? styles.selectorText : styles.placeholderText}>
              {getHabitacionNombre()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#BB86FC" />
          </TouchableOpacity>

          {/* Peso y Fragilidad */}
          <View style={styles.rowContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              placeholder="Peso (kg) - opcional"
              placeholderTextColor="#888"
              value={caja.peso}
              onChangeText={(text) => setCaja({...caja, peso: text})}
              keyboardType="numeric"
            />
            
            <TouchableOpacity 
              style={[styles.fragileButton, caja.isFragile && styles.fragileButtonActive]}
              onPress={() => setCaja({...caja, isFragile: !caja.isFragile})}
            >
              <Ionicons 
                name={caja.isFragile ? "warning" : "warning-outline"} 
                size={20} 
                color={caja.isFragile ? "#FFA500" : "#888"} 
              />
              <Text style={[styles.fragileText, caja.isFragile && styles.fragileTextActive]}>
                Frágil
              </Text>
            </TouchableOpacity>
          </View>

          {/* Descripción */}
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descripción o notas adicionales..."
            placeholderTextColor="#888"
            value={caja.descripcion}
            onChangeText={(text) => setCaja({...caja, descripcion: text})}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Artículos Problemáticos */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={16} color="#FFA000" />
            <Text style={styles.warningTitle}>Artículos Problemáticos</Text>
          </View>
          <Text style={styles.warningSubtitle}>
            No empacar en cajas regulares
          </Text>
          <View style={styles.problematicosGrid}>
            {ARTICULOS_PROBLEMATICOS.map((item, index) => (
              <View key={index} style={styles.problematicoChip}>
                <Ionicons name="alert-circle" size={14} color="#FFA000" />
                <Text style={styles.problematicoText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Agregar Artículos */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Artículos ({caja.items.length})</Text>
          
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.itemInput}
              placeholder="Agregar artículo..."
              placeholderTextColor="#888"
              value={itemActual}
              onChangeText={setItemActual}
              onSubmitEditing={agregarItem}
            />
            <TouchableOpacity style={styles.addButton} onPress={agregarItem}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Lista de Artículos */}
          {caja.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemText}>{item.nombre}</Text>
              <TouchableOpacity onPress={() => eliminarItem(item.id)}>
                <Ionicons name="trash" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Sugerencias - Solo en modo creación */}
        {!isEditMode && caja.habitacion && (
          <View style={styles.formSection}>
            <View style={styles.aiHeader}>
              <Text style={styles.sectionTitle}>Sugerencias para {getHabitacionNombre()}</Text>
              <TouchableOpacity 
                style={styles.aiButton} 
                onPress={getAISuggestions}
                disabled={loadingAI}
              >
                {loadingAI ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                )}
                <Text style={styles.aiButtonText}>
                  {loadingAI ? 'Generando...' : 'IA'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.suggestionsGrid}>
              {sugerencias.map((sugerencia, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => agregarSugerencia(sugerencia)}
                >
                  <Text style={styles.suggestionText}>{sugerencia}</Text>
                  <Ionicons name="add" size={14} color="#4CAF50" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Botón Guardar/Actualizar */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={guardarCaja}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Actualizar Caja' : 'Guardar Caja'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Selección de Tipo de Caja */}
      <Modal
        visible={showTipoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTipoModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTipoModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Tipo de Caja</Text>
                
                {TIPOS_CAJAS.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.id}
                    style={[
                      styles.option,
                      caja.tipo === tipo.id && styles.optionSelected
                    ]}
                    onPress={() => seleccionarTipo(tipo.id)}
                  >
                    <Ionicons 
                      name={tipo.icon} 
                      size={24} 
                      color={caja.tipo === tipo.id ? "#000000" : "#BB86FC"} 
                    />
                    <View style={styles.optionTextContainer}>
                      <Text style={[
                        styles.optionText,
                        caja.tipo === tipo.id && styles.optionTextSelected
                      ]}>
                        {tipo.nombre}
                      </Text>
                      <Text style={[
                        styles.optionSubtext,
                        caja.tipo === tipo.id && styles.optionSubtextSelected
                      ]}>
                        {tipo.capacidad}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowTipoModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal de Selección de Habitación */}
      <Modal
        visible={showHabitacionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHabitacionModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowHabitacionModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Habitación</Text>
                
                {HABITACIONES.map((habitacion) => (
                  <TouchableOpacity
                    key={habitacion.id}
                    style={[
                      styles.option,
                      caja.habitacion === habitacion.id && styles.optionSelected
                    ]}
                    onPress={() => seleccionarHabitacion(habitacion.id)}
                  >
                    <Ionicons 
                      name={habitacion.icon} 
                      size={24} 
                      color={caja.habitacion === habitacion.id ? "#000000" : "#BB86FC"} 
                    />
                    <Text style={[
                      styles.optionText,
                      caja.habitacion === habitacion.id && styles.optionTextSelected
                    ]}>
                      {habitacion.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowHabitacionModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  requiredText: {
    fontSize: 10,
    color: '#FFA500',
    marginTop: 2,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  requiredSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  requiredSectionText: {
    color: '#FFA500',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  moveInfo: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  moveTitle: {
    color: '#BB86FC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  moveType: {
    color: '#BB86FC',
    fontSize: 14,
  },
  editModeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
  },
  formSection: {
    marginBottom: 25,
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
  selector: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectorText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  fragileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 15,
    gap: 8,
  },
  fragileButtonActive: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderColor: '#FFA500',
  },
  fragileText: {
    color: '#888',
    fontSize: 16,
  },
  fragileTextActive: {
    color: '#FFA500',
    fontWeight: 'bold',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  warningSection: {
    backgroundColor: 'rgba(255, 160, 0, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA000',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  warningTitle: {
    color: '#FFA000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningSubtitle: {
    color: '#FFA000',
    fontSize: 14,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  problematicosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  problematicoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 160, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  problematicoText: {
    color: '#FFA000',
    fontSize: 12,
  },
  addItemContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  itemInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 15,
    color: '#FFFFFF',
    marginRight: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BB86FC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 12,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: '#BB86FC',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#000000',
    fontWeight: 'bold',
  },
  optionSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  optionSubtextSelected: {
    color: '#444',
  },
  modalCloseButton: {
    marginTop: 10,
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#333',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default NewBoxScreen;