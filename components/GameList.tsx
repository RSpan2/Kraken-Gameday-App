import { useMemo } from 'react';
import { FlatList, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Game } from '../types/Game';
import GameCard from './GameCard';

type Tab = 'upcoming' | 'previous';
type ListItem = { type: 'header'; date: string } | { type: 'game'; game: Game };

export interface GameListProps {
  games: Game[];
  loading: boolean;
  error: string | null;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  groupByDate?: boolean;
}

export default function GameList({ games, loading, error, tab, onTabChange, groupByDate = false }: GameListProps) {
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

  if (groupByDate) {
    const grouped = new Map<string, Game[]>();
    for (const game of games) {
      const existing = grouped.get(game.date) ?? [];
      existing.push(game);
      grouped.set(game.date, existing);
    }

    const listData: ListItem[] = [];
    for (const [date, dayGames] of grouped) {
      listData.push({ type: 'header', date });
      for (const game of dayGames) {
        listData.push({ type: 'game', game });
      }
    }

    return (
      <View style={styles.container}>
        <FlatList
          data={listData}
          keyExtractor={(item) => item.type === 'header' ? `header-${item.date}` : item.game.id}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return <Text style={styles.dateHeader}>{item.date}</Text>;
            }
            return <GameCard game={item.game} isAllTeams />;
          }}
          contentContainerStyle={styles.list}
        />
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
  dateHeader: {
    color: '#99D9D9',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
});
