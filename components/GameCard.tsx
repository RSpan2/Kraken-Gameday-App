import { View, Text, StyleSheet } from 'react-native';
import { Game } from '../types/Game';

interface GameCardProps {
  game: Game;
  isNextGame?: boolean;
}

export default function GameCard({ game, isNextGame = false }: GameCardProps) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const hasScore = game.teamScore !== null && game.opponentScore !== null;

  return (
    <View style={[styles.card, isNextGame && styles.nextGameCard]}>
      {isNextGame && <Text style={styles.nextGameLabel}>NEXT GAME</Text>}
      {isLive && <Text style={styles.liveLabel}>LIVE</Text>}
      {isFinal && <Text style={styles.finalLabel}>FINAL</Text>}

      <Text style={styles.opponent}>vs {game.opponent}</Text>

      {hasScore ? (
        <Text style={styles.score}>{game.teamAbbrev} {game.teamScore} · {game.opponentAbbrev} {game.opponentScore}</Text>
      ) : (
        <Text style={styles.detail}>{game.date} · {game.gameTime}</Text>
      )}

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
  nextGameCard: {
    backgroundColor: '#003D7A',
    borderLeftColor: '#00B4B4',
    borderLeftWidth: 6,
  },
  nextGameLabel: {
    color: '#00B4B4',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  liveLabel: {
    color: '#FF4444',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  finalLabel: {
    color: '#99D9D9',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  opponent: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  score: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  detail: {
    color: '#99D9D9',
    fontSize: 14,
    marginBottom: 3,
  },
});
