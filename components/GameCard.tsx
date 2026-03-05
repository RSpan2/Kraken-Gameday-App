import { View, Text, StyleSheet } from 'react-native';
import { Game } from '../types/Game';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.opponent}>vs {game.opponent}</Text>
      <Text style={styles.detail}>{game.date}</Text>
      <Text style={styles.detail}>{game.homeAway === 'home' ? '🏠 Home' : '✈️ Away'}</Text>
      <Text style={styles.detail}>📍 {game.venue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#002D55',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#99D9D9',
  },
  opponent: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  detail: {
    color: '#99D9D9',
    fontSize: 14,
    marginBottom: 3,
  },
});