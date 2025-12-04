import { request } from '@/libs/request'

export const workflowAPI  = (data) => request({
  url: '/v2/workflow/invoke',
  method: 'post',
  data
})
export const stopWorkflowAPI  = (data) => request({
  url: '/v2/workflow/stop',
  method: 'post',
  data
})

