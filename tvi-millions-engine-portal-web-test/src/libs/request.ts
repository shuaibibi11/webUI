import axios from 'axios'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API,
  // timeout: 50000,
  timeout: 20 * 60 * 1000,
})

// request拦截器
instance.interceptors.request.use(
  (config) => {
    // config.headers['Content-Language'] = 'zh_CN'

    // const isToken = config.headers?.isToken === false
    // const isEncrypt = config.headers?.isEncrypt === 'true'
    // const isBlob = config.headers?.isBlob === 'true'

    // if (isBlob) {
    //   config.responseType = 'blob'
    // }

    // // 添加请求头
    // const userStore = useUserStore()
    // if (userStore.token && !isToken) {
    //   config.headers['Authorization'] = `Bearer ${userStore.token}` // 让每个请求携带自定义token 请根据实际情况自行修改
    // }

    // 当开启参数加密
    // if (isEncrypt && (config.method === 'post' || config.method === 'put')) {
    //   // 生成一个 AES 密钥
    //   const aesKey = generateAesKey();
    //   config.headers[encryptHeader] = encrypt(encryptBase64(aesKey));
    //   config.data = typeof config.data === 'object' ? encryptWithAes(JSON.stringify(config.data), aesKey) : encryptWithAes(config.data, aesKey);
    // }
    
    return config
  },
  () => {}
)

// 响应拦截器
instance.interceptors.response.use(
  (config) => {
    // const isBlob = config.config.headers.isBlob === 'true'
    // if (isBlob) {
    //   return config
    // } else {
    //   const userStore = useUserStore()
    //   if (config.status === 200) {
    //     if (config.data.code !== 200) {
    //       if (config.data.code === 401) {
    //         const confirm = DialogPlugin.confirm({
    //           header: '系统提示',
    //           dialogClassName: 'tvi-login-dialog',
    //           body: '登录状态已过期，请重新登录',
    //           theme: 'warning',
    //           onConfirm: () => {
    //             userStore.token = null
    //             location.href = '/'
    //             confirm.hide()
    //           },
    //         })
    //       } else {
    //         MessagePlugin.error(config.data.msg)
    //       }
    //     }
    //   } 
    //   return config.data
    // }
    // if (config.status === 200) {
    //   if (config.data.code !== 200) {
        
    //   }
    // } 
  
    
    return config.data
  },
  
)

export const post = (url, data, opts) => {
  return instance.post(url, data, opts)
}

export const get = (url,data) => {
  return instance.get(url, {
    params: data
  })
}

export const request = (config) => {
  return instance.request(config)
}