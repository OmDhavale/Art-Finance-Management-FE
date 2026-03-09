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
import WorkshopDetailsScreen from '../screens/WorkshopDetailsScreen';
import AnimatedWrapper from '../components/AnimatedWrapper';
import BottomTab from '../components/BottomTab';

const Tab = createBottomTabNavigator();

// HOC to wrap screens with AnimatedWrapper and pass index
const withAnimation = (Component, index) => (props) => (
    <AnimatedWrapper index={index}>
        <Component {...props} />
    </AnimatedWrapper>
);

export default function AppNavigator() {
    return (
        <Tab.Navigator
            tabBar={props => <BottomTab {...props} />}
            screenOptions={{ headerShown: false }}
        >
            {/* Primary Navigation Tabs */}
            <Tab.Screen name="Dashboard" component={withAnimation(DashboardScreen, 0)} />
            <Tab.Screen name="SearchMandal" component={withAnimation(MandalSearchScreen, 1)} />
            <Tab.Screen name="BookMandal" component={withAnimation(BookMandalScreen, 2)} />
            <Tab.Screen name="MyBookings" component={withAnimation(MyBookingsScreen, 3)} />
            <Tab.Screen name="WorkshopDetails" component={withAnimation(WorkshopDetailsScreen, 4)} />

            {/* Secondary Screens */}
            <Tab.Screen name="MandalDetails" component={withAnimation(MandalDetailsScreen, 5)} />
            <Tab.Screen name="AddPayment" component={withAnimation(AddPaymentScreen, 6)} />
            <Tab.Screen name="PaymentLogs" component={withAnimation(PaymentLogsScreen, 7)} />
            <Tab.Screen name="RegisterMandal" component={withAnimation(RegisterMandalScreen, 8)} />
            <Tab.Screen name="AddManager" component={withAnimation(AddManagerScreen, 9)} />
        </Tab.Navigator>
    );
}
