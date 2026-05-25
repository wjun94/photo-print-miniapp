import { View } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getRegionsAll } from '@/api/address'
import RegionPickerPopup from './Popup' // 下面会给出 Popup 组件

interface RegionNode {
  id: number
  name: string
  children?: RegionNode[]
}

export interface SelectedRegion {
  provinceId: number
  provinceName: string
  cityId: number
  cityName: string
  districtId: number
  districtName: string
}

interface RegionPickerProps {
  value?: Partial<SelectedRegion>
  onChange?: (region: SelectedRegion) => void
  placeholder?: string
  className?: string
}

// 全局缓存省市区数据
let cachedRegions: RegionNode[] | null = null

export default function RegionPicker({
  value,
  onChange,
  placeholder = '请选择省市区',
  className = ''
}: RegionPickerProps) {
  const [regionTree, setRegionTree] = useState<RegionNode[]>([])
  const [loading, setLoading] = useState(true)
  const [popupVisible, setPopupVisible] = useState(false)
  const [selected, setSelected] = useState<SelectedRegion>({
    provinceId: 0,
    provinceName: '',
    cityId: 0,
    cityName: '',
    districtId: 0,
    districtName: ''
  })

  // 加载数据（全局缓存）
  useEffect(() => {
    if (cachedRegions) {
      setRegionTree(cachedRegions)
      setLoading(false)
    } else {
      getRegionsAll()
        .then(data => {
          cachedRegions = data
          setRegionTree(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('省市区数据加载失败', err)
          setLoading(false)
        })
    }
  }, [])

  // 同步外部 value 到内部 selected
  useEffect(() => {
    if (!value) return
    const { provinceId, cityId, districtId } = value
    if (provinceId && regionTree.length) {
      const province = regionTree.find(p => p.id === provinceId)
      if (province) {
        const city = province.children?.find(c => c.id === cityId)
        const district = city?.children?.find(d => d.id === districtId)
        setSelected({
          provinceId: province.id,
          provinceName: province.name,
          cityId: city?.id || 0,
          cityName: city?.name || '',
          districtId: district?.id || 0,
          districtName: district?.name || ''
        })
      }
    } else if (!provinceId) {
      // 清空选中
      setSelected({
        provinceId: 0,
        provinceName: '',
        cityId: 0,
        cityName: '',
        districtId: 0,
        districtName: ''
      })
    }
  }, [value, regionTree])

  const openPopup = () => {
    if (loading) {
      Taro.showToast({ title: '数据加载中', icon: 'none' })
      return
    }
    setPopupVisible(true)
  }

  const handleConfirm = (region: SelectedRegion) => {
    setSelected(region)
    onChange?.(region)
    setPopupVisible(false)
  }

  const handleCancel = () => {
    setPopupVisible(false)
  }

  // 显示文本
  const displayText = selected.provinceName
    ? `${selected.provinceName} ${selected.cityName} ${selected.districtName}`
    : placeholder

  return (
    <>
      <View
        className={`border rounded p-2 bg-white ${className}`}
        onClick={openPopup}
      >
        <View className={selected.provinceId ? 'text-gray-900' : 'text-gray-400'}>
          {displayText}
        </View>
      </View>
      {regionTree.length > 0 && (
        <RegionPickerPopup
          visible={popupVisible}
          regionTree={regionTree}
          initialValue={{
            provinceId: selected.provinceId,
            cityId: selected.cityId,
            districtId: selected.districtId
          }}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}