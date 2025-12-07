import { collection, getDocs, query, where } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../../firebase/auth';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Verificar si el email existe en Firestore
  const checkEmailInFirestore = async (emailToCheck) => {
    try {
      const usersRef = collection(db, 'users');
      
      // Buscar por email exacto
      const q = query(
        usersRef, 
        where("email", "==", emailToCheck.toLowerCase().trim())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Usuario encontrado
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        // IMPORTANTE: Como ahora eliminamos físicamente, no necesitamos verificar deleted
        // Si el usuario existe aquí, es porque NO fue eliminado
        return {
          exists: true,
          userData: userData,
          userId: userDoc.id
        };
      }
      
      // Usuario no existe
      return {
        exists: false,
        userData: null,
        userId: null
      };
      
    } catch (error) {
      console.error('Error en Firestore:', error);
      throw error;
    }
  };

  const handleContinue = async () => {
    setError('');

    if (!email.trim()) {
      setError('Por favor, ingresa tu correo electrónico');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Por favor, ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);

    try {
      const emailNormalized = email.toLowerCase().trim();
      
      // Verificar si el usuario existe en Firestore
      const firestoreResult = await checkEmailInFirestore(emailNormalized);
      
      if (firestoreResult.exists) {
        // Usuario EXISTE - Ir a pantalla de confirmación
        navigation.navigate('ResetPasswordConfirm', { 
          email: emailNormalized,
          verified: true,
          userId: firestoreResult.userId
        });
        
      } else {
        // Usuario NO EXISTE - Mostrar error
        setError('Este correo no está registrado en Pack&Trip');
        
        Alert.alert(
          'Cuenta no encontrada',
          `No encontramos una cuenta con el correo:\n\n${emailNormalized}\n\n¿Quieres crear una cuenta nueva?`,
          [
            {
              text: 'Crear cuenta',
              onPress: () => {
                navigation.navigate('Register', { preFilledEmail: emailNormalized });
              },
              style: 'default'
            },
            {
              text: 'Intentar otro',
              style: 'cancel',
              onPress: () => {
                setEmail('');
                setError('');
              }
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Error en verificación:', error);
      
      // Manejo de errores limpio
      if (error.code === 'permission-denied') {
        setError('Error de permisos. Contacta con soporte.');
      } else if (error.code === 'unavailable') {
        setError('Servicio no disponible. Intenta de nuevo.');
      } else {
        setError('Error al verificar. Intenta de nuevo.');
      }
      
      // Si hay error, pasamos a pantalla 2 para intentar (como fallback)
      navigation.navigate('ResetPasswordConfirm', { 
        email: email.toLowerCase().trim(),
        verified: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Botón de regreso */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToLogin}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>← Volver al Login</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Encuentra tu cuenta</Text>
            <Text style={styles.subtitle}>
              Ingresa tu correo electrónico para buscar tu cuenta
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="ejemplo@gmail.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                autoFocus={true}
              />
              
              {/* Mensaje de error */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <Text style={styles.helperText}>
                  Ingresa el correo electrónico con el que te registraste
                </Text>
              )}
              
              {/* Estado de carga */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#BB86FC" />
                  <Text style={styles.loadingText}>Buscando cuenta...</Text>
                </View>
              )}
            </View>

            {/* Botón de continuar */}
            <TouchableOpacity 
              style={[
                styles.continueButton, 
                loading && styles.continueButtonDisabled,
                (!email || error) && styles.continueButtonInactive
              ]} 
              onPress={handleContinue}
              disabled={loading || !email || !!error}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.continueButtonText}>Buscar cuenta</Text>
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>¿Primera vez aquí?</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Opciones alternativas */}
            <View style={styles.alternativesContainer}>
              <TouchableOpacity 
                style={styles.alternativeOption}
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
              >
                <Text style={styles.alternativeOptionText}>Crear una cuenta nueva</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.alternativeOption, styles.helpOption]}
                onPress={() => {
                  Alert.alert(
                    'Ayuda adicional',
                    'Si tienes problemas para encontrar tu cuenta:\n\n• Verifica que el email esté correcto\n• Contacta con soporte técnico\n• Revisa si usaste otro email',
                    [{ text: 'OK' }]
                  );
                }}
                disabled={loading}
              >
                <Text style={styles.alternativeOptionText}>Obtener ayuda</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Información importante */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
            <Text style={styles.infoText}>
              Buscamos tu email en nuestra base de datos. Solo podrás recuperar contraseña si estás registrado y tu cuenta está activa.
            </Text>
            <Text style={styles.infoSmall}>
              Nota: Las cuentas eliminadas permanentemente no aparecerán en la búsqueda.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 30,
    padding: 10,
  },
  backButtonText: {
    color: '#BB86FC',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#BB86FC',
    opacity: 0.8,
    lineHeight: 22,
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    color: '#BB86FC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  errorContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '500',
  },
  helperText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderRadius: 8,
  },
  loadingText: {
    color: '#BB86FC',
    fontSize: 12,
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#BB86FC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#BB86FC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  continueButtonDisabled: {
    backgroundColor: '#666',
    shadowColor: 'transparent',
  },
  continueButtonInactive: {
    backgroundColor: '#444',
    shadowColor: 'transparent',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  separatorText: {
    color: '#888',
    marginHorizontal: 15,
    fontSize: 14,
  },
  alternativesContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.6)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  alternativeOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(187, 134, 252, 0.05)',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.2)',
    alignItems: 'center',
  },
  helpOption: {
    backgroundColor: 'rgba(41, 128, 185, 0.05)',
    borderColor: 'rgba(41, 128, 185, 0.2)',
  },
  alternativeOptionText: {
    color: '#BB86FC',
    fontSize: 15,
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: 'rgba(30, 30, 30, 0.6)',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#BB86FC',
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
    marginBottom: 8,
  },
  infoSmall: {
    color: '#FF6B6B',
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
});
