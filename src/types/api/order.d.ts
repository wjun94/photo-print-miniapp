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
    imageUrl: number;
    spec: string;
    quantity: number;
    price: number;
  }
  type List = {
    id: number;
    orderNo: string;
    userId: number;
    totalAmount: number;
    status: OrderStatus;
    address: string;
    createdAt: string;
    items?: OrderItem[];
  }
}
