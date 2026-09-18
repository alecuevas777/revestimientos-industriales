import type { ReactElement, ReactNode } from 'react';
import { FlatList, Platform, RefreshControl, View } from 'react-native';

import { Colors } from '@/constants/theme';

type Props<T> = {
  data: T[];
  extraData?: unknown;
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  header?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function CatalogList<T>({
  data,
  extraData,
  keyExtractor,
  renderItem,
  header,
  footer,
  empty,
  refreshing = false,
  onRefresh,
}: Props<T>) {
  return (
    <FlatList
      className="flex-1"
      data={data}
      extraData={extraData}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => renderItem(item)}
      ListHeaderComponent={header ? <View className="mb-5">{header}</View> : null}
      ListFooterComponent={footer ? <View className="mt-6">{footer}</View> : null}
      ListEmptyComponent={empty ? <View className="mt-2">{empty}</View> : null}
      ItemSeparatorComponent={() => <View className="h-3" />}
      contentContainerClassName="grow px-5 py-4 pb-8"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews={Platform.OS === 'android'}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brand}
            colors={[Colors.brand]}
          />
        ) : undefined
      }
    />
  );
}
