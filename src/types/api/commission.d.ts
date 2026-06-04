declare namespace COMMISSION {
  /** 佣金/返利记录模型 */
  type Item = {
    /** 主键ID */
    id: string;
    /** 推广者ID（上级） */
    userId: string;
    /** 下单用户ID（下级） */
    friendId: string;
    /** 订单ID（唯一防重） */
    orderId: string;
    /** 订单实付金额 */
    orderAmount: number;
    /** 当时返利比例 */
    ratio: number;
    /** 佣金金额 */
    amount: number;
    /** 状态: pending(待结算) / settled(已结算) */
    status: string;
    /** 创建时间 */
    createdAt: string;
  }
  /** 好友信息模型 */
  type FriendItem = {
    /** 主键ID */
    id: string;
    /** 昵称 */
    nickname: string;
    /** 头像链接 */
    avatarUrl: string;
    /** 创建时间 */
    createdAt: string;
    /** 累计消费金额 */
    totalSpent: number;
  }
}