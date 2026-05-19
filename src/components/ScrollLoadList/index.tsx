import React, { useState, useCallback, useRef, useEffect } from 'react'
import { ScrollView, View, Text } from '@tarojs/components'
import type { ScrollViewProps } from '@tarojs/components'

export interface RequestResult<T> {
    list: T[]
    total: number
}

export interface ScrollLoadListProps<T = any> {
    /** 请求函数，返回 Promise<RequestResult<T>>，参数为 page, pageSize */
    request: any
    /** 渲染每一项 */
    renderItem: (item: T, index: number) => React.ReactNode
    /** 每页数量，默认 10 */
    pageSize?: number
    /** 初始页码，默认 1 */
    initialPage?: number
    /** 是否立即加载，默认 true */
    immediate?: boolean
    /** 空状态文案 */
    emptyText?: string
    /** 加载更多中文案 */
    loadingMoreText?: string
    /** 没有更多文案 */
    noMoreText?: string
    /** 错误提示文案 */
    errorText?: string
    /** 自定义头部渲染 */
    renderHeader?: () => React.ReactNode
    /** 自定义底部渲染（在加载更多指示器之前） */
    renderFooter?: () => React.ReactNode
    /** 自定义空状态渲染 */
    renderEmpty?: () => React.ReactNode
    /** 自定义错误状态渲染 */
    renderError?: () => React.ReactNode
    /** 自定义加载更多指示器渲染 */
    renderLoadMoreIndicator?: () => React.ReactNode
    /** 列表项唯一标识提取器，默认使用 index */
    keyExtractor?: (item: T, index: number) => string
    /** 触底加载阈值（单位px） */
    lowerThreshold?: number
    /** 滚动视图额外属性 */
    scrollViewProps?: Omit<ScrollViewProps, 'onScrollToLower' | 'onRefresherRefresh' | 'refresherTriggered' | 'refresherEnabled'>
    /** 容器类名 */
    className?: string
    /** 容器样式 */
    style?: React.CSSProperties
}

const ScrollLoadList = <T = any>(props: ScrollLoadListProps<T>) => {
    const {
        request,
        renderItem,
        pageSize = 10,
        initialPage = 1,
        immediate = true,
        emptyText = '暂无数据',
        loadingMoreText = '加载中...',
        noMoreText = '没有更多了',
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
                setData(list)
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

    // 重试（错误时点击调用）
    const handleRetry = useCallback(() => {
        if (error) {
            if (data.length === 0) {
                loadData(initialPage, true)
            } else {
                handleLoadMore()
            }
        }
    }, [error, data.length, initialPage, loadData, handleLoadMore])

    // 渲染底部内容（加载更多/没有更多/错误状态）
    const renderFooterContent = () => {
        if (renderLoadMoreIndicator) {
            return renderLoadMoreIndicator()
        }

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

    // 渲染空状态
    const renderEmptyContent = () => {
        if (renderEmpty) return renderEmpty()
        return (
            <View className="flex flex-col justify-center items-center py-20">
                <Text className="text-gray-400 text-base">{emptyText}</Text>
            </View>
        )
    }

    const showEmpty = data.length === 0 && !loadingMore && !refreshing && !error && !initialLoading

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
                <View className="flex flex-col">
                    {data.map((item, index) => (
                        <View key={keyExtractor(item, index)}>
                            {renderItem(item, index)}
                        </View>
                    ))}
                </View>
            )}

            {data.length > 0 && renderFooterContent()}
            {renderFooter && renderFooter()}

            {showEmpty && renderEmptyContent()}
        </ScrollView>
    )
}

export default ScrollLoadList