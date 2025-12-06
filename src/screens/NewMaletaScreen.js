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
import { updateLuggage } from '../../firebase/luggageService';
import { saveMaleta } from '../../firebase/tripService';

const CATEGORIAS_MALETAS = [
  { id: 'bolson', nombre: 'Bolson', icon: 'bag-outline' },
  { id: 'mano', nombre: 'Maleta de Mano', icon: 'briefcase-outline' },
  { id: 'mediana', nombre: 'Maleta Mediana', icon: 'business-outline' },
  { id: 'grande', nombre: 'Maleta Grande', icon: 'archive-outline' },
  { id: 'extra_grande', nombre: 'Maleta Extra Grande', icon: 'cube-outline' }
];

const ARTICULOS_PROHIBIDOS_UNIVERSALES = [
  'Líquidos sobre 100ml en equipaje de mano (regla 3-1-1)',
  'Armas de cualquier tipo (incluidas réplicas y objetos punzantes)',
  'Productos inflamables (aerósoles, gasolina, fósforos, encendedores)',
  'Drogas ilegales y sustancias controladas sin prescripción',
  'Animales vivos sin documentación sanitaria y certificados',
  'Comida perecedera sin refrigeración adecuada',
  'Material explosivo o pirotécnico',
  'Productos químicos tóxicos o corrosivos',
  'Baterías de litio sueltas o dañadas',
  'Objetos magnéticos fuertes que puedan interferir con equipos de vuelo'
];

const PAISES_CON_RESTRICCIONES_ESPECIALES = {
  'méxico/mexico': {
    alimentos: ['Frutas y vegetales frescos', 'Carne de res y cerdo', 'Productos lácteos no pasteurizados'],
    otros: ['Semillas sin certificado fitosanitario', 'Plantas sin permiso', 'Productos de cannabis']
  },
  'españa/espana': {
    alimentos: ['Productos cárnicos de fuera de la UE', 'Leche y productos lácteos no UE'],
    otros: ['Plantas sin certificado fitosanitario', 'Especies protegidas (CITES)']
  },
  'estados unidos/usa/ee.uu.': {
    alimentos: ['Frutas tropicales frescas', 'Carne de cerdo', 'Quesos artesanales sin pasteurizar'],
    otros: ['Productos de CBD/THC', 'Medicamentos no aprobados por FDA', 'Piratería']
  },
  'australia': {
    alimentos: ['Cualquier alimento fresco o procesado', 'Productos de miel'],
    otros: ['Productos de madera', 'Tierra o arena', 'Equipos deportivos usados']
  },
  'nueva zelanda/nuevazelanda': {
    alimentos: ['Todos los productos agrícolas', 'Alimentos para camping'],
    otros: ['Equipamiento deportivo sucio', 'Productos de piel animal']
  },
  'japón/japon': {
    alimentos: ['Carne fresca y procesada', 'Frutas específicas como manzanas, cerezas'],
    otros: ['Medicamentos no autorizados', 'Productos con contenido adulto explícito']
  },
  'canadá/canada': {
    alimentos: ['Carne de res y aves', 'Productos lácteos no certificados'],
    otros: ['Armas de defensa personal', 'Fuegos artificiales']
  },
  'reino unido': {
    alimentos: ['Carne y productos cárnicos de países no UE', 'Leche cruda'],
    otros: ['Especies en peligro (CITES)', 'Productos culturales robados']
  }
};

const NewMaletaScreen = ({ route, navigation }) => {
  const { 
    tripId, 
    destination, 
    purpose, 
    origin = 'TripDetail', 
    trip,
    luggageToEdit,
    mode = 'create',
    forceLuggage = false,
    tripStartsToday = false
  } = route.params;
  
  const [maleta, setMaleta] = useState(
    mode === 'edit' && luggageToEdit 
      ? {
          categoria: luggageToEdit.categoria,
          articulos: luggageToEdit.articulos ? luggageToEdit.articulos.map(art => 
            typeof art === 'string' ? { id: Date.now().toString() + Math.random(), nombre: art } : art
          ) : []
        }
      : {
          categoria: '',
          articulos: []
        }
  );

  const [isEditMode] = useState(mode === 'edit');
  const [luggageId] = useState(luggageToEdit?.id || null);
  const [articuloActual, setArticuloActual] = useState('');
  const [sugerenciasIA, setSugerenciasIA] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [articulosProhibidos, setArticulosProhibidos] = useState([]);
  const [restriccionesPais, setRestriccionesPais] = useState({ alimentos: [], otros: [] });
  const [hasSavedLuggage, setHasSavedLuggage] = useState(false);
  const [aiButtonPressed, setAiButtonPressed] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
        if (forceLuggage && !hasSavedLuggage) {
          Alert.alert(
            'Acción requerida',
            'Debes completar y guardar al menos una maleta antes de poder salir, ya que tu viaje comienza hoy.',
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
  }, [navigation, origin, trip, forceLuggage, hasSavedLuggage]);

  useEffect(() => {
    cargarArticulosProhibidos();
  }, [destination]);

  const cargarArticulosProhibidos = () => {
    if (!destination) return;
    
    const destinoLower = destination.toLowerCase();
    let restriccionesEspecificas = { alimentos: [], otros: [] };
    
    Object.keys(PAISES_CON_RESTRICCIONES_ESPECIALES).forEach(paisKey => {
      const paises = paisKey.split('/');
      const tieneCoincidencia = paises.some(pais => destinoLower.includes(pais));
      
      if (tieneCoincidencia) {
        const restricciones = PAISES_CON_RESTRICCIONES_ESPECIALES[paisKey];
        restriccionesEspecificas = {
          alimentos: [...restriccionesEspecificas.alimentos, ...restricciones.alimentos],
          otros: [...restriccionesEspecificas.otros, ...restricciones.otros]
        };
      }
    });
    
    setRestriccionesPais(restriccionesEspecificas);
    setArticulosProhibidos(ARTICULOS_PROHIBIDOS_UNIVERSALES);
  };

  const getAISuggestions = async () => {
    if (!destination) {
      Alert.alert('Información requerida', 'Se necesita el destino para generar sugerencias');
      return;
    }

    setLoadingAI(true);
    setAiButtonPressed(true);
    
    try {
      const API_URL = "https://api.groq.com/openai/v1/chat/completions";

      const promptPurpose = purpose && purpose.trim() ? purpose : "viaje turístico general";
      const prompt = `Como experto en packing y viajes, genera una lista de 10 artículos esenciales para viajar a ${destination} con propósito: ${promptPurpose}.
      
Requisitos:
1. Genera SOLO 10 artículos específicos
2. Cada artículo debe ser práctico y relevante
3. Considera clima, cultura y actividades típicas de ${destination}
4. Incluye tanto artículos básicos como específicos del destino
5. Formato: lista separada por comas, sin numeración
6. Solo dame la lista, sin explicaciones adicionales
7. Si ya he generado sugerencias antes, crea una lista completamente nueva y diferente

Ejemplo formato respuesta: "Articulo, Articulo, Articulo, Articulo ..."`;

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
              content: "Eres un asistente especializado en packing para viajes. Proporcionas listas concisas y prácticas de artículos esenciales para diferentes tipos de viajes. Siempre respondes con listas separadas por comas."
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
      const suggestions = aiMessage.split(',')
        .map(item => item.trim())
        .filter(item => item && item.length > 0)
        .slice(0, 10); // Asegurar máximo 10 items
      
      setSugerenciasIA(suggestions);
      
    } catch (error) {
      console.error('Error con IA:', error);
      const defaultSuggestions = [
        'Pasaporte y documentos de identidad',
        'Adaptador de enchufes internacional',
        'Medicamentos personales con receta',
        'Protector solar adecuado al clima',
        'Cargador portátil y cables',
        'Botella de agua reusable',
        'Snacks no perecederos para el viaje',
        'Kit básico de primeros auxilios',
        'Ropa adecuada al clima local',
        'Calzado cómodo para caminar'
      ];
      setSugerenciasIA(defaultSuggestions);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleGoBack = () => {
    if (forceLuggage && !hasSavedLuggage) {
      Alert.alert(
        'Acción requerida',
        'Debes completar y guardar al menos una maleta antes de poder salir, ya que tu viaje comienza hoy.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    switch(origin) {
      case 'Home':
        navigation.navigate('Home');
        break;
      case 'TripDetail':
        navigation.navigate('TripDetail', { 
          trip: trip || { id: tripId, destination, purpose } 
        });
        break;
      case 'EditTrip':
        navigation.navigate('EditTrip', { trip });
        break;
      default:
        navigation.navigate('TripDetail', { 
          trip: trip || { id: tripId, destination, purpose } 
        });
    }
  };

  const agregarArticulo = () => {
    if (articuloActual.trim()) {
      setMaleta({
        ...maleta,
        articulos: [...maleta.articulos, { 
          id: Date.now().toString() + Math.random(), 
          nombre: articuloActual.trim() 
        }]
      });
      setArticuloActual('');
    }
  };

  const eliminarArticulo = (id) => {
    setMaleta({
      ...maleta,
      articulos: maleta.articulos.filter(articulo => articulo.id !== id)
    });
  };

  const agregarSugerencia = (sugerencia) => {
    setMaleta({
      ...maleta,
      articulos: [...maleta.articulos, { 
        id: Date.now().toString() + Math.random(), 
        nombre: sugerencia 
      }]
    });
    setSugerenciasIA(sugerenciasIA.filter(item => item !== sugerencia));
  };

  const seleccionarCategoria = (categoriaId) => {
    setMaleta({ ...maleta, categoria: categoriaId });
    setShowCategoriaModal(false);
  };

  const guardarMaleta = async () => {
    if (!maleta.categoria) {
      Alert.alert('Error', 'Por favor selecciona una categoría para la maleta');
      return;
    }

    if (maleta.articulos.length === 0) {
      Alert.alert('Error', 'Por favor agrega al menos un artículo a la maleta');
      return;
    }

    setSaving(true);
    
    try {
      const maletaData = {
        categoria: maleta.categoria,
        articulos: maleta.articulos.map(art => art.nombre),
        destino: destination,
        proposito: purpose,
        fechaCreacion: luggageToEdit?.fechaCreacion || new Date(),
        updatedAt: new Date()
      };

      if (isEditMode && luggageId) {
        await updateLuggage(tripId, luggageId, maletaData);
      } else {
        await saveMaleta(tripId, maletaData);
      }
      
      setHasSavedLuggage(true);
      
      if (forceLuggage) {
        Alert.alert(
          '✅ Maleta Guardada', 
          'Has completado la maleta requerida. ¿Deseas agregar otra maleta o finalizar?',
          [
            {
              text: 'Finalizar',
              onPress: () => {
                navigation.replace('Home');
              }
            },
            {
              text: 'Agregar Otra Maleta',
              onPress: () => {
                setMaleta({
                  categoria: '',
                  articulos: []
                });
                setSugerenciasIA([]);
                setAiButtonPressed(false);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          isEditMode ? '✅ Maleta Actualizada' : '✅ Maleta Guardada', 
          isEditMode ? 'Maleta actualizada correctamente' : '¿Deseas agregar otra maleta para este viaje?',
          [
            {
              text: 'Finalizar',
              onPress: () => {
                switch(origin) {
                  case 'Home':
                    navigation.navigate('Home');
                    break;
                  case 'TripDetail':
                    navigation.navigate('TripDetail', { 
                      trip: trip || { id: tripId, destination, purpose } 
                    });
                    break;
                  case 'EditTrip':
                    navigation.navigate('EditTrip', { trip });
                    break;
                  default:
                    navigation.navigate('TripDetail', { 
                      trip: trip || { id: tripId, destination, purpose } 
                    });
                }
              }
            },
            ...(isEditMode ? [] : [{
              text: 'Agregar Otra Maleta',
              onPress: () => {
                setMaleta({
                  categoria: '',
                  articulos: []
                });
                setSugerenciasIA([]);
                setAiButtonPressed(false);
              }
            }])
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ Error guardando maleta:', error);
      Alert.alert('❌ Error', `No se pudo ${isEditMode ? 'actualizar' : 'guardar'} la maleta: ` + error.message);
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
          {isEditMode ? 'Editar Maleta' : 'Nueva Maleta'}
        </Text>
        {forceLuggage && (
          <Text style={styles.requiredText}>* Requerido</Text>
        )}
      </View>
      <View style={styles.placeholder} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      {renderHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {forceLuggage && (
          <View style={styles.requiredSection}>
            <Ionicons name="warning" size={16} color="#FFA500" />
            <Text style={styles.requiredSectionText}>
              Tu viaje comienza hoy. Debes completar al menos una maleta antes de continuar.
            </Text>
          </View>
        )}

        <View style={styles.tripInfo}>
          <Text style={styles.tripDestination}>Viaje a: {destination}</Text>
          <Text style={styles.tripPurpose}>Propósito: {purpose || 'No especificado'}</Text>
          {isEditMode && (
            <Text style={styles.editModeText}>Modo edición</Text>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Categoría de Maleta *</Text>
          <TouchableOpacity 
            style={styles.categoriaSelector}
            onPress={() => setShowCategoriaModal(true)}
          >
            <Text style={maleta.categoria ? styles.categoriaText : styles.placeholderText}>
              {maleta.categoria 
                ? CATEGORIAS_MALETAS.find(cat => cat.id === maleta.categoria)?.nombre
                : 'Seleccionar categoría'
              }
            </Text>
            <Ionicons name="chevron-down" size={20} color="#BB86FC" />
          </TouchableOpacity>
        </View>

        {/* Sección de Artículos Prohibidos Mejorada */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={20} color="#FFA000" />
            <Text style={styles.warningTitle}>Artículos Prohibidos</Text>
          </View>
          
          <Text style={styles.warningSubtitle}>🚫 Prohibidos Universales (Todos los vuelos)</Text>
          <View style={styles.prohibidosList}>
            {articulosProhibidos.map((item, index) => (
              <View key={`universal-${index}`} style={styles.prohibidoItem}>
                <Ionicons name="close-circle" size={14} color="#F44336" />
                <Text style={styles.prohibidoText}>{item}</Text>
              </View>
            ))}
          </View>

          {restriccionesPais.alimentos.length > 0 && (
            <>
              <Text style={styles.warningSubtitle}>🍎 Restricciones Específicas para {destination}</Text>
              <Text style={styles.restriccionCategoria}>Alimentos:</Text>
              <View style={styles.prohibidosList}>
                {restriccionesPais.alimentos.map((item, index) => (
                  <View key={`alimento-${index}`} style={styles.prohibidoItem}>
                    <Ionicons name="nutrition" size={14} color="#FF9800" />
                    <Text style={styles.prohibidoText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {restriccionesPais.otros.length > 0 && (
            <>
              <Text style={styles.restriccionCategoria}>Otros productos:</Text>
              <View style={styles.prohibidosList}>
                {restriccionesPais.otros.map((item, index) => (
                  <View key={`otro-${index}`} style={styles.prohibidoItem}>
                    <Ionicons name="alert-circle" size={14} color="#2196F3" />
                    <Text style={styles.prohibidoText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.warningNote}>
            ⚠️ Lista informativa. Consulta regulaciones actualizadas con tu aerolínea y aduanas del destino.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Artículos ({maleta.articulos.length})</Text>
          
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.itemInput}
              placeholder="Agregar artículo..."
              placeholderTextColor="#888"
              value={articuloActual}
              onChangeText={setArticuloActual}
              onSubmitEditing={agregarArticulo}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addButton} onPress={agregarArticulo}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {maleta.articulos.map((articulo) => (
            <View key={articulo.id} style={styles.item}>
              <Text style={styles.itemText}>{articulo.nombre}</Text>
              <TouchableOpacity onPress={() => eliminarArticulo(articulo.id)}>
                <Ionicons name="trash" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Sugerencias de IA Optimizadas */}
        {!isEditMode && !aiButtonPressed && (
          <View style={styles.formSection}>
            <View style={styles.aiSuggestionHeader}>
              <Ionicons name="sparkles" size={20} color="#BB86FC" />
              <Text style={styles.sectionTitle}>¿Necesitas ideas?</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.aiGenerateButton} 
              onPress={getAISuggestions}
              disabled={loadingAI}
            >
              {loadingAI ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="bulb" size={18} color="#FFFFFF" />
                  <Text style={styles.aiGenerateButtonText}>
                    Generar sugerencias con IA
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text style={styles.aiHintText}>
              La IA analizará tu destino{purpose ? ' y propósito' : ''} para sugerir artículos relevantes
            </Text>
          </View>
        )}

        {!isEditMode && aiButtonPressed && sugerenciasIA.length > 0 && (
          <View style={styles.formSection}>
            <View style={styles.aiHeader}>
              <Text style={styles.sectionTitle}>Sugerencias de IA</Text>
              <Text style={styles.aiCount}>{sugerenciasIA.length} sugerencias</Text>
            </View>

            <Text style={styles.aiSubtitle}>
              Basado en tu viaje a {destination}{purpose ? ` (${purpose})` : ''}
            </Text>
            
            <View style={styles.suggestionsList}>
              {sugerenciasIA.map((sugerencia, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => agregarSugerencia(sugerencia)}
                >
                  <View style={styles.suggestionLeft}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
                    <Text style={styles.suggestionText}>{sugerencia}</Text>
                  </View>
                  <Ionicons name="add-circle" size={20} color="#BB86FC" />
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.aiNote}>
              Presiona cualquier sugerencia para agregarla a tu lista
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={guardarMaleta}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditMode ? 'Actualizar Maleta' : 'Guardar Maleta'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showCategoriaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoriaModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCategoriaModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecciona una categoría</Text>
                
                {CATEGORIAS_MALETAS.map((categoria) => (
                  <TouchableOpacity
                    key={categoria.id}
                    style={[
                      styles.categoriaOption,
                      maleta.categoria === categoria.id && styles.categoriaSelected
                    ]}
                    onPress={() => seleccionarCategoria(categoria.id)}
                  >
                    <Ionicons 
                      name={categoria.icon} 
                      size={24} 
                      color={maleta.categoria === categoria.id ? "#000000" : "#BB86FC"} 
                    />
                    <Text style={[
                      styles.categoriaOptionText,
                      maleta.categoria === categoria.id && styles.categoriaOptionTextSelected
                    ]}>
                      {categoria.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowCategoriaModal(false)}
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
  tripInfo: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  tripDestination: {
    color: '#BB86FC',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tripPurpose: {
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
  categoriaSelector: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriaText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  warningSection: {
    backgroundColor: 'rgba(255, 160, 0, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 160, 0, 0.3)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  warningTitle: {
    color: '#FFA000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningSubtitle: {
    color: '#FFA000',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
  },
  restriccionCategoria: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5,
  },
  prohibidosList: {
    gap: 8,
  },
  prohibidoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 160, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  prohibidoText: {
    color: '#FFA000',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  warningNote: {
    color: '#FFA000',
    fontSize: 10,
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
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
  aiSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BB86FC',
    padding: 16,
    borderRadius: 10,
    gap: 10,
  },
  aiGenerateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aiHintText: {
    color: '#BB86FC',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiCount: {
    color: '#BB86FC',
    fontSize: 12,
    fontWeight: '600',
  },
  aiSubtitle: {
    color: '#BB86FC',
    fontSize: 12,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.3)',
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  aiNote: {
    color: '#BB86FC',
    fontSize: 10,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
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
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoriaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    gap: 12,
  },
  categoriaSelected: {
    backgroundColor: '#BB86FC',
  },
  categoriaOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  categoriaOptionTextSelected: {
    color: '#000000',
    fontWeight: 'bold',
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

export default NewMaletaScreen;