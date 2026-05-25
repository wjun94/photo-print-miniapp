// src/components/RegionPicker/Popup.tsx
import { View, PickerView, PickerViewColumn, Button } from '@tarojs/components'
import { useEffect, useState } from 'react'

interface RegionNode {
  id: number
  name: string
  children?: RegionNode[]
}

interface SelectedRegion {
  provinceId: number
  provinceName: string
  cityId: number
  cityName: string
  districtId: number
  districtName: string
}

interface RegionPickerPopupProps {
  visible: boolean
  regionTree: RegionNode[]
  initialValue?: Partial<SelectedRegion>
  onConfirm: (region: SelectedRegion) => void
  onCancel: () => void
}

export default function RegionPickerPopup({
  visible,
  regionTree,
  initialValue,
  onConfirm,
  onCancel
}: RegionPickerPopupProps) {
  const [provinceIndex, setProvinceIndex] = useState(0)
  const [cityIndex, setCityIndex] = useState(0)
  const [districtIndex, setDistrictIndex] = useState(0)

  // 根据 initialValue 初始化索引
  useEffect(() => {
    if (!visible || regionTree.length === 0) return
    const { provinceId, cityId, districtId } = initialValue || {}
    let pIdx = 0, cIdx = 0, dIdx = 0
    if (provinceId) {
      const found = regionTree.findIndex(p => p.id === provinceId)
      if (found !== -1) pIdx = found
    }
    setProvinceIndex(pIdx)
    const province = regionTree[pIdx]
    if (province && cityId) {
      const found = province.children?.findIndex(c => c.id === cityId) ?? -1
      if (found !== -1) cIdx = found
    }
    setCityIndex(cIdx)
    const city = province?.children?.[cIdx]
    if (city && districtId) {
      const found = city.children?.findIndex(d => d.id === districtId) ?? -1
      if (found !== -1) dIdx = found
    }
    setDistrictIndex(dIdx)
  }, [visible, regionTree, initialValue])

  const onPickerChange = (e: any) => {
    const [pIdx, cIdx, dIdx] = e.detail.value
    setProvinceIndex(pIdx)
    setCityIndex(cIdx)
    setDistrictIndex(dIdx)
  }

  const getCurrentSelection = (): SelectedRegion => {
    const province = regionTree[provinceIndex]
    if (!province) return { provinceId: 0, provinceName: '', cityId: 0, cityName: '', districtId: 0, districtName: '' }
    const city = province.children?.[cityIndex]
    const district = city?.children?.[districtIndex]
    return {
      provinceId: province.id,
      provinceName: province.name,
      cityId: city?.id || 0,
      cityName: city?.name || '',
      districtId: district?.id || 0,
      districtName: district?.name || ''
    }
  }

  const handleConfirm = () => {
    const selected = getCurrentSelection()
    if (!selected.provinceId || !selected.cityId || !selected.districtId) {
      // 可提示，但默认都有值
    }
    onConfirm(selected)
  }

  if (!visible) return null

  const provinces = regionTree.map(p => ({ id: p.id, name: p.name }))
  const currentProvince = regionTree[provinceIndex]
  const currentCityList = currentProvince?.children || []
  const currentDistrictList = currentCityList[cityIndex]?.children || []

  return (
    <View className='fixed inset-0 z-50'>
      <View className='absolute inset-0 bg-black bg-opacity-50' onClick={onCancel} />
      <View className='absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl'>
        <View className='flex justify-between items-center p-4 border-b'>
          <View className='text-gray-500' onClick={onCancel}>取消</View>
          <View className='text-lg font-bold'>选择地区</View>
          <View className='text-red-500' onClick={handleConfirm}>确定</View>
        </View>
        <PickerView
          indicatorStyle='height: 40px;'
          style={{ height: '240px', width: '100%' }}
          value={[provinceIndex, cityIndex, districtIndex]}
          onChange={onPickerChange}
        >
          <PickerViewColumn>
            {provinces.map(province => (
              <View key={province.id} style={{ textAlign: 'center' }}>{province.name}</View>
            ))}
          </PickerViewColumn>
          <PickerViewColumn>
            {currentCityList.map(city => (
              <View key={city.id} style={{ textAlign: 'center' }}>{city.name}</View>
            ))}
          </PickerViewColumn>
          <PickerViewColumn>
            {currentDistrictList.map(district => (
              <View key={district.id} style={{ textAlign: 'center' }}>{district.name}</View>
            ))}
          </PickerViewColumn>
        </PickerView>
      </View>
    </View>
  )
}