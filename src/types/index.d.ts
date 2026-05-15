export interface Photo {
  id: number;
  user_id: number;
  image_url: string;
  created_at: string;
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
