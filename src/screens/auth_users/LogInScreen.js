import { signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler, // ✅ AÑADIR ESTO
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../../firebase/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('👤 Usuario ya autenticado, redirigiendo a Home...');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }
    });

    return unsubscribe;
  }, [navigation]);

  // ✅ AÑADIR ESTE useEffect PARA BLOQUEAR EL BOTÓN BACK
  useEffect(() => {
    const backAction = () => {
      // Cuando estamos en LoginScreen y presionan back físico
      if (navigation.isFocused()) {
        Alert.alert(
          'Salir de la aplicación',
          '¿Estás seguro de que quieres salir?',
          [
            {
              text: 'Cancelar',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Salir',
              onPress: () => BackHandler.exitApp(),
              style: 'destructive',
            },
          ]
        );
        return true; // Evita el comportamiento por defecto (volver atrás)
      }
      return false;
    };

    // Suscribirse al evento del botón back
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    // Limpiar el listener al desmontar
    return () => backHandler.remove();
  }, [navigation]);

  // Validar formato de email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // Validaciones básicas
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos incompletos', 'Por favor, ingresa tu correo y contraseña');
      return;
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
      Alert.alert('Correo inválido', 'Por favor, ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)');
      return;
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      console.log('🟡 Intentando iniciar sesión...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('🟢 Sesión iniciada para: ', user.email);
      
      // Navegar al Home sin alerta de bienvenida (ya es suficiente con navegar)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      
    } catch (error) {
      console.error('❌ Error al iniciar sesión:', error.code, error.message);
      
      // Manejo de errores mejorado
      let errorTitle = 'Error de inicio de sesión';
      let errorMessage = 'No se pudo iniciar sesión. Por favor verifica tus credenciales.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorTitle = 'Correo inválido';
          errorMessage = 'El formato del correo electrónico no es válido. Verifica que esté bien escrito.';
          break;
          
        case 'auth/user-not-found':
          errorTitle = 'Usuario no encontrado';
          errorMessage = 'No existe una cuenta con este correo electrónico. ¿Quizás necesitas registrarte primero?';
          break;
          
        case 'auth/wrong-password':
          errorTitle = 'Contraseña incorrecta';
          errorMessage = 'La contraseña que ingresaste no es correcta. Verifica e intenta de nuevo.';
          break;
          
        case 'auth/invalid-credential':
          errorTitle = 'Credenciales incorrectas';
          errorMessage = 'El correo o la contraseña no son correctos. Por favor, verifica tus datos.';
          break;
          
        case 'auth/too-many-requests':
          errorTitle = 'Demasiados intentos';
          errorMessage = 'Has intentado iniciar sesión muchas veces. Por tu seguridad, espera unos minutos antes de intentar de nuevo.';
          break;
          
        case 'auth/network-request-failed':
          errorTitle = 'Sin conexión';
          errorMessage = 'Parece que no tienes conexión a internet. Verifica tu conexión e intenta de nuevo.';
          break;
          
        case 'auth/user-disabled':
          errorTitle = 'Cuenta deshabilitada';
          errorMessage = 'Esta cuenta ha sido deshabilitada por el administrador. Contacta con soporte si crees que es un error.';
          break;
          
        case 'auth/email-already-in-use':
          // Este error no debería ocurrir en login, pero por si acaso
          errorTitle = 'Correo en uso';
          errorMessage = 'Este correo ya está registrado. Si es tu cuenta, intenta iniciar sesión. Si no, usa otro correo.';
          break;
          
        case 'auth/weak-password':
          // Este error tampoco debería ocurrir en login
          errorTitle = 'Contraseña débil';
          errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
          break;
          
        default:
          // Para errores no manejados específicamente
          if (error.message.includes('auth/')) {
            errorTitle = 'Error de autenticación';
            errorMessage = 'Hubo un problema al verificar tus credenciales. Intenta de nuevo más tarde.';
          } else {
            errorTitle = 'Error del sistema';
            errorMessage = 'Ocurrió un error inesperado. Por favor, intenta de nuevo en unos minutos.';
          }
      }
      
      // Mostrar alerta con título y mensaje personalizados
      Alert.alert(
        errorTitle,
        errorMessage,
        [
          {
            text: 'Entendido',
            style: 'default'
          },
          // Sugerir registro si es usuario no encontrado
          error.code === 'auth/user-not-found' && {
            text: 'Crear cuenta',
            onPress: () => navigation.navigate('Register')
          }
        ].filter(Boolean) // Filtra los botones undefined
      );
      
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperar Contraseña',
      'Esta funcionalidad estará disponible en la próxima actualización.\n\nMientras tanto, puedes contactar con soporte.',
      [
        { text: 'Entendido', style: 'cancel' }
      ]
    );
  };

  // Navegar al registro
  const goToRegister = () => {
    navigation.navigate('Register');
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
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
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
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.loginButton, 
                loading && styles.loginButtonDisabled,
                (!email || !password) && styles.loginButtonInactive
              ]} 
              onPress={handleLogin}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
            <TouchableOpacity 
              onPress={goToRegister}
              disabled={loading}
            >
              <Text style={styles.registerLink}>Crear cuenta</Text>
            </TouchableOpacity>
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
    paddingBottom: Platform.OS === 'ios' ? 0 : 20, // Añadir padding en Android para evitar cortes
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    opacity: 0.8,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
    padding: 8,
  },
  forgotPasswordText: {
    color: '#BB86FC',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#BB86FC',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#BB86FC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
    shadowColor: 'transparent',
  },
  loginButtonInactive: {
    backgroundColor: '#333',
    shadowColor: 'transparent',
  },
  loginButtonText: {
    color: '#000000',
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  registerText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 5,
  },
  registerLink: {
    color: '#BB86FC',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  tipsContainer: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#BB86FC',
  },
  tipsTitle: {
    color: '#BB86FC',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipsText: {
    color: '#BB86FC',
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.8,
  },
});