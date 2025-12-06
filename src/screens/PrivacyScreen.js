import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  EmailAuthProvider,
  deleteUser,
  getAuth,
  reauthenticateWithCredential,
  sendEmailVerification,
  signOut,
  updateEmail,
  updatePassword,
} from 'firebase/auth';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../../firebase/auth';
import { app } from '../../firebase/config';

const PrivacyScreen = ({ navigation }) => {
  const auth = getAuth(app);
  const [user, setUser] = useState(auth.currentUser);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState('');

  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados para cambio de email
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [passwordForEmailChange, setPasswordForEmailChange] = useState('');

  // Verificar estado del usuario
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const privacySections = [
    {
      id: 'security',
      title: 'Seguridad',
      icon: 'lock-closed',
      color: '#3B82F6',
      items: [
        {
          title: 'Cambiar Contraseña',
          icon: 'key',
          description: 'Actualiza tu contraseña de acceso',
          action: () => openModal('password')
        },
      ]
    }
  ];

  const openModal = (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveModal(type);
    setModalVisible(true);
  };

  const reauthenticateUser = async (password) => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('Usuario no autenticado');
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    return user;
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const user = await reauthenticateUser(currentPassword);
      await updatePassword(user, newPassword);

      Alert.alert(
        'Éxito',
        'Contraseña cambiada correctamente. Debes iniciar sesión nuevamente.',
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                await signOut(auth);
                navigation.replace('Login');
              } catch (logoutError) {
                console.error('Error cerrando sesión:', logoutError);
                navigation.replace('Login');
              }
            }
          }
        ]
      );

      setModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Error cambiando contraseña:', error);

      let errorMessage = 'No se pudo cambiar la contraseña';
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'La contraseña actual es incorrecta';
          break;
        case 'auth/weak-password':
          errorMessage = 'La nueva contraseña es muy débil';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Debes iniciar sesión nuevamente para realizar esta acción';
          break;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !confirmEmail || !passwordForEmailChange) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newEmail !== confirmEmail) {
      Alert.alert('Error', 'Los correos no coinciden');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Error', 'Ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    try {
      const user = await reauthenticateUser(passwordForEmailChange);
      
      if (!user.emailVerified) {
        Alert.alert(
          'Email no verificado',
          'Tu email actual no está verificado. ¿Deseas continuar de todos modos?',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => setLoading(false) },
            { 
              text: 'Continuar', 
              onPress: async () => {
                await performEmailUpdate(user, newEmail);
              }
            }
          ]
        );
        return;
      }
      
      await performEmailUpdate(user, newEmail);
      
    } catch (error) {
      console.error('Error cambiando email:', error);
      handleEmailError(error);
    } finally {
      setLoading(false);
    }
  };

  const performEmailUpdate = async (user, newEmail) => {
    try {
      try {
        await updateEmail(user, newEmail);
        console.log('✅ Email actualizado en Authentication');
      } catch (authError) {
        console.log('Error en updateEmail, intentando alternativa:', authError);
        
        Alert.alert(
          'Advertencia',
          'No se pudo cambiar el email automáticamente. ' +
          'Para completar el cambio, contacta con soporte o usa la opción de restablecer contraseña con el nuevo email.',
          [
            {
              text: 'OK',
              onPress: () => {
                setModalVisible(false);
                setNewEmail('');
                setConfirmEmail('');
                setPasswordForEmailChange('');
              }
            }
          ]
        );
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          email: newEmail,
          updatedAt: new Date().toISOString(),
          emailVerified: false,
        });
        console.log('✅ Email actualizado en Firestore');
      } catch (firestoreError) {
        console.error('Error actualizando email en Firestore:', firestoreError);
      }
      
      await sendEmailVerification(user);
      
      Alert.alert(
        '✅ Cambio solicitado',
        'Hemos procesado tu solicitud de cambio de email.\n\n' +
        'Se ha enviado un email de verificación a tu nueva dirección.\n\n' +
        'Debes verificar el nuevo correo para completar el proceso.',
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                await signOut(auth);
                
                setModalVisible(false);
                setNewEmail('');
                setConfirmEmail('');
                setPasswordForEmailChange('');
                
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } catch (logoutError) {
                console.error('Error cerrando sesión:', logoutError);
                navigation.replace('Login');
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error en performEmailUpdate:', error);
      throw error;
    }
  };

  const handleEmailError = (error) => {
    let errorMessage = 'No se pudo cambiar el correo electrónico';
    
    switch (error.code) {
      case 'auth/wrong-password':
        errorMessage = 'La contraseña es incorrecta';
        break;
      case 'auth/email-already-in-use':
        errorMessage = 'Este correo ya está en uso por otra cuenta';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El correo electrónico no es válido';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'Debes iniciar sesión nuevamente para realizar esta acción';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'No se puede cambiar el email automáticamente. Contacta con soporte.';
        break;
    }
    
    Alert.alert('Error', errorMessage);
  };

  const handleDeleteAccount = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Eliminar Cuenta',
      'Esta acción eliminará permanentemente todos tus datos. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Continuar', 
          style: 'destructive',
          onPress: () => {
            setActiveModal('delete');
            setModalVisible(true);
          }
        }
      ]
    );
  };

  const PrivacyItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.privacyItem, !user?.emailVerified && item.title.includes('Correo') && styles.disabledItem]}
      onPress={item.action}
      activeOpacity={user?.emailVerified || !item.title.includes('Correo') ? 0.7 : 1}
      disabled={loading || (!user?.emailVerified && item.title.includes('Correo'))}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.itemIcon, { backgroundColor: '#3B82F6' + '20' }]}>
          <Ionicons 
            name={item.icon} 
            size={20} 
            color={user?.emailVerified || !item.title.includes('Correo') ? "#3B82F6" : "#64748B"} 
          />
        </View>
        <View style={styles.itemText}>
          <Text style={[
            styles.itemTitle, 
            !user?.emailVerified && item.title.includes('Correo') && styles.disabledText
          ]}>
            {item.title}
            {!user?.emailVerified && item.title.includes('Correo') && (
              <Text style={styles.verificationBadge}> (No verificado)</Text>
            )}
          </Text>
          <Text style={[
            styles.itemDescription,
            !user?.emailVerified && item.title.includes('Correo') && styles.disabledText
          ]}>
            {item.description}
          </Text>
        </View>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={user?.emailVerified || !item.title.includes('Correo') ? "#94A3B8" : "#64748B"} 
      />
    </TouchableOpacity>
  );

  const renderModalContent = () => {
    if (activeModal === 'password') {
      return (
        <>
          <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña Actual</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Ingresa tu contraseña actual"
              placeholderTextColor="#64748B"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nueva Contraseña</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#64748B"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la nueva contraseña"
              placeholderTextColor="#64748B"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleChangePassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.modalButton, loading && styles.disabledButton]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.modalButtonText}>Cambiar Contraseña</Text>
            )}
          </TouchableOpacity>
        </>
      );
    }

    if (activeModal === 'email') {
      return (
        <>
          {!user?.emailVerified && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                Tu email actual no está verificado. Debes verificarlo antes de poder cambiarlo.
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña Actual</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={passwordForEmailChange}
              onChangeText={setPasswordForEmailChange}
              placeholder="Para confirmar tu identidad"
              placeholderTextColor="#64748B"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nuevo Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="nuevo@correo.com"
              placeholderTextColor="#64748B"
              editable={!loading}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={confirmEmail}
              onChangeText={setConfirmEmail}
              placeholder="nuevo@correo.com"
              placeholderTextColor="#64748B"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={user?.emailVerified ? handleChangeEmail : null}
            />
          </View>

          <Text style={styles.modalNote}>
            {user?.emailVerified ? (
              <>
                • Tu sesión se cerrará automáticamente{'\n'}
                • Debes verificar el nuevo correo antes de iniciar sesión{'\n'}
                • Se enviará un email de verificación al nuevo correo
              </>
            ) : (
              <>
                • Primero debes verificar tu email actual{'\n'}
                • Revisa tu bandeja de entrada o spam{'\n'}
                • O solicita un nuevo email de verificación
              </>
            )}
          </Text>

          <TouchableOpacity
            style={[
              styles.modalButton, 
              loading && styles.disabledButton,
              !user?.emailVerified && styles.disabledButton
            ]}
            onPress={user?.emailVerified ? handleChangeEmail : () => {
              Alert.alert(
                'Email no verificado',
                'Debes verificar tu email actual primero. ¿Quieres que te reenviemos el email de verificación?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Reenviar', 
                    onPress: async () => {
                      setLoading(true);
                      try {
                        await sendEmailVerification(user);
                        Alert.alert(
                          '✅ Email enviado',
                          'Se ha reenviado el email de verificación.'
                        );
                        setModalVisible(false);
                      } catch (error) {
                        Alert.alert('Error', 'No se pudo reenviar el email');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }
                ]
              );
            }}
            disabled={loading || !user?.emailVerified}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.modalButtonText}>
                {user?.emailVerified ? 'Cambiar Correo' : 'Verificar Email Actual Primero'}
              </Text>
            )}
          </TouchableOpacity>
        </>
      );
    }

    if (activeModal === 'delete') {
      return (
        <>
          <Text style={styles.modalTitle}>Confirmar Eliminación</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña Actual</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Ingresa tu contraseña para confirmar"
              placeholderTextColor="#64748B"
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (currentPassword && !loading) {
                  // Lógica de eliminación de cuenta
                }
              }}
            />
          </View>

          <Text style={styles.modalNote}>Esta acción es irreversible. Todos tus datos serán eliminados permanentemente.</Text>

          <TouchableOpacity
            style={[styles.modalButton, styles.dangerButton, loading && styles.disabledButton]}
            onPress={async () => {
              const password = currentPassword;
              if (!password) {
                Alert.alert('Error', 'Debes ingresar tu contraseña');
                return;
              }
              
              setLoading(true);
              try {
                const user = auth.currentUser;
                if (!user || !user.email) {
                  Alert.alert('Error', 'Usuario no autenticado');
                  return;
                }

                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);
                
                const userId = user.uid;
                
                try {
                  const userDocRef = doc(db, 'users', userId);
                  await deleteDoc(userDocRef);
                  console.log('✅ Usuario eliminado permanentemente de Firestore');
                } catch (firestoreError) {
                  console.error('Error eliminando usuario de Firestore:', firestoreError);
                }
                
                await deleteUser(user);
                
                Alert.alert(
                  '✅ Cuenta Eliminada',
                  'Tu cuenta ha sido eliminada permanentemente. Todos tus datos fueron eliminados y no podrán ser recuperados.',
                  [
                    {
                      text: 'OK',
                      onPress: async () => {
                        try {
                          await signOut(auth);
                        } catch (e) {
                          console.error('Error en signOut:', e);
                        }
                        
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        });
                      }
                    }
                  ]
                );
                
                setModalVisible(false);
                setCurrentPassword('');
              } catch (error) {
                console.error('Error eliminando cuenta:', error);
                
                let errorMessage = 'No se pudo eliminar la cuenta';
                if (error.code === 'auth/wrong-password') {
                  errorMessage = 'Contraseña incorrecta';
                } else if (error.code === 'auth/requires-recent-login') {
                  errorMessage = 'Debes iniciar sesión nuevamente para realizar esta acción';
                } else if (error.code === 'auth/user-not-found') {
                  errorMessage = 'Usuario no encontrado';
                }
                
                Alert.alert('Error', errorMessage);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.modalButtonText}>ELIMINAR CUENTA PERMANENTEMENTE</Text>
            )}
          </TouchableOpacity>
        </>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.gradientBackground}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => !loading && navigation.goBack()}
            style={[styles.backButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            <Ionicons name="chevron-back" size={28} color={loading ? "#64748B" : "#FFFFFF"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacidad y Seguridad</Text>
          {loading && <ActivityIndicator size="small" color="#3B82F6" style={styles.headerLoader} />}
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>

            {/* Indicador de verificación de email */}
            {!user?.emailVerified && (
              <View style={styles.verificationAlert}>
                <Ionicons name="mail-unread-outline" size={20} color="#F59E0B" />
                <View style={styles.verificationAlertText}>
                  <Text style={styles.verificationAlertTitle}>Email no verificado</Text>
                  <Text style={styles.verificationAlertDescription}>
                    Debes verificar tu email para acceder a todas las funciones
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.verificationButton}
                  onPress={async () => {
                    setLoading(true);
                    try {
                      await sendEmailVerification(user);
                      Alert.alert(
                        '✅ Email enviado',
                        'Se ha reenviado el email de verificación. Revisa tu bandeja de entrada.'
                      );
                    } catch (error) {
                      Alert.alert('Error', 'No se pudo reenviar el email');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  <Text style={styles.verificationButtonText}>Reenviar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SECCIONES DE PRIVACIDAD */}
            {privacySections.map((section) => (
              <View key={section.id} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name={section.icon} size={20} color={section.color} />
                  </View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>

                <View style={styles.sectionContent}>
                  {section.items.map((item, index) => (
                    <PrivacyItem key={index} item={item} />
                  ))}
                </View>
              </View>
            ))}

            {/* ELIMINAR CUENTA */}
            <TouchableOpacity
              style={[styles.deleteButton, loading && styles.disabledButton]}
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Eliminar Cuenta Permanentemente</Text>
            </TouchableOpacity>

            {/* INFORMACIÓN */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Para cambios importantes (contraseña) necesitarás tu contraseña actual para confirmar tu identidad.
              </Text>
              <Text style={styles.infoSmall}>
                Usuario actual: {user?.email || 'No autenticado'}
                {user?.emailVerified ? ' ✓ Verificado' : ' ✗ No verificado'}
              </Text>
            </View>

          </View>
        </ScrollView>

        {/* MODAL PARA CAMBIOS - USANDO LA MISMA LÓGICA QUE LOGINSCREEN */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => !loading && setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalKeyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} // CAMBIADO: 'padding' para ambos
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // CAMBIADO: 0 para ambos
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                      <TouchableOpacity
                        onPress={() => {
                          if (!loading) {
                            setModalVisible(false);
                            Keyboard.dismiss();
                          }
                        }}
                        disabled={loading}
                      >
                        <Ionicons name="close" size={24} color={loading ? "#64748B" : "#FFFFFF"} />
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.modalScrollContent}
                      keyboardShouldPersistTaps="handled"
                      bounces={false}
                    >
                      {renderModalContent()}
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  headerLoader: {
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 40,
  },
  verificationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  verificationAlertText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  verificationAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 2,
  },
  verificationAlertDescription: {
    fontSize: 12,
    color: '#F59E0B',
    opacity: 0.8,
  },
  verificationButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verificationButtonText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '500',
  },
  verificationBadge: {
    color: '#F59E0B',
    fontSize: 12,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionContent: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  disabledItem: {
    opacity: 0.6,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: '#94A3B8',
  },
  disabledText: {
    color: '#64748B',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
  },
  infoContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  infoSmall: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // ESTILOS PARA EL MODAL - AJUSTADOS COMO EN LOGINSCREEN
  modalKeyboardAvoiding: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '90%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 40,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
  },
  modalNote: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 18,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrivacyScreen;