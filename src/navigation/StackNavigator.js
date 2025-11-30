import { MaterialIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';

// import local screens


// Import nuevas pantallas de viajes
import EditTripScreen from '../screens/EditTripScreen';
import HomeScreen from '../screens/HomeScreen';
import ItemsInBoxScreen from '../screens/Maletascreen';
import NewMaletaScreen from '../screens/NewMaletaScreen';
import NewMoveScreen from '../screens/NewMoveScreen';
import NewTripScreen from '../screens/NewTripScreen';
import TripDetailScreen from '../screens/TripDetailScreen';


const Stack = createNativeStackNavigator();

const openDrawer = ({ navigation }) => (
    <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <MaterialIcons name='menu' size={25} color={"blue"} />
    </TouchableOpacity>
);

export default function StackNavigator() {
    return (
        <Stack.Navigator>
             {/* Viajes */}
            <Stack.Screen
                name="NewTrip"
                component={NewTripScreen}
                options={({ navigation }) => ({
                    title: 'Nuevo Viaje',
                    headerLeft: () => openDrawer({ navigation })
                })}
            />

            <Stack.Screen
                name="NewMoveScreen"
                component={NewMoveScreen}
                options={({ navigation }) => ({
                    title: 'Nueva Mudanza',
                    headerLeft: () => openDrawer({ navigation })
                })}
            />

            <Stack.Screen
                name="ItemsInBox"
                component={ItemsInBoxScreen}
                options={({ navigation }) => ({
                    title: 'Mis Maletas / Cajas',
                    headerLeft: () => openDrawer({ navigation })
                })}
            />


            <Stack.Screen
                name="TripDetail"
                component={TripDetailScreen}
                options={({ navigation }) => ({
                    title: 'Detalle del Viaje',
                    headerLeft: () => openDrawer({ navigation })
                })}
            />

            <Stack.Screen
                name="EditTrip"
                component={EditTripScreen}
                options={({ navigation }) => ({
                    title: 'Editar Viaje',
                    headerLeft: () => openDrawer({ navigation })
                })}
            />


           <Stack.Screen name="NewMaleta" component={NewMaletaScreen} />
           <Stack.Screen name="Home" component={HomeScreen} />
           
            
           

        </Stack.Navigator>
    );
}
