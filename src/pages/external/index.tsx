import { products } from '@/api/product'
import { useRequest } from 'ahooks'

export default () => {
    const { data } = useRequest(products)
    const list = data?.list || []
    console.log('外部订单数据：', list)
    return <></>
}