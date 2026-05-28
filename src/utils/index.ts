/** cdn图片域名地址 */
export function getImageCdnUrl(url: string): string {
  return url ? `${STATIC_BASE_URL}/img/${url}?imageView2/1/w/750` : "";
}

/** 接口返回的图片域名地址 */
export function getImageUrl(url = "") {
  if (!url) return url;
  // 增加对微信本地临时路径（wxfile://）的判断，如果是本地路径则直接返回
  if (
    url.startsWith("upload/") ||
    url.startsWith("upload-dev/") ||
    url.startsWith("upload-admin-dev/") ||
    url.startsWith("upload-prod/") ||
    url.startsWith("dev/") ||
    url.startsWith("prod/")
  ) {
    return `${STATIC_BASE_URL}/` + url + "?imageView2/1/w/750";
  }
  return url;
}
