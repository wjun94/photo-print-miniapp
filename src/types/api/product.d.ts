declare namespace PRODUCT {
  // 商品规格
  export interface Spec {
    id: string;
    name: string; // 规格名称，如 "6寸"
    price: number;
    stock: number;
    skuCode?: string;
    image?: string; // 规格图
  }

  export interface SpecAttribute {
    id: string
    name: string
    values: string[]
    sortOrder: number
  }

  export interface SpecItem {
    id: string
    skuKey: string
    price: number
    stock: number
    skuCode: string
    image: string
    attributes: Record<string, string>
  }

  // 商品详情
  export interface Detail {
    id: string
    name: string
    coverImage: string
    bannerImages: string[]
    description: string
    detail: string
    status: string
    sortOrder: number
    createdAt: string
    updatedAt: string
    action: 'confirm' | 'upload' | string // 核心判断字段
    specAttributes: SpecAttribute[]
    specs: SpecItem[]
    freeShippingAmount: number
    minPrice: number
    maxPrice: number
  }
}
