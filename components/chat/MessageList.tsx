import React from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { Message } from '../../types';

export function MessageList({
  flatListRef,
  messages,
  renderItem,
  onScroll,
  onViewableItemsChanged,
  viewabilityConfig,
  loadingMore,
  headerSpacerHeight = 0,
  footerSpacerHeight = 0,
}: any) {
  return (
    <FlatList
      ref={flatListRef}
      testID="chat-messages-list"
      data={messages}
      renderItem={renderItem}
      keyExtractor={(item: Message) => item.id}
      contentContainerStyle={{ padding: 16 }}
      inverted={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onViewableItemsChanged={onViewableItemsChanged.current}
      viewabilityConfig={viewabilityConfig}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
        }, 100);
      }}
      ListHeaderComponent={
        <>
          {headerSpacerHeight > 0 ? <View style={{ height: headerSpacerHeight }} /> : null}
          {loadingMore ? <ActivityIndicator style={{ paddingVertical: 16 }} /> : null}
        </>
      }
      ListFooterComponent={footerSpacerHeight > 0 ? <View style={{ height: footerSpacerHeight }} /> : null}
    />
  );
}


