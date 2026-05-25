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
    <View className='min-h-screen bg-gray-100 p-4'>
      <View className='bg-white rounded-lg p-4'>
        <View className='mb-4'>
          <View className='text-gray-700 mb-1'>收货人</View>
          <Input
            className='border rounded p-2'
            placeholder='请输入收货人姓名'
            value={form.receiverName}
            onInput={e => setForm({ ...form, receiverName: e.detail.value })}
          />
        </View>
        <View className='mb-4'>
          <View className='text-gray-700 mb-1'>手机号码</View>
          <Input
            className='border rounded p-2'
            placeholder='请输入手机号码'
            type='number'
            value={form.mobile}
            onInput={e => setForm({ ...form, mobile: e.detail.value })}
          />
        </View>

        {/* 省市区选择器（使用 PickerView） */}
        <View className='mb-4'>
          <View className='text-gray-700 mb-1'>所在地区</View>
          <RegionPicker
            value={{
              provinceId: region.provinceId,
              cityId: region.cityId,
              districtId: region.districtId
            }}
            onChange={(newRegion) => setRegion(newRegion)}
          />
        </View>

        <View className='mb-4'>
          <View className='text-gray-700 mb-1'>详细地址</View>
          <Textarea
            className='border rounded p-2'
            placeholder='街道、楼号、门牌号'
            value={form.detail}
            onInput={e => setForm({ ...form, detail: e.detail.value })}
          />
        </View>
        <View className='mb-4'>
          <View className='text-gray-700 mb-1'>门牌号（选填）</View>
          <Input
            className='border rounded p-2'
            placeholder='如大厦、楼层、房间号等'
            value={form.doorplate}
            onInput={e => setForm({ ...form, doorplate: e.detail.value })}
          />
        </View>
        <View className='mb-6 flex justify-between items-center'>
          <Text>设为默认地址</Text>
          <Switch checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.detail.value })} />
        </View>
        <Button
          className='bg-red-500 text-white rounded-full'
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '保存中...' : '保存地址'}
        </Button>
      </View>
    </View>
  )
}