import { GROQ_API_KEY } from '@env';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../../firebase/config';
import { saveTrip } from '../../firebase/tripService';


const NewMoveScreen = ({ navigation }) => {
  const [trip, setTrip] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    purpose: '',
    type: 'mudanza'
  });
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [saving, setSaving] = useState(false);

  // Función de IA para sugerencias de mudanza
  const getAISuggestions = async () => {
    if (!trip.destination && !trip.purpose) {
      Alert.alert('Info', 'Completa al menos el destino o propósito para mejores sugerencias');
      return;
    }

    setLoadingAI(true);
    try {
      
      const API_URL = "https://api.groq.com/openai/v1/chat/completions";

      const prompt = `Como experto en mudanzas y organización, sugiere 8 artículos esenciales para una mudanza a ${trip.destination} con propósito: ${trip.purpose}. 
      Incluye elementos importantes para empaque, organización y limpieza. Responde SOLO con una lista separada por comas, sin numeración ni explicaciones.`;

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
              content: "Eres un asistente especializado en mudanzas y organización. Proporciona listas concisas de artículos esenciales para mudanzas."
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

      const data = await response.json();
      const aiMessage = data.choices[0].message.content;
      
      // Procesar la respuesta de la IA
      const suggestions = aiMessage.split(',').map(item => item.trim()).filter(item => item);
      setAiSuggestions(suggestions);
      
    } catch (error) {
      console.error('Error con IA:', error);
      // Sugerencias por defecto para mudanza
      const defaultSuggestions = [
        'Cajas de cartón resistentes',
        'Cinta de embalaje',
        'Plumón para etiquetar',
        'Plástico de burbujas',
        'Tijeras y cutter',
        'Guantes de trabajo',
        'Toallas y papel',
        'Kit de limpieza básico'
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

  const saveMoveToFirebase = async () => {
    if (!trip.destination || !trip.startDate) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios (*)');
      return;
    }

    // Verificar que el usuario esté autenticado
    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para guardar mudanzas');
      return;
    }

    setSaving(true);
    try {
      const moveData = {
        ...trip,
        items: items.map(item => item.name),
        status: 'planning',
        itemCount: items.length,
        type: 'mudanza'
      };

      await saveTrip(moveData);
      
      Alert.alert('✅ Éxito', 'Mudanza guardada correctamente');
      navigation.goBack();
      
    } catch (error) {
      console.error('Error guardando mudanza:', error);
      Alert.alert('❌ Error', 'No se pudo guardar la mudanza: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Mudanza</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Formulario de la Mudanza */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Información de la Mudanza</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Dirección de destino *"
            placeholderTextColor="#888"
            value={trip.destination}
            onChangeText={(text) => setTrip({...trip, destination: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Fecha de mudanza (DD/MM/AAAA) *"
            placeholderTextColor="#888"
            value={trip.startDate}
            onChangeText={(text) => setTrip({...trip, startDate: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Fecha de entrega de llaves (DD/MM/AAAA)"
            placeholderTextColor="#888"
            value={trip.endDate}
            onChangeText={(text) => setTrip({...trip, endDate: text})}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tipo de mudanza (casa, departamento, oficina, etc.)"
            placeholderTextColor="#888"
            value={trip.purpose}
            onChangeText={(text) => setTrip({...trip, purpose: text})}
            multiline
          />
        </View>

        {/* Lista de Artículos para Mudanza */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Artículos para empacar ({items.length})</Text>
          
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

          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text style={styles.itemText}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                  <Ionicons name="trash" size={18} color="#F44336" />
                </TouchableOpacity>
              </View>
            )}
            style={styles.itemsList}
          />
        </View>

        {/* Sugerencias de IA para Mudanza */}
        <View style={styles.formSection}>
          <View style={styles.aiHeader}>
            <Text style={styles.sectionTitle}>Sugerencias para Mudanza</Text>
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

        {/* Información adicional para mudanza */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Checklist de Mudanza</Text>
          <View style={styles.checklist}>
            <View style={styles.checklistItem}>
              <Ionicons name="checkbox-outline" size={20} color="#4CAF50" />
              <Text style={styles.checklistText}>Contratar servicio de mudanza</Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons name="checkbox-outline" size={20} color="#4CAF50" />
              <Text style={styles.checklistText}>Notificar cambio de dirección</Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons name="checkbox-outline" size={20} color="#4CAF50" />
              <Text style={styles.checklistText}>Empacar por categorías</Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons name="checkbox-outline" size={20} color="#4CAF50" />
              <Text style={styles.checklistText}>Preparar caja de primeros días</Text>
            </View>
          </View>
        </View>

        {/* Botón Guardar */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={saveMoveToFirebase}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Mudanza</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  itemsList: {
    maxHeight: 200,
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
  checklist: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checklistText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
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

export default NewMoveScreen;