import { signOut } from 'firebase/auth';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../../firebase/auth';

const SettingScreen = ({ navigation }) => {
    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.error('Error al cerrar sesión:', error);
                            Alert.alert('Error', 'No se pudo cerrar sesión');
                        }
                    }
                }
            ]
        );
    };

    const menuItems = [
        {
            title: 'Perfil',
            icon: '👤',
            onPress: () => console.log('Perfil presionado')
        },
        {
            title: 'Notificaciones',
            icon: '🔔',
            onPress: () => console.log('Notificaciones presionado')
        },
        {
            title: 'Privacidad',
            icon: '🔒',
            onPress: () => console.log('Privacidad presionado')
        },
        {
            title: 'Ayuda y Soporte',
            icon: '❓',
            onPress: () => console.log('Ayuda presionado')
        },
        {
            title: 'Acerca de',
            icon: 'ℹ️',
            onPress: () => console.log('Acerca de presionado')
        }
    ];

    return (
        <View style={styles.container}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10
            }}>

                {/* Flecha a la izquierda */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ position: 'absolute', left: 0, paddingLeft: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Título centrado */}
                <Text style={styles.title}>Configuración</Text>

            </View>

            
            {/* Lista de opciones */}
            <View style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={item.onPress}
                    >
                        <View style={styles.menuItemLeft}>
                            <Text style={styles.menuItemIcon}>{item.icon}</Text>
                            <Text style={styles.menuItemText}>{item.title}</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Botón de cerrar sesión */}
            <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={handleLogout}
            >
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            {/* Información de la versión */}
            <View style={styles.versionContainer}>
                <Text style={styles.versionText}>Versión 1.0.0</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 30,
        textAlign: 'center',
    },
    menuContainer: {
        backgroundColor: '#1E1E1E',
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 30,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuItemIcon: {
        fontSize: 24,
        marginRight: 15,
        width: 30,
        textAlign: 'center',
    },
    menuItemText: {
        color: '#FFFFFF',
        fontSize: 16,
        flex: 1,
    },
    chevron: {
        color: '#666',
        fontSize: 24,
        fontWeight: 'bold',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2A1E1E',
        padding: 18,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F44336',
        marginBottom: 20,
    },
    logoutIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    logoutButtonText: {
        color: '#F44336',
        fontSize: 16,
        fontWeight: 'bold',
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: 'auto',
        paddingVertical: 20,
    },
    versionText: {
        color: '#666',
        fontSize: 14,
    },
});

export default SettingScreen;