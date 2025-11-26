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
import { saveMaleta } from '../../firebase/tripService';

const CATEGORIAS_MALETAS = [
  { id: 'bolson', nombre: 'Bolson', icon: 'bag-outline' },
  { id: 'mano', nombre: 'Maleta de Mano', icon: 'briefcase-outline' },
  { id: 'mediana', nombre: 'Maleta Mediana', icon: 'business-outline' },
  { id: 'grande', nombre: 'Maleta Grande', icon: 'archive-outline' },
  { id: 'extra_grande', nombre: 'Maleta Extra Grande', icon: 'cube-outline' }
];

// ✅ NUEVO: Base de datos de artículos prohibidos por país
const ARTICULOS_PROHIBIDOS_POR_PAIS = {
  // México
  'méxico': ['Frutas y vegetales frescos', 'Semillas sin certificado', 'Carne de res', 'Productos lácteos no pasteurizados'],
  'mexico': ['Frutas y vegetales frescos', 'Semillas sin certificado', 'Carne de res', 'Productos lácteos no pasteurizados'],
  
  // España
  'españa': ['Productos cárnicos de fuera de la UE', 'Plantas sin certificado fitosanitario', 'Drogas recreativas', 'Armas de fuego'],
  'espana': ['Productos cárnicos de fuera de la UE', 'Plantas sin certificado fitosanitario', 'Drogas recreativas', 'Armas de fuego'],
  
  // Estados Unidos
  'estados unidos': ['Frutas tropicales', 'Carne de cerdo', 'Quesos artesanales', 'Productos de CBD'],
  'usa': ['Frutas tropicales', 'Carne de cerdo', 'Quesos artesanales', 'Productos de CBD'],
  'ee.uu.': ['Frutas tropicales', 'Carne de cerdo', 'Quesos artesanales', 'Productos de CBD'],
  
  // Unión Europea (general)
  'ue': ['Productos transgénicos no autorizados', 'Animales en peligro de extinción', 'Pesticidas prohibidos'],
  'europa': ['Productos transgénicos no autorizados', 'Animales en peligro de extinción', 'Pesticidas prohibidos'],
  
  // América Latina (general)
  'latinoamérica': ['Electrónicos sin factura', 'Juguetes con pilas de litio', 'Productos pirata'],
  'latinoamerica': ['Electrónicos sin factura', 'Juguetes con pilas de litio', 'Productos pirata'],
};

// ✅ Artículos prohibidos universales
const ARTICULOS_PROHIBIDOS_UNIVERSALES = [
  'Líquidos sobre 100ml en equipaje de mano',
  'Armas de cualquier tipo (incluidas réplicas)',
  'Productos inflamables (aerósoles, gasolina)',
  'Drogas ilegales y sustancias controladas',
  'Animales vivos sin documentación',
  'Comida perecedera sin refrigeración',
  'Material pornográfico ilegal',
  'Productos que infrinjan derechos de autor'
];

const NewMaletaScreen = ({ route, navigation }) => {
  // ✅ CORREGIDO: Recibir el trip completo y origin
  const { tripId, destination, purpose, origin = 'TripDetail', trip } = route.params;
  
  const [maleta, setMaleta] = useState({
    categoria: '',
    articulos: []
  });
  const [articuloActual, setArticuloActual] = useState('');
  const [sugerenciasIA, setSugerenciasIA] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [articulosProhibidos, setArticulosProhibidos] = useState([]);

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
  }, [navigation, origin, trip]); // 👈 INCLUIR TRIP COMPLETO EN DEPENDENCIAS

  // Cargar sugerencias de IA y artículos prohibidos
  useEffect(() => {
    getAISuggestions();
    cargarArticulosProhibidos();
  }, [destination]);

  // ✅ NUEVA FUNCIÓN: Cargar artículos prohibidos según el destino
  const cargarArticulosProhibidos = () => {
    console.log('🟡 Cargando artículos prohibidos para:', destination);
    
    let articulosEspecificos = [];
    
    if (destination) {
      const destinoLower = destination.toLowerCase();
      
      // Buscar coincidencias por país
      Object.keys(ARTICULOS_PROHIBIDOS_POR_PAIS).forEach(pais => {
        if (destinoLower.includes(pais)) {
          console.log(`🔵 Encontrados artículos prohibidos para: ${pais}`);
          articulosEspecificos = [...articulosEspecificos, ...ARTICULOS_PROHIBIDOS_POR_PAIS[pais]];
        }
      });
    }
    
    // Combinar artículos específicos con universales
    const todosLosProhibidos = [
      ...ARTICULOS_PROHIBIDOS_UNIVERSALES,
      ...articulosEspecificos
    ];
    
    console.log(`🟢 Total artículos prohibidos cargados: ${todosLosProhibidos.length}`);
    setArticulosProhibidos(todosLosProhibidos);
  };

  // ✅ CORREGIDO: Función de navegación INTELIGENTE usando el trip completo
  const handleGoBack = () => {
    console.log('🟡 Navegando desde NewMaleta - Origen:', origin);
    
    switch(origin) {
      case 'Home':
        console.log('🔵 Regresando a Home');
        navigation.navigate('Home');
        break;
      case 'TripDetail':
        console.log('🔵 Regresando a TripDetail con trip completo');
        // ✅ USAR EL TRIP COMPLETO PARA EVITAR FECHAS UNDEFINED
        navigation.navigate('TripDetail', { 
          trip: trip || { id: tripId, destination, purpose } 
        });
        break;
      default:
        console.log('🔵 Regresando a TripDetail (default)');
        navigation.navigate('TripDetail', { 
          trip: trip || { id: tripId, destination, purpose } 
        });
    }
  };

  // Función de IA para sugerencias de artículos
  const getAISuggestions = async () => {
    if (!destination && !purpose) {
      Alert.alert('Info', 'No hay información del viaje para generar sugerencias');
      return;
    }

    setLoadingAI(true);
    try {
      const API_URL = "https://api.groq.com/openai/v1/chat/completions";

      const prompt = `Como experto en viajes, sugiere 10 artículos esenciales específicos para un viaje a ${destination} con propósito: ${purpose}. 
      Considera el clima, actividades típicas y duración del viaje.
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
              content: "Eres un asistente especializado en viajes. Proporcionas listas concisas de artículos esenciales específicos para cada tipo de viaje."
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
      const suggestions = aiMessage.split(',').map(item => item.trim()).filter(item => item);
      setSugerenciasIA(suggestions);
      
    } catch (error) {
      console.error('Error con IA:', error);
      // Sugerencias por defecto si falla la IA
      const defaultSuggestions = [
        'Pasaporte y documentos',
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

  const agregarArticulo = () => {
    if (articuloActual.trim()) {
      setMaleta({
        ...maleta,
        articulos: [...maleta.articulos, { 
          id: Date.now().toString(), 
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
        id: Date.now().toString(), 
        nombre: sugerencia 
      }]
    });
    // Remover la sugerencia de la lista de sugerencias
    setSugerenciasIA(sugerenciasIA.filter(item => item !== sugerencia));
  };

  const seleccionarCategoria = (categoriaId) => {
    setMaleta({ ...maleta, categoria: categoriaId });
    setShowCategoriaModal(false);
  };

  // ✅ CORREGIDO: Función de guardado MEJORADA con navegación inteligente
  const guardarMaleta = async () => {
    console.log('🟡 Botón presionado - Iniciando guardado de maleta...');
    console.log('📍 Origen de navegación:', origin);
    
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
        fechaCreacion: new Date()
      };

      console.log('🟡 Enviando datos de maleta:', maletaData);
      
      // Usar la función correcta que guarda en la subcolección
      await saveMaleta(tripId, maletaData);
      
      console.log('🟢 Maleta guardada correctamente en Firebase');
      
      // ✅ CORREGIDO: Navegación INTELIGENTE usando el trip completo
      Alert.alert(
        '✅ Maleta Guardada', 
        '¿Deseas agregar otra maleta para este viaje?',
        [
          {
            text: 'Finalizar',
            onPress: () => {
              console.log('🟡 Navegando según origen:', origin);
              
              // Navegar según el origen usando el trip completo
              if (origin === 'Home') {
                console.log('🔵 Navegando a Home');
                navigation.navigate('Home');
              } else {
                console.log('🔵 Navegando a TripDetail con trip completo');
                navigation.navigate('TripDetail', { 
                  trip: trip || { id: tripId, destination, purpose } 
                });
              }
            }
          },
          {
            text: 'Agregar Otra Maleta',
            onPress: () => {
              console.log('🟡 Reiniciando formulario para nueva maleta...');
              // Resetear el formulario para nueva maleta
              setMaleta({
                categoria: '',
                articulos: []
              });
              setSugerenciasIA([]);
              getAISuggestions();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error guardando maleta:', error);
      Alert.alert('❌ Error', 'No se pudo guardar la maleta: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Nueva Maleta</Text>
      <View style={styles.placeholder} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      {renderHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del Viaje */}
        <View style={styles.tripInfo}>
          <Text style={styles.tripDestination}>Viaje a: {destination}</Text>
          <Text style={styles.tripPurpose}>Propósito: {purpose}</Text>
        </View>

        {/* Selección de Categoría */}
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

        {/* Artículos Prohibidos */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={20} color="#FFA000" />
            <Text style={styles.warningTitle}>⚠️ Artículos Prohibidos</Text>
          </View>
          <Text style={styles.warningSubtitle}>
            Para {destination || 'tu destino'}
          </Text>
          <View style={styles.prohibidosGrid}>
            {articulosProhibidos.map((item, index) => (
              <View key={index} style={styles.prohibidoChip}>
                <Ionicons name="close-circle" size={14} color="#F44336" />
                <Text style={styles.prohibidoText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.warningNote}>
            * Lista referencial. Verifica regulaciones actuales con tu aerolínea.
          </Text>
        </View>

        {/* Agregar Artículos Manualmente */}
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
            />
            <TouchableOpacity style={styles.addButton} onPress={agregarArticulo}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Lista de Artículos */}
          {maleta.articulos.map((articulo) => (
            <View key={articulo.id} style={styles.item}>
              <Text style={styles.itemText}>{articulo.nombre}</Text>
              <TouchableOpacity onPress={() => eliminarArticulo(articulo.id)}>
                <Ionicons name="trash" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Sugerencias de IA */}
        <View style={styles.formSection}>
          <View style={styles.aiHeader}>
            <Text style={styles.sectionTitle}>Sugerencias de IA</Text>
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
                {loadingAI ? 'Generando...' : 'Actualizar'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.aiSubtitle}>Basado en tu destino y propósito</Text>
          
          <View style={styles.suggestionsGrid}>
            {sugerenciasIA.map((sugerencia, index) => (
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

        {/* Botón Guardar */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={guardarMaleta}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Maleta</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Selección de Categoría */}
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

// Los estilos se mantienen igual con algunas mejoras
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
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
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
  warningNote: {
    color: '#FFA000',
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
  },
  prohibidosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prohibidoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  prohibidoText: {
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
  aiSubtitle: {
    color: '#BB86FC',
    fontSize: 12,
    marginBottom: 10,
    fontStyle: 'italic',
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