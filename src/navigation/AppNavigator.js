import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import BookMandalScreen from '../screens/BookMandalScreen';
import MandalSearchScreen from '../screens/MandalSearchScreen';
import MandalDetailsScreen from '../screens/MandalDetailsScreen';
import AddPaymentScreen from '../screens/AddPaymentScreen';
import RegisterMandalScreen from '../screens/RegisterMandalScreen';
import AddManagerScreen from '../screens/AddManagerScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import PaymentLogsScreen from '../screens/PaymentLogsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="AddManager" component={AddManagerScreen} />
            <Stack.Screen name="RegisterMandal" component={RegisterMandalScreen} />
            <Stack.Screen name="BookMandal" component={BookMandalScreen} />
            <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
            <Stack.Screen name="SearchMandal" component={MandalSearchScreen} />
            <Stack.Screen name="MandalDetails" component={MandalDetailsScreen} />
            <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
            <Stack.Screen name="PaymentLogs" component={PaymentLogsScreen} />
        </Stack.Navigator>
    );
}
