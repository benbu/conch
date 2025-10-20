/**
 * Global Search Screen
 * Search across messages, conversations, and users
 */

import { globalSearch, SearchResult } from '@/services/searchService';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      setSearchPerformed(false);
      return;
    }

    setLoading(true);
    setSearchPerformed(true);

    try {
      const searchResults = await globalSearch(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderResultItem = ({ item }: { item: SearchResult }) => {
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => {
          if (item.type === 'message' && item.conversationId) {
            router.push(`/chat/${item.conversationId}`);
          } else if (item.type === 'conversation') {
            router.push(`/chat/${item.id}`);
          } else if (item.type === 'user') {
            // Navigate to user profile or start chat
            // router.push(`/profile/${item.id}`);
          }
        }}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultType}>
            {item.type === 'message' ? '💬' : item.type === 'conversation' ? '📁' : '👤'}
          </Text>
          <Text style={styles.resultTitle}>
            {item.type === 'message'
              ? (item.data as any).text?.substring(0, 50)
              : item.type === 'conversation'
              ? (item.data as any).title
              : (item.data as any).displayName}
          </Text>
        </View>
        
        {item.highlights && item.highlights.length > 0 && (
          <Text style={styles.highlight}>{item.highlights[0]}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Search',
          headerSearchBarOptions: {
            placeholder: 'Search messages, conversations, users...',
            onChangeText: (event) => handleSearch(event.nativeEvent.text),
          },
        }}
      />
      
      <View style={styles.container}>
        {/* Search Input (for Android) */}
        {/* Note: iOS uses headerSearchBarOptions */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages, conversations, users..."
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchPerformed && results.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No results found for "{query}"</Text>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
            contentContainerStyle={styles.resultsList}
          />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Search messages, conversations, and users</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultType: {
    fontSize: 20,
    marginRight: 12,
  },
  resultTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  highlight: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

