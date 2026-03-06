import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import BookMandalScreen from '../screens/BookMandalScreen';
import MandalSearchScreen from '../screens/MandalSearchScreen';
import MandalDetailsScreen from '../screens/MandalDetailsScreen';
import AddPaymentScreen from '../screens/AddPaymentScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#FF6B35' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: '🙏 Ganesh Mandal' }} />
            <Stack.Screen name="BookMandal" component={BookMandalScreen} options={{ title: 'Book Mandal' }} />
            <Stack.Screen name="SearchMandal" component={MandalSearchScreen} options={{ title: 'Search Mandal' }} />
            <Stack.Screen name="MandalDetails" component={MandalDetailsScreen} options={{ title: 'Mandal Details' }} />
            <Stack.Screen name="AddPayment" component={AddPaymentScreen} options={{ title: 'Add Payment' }} />
        </Stack.Navigator>
    );
}
