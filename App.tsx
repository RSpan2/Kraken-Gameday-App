import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🏒 Kraken GameDay</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001628',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    color: '#99D9D9',
    fontSize: 28,
    fontWeight: 'bold',
  },
});