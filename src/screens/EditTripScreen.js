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
import { auth } from '../../firebase/config';
import { getTripById, updateTrip } from '../../firebase/tripService';


const EditTripScreen = ({ route, navigation }) => {
  const { trip } = route.params;
  
  const [editedTrip, setEditedTrip] = useState({
    tripName: trip.tripName || '',
    destination: trip.destination || '',
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    purpose: trip.purpose || '',
    type: trip.type || 'viaje'
  });
  
  const [items, setItems] = useState(trip.items ? trip.items.map((item, index) => ({ 
    id: index.toString(), 
    name: item 
  })) : []);
  
  const [newItem, setNewItem] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar datos actualizados si es necesario
  useEffect(() => {
    if (trip.id) {
      loadTripData();
    }
  }, [trip.id]);

  const loadTripData = async () => {
    try {
      setLoading(true);
      const tripData = await getTripById(trip.id);
      
      setEditedTrip({
        tripName: tripData.tripName || '',
        destination: tripData.destination || '',
        startDate: tripData.startDate || '',
        endDate: tripData.endDate || '',
        purpose: tripData.purpose || '',
        type: tripData.type || 'viaje'
      });
      
      setItems(tripData.items ? tripData.items.map((item, index) => ({ 
        id: index.toString(), 
        name: item 
      })) : []);
      
    } catch (error) {
      console.error('Error cargando datos del viaje:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del viaje');
    } finally {
      setLoading(false);
    }
  };

  // Función de IA para sugerencias
  const getAISuggestions = async () => {
    if (!editedTrip.destination && !editedTrip.purpose) {
      Alert.alert('Info', 'Completa al menos el destino o propósito para mejores sugerencias');
      return;
    }

    setLoadingAI(true);
    try {
      const API_URL = "https://api.groq.com/openai/v1/chat/completions";

      const prompt = `Como experto en viajes, sugiere 8 artículos esenciales para llevar en un viaje a ${editedTrip.destination} con propósito: ${editedTrip.purpose}. 
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

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Respuesta de IA en formato incorrecto');
      }
      
      const aiMessage = data.choices[0].message.content;
      const suggestions = aiMessage.split(',').map(item => item.trim()).filter(item => item);
      setAiSuggestions(suggestions);
      
    } catch (error) {
      console.error('Error con IA:', error);
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

  const updateTripInFirebase = async () => {
    if (!editedTrip.tripName || !editedTrip.destination || !editedTrip.startDate) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios (*)');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para editar viajes');
      return;
    }

    console.log('🔵 Actualizando viaje:', trip.id);
    setSaving(true);
    
    try {
      const tripData = {
        tripName: editedTrip.tripName,
        destination: editedTrip.destination,
        startDate: editedTrip.startDate,
        endDate: editedTrip.endDate,
        purpose: editedTrip.purpose,
        type: 'viaje',
        items: items.map(item => item.name),
        status: trip.status || 'planning',
        itemCount: items.length,
        updatedAt: new Date()
      };

      console.log('🟡 Enviando datos actualizados...');
      
      await updateTrip(trip.id, tripData);
      console.log('🟢 Viaje actualizado correctamente');
      
      Alert.alert(
        '✅ Éxito', 
        'Viaje actualizado correctamente',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('TripDetail', { trip: { ...trip, ...tripData } });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error actualizando viaje:', error);
      console.error('❌ Mensaje:', error.message);
      
      let errorMessage = 'No se pudo actualizar el viaje';
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BB86FC" />
        <Text style={styles.loadingText}>Cargando viaje...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Viaje</Text>
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
          
          <TextInput
            style={styles.input}
            placeholder="Nombre del viaje *"
            placeholderTextColor="#888"
            value={editedTrip.tripName}
            onChangeText={(text) => setEditedTrip({...editedTrip, tripName: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Destino *"
            placeholderTextColor="#888"
            value={editedTrip.destination}
            onChangeText={(text) => setEditedTrip({...editedTrip, destination: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Fecha de inicio (DD/MM/AAAA) *"
            placeholderTextColor="#888"
            value={editedTrip.startDate}
            onChangeText={(text) => setEditedTrip({...editedTrip, startDate: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Fecha de fin (DD/MM/AAAA)"
            placeholderTextColor="#888"
            value={editedTrip.endDate}
            onChangeText={(text) => setEditedTrip({...editedTrip, endDate: text})}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Propósito del viaje (vacaciones, trabajo, etc.)"
            placeholderTextColor="#888"
            value={editedTrip.purpose}
            onChangeText={(text) => setEditedTrip({...editedTrip, purpose: text})}
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

          {/* Renderizar items */}
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

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={updateTripInFirebase}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Actualizar Viaje</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditTripScreen;