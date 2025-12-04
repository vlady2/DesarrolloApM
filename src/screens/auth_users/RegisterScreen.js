import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../../../firebase/auth';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // ✅ Prevenir botón back físico (igual que en LoginScreen)
  useEffect(() => {
    const backAction = () => {
      if (navigation.isFocused()) {
        Alert.alert(
          'Salir del registro',
          '¿Estás seguro de que quieres cancelar el registro?',
          [
            {
              text: 'Continuar',
              style: 'cancel',
              onPress: () => null
            },
            {
              text: 'Salir',
              style: 'destructive',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  // ✅ Calcular fortaleza de la contraseña en tiempo real
  useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  // ✅ Validar formato de email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ✅ Validar nombre (solo letras y espacios)
  const isValidName = (name) => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,30}$/;
    return nameRegex.test(name.trim());
  };

  // ✅ Obtener color de fortaleza de contraseña
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return '#FF5252'; // Rojo - Débil
      case 1: return '#FF9800'; // Naranja - Regular
      case 2: return '#FFC107'; // Amarillo - Buena
      case 3: return '#4CAF50'; // Verde - Fuerte
      case 4: return '#2E7D32'; // Verde oscuro - Muy fuerte
      default: return '#FF5252';
    }
  };

  // ✅ Obtener texto de fortaleza
  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return 'Muy débil';
      case 1: return 'Débil';
      case 2: return 'Regular';
      case 3: return 'Fuerte';
      case 4: return 'Muy fuerte';
      default: return '';
    }
  };

  const handleRegister = async () => {
    // ✅ Validaciones mejoradas
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Campos incompletos', 'Por favor, completa todos los campos');
      return;
    }

    // ✅ Validar nombre
    if (!isValidName(name)) {
      Alert.alert(
        'Nombre inválido',
        'El nombre solo puede contener letras y espacios (2-30 caracteres)'
      );
      return;
    }

    // ✅ Validar formato de email
    if (!isValidEmail(email)) {
      Alert.alert('Correo inválido', 'Por favor, ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)');
      return;
    }

    // ✅ Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      Alert.alert('Contraseñas no coinciden', 'Las contraseñas ingresadas no son iguales');
      return;
    }

    // ✅ Validar longitud mínima de contraseña
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // ✅ Advertencia para contraseñas débiles
    if (passwordStrength < 2) {
      Alert.alert(
        'Contraseña débil',
        'Tu contraseña es débil. Para mayor seguridad, te recomendamos:\n• Usar al menos 8 caracteres\n• Incluir mayúsculas y minúsculas\n• Agregar números y símbolos',
        [
          {
            text: 'Mejorar contraseña',
            style: 'cancel'
          },
          {
            text: 'Continuar igual',
            onPress: () => proceedWithRegistration()
          }
        ]
      );
      return;
    }

    await proceedWithRegistration();
  };

  const proceedWithRegistration = async () => {
    setLoading(true);
    try {
      console.log('🟡 Creando cuenta...');
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('✅ Usuario creado en Auth:', user.uid);

      // Actualizar perfil con el nombre
      await updateProfile(user, {
        displayName: name.trim()
      });

      console.log('✅ Perfil actualizado con nombre');

      // Guardar información adicional en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        trips: [],
        moves: [],
        boxes: [],
        profileComplete: true,
        settings: {
          notifications: true,
          darkMode: true,
          language: 'es'
        }
      });

      console.log('✅ Usuario guardado en Firestore');

      // ✅ Navegar directamente a Home después de registro exitoso
      Alert.alert(
        '¡Cuenta creada! ',
        `Bienvenido ${name.trim()}. Tu cuenta ha sido creada exitosamente.`,
        [
          { 
            text: 'Comenzar', 
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error al registrar:', error.code, error.message);
      
      let errorTitle = 'Error al crear cuenta';
      let errorMessage = 'No se pudo crear la cuenta. Intenta de nuevo.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorTitle = 'Correo en uso';
          errorMessage = 'Ya existe una cuenta con este correo electrónico. ¿Quizás quieres iniciar sesión?';
          break;
        case 'auth/invalid-email':
          errorTitle = 'Correo inválido';
          errorMessage = 'El formato del correo electrónico no es válido. Verifica que esté bien escrito.';
          break;
        case 'auth/weak-password':
          errorTitle = 'Contraseña débil';
          errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
          break;
        case 'auth/operation-not-allowed':
          errorTitle = 'Operación no permitida';
          errorMessage = 'El registro con email/contraseña no está habilitado. Contacta con soporte.';
          break;
        case 'auth/network-request-failed':
          errorTitle = 'Sin conexión';
          errorMessage = 'Parece que no tienes conexión a internet. Verifica tu conexión e intenta de nuevo.';
          break;
        case 'auth/too-many-requests':
          errorTitle = 'Demasiados intentos';
          errorMessage = 'Has intentado registrar muchas veces. Por tu seguridad, espera unos minutos.';
          break;
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [
          { text: 'Entendido', style: 'default' },
          error.code === 'auth/email-already-in-use' && {
            text: 'Iniciar Sesión',
            onPress: () => navigation.navigate('Login')
          }
        ].filter(Boolean)
      );
      
    } finally {
      setLoading(false);
    }
  };

  // ✅ Ir a Login
  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={24} color="#BB86FC" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Comienza tu aventura ✈️</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Nombre */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
                maxLength={30}
              />
              {name.length > 0 && (
                <Text style={styles.charCount}>{name.length}/30</Text>
              )}
            </View>
            
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
            
            {/* Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Indicador de fortaleza de contraseña */}
              {password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((index) => (
                      <View
                        key={index}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor: index <= passwordStrength 
                              ? getPasswordStrengthColor() 
                              : '#333'
                          }
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[
                    styles.strengthText,
                    { color: getPasswordStrengthColor() }
                  ]}>
                    {getPasswordStrengthText()}
                  </Text>
                </View>
              )}
              
              {/* Consejos de contraseña */}
              {password.length > 0 && passwordStrength < 3 && (
                <View style={styles.passwordTips}>
                  <Text style={styles.tipsTitle}>💡 Para mejorar tu contraseña:</Text>
                  <Text style={styles.tipText}>• Usa al menos 8 caracteres</Text>
                  <Text style={styles.tipText}>• Incluye mayúsculas y minúsculas</Text>
                  <Text style={styles.tipText}>• Agrega números (0-9)</Text>
                  <Text style={styles.tipText}>• Usa símbolos (!@#$%^&*)</Text>
                </View>
              )}
            </View>
            
            {/* Confirmar Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#666"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={22} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Indicador de coincidencia */}
              {confirmPassword.length > 0 && (
                <View style={styles.matchIndicator}>
                  <Ionicons 
                    name={password === confirmPassword ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={password === confirmPassword ? "#4CAF50" : "#F44336"} 
                  />
                  <Text style={[
                    styles.matchText,
                    { color: password === confirmPassword ? "#4CAF50" : "#F44336" }
                  ]}>
                    {password === confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                  </Text>
                </View>
              )}
            </View>

            {/* Botón de registro */}
            <TouchableOpacity 
              style={[
                styles.registerButton, 
                loading && styles.registerButtonDisabled,
                (!name || !email || !password || !confirmPassword) && styles.registerButtonInactive
              ]} 
              onPress={handleRegister}
              disabled={loading || !name || !email || !password || !confirmPassword}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Separador */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Enlace a Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
            <TouchableOpacity 
              onPress={goToLogin}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Términos y condiciones */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              Al crear una cuenta, aceptas nuestros{' '}
              <Text style={styles.termsLink}>Términos de Servicio</Text>{' '}
              y{' '}
              <Text style={styles.termsLink}>Política de Privacidad</Text>
            </Text>
          </View>

          {/* Información de seguridad */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={18} color="#4CAF50" />
            <Text style={styles.securityText}>
              Tus datos están protegidos con encriptación de extremo a extremo
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#BB86FC',
    opacity: 0.9,
  },
  form: {
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#BB86FC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeButton: {
    padding: 10,
    paddingRight: 16,
  },
  charCount: {
    color: '#888',
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 5,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordTips: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  tipsTitle: {
    color: '#BB86FC',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  tipText: {
    color: '#BB86FC',
    fontSize: 11,
    opacity: 0.8,
    marginBottom: 2,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  matchText: {
    fontSize: 12,
    marginLeft: 6,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#666',
    shadowColor: 'transparent',
  },
  registerButtonInactive: {
    backgroundColor: '#333',
    shadowColor: 'transparent',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#888',
    marginHorizontal: 15,
    fontSize: 14,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 5,
  },
  loginLink: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  termsContainer: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  termsText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  securityText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});