declare namespace ORDER {
  type OrderStatus =
    | "pending"
    | "paid"
    | "processing"
    | "completed"
    | "cancelled";
  type CreateReq = {
    token: string;
    user_id: number;
  };
  type CreateItem = {
    imageUrl: string
    spec: string
    quantity: number
    price: number
  }
  type OrderItem = {
    id: number;
    imageUrl: number;
    spec: string;
    quantity: number;
    price: number;
    image_url?: string;
  }
  type List = {
    id: number;
    order_no: string;
    user_id: number;
    total_amount: number;
    status: OrderStatus;
    address: string;
    created_at: string;
    items?: OrderItem[];
  }
}
