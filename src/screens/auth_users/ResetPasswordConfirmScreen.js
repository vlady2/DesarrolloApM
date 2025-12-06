// ResetPasswordConfirmScreen.js - Pantalla 2: Confirmación
import { sendPasswordResetEmail } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../../../firebase/auth';

export default function ResetPasswordConfirmScreen({ navigation, route }) {
  const { email } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      navigation.goBack();
    }
  }, [email, navigation]);

  // Countdown para reenviar
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendResetEmail = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('📤 Enviando email de recuperación a:', email);
      
      await sendPasswordResetEmail(auth, email);
      
      console.log('✅ Email enviado exitosamente');
      
      // Iniciar countdown de 60 segundos
      setCountdown(60);
      setEmailSent(true);
      
      Alert.alert(
        '✅ Email enviado',
        `Hemos enviado un enlace de recuperación a:\n\n📧 ${email}\n\n**Por favor:**\n1. Revisa tu bandeja de entrada\n2. Busca en la carpeta de spam\n3. El enlace expira en 1 hora`,
        [
          {
            text: 'Abrir Gmail',
            onPress: () => {
              Linking.openURL('https://mail.google.com')
                .catch(err => console.log('Error:', err));
            }
          },
          { text: 'OK', style: 'default' }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error al enviar email:', error.code, error.message);
      
      // Manejo específico de errores
      if (error.code === 'auth/user-not-found') {
        setError('❌ Este correo no está registrado en Pack&Trip');
        Alert.alert(
          'Usuario no encontrado',
          `"${email}" no está registrado en nuestra plataforma.\n\n¿Quieres crear una cuenta nueva?`,
          [
            {
              text: 'Crear cuenta',
              onPress: () => {
                navigation.navigate('Register', { preFilledEmail: email });
              }
            },
            {
              text: 'Volver',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            }
          ]
        );
      } else if (error.code === 'auth/too-many-requests') {
        setError('⚠️ Demasiados intentos. Espera unos minutos.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('🌐 Error de conexión. Verifica tu internet.');
      } else {
        setError('❌ Error al enviar el email. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleUseDifferentEmail = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Botón de regreso */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Restablecer contraseña</Text>
            <Text style={styles.subtitle}>
              Enviaremos un enlace de recuperación a tu correo
            </Text>
          </View>

          {/* Email display */}
          <View style={styles.emailDisplayContainer}>
            <Text style={styles.emailLabel}>Correo electrónico:</Text>
            <View style={styles.emailBox}>
              <Text style={styles.emailText}>📧 {email}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.changeEmailButton}
              onPress={handleUseDifferentEmail}
              disabled={loading}
            >
              <Text style={styles.changeEmailText}>✏️ Usar otro correo</Text>
            </TouchableOpacity>
          </View>

          {/* Instrucciones */}
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>📋 Instrucciones:</Text>
            <Text style={styles.instructionsText}>
              1. Haz clic en "Enviar enlace"{'\n'}
              2. Revisa tu correo electrónico{'\n'}
              3. Busca en la carpeta de spam{'\n'}
              4. Haz clic en el enlace recibido{'\n'}
              5. Crea una nueva contraseña
            </Text>
          </View>

          {/* Estado */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : emailSent ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ Email enviado correctamente</Text>
              <Text style={styles.successSubtext}>
                Si no lo recibes en 5 minutos, revisa la carpeta de spam.
              </Text>
            </View>
          ) : null}

          {/* Botón principal */}
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              loading && styles.sendButtonDisabled,
              (emailSent && countdown > 0) && styles.sendButtonInactive
            ]} 
            onPress={handleSendResetEmail}
            disabled={loading || (emailSent && countdown > 0)}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : emailSent && countdown > 0 ? (
              <Text style={styles.sendButtonText}>
                Reenviar en {countdown}s
              </Text>
            ) : emailSent ? (
              <Text style={styles.sendButtonText}>🔄 Reenviar enlace</Text>
            ) : (
              <Text style={styles.sendButtonText}>📨 Enviar enlace de recuperación</Text>
            )}
          </TouchableOpacity>

          {/* Info adicional */}
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalInfoTitle}>ℹ️ Información importante</Text>
            <Text style={styles.additionalInfoText}>
              • El enlace expira en 1 hora{'\n'}
              • Solo funciona para este correo{'\n'}
              • Si no recibes el email, contacta soporte
            </Text>
          </View>

          {/* Opciones */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.optionButtonText}>↩️ Volver al inicio de sesión</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionButton, styles.supportButton]}
              onPress={() => {
                Alert.alert(
                  'Contactar soporte',
                  '¿Necesitas ayuda adicional con la recuperación de tu cuenta?',
                  [
                    {
                      text: 'Enviar email a soporte',
                      onPress: () => {
                        Linking.openURL('mailto:soporte@packtrip.com')
                          .catch(err => console.log('Error:', err));
                      }
                    },
                    { text: 'Cancelar', style: 'cancel' }
                  ]
                );
              }}
              disabled={loading}
            >
              <Text style={styles.optionButtonText}>🆘 Contactar soporte</Text>
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
    marginBottom: 35,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#BB86FC',
    opacity: 0.8,
    lineHeight: 22,
  },
  emailDisplayContainer: {
    marginBottom: 30,
  },
  emailLabel: {
    color: '#BB86FC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  emailBox: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#BB86FC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 15,
  },
  emailText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  changeEmailButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  changeEmailText: {
    color: '#BB86FC',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  instructionsBox: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    padding: 18,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#BB86FC',
    marginBottom: 25,
  },
  instructionsTitle: {
    color: '#BB86FC',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructionsText: {
    color: '#BB86FC',
    fontSize: 14,
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  successBox: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
    marginBottom: 20,
  },
  successText: {
    color: '#2ecc71',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  successSubtext: {
    color: '#2ecc71',
    fontSize: 13,
    opacity: 0.9,
  },
  sendButton: {
    backgroundColor: '#BB86FC',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#BB86FC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 25,
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
    shadowColor: 'transparent',
  },
  sendButtonInactive: {
    backgroundColor: '#444',
    shadowColor: 'transparent',
  },
  sendButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  additionalInfo: {
    backgroundColor: 'rgba(30, 30, 30, 0.6)',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 25,
  },
  additionalInfoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  additionalInfoText: {
    color: '#BB86FC',
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.9,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.3)',
  },
  supportButton: {
    backgroundColor: 'rgba(41, 128, 185, 0.1)',
    borderColor: 'rgba(41, 128, 185, 0.3)',
  },
  optionButtonText: {
    color: '#BB86FC',
    fontSize: 16,
    fontWeight: '500',
  },
});