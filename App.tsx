import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';

import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SaasApp } from '@/components/SaasApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <SaasApp />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
