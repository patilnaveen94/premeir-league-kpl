import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="light" backgroundColor="#37003c" />
    </AuthProvider>
  );
}
