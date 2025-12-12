import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Feedback from './Feedback.vue'

describe('Feedback.vue', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(Feedback)
  })

  it('renders the component correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the floating button', () => {
    const floatingBtn = wrapper.find('.floating-btn')
    expect(floatingBtn.exists()).toBe(true)
  })

  it('opens the feedback form when the floating button is clicked', () => {
    const floatingBtn = wrapper.find('.floating-btn')
    floatingBtn.trigger('click')
    expect(wrapper.vm.formVisible).toBe(true)
  })

  it('closes the feedback form when the drawer is closed', () => {
    // 打开表单
    wrapper.vm.formVisible = true
    // 关闭表单
    wrapper.vm.formVisible = false
    expect(wrapper.vm.formVisible).toBe(false)
  })

  it('validates the form correctly', async () => {
    // 打开表单
    wrapper.vm.formVisible = true
    
    // 直接调用提交方法，不填写任何内容
    await wrapper.vm.handleSubmit()
    
    // 验证表单没有提交成功
    expect(wrapper.vm.submitting).toBe(false)
  })

  it('submits the form successfully when all fields are valid', async () => {
    // 模拟alert函数
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    // 打开表单
    wrapper.vm.formVisible = true
    
    // 填写表单
    wrapper.vm.form.type = 'bug'
    wrapper.vm.form.content = 'This is a test feedback with more than 10 characters'
    
    // 调用提交方法
    await wrapper.vm.handleSubmit()
    
    // 验证提交状态
    expect(wrapper.vm.submitting).toBe(true)
    
    // 等待模拟的API调用完成
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    // 验证提交成功后的状态
    expect(wrapper.vm.submitting).toBe(false)
    expect(wrapper.vm.formVisible).toBe(false)
    expect(wrapper.vm.form.type).toBe('')
    expect(wrapper.vm.form.content).toBe('')
    expect(window.alert).toHaveBeenCalledWith('反馈成功，感谢您的支持！')
  })

  it('shows the correct feedback types in the select', () => {
    // 打开表单
    wrapper.vm.formVisible = true
    
    // 验证反馈类型选项
    expect(wrapper.vm.feedbackTypes).toHaveLength(4)
    expect(wrapper.vm.feedbackTypes[0].label).toBe('Bug报告')
    expect(wrapper.vm.feedbackTypes[1].label).toBe('功能建议')
    expect(wrapper.vm.feedbackTypes[2].label).toBe('投诉')
    expect(wrapper.vm.feedbackTypes[3].label).toBe('其他')
  })

  it('applies the expanded class to the floating button when the form is visible', () => {
    const floatingBtn = wrapper.find('.floating-btn')
    
    // 表单未打开时，不应该有expanded类
    expect(floatingBtn.classes()).not.toContain('expanded')
    
    // 打开表单
    wrapper.vm.formVisible = true
    
    // 表单打开时，应该有expanded类
    expect(floatingBtn.classes()).toContain('expanded')
  })
})
