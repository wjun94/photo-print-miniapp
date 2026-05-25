declare namespace ADDRESS {
  export interface Items {
    id: string
    receiverName: string
    mobile: string
    provinceId: number
    cityId: number
    cityName: string
    provinceName: string
    districtId: number
    districtName: string
    detail: string
    doorplate?: string
    isDefault: boolean
    createdAt: string
    updatedAt: string
  }
}