import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import BookMandalScreen from '../screens/BookMandalScreen';
import MandalSearchScreen from '../screens/MandalSearchScreen';
import MandalDetailsScreen from '../screens/MandalDetailsScreen';
import AddPaymentScreen from '../screens/AddPaymentScreen';
import RegisterMandalScreen from '../screens/RegisterMandalScreen';
import AddManagerScreen from '../screens/AddManagerScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import PaymentLogsScreen from '../screens/PaymentLogsScreen';
import BottomTab from '../components/BottomTab';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
    return (
        <Tab.Navigator
            tabBar={props => <BottomTab {...props} />}
            screenOptions={{ headerShown: false }}
        >
            {/* Primary Navigation Tabs */}
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="SearchMandal" component={MandalSearchScreen} />
            <Tab.Screen name="BookMandal" component={BookMandalScreen} />
            <Tab.Screen name="MyBookings" component={MyBookingsScreen} />

            {/* Secondary Screens (Will be persistent but not in the main tab icons) */}
            <Tab.Screen name="MandalDetails" component={MandalDetailsScreen} />
            <Tab.Screen name="AddPayment" component={AddPaymentScreen} />
            <Tab.Screen name="PaymentLogs" component={PaymentLogsScreen} />
            <Tab.Screen name="RegisterMandal" component={RegisterMandalScreen} />
            <Tab.Screen name="AddManager" component={AddManagerScreen} />
        </Tab.Navigator>
    );
}
