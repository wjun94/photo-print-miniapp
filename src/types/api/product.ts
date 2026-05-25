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

  // 商品详情
  export interface Detail {
    id: string;
    name: string;
    coverImage: string;
    bannerImages: string[];
    description: string;
    detail: string; // 富文本详情
    status: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    specs: Spec[];
  }
}
