import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const helpSoportScreen = ({ navigation }) => {
    const handleEmail = () => {
        Linking.openURL('mailto:soporte@miapp.com?subject=Soporte%20y%20Ayuda');
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
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
            <Text style={styles.title}>Soporte y Ayuda</Text>

            <Text style={styles.description}>
                ¿Necesitás ayuda con la aplicación? Estamos aquí para asistirte.
                Consultá las preguntas frecuentes o contactanos directamente.
            </Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Preguntas frecuentes</Text>
                <Text style={styles.cardText}>
                    • ¿Cómo registro una maleta?{'\n'}
                    • ¿Cómo busco un artículo específico?{'\n'}
                    • ¿Qué objetos no puedo llevar?{'\n'}
                    • ¿Cómo funciona la IA en mis viajes?
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>¿Aún necesitás ayuda?</Text>
                <Text style={styles.cardText}>
                    Envíanos un mensaje y con gusto te responderemos lo antes posible.
                </Text>

                <TouchableOpacity style={styles.button} onPress={handleEmail}>
                    <Text style={styles.buttonText}>Contactar soporte</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: '#000000ff'
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffffff',
        marginBottom: 12,
        textAlign: 'center'
    },
    description: {
        fontSize: 16,
        color: '#9ea0a3ff',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22
    },
    card: {
        backgroundColor: '#525151ff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#7c7878ff',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8
    },
    cardText: {
        fontSize: 15,
        color: '#dfdfdfff',
        lineHeight: 22
    },
    button: {
        marginTop: 16,
        backgroundColor: '#2563EB',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center'
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600'
    }
});

export default helpSoportScreen;