declare namespace ORDER {
  type CreateReq = {
    token: string;
    user_id: number;
  };
  type CreateItem = {
    photo_id: number
    spec: string
    quantity: number
    price: number
  }
}
