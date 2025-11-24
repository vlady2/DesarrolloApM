import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';

// import local screens
import GenresScreen from '../screens/GenerosScreen';
import StackNavigator from './StackNavigator';

// Import nuevas pantallas de viajes
import TravelHomeScreen from '../screens/HomeScreen';
import NewMoveScreen from '../screens/NewMoveScreen';
import NewTripScreen from '../screens/NewTripScreen';

// Ambas importaciones del merge
import MyTripsStackNavigator from './MyTripsStackNavigator'; // ← esta es la que realmente usas

const Tab = createBottomTabNavigator();

const openDrawer = ({ navigation }) => {
    return (
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <MaterialIcons name='menu' size={25} color={"blue"} />
        </TouchableOpacity>
    )
}

export default function TabNavigator({ navigation }) {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: 'blue',
                tabBarInactiveTintColor: 'gray',
            }}
        >

            <Tab.Screen 
                name="MusicHome"
                component={StackNavigator}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (<MaterialIcons name='home' size={25} color={color} />),
                    title: 'Música'
                }}
            />

            <Tab.Screen
                name="TravelHome"
                component={TravelHomeScreen}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (<Ionicons name='airplane' size={25} color={color} />),
                    title: 'Viajes'
                }}
            />

            <Tab.Screen
                name="MyTrips"
                component={MyTripsStackNavigator} // ← FINAL DECISIÓN
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (<Ionicons name='list' size={25} color={color} />),
                    title: 'Mis Viajes'
                }}
            />

            <Tab.Screen
                name="NewTrip"
                component={NewTripScreen}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (<Ionicons name='add-circle' size={25} color={color} />),
                    title: 'Nuevo Viaje'
                }}
            />

            <Tab.Screen
                name="NewMove"
                component={NewMoveScreen}
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }) => (<Ionicons name='business' size={25} color={color} />),
                    title: 'Mudanza'
                }}
            />

            <Tab.Screen
                name="Genres"
                component={GenresScreen}
                options={{
                    headerLeft: (() => (openDrawer({ navigation }))),
                    tabBarIcon: ({ color }) => (<MaterialIcons name='music-note' size={25} color={color} />)
                }}
            />

        </Tab.Navigator>
    );
}
