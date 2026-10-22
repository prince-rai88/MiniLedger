import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getToken } from '../src/utils/storage';
import { Colors } from '../src/utils/theme';
import { Redirect } from 'expo-router';
import LoginScreen from './login';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        setHasToken(!!token);
      } catch {
        setHasToken(false);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (hasToken) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <LoginScreen />;
}
