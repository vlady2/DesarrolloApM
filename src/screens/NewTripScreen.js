import { GROQ_API_KEY } from '@env';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../../firebase/auth';
import { saveTrip } from '../../firebase/tripService';

const NewTripScreen = ({ navigation }) => {
  const [trip, setTrip] = useState({
    tripName: '', // ✅ AGREGADO: Campo nombre del viaje
    destination: '',
    startDate: '',
    endDate: '',
    purpose: '',
    type: 'viaje'
  });
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log('🔐 Estado de autenticación:', auth.currentUser);
    console.log('📱 NewTripScreen montado');
  }, []);

  useEffect(() => {
    console.log('🔑 GROQ_API_KEY cargada:', GROQ_API_KEY ? 'SÍ' : 'NO');
    console.log('📏 Longitud de API_KEY:', GROQ_API_KEY?.length);
    console.log('🔍 Primeros 10 caracteres:', GROQ_API_KEY?.substring(0, 10) + '...');
  }, []);

  // Función de IA REAL para sugerencias
  const getAISuggestions = async () => {
  if (!trip.destination && !trip.purpose) {
    Alert.alert('Info', 'Completa al menos el destino o propósito para mejores sugerencias');
    return;
  }

  setLoadingAI(true);
  try {
    const API_URL = "https://api.groq.com/openai/v1/chat/completions";

    const prompt = `Como experto en viajes, sugiere 8 artículos esenciales para llevar en un viaje a ${trip.destination} con propósito: ${trip.purpose}. 
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
            content: "Eres un asistente especializado en viajes. Proporcionas listas concisas de artículos esenciales."
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

    // ✅ AGREGAR VERIFICACIÓN DE RESPUESTA
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // ✅ VERIFICAR QUE LA RESPUESTA TENGA LOS DATOS ESPERADOS
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Respuesta de IA en formato incorrecto');
    }
    
    const aiMessage = data.choices[0].message.content;
    
    // Procesar la respuesta de la IA
    const suggestions = aiMessage.split(',').map(item => item.trim()).filter(item => item);
    setAiSuggestions(suggestions);
    
  } catch (error) {
    console.error('Error con IA:', error);
    // Sugerencias por defecto si falla la IA
    const defaultSuggestions = [
      'Pasaporte y documentos',
      'Adaptador de enchufes',
      'Medicamentos personales',
      'Protector solar',
      'Cargador portátil',
      'Botella de agua reusable',
      'Snacks para el viaje',
      'Kit de primeros auxilios'
    ];
    setAiSuggestions(defaultSuggestions);
  } finally {
    setLoadingAI(false);
  }
};

  const handleAddItem = () => {
    if (newItem.trim()) {
      setItems([...items, { id: Date.now().toString(), name: newItem.trim() }]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addSuggestion = (suggestion) => {
    setItems([...items, { id: Date.now().toString(), name: suggestion }]);
    setAiSuggestions(aiSuggestions.filter(item => item !== suggestion));
  };

  const saveTripToFirebase = async () => {
  if (!trip.tripName || !trip.destination || !trip.startDate) {
    Alert.alert('Error', 'Por favor completa los campos obligatorios (*)');
    return;
  }

   // Verificar que el usuario esté autenticado
  if (!auth.currentUser) {
    Alert.alert('Error', 'Debes iniciar sesión para guardar viajes');
    console.log('❌ Usuario NO autenticado');
    return;
  }

  console.log('🔵 Usuario autenticado:', auth.currentUser.uid);
  console.log('🟡 Datos del viaje:', {
    tripName: trip.tripName,
    destination: trip.destination,
    itemsCount: items.length,
    userId: auth.currentUser.uid
  });

  setSaving(true);
  
  try {
    const tripData = {
      tripName: trip.tripName,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      purpose: trip.purpose,
      type: 'viaje',
      items: items.map(item => item.name),
      status: 'planning',
      itemCount: items.length,
      userId: auth.currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

     console.log('🟡 Enviando datos a saveTrip...');
    
    const result = await saveTrip(tripData);
    console.log('🟢 saveTrip retornó:', result);
    
    Alert.alert(
      '✅ Éxito', 
      'Viaje guardado correctamente',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navegar de regreso de manera segura
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainApp'); // O la pantalla principal
            }
          }
        }
      ]
    );
    
  } catch (error) {
    console.error('❌ Error en saveTripToFirebase:', error);
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack:', error.stack);
    
    let errorMessage = 'No se pudo guardar el viaje';
    if (error.message.includes('permission')) {
      errorMessage = 'Error de permisos. Verifica las reglas de Firestore.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Error de conexión. Verifica tu internet.';
    }
    
    Alert.alert('❌ Error', errorMessage);
  } finally {
    setSaving(false);
  }
};
    // Agrega esto temporalmente en tu NewTripScreen
    useEffect(() => {
      console.log('🔐 Estado de autenticación:', auth.currentUser);
    }, []);
    
    

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Viaje</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Formulario del Viaje */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información del Viaje</Text>
          
          {/* ✅ AGREGADO: Campo nombre del viaje */}
          <TextInput
            style={styles.input}
            placeholder="Nombre del viaje *"
            placeholderTextColor="#888"
            value={trip.tripName}
            onChangeText={(text) => setTrip({...trip, tripName: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Destino *"
            placeholderTextColor="#888"
            value={trip.destination}
            onChangeText={(text) => setTrip({...trip, destination: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Fecha de inicio (DD/MM/AAAA) *"
            placeholderTextColor="#888"
            value={trip.startDate}
            onChangeText={(text) => setTrip({...trip, startDate: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Fecha de fin (DD/MM/AAAA)"
            placeholderTextColor="#888"
            value={trip.endDate}
            onChangeText={(text) => setTrip({...trip, endDate: text})}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Propósito del viaje (vacaciones, trabajo, etc.)"
            placeholderTextColor="#888"
            value={trip.purpose}
            onChangeText={(text) => setTrip({...trip, purpose: text})}
            multiline
          />
        </View>

        {/* Lista de Artículos */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Artículos para llevar ({items.length})</Text>
          
          <View style={styles.addItemContainer}>
            <TextInput
              style={styles.itemInput}
              placeholder="Agregar artículo..."
              placeholderTextColor="#888"
              value={newItem}
              onChangeText={setNewItem}
              onSubmitEditing={handleAddItem}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Renderizar items manualmente sin FlatList */}
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemText}>{item.name}</Text>
              <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
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
                {loadingAI ? 'Generando...' : 'Sugerencias IA'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.suggestionsGrid}>
            {aiSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => addSuggestion(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
                <Ionicons name="add" size={14} color="#4CAF50" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={saveTripToFirebase}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Viaje</Text>
          )}
        </TouchableOpacity>
        {/*Agrega esto temporalmente en NewTripScreen después del botón guardar*/}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#FF9800', marginTop: 10 }]}
          onPress={() => {
            console.log('🐛 DEBUG INFO:');
            console.log('Usuario:', auth.currentUser);
            console.log('Trip Data:', trip);
            console.log('Items:', items);
            Alert.alert('Debug', 'Revisa la consola para más información');
          }}
        >
          <Text style={styles.saveButtonText}>Debug Info</Text>
        </TouchableOpacity>
      </ScrollView>
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
});

export default NewTripScreen;