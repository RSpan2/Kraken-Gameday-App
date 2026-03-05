import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NHL_TEAMS } from '../data/nhlTeams';

export interface TeamSelectorProps {
  visible: boolean;
  selectedTeam: string | null;
  onSelect: (teamAbbrev: string | null) => void;
  onClose: () => void;
}

export default function TeamSelector({ visible, selectedTeam, onSelect, onClose }: TeamSelectorProps) {
  const handleSelect = (abbrev: string | null) => {
    onSelect(abbrev);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Team</Text>

          <TouchableOpacity
            style={[styles.row, selectedTeam === null && styles.selectedRow]}
            onPress={() => handleSelect(null)}
          >
            <Text style={styles.abbrev} />
            <Text style={[styles.rowText, selectedTeam === null && styles.selectedText]}>
              All Teams
            </Text>
            {selectedTeam === null ? <Text style={styles.check}>✓</Text> : null}
          </TouchableOpacity>

          <View style={styles.divider} />

          <ScrollView>
            {NHL_TEAMS.map((item) => {
              const isSelected = item.abbrev === selectedTeam;
              return (
                <TouchableOpacity
                  key={item.abbrev}
                  style={[styles.row, isSelected && styles.selectedRow]}
                  onPress={() => handleSelect(item.abbrev)}
                >
                  <Text style={styles.abbrev}>{item.abbrev}</Text>
                  <Text style={[styles.rowText, isSelected && styles.selectedText]}>
                    {item.name}
                  </Text>
                  {isSelected ? <Text style={styles.check}>✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#001628',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingTop: 16,
  },
  title: {
    color: '#99D9D9',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#002D55',
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  selectedRow: {
    backgroundColor: '#002D55',
  },
  abbrev: {
    color: '#99D9D9',
    fontSize: 13,
    fontWeight: 'bold',
    width: 44,
  },
  rowText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  selectedText: {
    color: '#99D9D9',
    fontWeight: 'bold',
  },
  check: {
    color: '#99D9D9',
    fontSize: 16,
    marginLeft: 8,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#002D55',
    marginTop: 4,
  },
  closeText: {
    color: '#99D9D9',
    fontSize: 16,
  },
});
