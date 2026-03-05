import { useMemo } from 'react';
import { FlatList, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Game } from '../types/Game';
import GameCard from './GameCard';

type Tab = 'upcoming' | 'previous';

export interface GameListProps {
  games: Game[];
  loading: boolean;
  error: string | null;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function GameList({ games, loading, error, tab, onTabChange }: GameListProps) {
  const nextGameId = useMemo(
    () => games.find((g) => g.status === 'upcoming')?.id ?? null,
    [games],
  );

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

  const filtered = games.filter((g) =>
    tab === 'upcoming' ? g.status !== 'final' : g.status === 'final',
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'upcoming' && styles.activeTab]}
          onPress={() => onTabChange('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'previous' && styles.activeTab]}
          onPress={() => onTabChange('previous')}
        >
          <Text style={[styles.tabText, tab === 'previous' && styles.activeTabText]}>Previous</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GameCard
            game={item}
            isNextGame={tab === 'upcoming' && item.id === nextGameId}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: '#99D9D9',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#002D55',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#99D9D9',
  },
  tabText: {
    color: '#99D9D9',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#001628',
  },
  list: {
    padding: 16,
  },
});
