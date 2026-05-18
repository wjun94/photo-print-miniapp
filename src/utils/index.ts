/** cdn图片域名地址 */
export function getImageCdnUrl(url: string): string {
  return url ? `${STATIC_BASE_URL}/ygtk/${url}` : '';
}

/** 接口返回的图片域名地址 */
export function getImageUrl(url = '') {
  if (!url) return url;
  return url.startsWith('http') ? url : `${STATIC_BASE_URL}` + url;
}