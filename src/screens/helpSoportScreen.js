import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const HelpSoportScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  
  const spinValue = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  // Animación de entrada
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Animación del icono giratorio
  const startSpinAnimation = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const categories = [
    { id: 1, icon: '📦', title: 'Maletas y Equipaje', color: '#4CAF50' },
    { id: 2, icon: '✈️', title: 'Viajes y Vuelos', color: '#2196F3' },
    { id: 3, icon: '⚠️', title: 'Artículos Prohibidos', color: '#FF9800' },
    { id: 4, icon: '🤖', title: 'IA y Recomendaciones', color: '#9C27B0' },
    { id: 5, icon: '⚙️', title: 'Configuración', color: '#607D8B' },
    { id: 6, icon: '📱', title: 'Uso de la App', color: '#E91E63' },
  ];

  const faqs = [
    {
      id: 1,
      question: '¿Cómo registro una nueva maleta o equipaje?',
      answer: '1. Ve a la pantalla principal y toca "NUEVO"\n2. Selecciona "Viaje" o "Mudanza"\n3. Completa los datos: Destino, Fechas de inicio y final\n4.puedes agregar descripciones\n5. Guarda y crea tus maletas o cajas organiza en categorías',
      category: 1
    },
    {
      id: 2,
      question: '¿Qué objetos están prohibidos en los viajes?',
      answer: '• Líquidos sobre 100ml\n• Objetos punzantes (tijeras, cuchillos)\n• Materiales inflamables\n• Baterías de litio sueltas\n• Alimentos perecederos no declarados\n• Armas y objetos peligrosos',
      category: 3
    },
    {
      id: 3,
      question: '¿Cómo funciona la IA para recomendaciones?',
      answer: 'Nuestra IA analiza:\n• Tus viajes y sugerirte articulos que puedes llevar mediante tu motivo de viaje',
      category: 4
    },
    {
      id: 4,
      question: '¿Puedo compartir mis listas con otros?',
      answer: 'No, aún no puedes compartir tu lista de equipajes con otros amigos',
      category: 6
    },
    {
      id: 5,
      question: '¿Cómo añado un nuevo viaje?',
      answer: '1. Toca "NUEVO" en la pantalla principal\n2. Selecciona "Viaje"\n3. Ingresa destino, fechas y Motivo de viaje\n4. Agrega maletas y articulos\n5. Guarda para iniciar la organización de tu viaje',
      category: 2
    },
    {
      id: 6,
      question: '¿Mis datos están seguros?',
      answer: '✅ Encriptación de extremo a extremo\n✅ Servidores seguros en la nube\n✅ Cumplimiento GDPR\n✅ Sin venta de datos personales\n✅ Acceso solo con tu permiso',
      category: 5
    },
  ];

  const handleEmail = () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      Alert.alert('Campos incompletos', 'Por favor, completa el asunto y el mensaje');
      return;
    }

    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody + '\n\n---\nEnviado desde MiApp de Viajes');
    
    Linking.openURL(`mailto:valdiviesobryan130@gmail.com?subject=${encodedSubject}&body=${encodedBody}`);
    setModalVisible(false);
    setEmailSubject('');
    setEmailBody('');
    
    Alert.alert(
      '✅ Mensaje enviado',
      'Hemos recibido tu consulta. Te responderemos en menos de 24 horas.',
      [{ text: 'OK' }]
    );
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    startSpinAnimation();
  };

  const toggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const filteredFAQs = selectedCategory 
    ? faqs.filter(faq => faq.category === selectedCategory)
    : faqs;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={styles.gradientBackground}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          
          {/* HEADER ELEGANTE */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Ionicons name="help-circle" size={32} color="#60A5FA" />
              <Text style={styles.headerTitle}>Centro de Ayuda</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.supportButton}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* HERO SECTION */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>¿En qué podemos ayudarte?</Text>
            <Text style={styles.heroSubtitle}>
              Encuentra respuestas rápidas o contáctanos directamente
            </Text>
            
            
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* CATEGORÍAS INTERACTIVAS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Explora por categoría</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
                contentContainerStyle={styles.categoriesContainer}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: category.color },
                      selectedCategory === category.id && styles.categorySelected
                    ]}
                    onPress={() => handleCategorySelect(category.id)}
                    activeOpacity={0.8}
                  >
                    <Animated.View style={selectedCategory === category.id && { transform: [{ rotate: spin }] }}>
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                    </Animated.View>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    {selectedCategory === category.id && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* PREGUNTAS FRECUENTES ACORDEÓN */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory 
                    ? `Preguntas sobre ${categories.find(c => c.id === selectedCategory)?.title}`
                    : 'Preguntas frecuentes'}
                </Text>
                <Text style={styles.faqCount}>{filteredFAQs.length} preguntas</Text>
              </View>
              
              {filteredFAQs.map((faq) => (
                <TouchableOpacity
                  key={faq.id}
                  style={[
                    styles.faqCard,
                    expandedFAQ === faq.id && styles.faqCardExpanded
                  ]}
                  onPress={() => toggleFAQ(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons 
                      name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"} 
                      size={22} 
                      color="#60A5FA" 
                    />
                  </View>
                  
                  {expandedFAQ === faq.id && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      <TouchableOpacity 
                        style={styles.faqHelpfulButton}
                        onPress={() => Alert.alert('¡Gracias!', 'Tu feedback nos ayuda a mejorar')}
                      >
                        <Text style={styles.faqHelpfulText}>¿Te fue útil esta respuesta?</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* TARJETA DE CONTACTO PREMIUM */}
            <LinearGradient
              colors={['#1E40AF', '#3B82F6', '#60A5FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.contactCard}
            >
              <View style={styles.contactHeader}>
                <Ionicons name="headset" size={40} color="#FFFFFF" />
                <Text style={styles.contactTitle}>Soporte Premium 24/7</Text>
              </View>
              
              <Text style={styles.contactDescription}>
                ¿No encontraste lo que buscabas? Nuestro equipo está disponible para ayudarte en cualquier momento.
              </Text>
              
              <View style={styles.contactStats}>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={20} color="#FFFFFF" />
                  <Text style={styles.statText}>Respuesta en 2h</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                  <Text style={styles.statText}>95% satisfacción</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="globe" size={20} color="#FFFFFF" />
                  <Text style={styles.statText}>Soporte global</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F1F5F9']}
                  style={styles.contactButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="chatbubble" size={22} color="#1E40AF" />
                  <Text style={styles.contactButtonText}>Contactar Soporte</Text>
                  <Ionicons name="arrow-forward" size={20} color="#1E40AF" />
                </LinearGradient>
              </TouchableOpacity>
              
              <Text style={styles.contactFooter}>
                 email: valdiviesobryan130@gmail.com
              </Text>
            </LinearGradient>

            
          </ScrollView>

          {/* MODAL DE CONTACTO */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <LinearGradient
                  colors={['#1E293B', '#0F172A']}
                  style={styles.modalGradient}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Contactar Soporte</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Asunto</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Ej: Problema con registro de maleta"
                      placeholderTextColor="#94A3B8"
                      value={emailSubject}
                      onChangeText={setEmailSubject}
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Describe tu problema</Text>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      placeholder="Describe detalladamente lo que necesitas..."
                      placeholderTextColor="#94A3B8"
                      value={emailBody}
                      onChangeText={setEmailBody}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalButton, styles.sendButton]}
                      onPress={handleEmail}
                    >
                      <LinearGradient
                        colors={['#3B82F6', '#1D4ED8']}
                        style={styles.sendButtonGradient}
                      >
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                        <Text style={styles.sendButtonText}>Enviar mensaje</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </Modal>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.2)',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  supportButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
  },
  heroSection: {
    padding: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  searchPlaceholder: {
    color: '#94A3B8',
    marginLeft: 12,
    fontSize: 15,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  faqCount: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '600',
  },
  categoriesScroll: {
    marginHorizontal: -20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  categoryCard: {
    width: 140,
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  categorySelected: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.4,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  categoryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 2,
  },
  faqCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  faqCardExpanded: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    marginRight: 12,
  },
  faqAnswerContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  faqAnswer: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 22,
    marginBottom: 16,
  },
  faqHelpfulButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 20,
  },
  faqHelpfulText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
  },
  contactCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  contactTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  contactDescription: {
    fontSize: 16,
    color: '#E2E8F0',
    lineHeight: 24,
    marginBottom: 20,
  },
  contactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  contactButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  contactButtonText: {
    color: '#1E40AF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contactFooter: {
    color: '#BFDBFE',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoSection: {
    paddingHorizontal: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  infoCardDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    maxHeight: height * 0.85,
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 120,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    flex: 2,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HelpSoportScreen;