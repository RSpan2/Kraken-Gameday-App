import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Game } from './types/Game';
import { getKrakenSchedule } from './services/nhlApi';
import GameList from './components/GameList';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const data = await getKrakenSchedule();
        setGames(data);
      } catch (err) {
        setError('Could not load Kraken schedule');
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🏒 Kraken GameDay</Text>
      <GameList games={games} loading={loading} error={error} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001628',
    paddingTop: 60,
  },
  header: {
    color: '#99D9D9',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
});