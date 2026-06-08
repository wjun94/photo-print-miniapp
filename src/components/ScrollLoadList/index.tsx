import React, { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ScrollView, View, Text, Image } from '@tarojs/components'
import type { ScrollViewProps } from '@tarojs/components'

export interface RequestResult<T> {
  list: T[]
  total: number
}

export interface ScrollLoadListProps<T = any> {
  request: (page: number, pageSize: number) => Promise<RequestResult<T>> | any
  renderItem: (item: T | any, index: number) => React.ReactNode
  pageSize?: number
  initialPage?: number
  immediate?: boolean
  emptyText?: string
  loadingMoreText?: string
  noMoreText?: string
  errorText?: string
  renderHeader?: () => React.ReactNode
  renderFooter?: () => React.ReactNode
  renderEmpty?: () => React.ReactNode
  renderError?: () => React.ReactNode
  renderLoadMoreIndicator?: () => React.ReactNode
  keyExtractor?: (item: T | any, index: number) => string
  lowerThreshold?: number
  scrollViewProps?: Omit<ScrollViewProps, 'onScrollToLower' | 'onRefresherRefresh' | 'refresherTriggered' | 'refresherEnabled'>
  className?: string
  style?: React.CSSProperties
  /** 每行显示的列数，默认 1（普通列表） */
  numColumns?: number
  /** 列间距（单位 px），仅在多列布局时生效，默认 0 */
  columnGap?: number
  /** 行间距（单位 px），仅在多列布局时生效，默认 0 */
  rowGap?: number
  /** 是否启用瀑布流布局（仅当 numColumns > 1 时生效），默认 false */
  masonry?: boolean
}

export interface ScrollLoadListRef {
  refresh: () => void
}

const ScrollLoadList = forwardRef(<T = any>(props: ScrollLoadListProps<T>, ref: React.Ref<ScrollLoadListRef | any>) => {
  const {
    request,
    renderItem,
    pageSize = 10,
    initialPage = 1,
    immediate = true,
    emptyText = '暂无数据',
    loadingMoreText = '加载中...',
    noMoreText = '—— 已全部加载 ——',
    errorText = '加载失败，点击重试',
    renderHeader,
    renderFooter,
    renderEmpty,
    renderError,
    renderLoadMoreIndicator,
    keyExtractor = (_, index) => index.toString(),
    lowerThreshold = 100,
    scrollViewProps = {},
    className = '',
    style,
    numColumns = 1,
    columnGap = 0,
    rowGap = 0,
    masonry = false,
  } = props

  const [data, setData] = useState<T[]>([])
  const [page, setPage] = useState(initialPage)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(false)
  const [initialLoading, setInitialLoading] = useState(immediate)

  const isMounted = useRef(true)
  const isLoadingMoreRef = useRef(false)

  // 加载数据（通用）
  const loadData = useCallback(async (currentPage: number, isRefresh = false) => {
    if (!isRefresh && loadingMore) return
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoadingMore(true)
    }
    setError(false)

    try {
      const res = await request(currentPage, pageSize)
      if (!isMounted.current) return

      const { list, total } = res
      const totalPage = Math.ceil(total / pageSize)

      if (isRefresh) {
        setData(list || [])
        setPage(currentPage)
      } else {
        setData(prev => [...prev, ...list])
      }
      setHasMore(currentPage < totalPage)
      setError(false)
    } catch (err) {
      if (!isMounted.current) return
      setError(true)
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoadingMore(false)
      }
      if (isRefresh && isMounted.current) {
        setInitialLoading(false)
      }
    }
  }, [request, pageSize, loadingMore])

  // 对外暴露的刷新方法
  const refresh = useCallback(() => {
    if (refreshing || loadingMore) return
    loadData(initialPage, true)
  }, [refreshing, loadingMore, initialPage, loadData])

  useImperativeHandle(ref, () => ({
    refresh
  }), [refresh])

  // 初始加载
  useEffect(() => {
    if (immediate) {
      loadData(initialPage, true)
    }
    return () => {
      isMounted.current = false
    }
  }, [])

  // 上拉加载更多
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || refreshing || error || isLoadingMoreRef.current) return
    isLoadingMoreRef.current = true
    const nextPage = page + 1
    loadData(nextPage, false).finally(() => {
      setTimeout(() => {
        isLoadingMoreRef.current = false
      }, 200)
    })
  }, [loadingMore, hasMore, refreshing, error, page, loadData])

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    if (refreshing || loadingMore) return
    loadData(initialPage, true)
  }, [refreshing, loadingMore, initialPage, loadData])

  // 重试
  const handleRetry = useCallback(() => {
    if (error) {
      if (data.length === 0) {
        loadData(initialPage, true)
      } else {
        handleLoadMore()
      }
    }
  }, [error, data.length, initialPage, loadData, handleLoadMore])

  const renderFooterContent = () => {
    if (renderLoadMoreIndicator) return renderLoadMoreIndicator()
    if (error) {
      if (renderError) return renderError()
      return (
        <View className="flex justify-center items-center py-4" onClick={handleRetry}>
          <Text className="text-red-500 text-sm">{errorText}</Text>
        </View>
      )
    }
    if (loadingMore) {
      return (
        <View className="flex justify-center items-center py-4">
          <View className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
          <Text className="text-gray-500 text-sm">{loadingMoreText}</Text>
        </View>
      )
    }
    if (!hasMore && data.length > 0) {
      return (
        <View className="flex justify-center items-center py-4">
          <Text className="text-gray-400 text-sm">{noMoreText}</Text>
        </View>
      )
    }
    return null
  }

  const renderEmptyContent = () => {
    if (renderEmpty) return renderEmpty()
    return (
      <View className="flex flex-col justify-center items-center text-gray-400 py-20">
        <Text className='iconfont icon-none text-68px' />
        <Text className="text-28px mt-20px">{emptyText}</Text>
      </View>
    )
  }

  const showEmpty = data.length === 0 && !loadingMore && !refreshing && !error && !initialLoading

  // 判断是否启用瀑布流布局（masonry 模式且多列）
  const isMasonry = masonry && numColumns > 1
  // 普通网格（flex 等高分列）
  const isGrid = !isMasonry && numColumns > 1

  // 瀑布流样式 (CSS Columns)
  const masonryContainerStyle: React.CSSProperties = isMasonry
    ? {
      columnCount: numColumns,
      columnGap: columnGap,
    }
    : {}

  const masonryItemStyle: React.CSSProperties = isMasonry
    ? {
      breakInside: 'avoid',
      marginBottom: rowGap,
    }
    : {}

  // 普通网格样式 (flex)
  const gridContainerStyle: React.CSSProperties = isGrid
    ? {
      display: 'flex',
      flexWrap: 'wrap',
      marginLeft: columnGap ? -columnGap / 2 : 0,
      marginRight: columnGap ? -columnGap / 2 : 0,
    }
    : {}

  const gridItemStyle: React.CSSProperties = isGrid
    ? {
      width: `${100 / numColumns}%`,
      paddingLeft: columnGap ? columnGap / 2 : 0,
      paddingRight: columnGap ? columnGap / 2 : 0,
      marginBottom: rowGap,
      boxSizing: 'border-box',
    }
    : {}

  return (
    <ScrollView
      scrollY
      className={`h-full ${className}`}
      style={style}
      refresherEnabled={true}
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
      onScrollToLower={handleLoadMore}
      lowerThreshold={lowerThreshold}
      {...scrollViewProps}
    >
      {renderHeader && renderHeader()}

      {!showEmpty && (
        <>
          {/* 瀑布流模式：使用 CSS columns */}
          {isMasonry && (
            <View style={masonryContainerStyle}>
              {data.map((item, index) => {
                const key = keyExtractor(item, index)
                return (
                  <View key={key} style={masonryItemStyle}>
                    {renderItem(item, index)}
                  </View>
                )
              })}
            </View>
          )}

          {/* 普通网格模式：flex */}
          {isGrid && (
            <View style={gridContainerStyle}>
              {data.map((item, index) => {
                const key = keyExtractor(item, index)
                return (
                  <View key={key} style={gridItemStyle}>
                    {renderItem(item, index)}
                  </View>
                )
              })}
            </View>
          )}

          {/* 单列模式：普通列表 */}
          {numColumns === 1 && (
            <View className="flex flex-col">
              {data.map((item, index) => (
                <View key={keyExtractor(item, index)}>
                  {renderItem(item, index)}
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {data.length > 0 && renderFooterContent()}
      {renderFooter && renderFooter()}

      {showEmpty && renderEmptyContent()}
    </ScrollView>
  )
})

// 添加 displayName 便于调试
ScrollLoadList.displayName = 'ScrollLoadList'

export default ScrollLoadList