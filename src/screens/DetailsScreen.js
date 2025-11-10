//import { signOut } from "firebase/auth";
import { Button, StyleSheet, Text, View } from "react-native";
//import { auth } from "../../firebase/auth";


export default function DetailsScreen({navigation}) {

    /*const handleLogout = async () => {
        try {
            if(auth.currentUser){
                await signOut(auth);
            alert("Sesión cerrada");
            navigation.navigate("MainApp")
            } else {
                alert("No hay usuario activo para cerrar sesión")
            }
            
        } catch (error) {
            console.error("error al cerrar sesión: ", error);
        }
    };*/


    return (
        <View style={styles.content}>
            <Text style={styles.title}>Pantalla de detalle de vije</Text>
            <Text style={styles.txtCloseSesion}>Cerrar Sesión</Text>
            
        </View>
    );
}
//<Button title="Cerrar" onPress={handleLogout}/>
const styles = StyleSheet.create({
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    title:{
        fontSize: 25,
    },
    txtCloseSesion:{
        fontSize: 25,
    }
})