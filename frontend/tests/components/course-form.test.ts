import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CourseForm from '../../app/components/CourseForm.vue'

describe('CourseForm', () => {
  it('emits valid course form data', async () => {
    const wrapper = await mountSuspended(CourseForm)

    await wrapper.find('input[name="name"]').setValue('Sample Language Course')
    await wrapper.find('textarea[name="description"]').setValue('Fictional course used in automated tests')

    const file = new File(['image'], 'cover.jpg', { type: 'image/jpeg' })
    const imageInput = wrapper.find<HTMLInputElement>('input[name="image"]')
    Object.defineProperty(imageInput.element, 'files', {
      value: [file],
      configurable: true
    })
    await imageInput.trigger('change')

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          name: 'Sample Language Course',
          description: 'Fictional course used in automated tests',
          image: file
        }
      ]
    ])
  })
})
