export interface CreateOrderItem {
  photo_id: number;
  spec: string;
  quantity: number;
  price: number;
}

export interface CreateOrderReq {
  address: string;
  items: CreateOrderItem[];
}
