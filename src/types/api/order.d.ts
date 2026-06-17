declare namespace ORDER {
  type Status =
    | 'pending' // 待付款
    | 'paid' // 已付款/待发货
    | 'shipped' // 已发货
    | 'completed' // 已取消
    | 'refunding' // 退款中
    | 'refunded' // 已退款
    | 'cancelled'; // 已取消
  type CreateReq = {
    token: string;
    userId: number;
  };
  type CreateItem = {
    imageUrl: string;
    spec: string;
    quantity: number;
    price: number;
  };
  type OrderItem = {
    id: number;
    imageUrl: string;
    spec: string;
    quantity: number;
    price: number;
    totalQuantity: number;
    totalSubtotal: number;
    specName: string;
    productName: string;
    specId: string;
  };
  type SpecsItem = {
    productName: string;
    specName: string;
    specId: string;
    imageUrl: string;
    price: number;
    quantity: number;
    totalQuantity: number;
    totalSubtotal: number;
  };
  type Logistics = {
    courierCode: string;
    courierName: string;
    createdAt: string;
    id: string;
    orderId: string;
    remark: string;
    trackingNo: string;
    updatedAt: string;
  };
  type Item = {
    id: string;
    orderNo: string;
    userId: number;
    status: Status;
    address: ADDRESS.Items;
    createdAt: string;
    actualAmount: string;
    freight: string;
    discountAmount: string
    amount: string;
    items?: OrderItem[];
    specs?: SpecsItem[];
    logistics?: Logistics[];
  };
  export interface ItemRequest {
    imageUrl: string
    productId?: string;
    specId?: string;
    quantity: number;
  }

  export interface PreviewItem {
    productId: string;
    productName: string;
    specId: string;
    specName: string;
    price: number;
    quantity: number;
    totalQuantity: number;
    subtotal: number;
    totalSubtotal: number;
    imageUrl: string;
  }
}
