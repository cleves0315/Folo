import type { ListRenderItemInfo } from "@shopify/flash-list"
import type { ElementRef } from "react"
import { useCallback, useImperativeHandle, useMemo } from "react"
import { View } from "react-native"

import { usePrefetchEntryTranslation } from "@/src/store/translation/hooks"

import { useFetchEntriesControls } from "../screen/atoms"
import { TimelineSelectorList } from "../screen/TimelineSelectorList"
import { EntryListFooter } from "./EntryListFooter"
import { useOnViewableItemsChanged, usePagerListPerformanceHack } from "./hooks"
import { ItemSeparatorFullWidth } from "./ItemSeparator"
import { EntrySocialItem } from "./templates/EntrySocialItem"

export const EntryListContentSocial = ({
  ref: forwardRef,
  entryIds,
  active,
}: { entryIds: string[] | null; active?: boolean } & {
  ref?: React.Ref<ElementRef<typeof TimelineSelectorList> | null>
}) => {
  const { fetchNextPage, isFetching, refetch, isRefetching, hasNextPage } =
    useFetchEntriesControls()

  const { onScroll: hackOnScroll, ref, style: hackStyle } = usePagerListPerformanceHack()
  useImperativeHandle(forwardRef, () => ref.current!)
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-callback
  const renderItem = useCallback(
    ({ item: id }: ListRenderItemInfo<string>) => <EntrySocialItem entryId={id} />,
    [],
  )

  const ListFooterComponent = useMemo(
    () => (hasNextPage ? <EntryItemSkeleton /> : <EntryListFooter />),
    [hasNextPage],
  )

  const { onViewableItemsChanged, onScroll, viewableItems } = useOnViewableItemsChanged({
    disabled: active === false || isFetching,
    onScroll: hackOnScroll,
  })

  usePrefetchEntryTranslation({ entryIds: active ? viewableItems.map((item) => item.key) : [] })

  return (
    <TimelineSelectorList
      ref={ref}
      onRefresh={() => {
        refetch()
      }}
      isRefetching={isRefetching}
      data={entryIds}
      keyExtractor={(id) => id}
      estimatedItemSize={100}
      renderItem={renderItem}
      onEndReached={fetchNextPage}
      onViewableItemsChanged={onViewableItemsChanged}
      onScroll={onScroll}
      ItemSeparatorComponent={ItemSeparatorFullWidth}
      ListFooterComponent={ListFooterComponent}
      style={hackStyle}
    />
  )
}

export function EntryItemSkeleton() {
  return (
    <View className="flex flex-col gap-2 p-4">
      {/* Header row with avatar, author, and date */}
      <View className="flex flex-1 flex-row items-center gap-2">
        <View className="bg-system-fill size-8 animate-pulse rounded-full" />
        <View className="bg-system-fill h-4 w-24 animate-pulse rounded-md" />
        <View className="bg-system-fill h-3 w-20 animate-pulse rounded-md" />
      </View>

      {/* Description area */}
      <View className="ml-10 space-y-2">
        <View className="bg-system-fill h-4 w-full animate-pulse rounded-md rounded-bl-none" />
        <View className="bg-system-fill h-4 w-3/4 animate-pulse rounded-md rounded-tl-none" />
      </View>

      {/* Media preview area */}
      <View className="ml-10 flex flex-row gap-2">
        <View className="bg-system-fill size-20 animate-pulse rounded-md" />
        <View className="bg-system-fill size-20 animate-pulse rounded-md" />
      </View>
    </View>
  )
}
