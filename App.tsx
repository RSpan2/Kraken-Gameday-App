import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Game } from './types/Game';
import { getTeamSchedule } from './services/nhlApi';
import GameList from './components/GameList';
import TeamSelector from './components/TeamSelector';
import { NHL_TEAMS } from './data/nhlTeams';

type Tab = 'upcoming' | 'previous';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [selectedTeam, setSelectedTeam] = useState<string | null>('SEA');
  const [selectorVisible, setSelectorVisible] = useState(false);

  const selectedTeamName = selectedTeam
    ? (NHL_TEAMS.find((t) => t.abbrev === selectedTeam)?.name ?? selectedTeam)
    : 'All Teams';

  useEffect(() => {
    if (selectedTeam === null) {
      setGames([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    async function loadSchedule() {
      try {
        const data = await getTeamSchedule(selectedTeam as string);
        setGames(data);
      } catch (err) {
        setError('Could not load schedule');
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [selectedTeam]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.headerRow} onPress={() => setSelectorVisible(true)}>
        <Text style={styles.header}>🏒 {selectedTeamName}</Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      <GameList
        games={games}
        loading={loading}
        error={error}
        tab={tab}
        onTabChange={setTab}
      />
      <TeamSelector
        visible={selectorVisible}
        selectedTeam={selectedTeam}
        onSelect={setSelectedTeam}
        onClose={() => setSelectorVisible(false)}
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    color: '#99D9D9',
    fontSize: 28,
    fontWeight: 'bold',
  },
  chevron: {
    color: '#99D9D9',
    fontSize: 14,
    marginLeft: 8,
    marginTop: 4,
  },
});
