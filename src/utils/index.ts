/** cdn图片域名地址 */
export function getImageCdnUrl(url: string): string {
  return url ? `${STATIC_BASE_URL}/photo-print/img/${url}?imageView2/1/w/750` : "";
}

/** 接口返回的图片域名地址 */
export function getImageUrl(url = "") {
  if (!url) return url;
  // 增加对微信本地临时路径（wxfile://）的判断，如果是本地路径则直接返回
  if (
    url.startsWith("photo-print/")
  ) {
    return `${STATIC_BASE_URL}/` + url + "?imageView2/1/w/750";
  }
  return url;
}
