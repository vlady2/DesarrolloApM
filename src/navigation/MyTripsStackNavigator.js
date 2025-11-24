import { MaterialIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import EditTripScreen from '../screens/EditTripScreen';
import MyTripsScreen from '../screens/MyTripsScreen';
import TripDetailScreen from '../screens/TripDetailScreen';

const Stack = createNativeStackNavigator();

const OpenDrawerButton = ({ navigation }) => {
    return (
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <MaterialIcons name="menu" size={25} color="blue" />
        </TouchableOpacity>
    );
};

export default function MyTripsStackNavigator() {
    return (
        <Stack.Navigator>
            
            <Stack.Screen
                name="MyTripsMain"
                component={MyTripsScreen}
                options={({ navigation }) => ({
                    title: "Mis Viajes",
                    headerLeft: () => <OpenDrawerButton navigation={navigation} />
                })}
            />

            <Stack.Screen
                name="TripDetail"
                component={TripDetailScreen}
                options={({ navigation }) => ({
                    title: "Detalle del Viaje",
                    headerLeft: () => <OpenDrawerButton navigation={navigation} />
                })}
            />

            <Stack.Screen
                name="EditTrip"
                component={EditTripScreen}
                options={({ navigation }) => ({
                    title: "Editar Viaje",
                    headerLeft: () => <OpenDrawerButton navigation={navigation} />
                })}
            />

        </Stack.Navigator>
    );
}
