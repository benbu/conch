import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AISuggestionsSheetProps {
  visible: boolean;
  onClose: () => void;
  suggestions: string[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onInsert: (text: string) => void;
}

export function AISuggestionsSheet({
  visible,
  onClose,
  suggestions,
  loading,
  error,
  onRefresh,
  onInsert,
}: AISuggestionsSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>AI Suggestions</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" /></View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.error}>{error}</Text>
              {onRefresh && (
                <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(item, idx) => `${idx}`}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.row} onPress={() => onInsert(item)}>
                  <Text style={styles.text}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: '600' },
  close: { fontSize: 20, color: '#666' },
  center: { padding: 24, alignItems: 'center' },
  error: { color: '#b00020', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0f0f0', borderRadius: 8 },
  retryText: { fontWeight: '600' },
  row: { paddingHorizontal: 16, paddingVertical: 12 },
  text: { fontSize: 16, color: '#111' },
  sep: { height: 1, backgroundColor: '#f0f0f0' },
});


