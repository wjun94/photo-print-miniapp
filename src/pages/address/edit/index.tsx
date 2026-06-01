import { View, Input, Textarea, Text, Button, Switch } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { getAddressDetail, createAddress, updateAddress } from '@/api/address'
import RegionPicker from '@/components/RegionPicker'

interface SelectedRegion {
  provinceId: number
  provinceName: string
  cityId: number
  cityName: string
  districtId: number
  districtName: string
}

export default function AddressEdit() {
  const router = useRouter()
  const { id, copy } = router.params
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    receiverName: '',
    mobile: '',
    detail: '',
    doorplate: '',
    isDefault: false
  })

  const [region, setRegion] = useState<SelectedRegion>({
    provinceId: 0,
    provinceName: '',
    cityId: 0,
    cityName: '',
    districtId: 0,
    districtName: ''
  })

  // 加载地址数据（编辑模式）
  useEffect(() => {
    if (id) {
      fetchAddress()
    } else if (copy) {
      parseCopyData()
    }
  }, [id, copy])

  const fetchAddress = async () => {
    try {
      const addr = await getAddressDetail(id as string)
      setForm({
        receiverName: addr.receiverName,
        mobile: addr.mobile,
        detail: addr.detail,
        doorplate: addr.doorplate || '',
        isDefault: addr.isDefault
      })
      setRegion({
        provinceId: addr.provinceId,
        provinceName: addr.provinceName,
        cityId: addr.cityId,
        cityName: addr.cityName,
        districtId: addr.districtId,
        districtName: addr.districtName
      })
    } catch (err) {
      Taro.showToast({ title: '获取地址失败', icon: 'none' })
    }
  }

  const parseCopyData = () => {
    try {
      const copied = JSON.parse(copy as string)
      setForm({
        receiverName: copied.receiverName,
        mobile: copied.mobile,
        detail: copied.detail,
        doorplate: copied.doorplate || '',
        isDefault: false
      })
      setRegion({
        provinceId: copied.provinceId,
        provinceName: copied.provinceName,
        cityId: copied.cityId,
        cityName: copied.cityName,
        districtId: copied.districtId,
        districtName: copied.districtName
      })
    } catch (err) {
      Taro.showToast({ title: '地址复制解析失败', icon: 'none' })
    }
  }

  const validate = () => {
    if (!form.receiverName) return '请输入收货人姓名'
    if (!/^1[3-9]\d{9}$/.test(form.mobile)) return '手机号格式错误'
    if (!region.provinceId || !region.cityId || !region.districtId) return '请选择完整地址'
    if (!form.detail) return '请输入详细地址'
    return ''
  }

  const handleSubmit = async () => {
    const errMsg = validate()
    if (errMsg) {
      Taro.showToast({ title: errMsg, icon: 'none' })
      return
    }
    setLoading(true)
    try {
      const data = {
        receiverName: form.receiverName,
        mobile: form.mobile,
        provinceId: region.provinceId,
        cityId: region.cityId,
        districtId: region.districtId,
        detail: form.detail,
        doorplate: form.doorplate,
        isDefault: form.isDefault
      }
      if (id) {
        await updateAddress(id, data)
      } else {
        await createAddress(data)
      }
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (err) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='bg-[#F7F8FA] p-4 flex flex-col justify-between pb-10'>
      <View className='flex-1'>
        {/* 第一部分：核心表单信息卡片 */}
        <View className='bg-white rounded-2xl px-4 py-1 mb-3 shadow-sm'>
          {/* 收货人 */}
          <View className='flex items-center py-2 bb'>
            <View className='w-24 leading-[1] text-gray-800 flex-shrink-0'>收货人</View>
            <Input
              className='flex-1 text-gray-900 p-0 bg-transparent'
              placeholder='请输入收货人姓名'
              placeholderClass='text-gray-300'
              value={form.receiverName}
              onInput={e => setForm({ ...form, receiverName: e.detail.value })}
            />
          </View>

          {/* 手机号码 */}
          <View className='flex items-center py-2 bb'>
            <View className='w-24 leading-[1] text-gray-800 flex-shrink-0'>手机号码</View>
            <Input
              className='flex-1 text-gray-900 p-0 bg-transparent'
              placeholder='请输入手机号码'
              placeholderClass='text-gray-300'
              type='number'
              value={form.mobile}
              onInput={e => setForm({ ...form, mobile: e.detail.value })}
            />
          </View>

          {/* 所在地区 */}
          <View className='flex items-center py-2 bb justify-between'>
            <View className='w-24 leading-[1] text-gray-800 flex-shrink-0'>所在地区</View>
            <View className='flex-1 flex items-center justify-between overflow-hidden'>
              <RegionPicker
                value={{
                  provinceId: region.provinceId,
                  cityId: region.cityId,
                  districtId: region.districtId
                }}
                onChange={(newRegion) => setRegion(newRegion)}
              />
              <Text className='text-gray-400 text-lg font-light ml-2 flex-shrink-0'>›</Text>
            </View>
          </View>

          {/* 详细地址 */}
          <View className='py-3.5 bb'>
            <View className='text-gray-800 mb-1.5'>详细地址</View>
            <View className='flex items-start justify-between'>
              <Textarea
                className='flex-1 text-gray-900 h-14 p-0 bg-transparent leading-relaxed'
                placeholder='街道、楼号、门牌号'
                placeholderClass='text-gray-300'
                value={form.detail}
                onInput={e => setForm({ ...form, detail: e.detail.value })}
              />
              {/* 右侧定位图标 */}
              <View className='ml-3 pt-0.5 flex-shrink-0'>
                <View className='w-5 h-5 flex items-center justify-center text-[#2F77F1]'>
                  <svg viewBox='0 0 24 24' width='20' height='20' stroke='currentColor' strokeWidth='2' fill='none' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'></path>
                    <circle cx='12' cy='10' r='3'></circle>
                  </svg>
                </View>
              </View>
            </View>
          </View>

          {/* 门牌号 */}
          <View className='flex items-center py-2'>
            <View className='w-24 text-gray-800 flex-shrink-0'>门牌号</View>
            <Input
              className='flex-1 text-gray-900 p-0 bg-transparent'
              placeholder='如大厦、楼层、房间号等（选填）'
              placeholderClass='text-gray-300'
              value={form.doorplate}
              onInput={e => setForm({ ...form, doorplate: e.detail.value })}
            />
          </View>
        </View>

        {/* 第二部分：默认地址独立卡片 */}
        <View className='bg-white rounded-2xl px-4 py-3.5 flex justify-between items-center shadow-sm'>
          <Text className='text-gray-800 font-medium'>设为默认地址</Text>
          <Switch 
            checked={form.isDefault} 
            color='#2F77F1'
            onChange={e => setForm({ ...form, isDefault: e.detail.value })} 
          />
        </View>
      </View>

      {/* 第三部分：底部悬浮/固定保存按钮 */}
      <View className='px-2 mt-18'>
        <Button
          className='w-full h-12 flex items-center justify-center bg-primary-400 text-white text-base font-medium rounded-full active:opacity-90 shadow-lg shadow-blue-100'
          onClick={handleSubmit}
          disabled={loading}
          style={{ border: 'none' }}
        >
          {loading ? '保存中...' : '保存地址'}
        </Button>
      </View>
    </View>
  )
}