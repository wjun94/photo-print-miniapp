// windi.config.js


export default {
  prefixer: false,
  extract: {
    // 忽略部分文件夹
    exclude: ['node_modules', '.git', 'dist']
  },
  theme: {
    extend: {
      colors: {
        primary: { 200: '#ecf3fd', 400: '#2F77F1', },
        text: { 200: '#b7b7b7', 300: '#999999', 400: '#888888', 500: '#666666', 600: '#323232', 700: '#787878' /** 标题主色号*/ }
      },
      backgroundSize: {
        'full': '100% 100%'
      }
    },
  },
  important: true, // 所有工具类自动加 !important
  corePlugins: {
    // 禁用掉在小程序环境中不可能用到的 plugins
    container: false
  }
}