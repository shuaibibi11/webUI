import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from './HelloWorld.vue'

describe('HelloWorld.vue', () => {
  it('renders the component correctly', () => {
    const wrapper = mount(HelloWorld)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the correct message', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Hello Vitest!'
      }
    })
    expect(wrapper.text()).toContain('Hello Vitest!')
  })

  it('renders the correct number of stars', () => {
    const wrapper = mount(HelloWorld, {
      props: {
        msg: 'Hello Vitest!',
        count: 5
      }
    })
    const stars = wrapper.findAll('.star')
    expect(stars.length).toBe(5)
  })

  it('emits an event when the button is clicked', () => {
    const wrapper = mount(HelloWorld)
    wrapper.find('button').trigger('click')
    expect(wrapper.emitted('count-changed')).toBeTruthy()
    expect(wrapper.emitted('count-changed')?.length).toBe(1)
  })

  it('increments the count when the button is clicked', async () => {
    const wrapper = mount(HelloWorld)
    const button = wrapper.find('button')
    const initialText = button.text()
    
    await button.trigger('click')
    
    expect(button.text()).not.toBe(initialText)
    expect(button.text()).toContain('1')
  })
})
