// NewBoxScreen.js
import { GROQ_API_KEY } from '@env';
import { useEffect, useRef, useState } from 'react';
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

// Artículos problemáticos para mudanza - UNIVERSALES
const ARTICULOS_PROBLEMATICOS_UNIVERSALES = [
  'Productos químicos (limpieza, pinturas, solventes)',
  'Alimentos perecederos sin refrigeración',
  'Plantas vivas y tierra/abono',
  'Objetos de valor extremo (joyas, efectivo, documentos irreemplazables)',
  'Medicamentos refrigerados (insulina, vacunas)',
  'Electrónicos sensibles a temperatura extrema',
  'Líquidos inflamables o corrosivos',
  'Baterías de litio sueltas o dañadas',
  'Productos en aerosol bajo presión',
  'Objetos pesados (>25kg) en cajas pequeñas'
];

// Restricciones por país para mudanzas internacionales
const RESTRICCIONES_POR_PAIS_MUDANZA = {
  'australia': {
    problemas: ['Cualquier objeto de madera sin tratamiento', 'Equipos deportivos usados con tierra', 'Productos de miel y cera'],
    recomendaciones: ['Fumigación obligatoria para muebles', 'Inspección aduanal detallada', 'Documentación fitosanitaria']
  },
  'nueva zelanda/nuevazelanda': {
    problemas: ['Equipamiento de camping usado', 'Calzado con suela sucia', 'Herramientas de jardinería'],
    recomendaciones: ['Limpieza profesional requerida', 'Certificado de no contaminación', 'Cuarentena posible']
  },
  'estados unidos/usa/ee.uu.': {
    problemas: ['Productos agrícolas no certificados', 'Muebles de madera exótica', 'Productos de origen animal'],
    recomendaciones: ['Formulario de aduana obligatorio', 'Valoración de bienes requerida', 'Seguro de transporte']
  },
  'canadá/canada': {
    problemas: ['Armas o réplicas', 'Productos de tabaco sin declarar', 'Alimentos en grandes cantidades'],
    recomendaciones: ['Lista detallada de contenido', 'Documentación de propiedad', 'Permiso de importación']
  },
  'reino unido/uk': {
    problemas: ['Productos de origen animal de países no UE', 'Especies protegidas (CITES)', 'Antigüedades sin certificado'],
    recomendaciones: ['IVA sobre valor de bienes', 'Documentación de procedencia', 'Inspección de aduanas']
  },
  'japón/japon': {
    problemas: ['Medicamentos sin receta traducida', 'Productos con contenido adulto', 'Alimentos frescos'],
    recomendaciones: ['Traducción jurada de documentos', 'Inventario muy detallado', 'Embajada/consulado']
  },
  'méxico/mexico': {
    problemas: ['Electrónicos sin factura', 'Joyas en grandes cantidades', 'Antigüedades prehispánicas'],
    recomendaciones: ['Facturas de compra', 'Permiso para antigüedades', 'Valoración oficial']
  },
  'españa/espana': {
    problemas: ['Productos pirata o falsificados', 'Especies protegidas de flora/fauna', 'Armas incluso decorativas'],
    recomendaciones: ['Documentación de la UE para ciudadanos', 'IVA de importación', 'Registro de bienes']
  }
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
  
  // Referencia para almacenar sugerencias por habitación
  const sugerenciasPorHabitacionRef = useRef({});
  const [aiButtonPressedPorHabitacion, setAiButtonPressedPorHabitacion] = useState({});

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
  const [restriccionesPais, setRestriccionesPais] = useState({ problemas: [], recomendaciones: [] });

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

  // Cargar restricciones por país
  useEffect(() => {
    cargarRestriccionesPorPais();
  }, [moveDestination]);

  // Cargar sugerencias cuando cambia la habitación
  useEffect(() => {
    if (caja.habitacion && !isEditMode) {
      cargarSugerenciasParaHabitacion();
    }
  }, [caja.habitacion, isEditMode]);

  const cargarRestriccionesPorPais = () => {
    if (!moveDestination) return;
    
    const destinoLower = moveDestination.toLowerCase();
    let restriccionesEncontradas = { problemas: [], recomendaciones: [] };
    
    Object.keys(RESTRICCIONES_POR_PAIS_MUDANZA).forEach(paisKey => {
      const paises = paisKey.split('/');
      const tieneCoincidencia = paises.some(pais => destinoLower.includes(pais));
      
      if (tieneCoincidencia) {
        const restricciones = RESTRICCIONES_POR_PAIS_MUDANZA[paisKey];
        restriccionesEncontradas = {
          problemas: [...restriccionesEncontradas.problemas, ...restricciones.problemas],
          recomendaciones: [...restriccionesEncontradas.recomendaciones, ...restricciones.recomendaciones]
        };
      }
    });
    
    setRestriccionesPais(restriccionesEncontradas);
  };

  const cargarSugerenciasParaHabitacion = () => {
    // Si ya hay sugerencias generadas para esta habitación, usarlas
    if (sugerenciasPorHabitacionRef.current[caja.habitacion]) {
      setSugerencias(sugerenciasPorHabitacionRef.current[caja.habitacion]);
    } else {
      // Cargar sugerencias básicas por defecto
      const sugerenciasBasicas = {
        'living': ['Decoraciones de pared', 'Libros y revistas', 'Control remoto y accesorios', 'Cojines decorativos', 'Alfombra pequeña'],
        'kitchen': ['Utensilios de cocina', 'Vajilla y cubiertos', 'Electrodomésticos pequeños', 'Tablas de cortar', 'Tuppers y recipientes'],
        'bedroom': ['Ropa de cama', 'Almohadas y cojines', 'Accesorios personales', 'Joyería organizada', 'Cosméticos en bañera'],
        'bathroom': ['Toallas y albornoces', 'Productos de higiene', 'Botiquín de primeros auxilios', 'Accesorios de ducha', 'Espejos pequeños'],
        'office': ['Material de oficina', 'Documentos importantes', 'Libros de referencia', 'Cables y cargadores', 'Accesorios de computadora'],
        'garage': ['Herramientas manuales', 'Equipo deportivo', 'Productos de limpieza', 'Bicicletas desarmadas', 'Cajas de almacenamiento'],
        'other': ['Artículos varios', 'Decoraciones varias', 'Objetos personales', 'Regalos sin abrir', 'Recuerdos y fotos']
      };
      
      const sugerenciasHabitacion = sugerenciasBasicas[caja.habitacion] || [
        'Documentos importantes',
        'Objetos de valor',
        'Productos de limpieza básicos',
        'Herramientas para desarmar',
        'Material de embalaje extra'
      ];
      
      setSugerencias(sugerenciasHabitacion.slice(0, 5));
    }
  };

  const getAISuggestions = async () => {
    if (!caja.habitacion || !moveType) {
      Alert.alert('Información requerida', 'Selecciona una habitación para generar sugerencias');
      return;
    }

    // Marcar que ya se presionó el botón para esta habitación
    setAiButtonPressedPorHabitacion(prev => ({
      ...prev,
      [caja.habitacion]: true
    }));

    setLoadingAI(true);
    try {
      const API_URL = "https://api.groq.com/openai/v1/chat/completions";

      const prompt = `Como experto en mudanzas internacionales, genera una lista de EXACTAMENTE 10 artículos específicos para empacar de la habitación ${caja.habitacion} para una mudanza a ${moveDestination} de tipo ${moveType}.

Requisitos CRÍTICOS:
1. SOLO 10 artículos, ni uno más ni uno menos
2. Formato: lista separada por comas, sin numeración
3. Considera: clima de ${moveDestination}, regulaciones aduanales, fragilidad
4. Incluye artículos frecuentemente olvidados
5. Prioriza objetos prácticos y necesarios
6. Evita repeticiones

Ejemplo de formato correcto: "Articulo Logico de la habitacion,Articulo Logico de la habitacion,Articulo Logico de la habitacion,Articulo Logico de la habitacion,Articulo Logico de la habitacion..."

IMPORTANTE: Responde SOLO con los 10 artículos separados por comas, sin texto adicional.`;

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
              content: "Eres un asistente especializado en mudanzas internacionales. Siempre generas listas de EXACTAMENTE 10 artículos separados por comas. Nunca agregas explicaciones, numeración o texto adicional. Tu respuesta es solo la lista de 10 items."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
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
      
      // Procesar la respuesta para obtener exactamente 10 items
      let aiSuggestions = aiMessage.split(',')
        .map(item => item.trim())
        .filter(item => item && item.length > 0 && item.length < 50);
      
      // Asegurar exactamente 10 items
      if (aiSuggestions.length > 10) {
        aiSuggestions = aiSuggestions.slice(0, 10);
      } else if (aiSuggestions.length < 10) {
        // Completar con sugerencias genéricas si faltan
        const sugerenciasGenericas = [
          'Documentos importantes y pasaportes',
          'Kit de herramientas básicas',
          'Medicamentos personales con receta',
          'Juego de llaves y copias',
          'Dispositivos electrónicos y cargadores',
          'Ropa adecuada al clima destino',
          'Productos de higiene personal',
          'Dinero en efectivo local',
          'Snacks no perecederos para el viaje',
          'Botiquín de primeros auxilios'
        ];
        
        while (aiSuggestions.length < 10) {
          const sugerencia = sugerenciasGenericas[aiSuggestions.length];
          if (!aiSuggestions.includes(sugerencia)) {
            aiSuggestions.push(sugerencia);
          }
        }
      }
      
      // Eliminar duplicados
      aiSuggestions = [...new Set(aiSuggestions)];
      
      // Guardar en referencia para esta habitación
      sugerenciasPorHabitacionRef.current[caja.habitacion] = aiSuggestions;
      setSugerencias(aiSuggestions);
      
    } catch (error) {
      console.error('Error con IA:', error);
      
      // Sugerencias por defecto organizadas
      const sugerenciasPorDefecto = {
        'living': ['Decoraciones de pared', 'Libros organizados por género', 'Control remoto y baterías', 'Cojines decorativos en bolsas', 'Alfombra enrollada y sellada', 'Figuras y adornos frágiles', 'DVDs y Blu-rays', 'Juegos de mesa', 'Velas y candelabros', 'Plantas artificiales'],
        'kitchen': ['Utensilios de cocina por tipo', 'Vajilla con separadores', 'Electrodomésticos pequeños limpiados', 'Tablas de cortar de diferentes tamaños', 'Tuppers con tapas aseguradas', 'Cuchillos en fundas protectoras', 'Espátulas y cucharas de madera', 'Tazas y tazones anidados', 'Saleros y pimenteros', 'Trapos de cocina limpios'],
        'bedroom': ['Juego completo de ropa de cama', 'Almohadas en bolsas al vacío', 'Accesorios personales organizados', 'Joyería en cajas organizadoras', 'Cosméticos en contenedores seguros', 'Ropa por temporada', 'Zapatos en cajas individuales', 'Bolsos y carteras', 'Relojes y joyería fina', 'Artículos de aseo personal'],
        'bathroom': ['Toallas por tamaño y color', 'Productos de higiene sellados', 'Botiquín completo de primeros auxilios', 'Accesorios de ducha y bañera', 'Espejos con protección en esquinas', 'Cortinas de baño dobladas', 'Alfombrillas de baño limpias', 'Porta cepillos y pasta dental', 'Secador de pelo y planchas', 'Productos de spa y relajación'],
        'office': ['Material de oficina por categoría', 'Documentos importantes en carpetas', 'Libros de referencia por tema', 'Cables y cargadores etiquetados', 'Accesorios de computadora organizados', 'Papelería y útiles escolares', 'Calculadoras y dispositivos electrónicos', 'Archivos y expedientes', 'Marcadores y resaltadores', 'Grapadoras y perforadoras'],
        'garage': ['Herramientas manuales organizadas', 'Equipo deportivo limpio y seco', 'Productos de limpieza en contenedores seguros', 'Bicicletas desarmadas y engrasadas', 'Cajas de almacenamiento etiquetadas', 'Pinturas y solventes sellados', 'Escaleras y herramientas grandes', 'Cajas de herramientas completas', 'Equipo de jardinería limpio', 'Repuestos y piezas organizadas'],
        'other': ['Artículos varios categorizados', 'Decoraciones por tipo de material', 'Objetos personales por dueño', 'Regalos sin abrir etiquetados', 'Recuerdos y fotos protegidos', 'Manuales e instrucciones', 'Juguetes y juegos infantiles', 'Material de manualidades', 'Decoraciones navideñas', 'Artículos deportivos diversos']
      };
      
      const sugerenciasDefault = sugerenciasPorDefecto[caja.habitacion] || [
        'Documentos importantes en carpeta',
        'Llaves de todas las cerraduras',
        'Herramientas básicas para emergencias',
        'Productos de limpieza esenciales',
        'Material de embalaje sobrante',
        'Bolsas de basura y guantes',
        'Cinta adhesiva y cortadores',
        'Marcadores para etiquetar',
        'Lista de inventario completa',
        'Teléfonos de contacto importantes'
      ];
      
      sugerenciasPorHabitacionRef.current[caja.habitacion] = sugerenciasDefault;
      setSugerencias(sugerenciasDefault);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleGoBack = () => {
    if (forceBoxes && !hasSavedBox) {
      Alert.alert(
        'Acción requerida',
        'Debes completar y guardar al menos una caja antes de poder salir, ya que tu mudanza es hoy.',
        [{ text: 'Entendido' }]
      );
      return;
    }

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

  const agregarItem = () => {
    if (itemActual.trim()) {
      setCaja({
        ...caja,
        items: [...caja.items, { 
          id: Date.now().toString() + Math.random(), 
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
    // Agregar a los items de la caja
    setCaja({
      ...caja,
      items: [...caja.items, { 
        id: Date.now().toString() + Math.random(), 
        nombre: sugerencia 
      }]
    });
    
    // Eliminar de las sugerencias actuales
    const nuevasSugerencias = sugerencias.filter(item => item !== sugerencia);
    setSugerencias(nuevasSugerencias);
    
    // Actualizar la referencia para esta habitación
    if (caja.habitacion) {
      sugerenciasPorHabitacionRef.current[caja.habitacion] = nuevasSugerencias;
    }
  };

  const seleccionarTipo = (tipoId) => {
    setCaja({ ...caja, tipo: tipoId });
    setShowTipoModal(false);
  };

  const seleccionarHabitacion = (habitacionId) => {
    const habitacionAnterior = caja.habitacion;
    setCaja({ ...caja, habitacion: habitacionId });
    setShowHabitacionModal(false);
    
    // Si cambia de habitación, mostrar botón de IA solo si no se ha usado para la nueva habitación
    if (habitacionId !== habitacionAnterior) {
      setSugerencias([]);
    }
  };

  const guardarCaja = async () => {
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

      if (isEditMode && boxId) {
        await updateBox(moveId, boxId, cajaData);
      } else {
        await saveBox(moveId, cajaData);
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
                navigation.replace('Home');
              }
            },
            {
              text: 'Agregar Otra Caja',
              onPress: () => {
                // Mantener las sugerencias de IA si ya se generaron
                const sugerenciasActuales = [...sugerencias];
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
                // Restaurar sugerencias si ya estaban generadas
                if (sugerenciasActuales.length > 0) {
                  setSugerencias(sugerenciasActuales);
                }
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
                // Mantener las sugerencias de IA si ya se generaron
                const sugerenciasActuales = [...sugerencias];
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
                // Restaurar sugerencias si ya estaban generadas
                if (sugerenciasActuales.length > 0) {
                  setSugerencias(sugerenciasActuales);
                }
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

  // Verificar si el botón de IA debe estar habilitado
  const isAIButtonEnabled = () => {
    return caja.habitacion && !aiButtonPressedPorHabitacion[caja.habitacion];
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      
      {renderHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {forceBoxes && (
          <View style={styles.requiredSection}>
            <Ionicons name="warning" size={16} color="#FFA500" />
            <Text style={styles.requiredSectionText}>
              Tu mudanza es hoy. Debes completar al menos una caja antes de continuar.
            </Text>
          </View>
        )}

        <View style={styles.moveInfo}>
          <Text style={styles.moveTitle}>Mudanza: {moveOrigin} → {moveDestination}</Text>
          <Text style={styles.moveType}>Tipo: {moveType}</Text>
          {isEditMode && (
            <Text style={styles.editModeText}>Modo edición</Text>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información de la Caja</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Nombre de la caja (opcional)"
            placeholderTextColor="#888"
            value={caja.nombre}
            onChangeText={(text) => setCaja({...caja, nombre: text})}
          />

          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowTipoModal(true)}
          >
            <Text style={caja.tipo ? styles.selectorText : styles.placeholderText}>
              {getTipoNombre()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#BB86FC" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowHabitacionModal(true)}
          >
            <Text style={caja.habitacion ? styles.selectorText : styles.placeholderText}>
              {getHabitacionNombre()}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#BB86FC" />
          </TouchableOpacity>

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

        {/* Artículos Problemáticos Mejorados */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={20} color="#FF6B6B" />
            <Text style={styles.warningTitle}>⚠️ Artículos Problemáticos</Text>
          </View>
          
          <Text style={styles.warningSubtitle}>🚫 NO EMPACAR EN CAJAS REGULARES</Text>
          
          <Text style={styles.problematicCategory}>Problemas Universales:</Text>
          <View style={styles.problematicosList}>
            {ARTICULOS_PROBLEMATICOS_UNIVERSALES.map((item, index) => (
              <View key={`universal-${index}`} style={styles.problematicoItem}>
                <Ionicons name="close-circle" size={14} color="#FF6B6B" />
                <Text style={styles.problematicoText}>{item}</Text>
              </View>
            ))}
          </View>

          {restriccionesPais.problemas.length > 0 && (
            <>
              <Text style={styles.problematicCategory}>Restricciones para {moveDestination}:</Text>
              <View style={styles.problematicosList}>
                {restriccionesPais.problemas.map((item, index) => (
                  <View key={`pais-${index}`} style={styles.problematicoItem}>
                    <Ionicons name="flag" size={14} color="#4ECDC4" />
                    <Text style={styles.problematicoText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {restriccionesPais.recomendaciones.length > 0 && (
            <>
              <Text style={styles.recommendationCategory}>Recomendaciones para {moveDestination}:</Text>
              <View style={styles.recommendationList}>
                {restriccionesPais.recomendaciones.map((item, index) => (
                  <View key={`rec-${index}`} style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                    <Text style={styles.recommendationText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.warningNote}>
            ⚠️ Consulta regulaciones específicas con tu empresa de mudanzas y aduanas del país destino.
          </Text>
        </View>

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
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addButton} onPress={agregarItem}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {caja.items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemText}>{item.nombre}</Text>
              <TouchableOpacity onPress={() => eliminarItem(item.id)}>
                <Ionicons name="trash" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Sugerencias de IA Mejoradas */}
        {!isEditMode && caja.habitacion && (
          <View style={styles.formSection}>
            <View style={styles.aiHeader}>
              <Text style={styles.sectionTitle}>
                Sugerencias para {getHabitacionNombre()}
              </Text>
              
              {isAIButtonEnabled() ? (
                <TouchableOpacity 
                  style={styles.aiButton} 
                  onPress={getAISuggestions}
                  disabled={loadingAI}
                >
                  {loadingAI ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                      <Text style={styles.aiButtonText}>Generar con IA</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.aiButtonDisabled}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.aiButtonTextDisabled}>Sugerencias generadas</Text>
                </View>
              )}
            </View>

            {sugerencias.length > 0 && (
              <>
                <Text style={styles.aiSubtitle}>
                  Lista de {sugerencias.length} artículos específicos para {getHabitacionNombre()}
                  {sugerencias.length < 10 && ' (algunos ya fueron agregados)'}
                </Text>
                
                <View style={styles.suggestionsList}>
                  {sugerencias.map((sugerencia, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => agregarSugerencia(sugerencia)}
                    >
                      <View style={styles.suggestionLeft}>
                        <Text style={styles.suggestionNumber}>{index + 1}.</Text>
                        <Text style={styles.suggestionText}>{sugerencia}</Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={22} color="#BB86FC" />
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={styles.aiNote}>
                  💡 Presiona cualquier artículo para agregarlo a tu caja (se eliminará de la lista)
                </Text>
              </>
            )}
          </View>
        )}

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

      {/* Modales */}
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
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  warningTitle: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningSubtitle: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  problematicCategory: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  recommendationCategory: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
  },
  problematicosList: {
    gap: 8,
    marginBottom: 5,
  },
  recommendationList: {
    gap: 8,
    marginBottom: 5,
  },
  problematicoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  problematicoText: {
    color: '#FFA000',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  recommendationText: {
    color: '#4CAF50',
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
  aiButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  aiButtonTextDisabled: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
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
    flex: 1,
  },
  suggestionNumber: {
    color: '#BB86FC',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
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