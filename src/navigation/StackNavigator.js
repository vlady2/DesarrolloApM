import { MaterialIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';

// import local screens
import PlayListDetailScreen from '../screens/PlayListDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SongDetailScreen from '../screens/SongDetailScreen';
// Import nuevas pantallas de viajes
import ItemsInBoxScreen from '../screens/ItemsInBoxScreen';
import NewMoveScreen from '../screens/NewMoveScreen';
import NewTripScreen from '../screens/NewTripScreen';

const Stack = createNativeStackNavigator();

const openDrawer = ({navigation}) => {
    return(
        <TouchableOpacity onPress={()=> navigation.openDrawer()}>
            <MaterialIcons name='menu' size={25} color={"blue"}/>
        </TouchableOpacity>
    )
}

export default function StackNavigator({navigation}) {
    return (
        <Stack.Navigator>
            {/* Pantallas de música existentes */}
            <Stack.Screen 
                name="Perfil" 
                component={ProfileScreen} 
                options={{
                    headerLeft: (() => openDrawer({navigation}))
                }}
            />
            <Stack.Screen name="DetallePlayList" component={PlayListDetailScreen} />
            <Stack.Screen name="SongDetailScreen" component={SongDetailScreen} />

            {/* Nuevas pantallas de viajes */}
            <Stack.Screen 
                name="NewTrip" 
                component={NewTripScreen}
                options={{
                    title: 'Nuevo Viaje',
                    headerLeft: (() => openDrawer({navigation}))
                }}
            />
            <Stack.Screen 
                name="NewMoveScreen" 
                component={NewMoveScreen}
                options={{
                    title: 'Nueva Mudanza',
                    headerLeft: (() => openDrawer({navigation}))
                }}
            />
            <Stack.Screen 
                name="ItemsInBox" 
                component={ItemsInBoxScreen}
                options={{
                    title: 'Mis Maletas / Cajas',
                    headerLeft: (() => openDrawer({navigation}))
                }}
            />
        </Stack.Navigator>
    );
}