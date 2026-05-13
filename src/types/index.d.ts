export interface Photo {
  id: number;
  user_id: number;
  image_url: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  photo_id: number;
  spec: string;
  quantity: number;
  price: number;
  photo?: Photo;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "completed"
  | "cancelled";

export interface Order {
  id: number;
  order_no: string;
  user_id: number;
  total_amount: number;
  status: OrderStatus;
  address: string;
  created_at: string;
  items?: OrderItem[];
}

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
