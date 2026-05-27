declare namespace ORDER {
  type OrderStatus =
    | "pending"
    | "paid"
    | "processing"
    | "completed"
    | "cancelled";
  type CreateReq = {
    token: string;
    userId: number;
  };
  type CreateItem = {
    imageUrl: string
    spec: string
    quantity: number
    price: number
  }
  type OrderItem = {
    id: number;
    imageUrl: string;
    spec: string;
    quantity: number;
    price: number;
  }
  type List = {
    id: number;
    orderNo: string;
    userId: number;
    status: OrderStatus;
    address: string;
    createdAt: string;
    items?: OrderItem[];
  }
  export interface ItemRequest {
    productId: string
    specId: string
    quantity: number
  }

  export interface PreviewItem {
    productId: string
    productName: string
    specId: string
    specName: string
    price: number
    quantity: number
    totalQuantity: number
    subtotal: number
    totalSubtotal: number
    imageUrl: string
  }
}
