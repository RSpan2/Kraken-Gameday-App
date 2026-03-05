import { FlatList, StyleSheet, View, Text } from 'react-native';
import { Game } from '../types/Game';
import GameCard from './GameCard';

interface GameListProps {
  games: Game[];
  loading: boolean;
  error: string | null;
}

export default function GameList({ games, loading, error }: GameListProps) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Loading schedule...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>❌ {error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={games}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <GameCard game={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: '#99D9D9',
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
});