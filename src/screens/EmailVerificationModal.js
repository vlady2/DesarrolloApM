// EmailVerificationModal.js
import { getAuth, reload, sendEmailVerification } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const EmailVerificationModal = ({ visible, onClose, user }) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Temporizador para reenvío
  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleResendVerification = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      await sendEmailVerification(user);
      setTimeLeft(60); // 60 segundos de espera
      setCanResend(false);
      Alert.alert(
        '✅ Email enviado',
        'Se ha reenviado el email de verificación.\n\n' +
        'Revisa tu bandeja de entrada y carpeta de spam.'
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo reenviar el email');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      // Recargar datos del usuario
      await reload(user);
      const updatedUser = getAuth().currentUser;
      
      if (updatedUser.emailVerified) {
        Alert.alert(
          '✅ Email verificado',
          '¡Tu email ha sido verificado exitosamente!',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert(
          '❌ Aún no verificado',
          'El email aún no ha sido verificado.\n\n' +
          'Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar el estado');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={60} color="#3B82F6" />
              {user?.emailVerified ? (
                <View style={[styles.verificationBadge, styles.verified]}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              ) : (
                <View style={[styles.verificationBadge, styles.notVerified]}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                </View>
              )}
            </View>

            <Text style={styles.title}>
              {user?.emailVerified ? 'Email Verificado' : 'Verifica tu Email'}
            </Text>

            <Text style={styles.emailText}>{user?.email}</Text>

            {!user?.emailVerified ? (
              <>
                <View style={styles.instructions}>
                  <Text style={styles.instructionsTitle}>Pasos a seguir:</Text>
                  <Text style={styles.instruction}>
                    1. Revisa tu bandeja de entrada en: {user?.email}
                  </Text>
                  <Text style={styles.instruction}>
                    2. Busca el email de "Verificación de cuenta"
                  </Text>
                  <Text style={styles.instruction}>
                    3. Haz clic en el enlace de verificación
                  </Text>
                  <Text style={styles.instruction}>
                    4. Vuelve aquí y presiona "Ya verifiqué"
                  </Text>
                </View>

                <View style={styles.tipContainer}>
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <Text style={styles.tipText}>
                    Si no ves el email, revisa tu carpeta de spam o solicita un nuevo envío.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleCheckVerification}
                  disabled={checking}
                >
                  {checking ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Ya verifiqué mi email</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton, !canResend && styles.disabledButton]}
                  onPress={handleResendVerification}
                  disabled={loading || !canResend}
                >
                  {loading ? (
                    <ActivityIndicator color="#3B82F6" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={20} color="#3B82F6" />
                      <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                        {canResend ? 'Reenviar email de verificación' : `Espera ${timeLeft}s`}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-done-circle" size={40} color="#10B981" />
                  <Text style={styles.successText}>
                    ¡Excelente! Tu email está verificado.{'\n'}
                    Ahora puedes acceder a todas las funciones.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.successButton]}
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>Continuar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  verified: {
    backgroundColor: '#10B981',
  },
  notVerified: {
    backgroundColor: '#EF4444',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  instructions: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  tipText: {
    fontSize: 13,
    color: '#3B82F6',
    marginLeft: 8,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#3B82F6',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
});

export default EmailVerificationModal;