import { registerRootComponent } from 'expo';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

function Root() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTheme() {
      try {
        const theme = await AsyncStorage.getItem('app_theme');
        global.__SELECTED_THEME__ = theme || 'light_orange';
      } catch (e) {
        global.__SELECTED_THEME__ = 'light_orange';
      } finally {
        setLoading(false);
      }
    }
    loadTheme();
  }, []);

  if (loading) {
    const bgColor = '#F1F5F9';
    const primaryColor = '#F97316';
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bgColor }}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  // Require the main App after the theme global is populated
  const App = require('./App').default;
  return <App />;
}

registerRootComponent(Root);
