import { StyleSheet, Text, View } from 'react-native';

export default function ItemsInBoxScreen({ navigation }) {
    return (
        <View style={styles.content}>
            <Text style={styles.title}>Pantalla de cosas en la caja</Text>
            <Text style={styles.txtCloseSesion}>Cerrar Sesión</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
    },
    title: {
        fontSize: 25,
        color: '#FFFFFF',
    },
    txtCloseSesion: {
        fontSize: 25,
        color: '#BB86FC',
    }
});