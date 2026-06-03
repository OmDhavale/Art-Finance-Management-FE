import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { Colors } from './src/theme';
import { ToastProvider } from './src/utils/ToastProvider';

function RootNavigator() {
  const { token, loading } = useAuth();
  const [hasSeenIntro, setHasSeenIntro] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then(val => {
      setHasSeenIntro(val === 'true');
    }).catch(() => {
      setHasSeenIntro(true); // Fallback if storage fails
    });
  }, []);

  if (loading || hasSeenIntro === null) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!hasSeenIntro) {
    return (
      <OnboardingScreen
        onFinish={() => {
          AsyncStorage.setItem('hasSeenOnboarding', 'true');
          setHasSeenIntro(true);
        }}
      />
    );
  }

  return token ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
});
