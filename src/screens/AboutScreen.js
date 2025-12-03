import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AboutScreen = ({ navigation }) => {
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
            <Text style={styles.title}>Acerca de</Text>
          </View>
      

      <Text style={styles.description}>
        Organiza tus viajes fácilmente. Registra tus maletas, agrega artículos 
        y encontrá cualquier objeto al instante. Además, nuestra IA te muestra 
        qué cosas no podés llevar y te brinda información útil sobre tus destinos. 
        Viajar nunca fue tan simple.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffffff',
    marginBottom: 16,
    textAlign: 'center'
  },
  description: {
    fontSize: 16,
    color: '#ffffffff',
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    justifyContent: 'center'
  }
});

export default AboutScreen;