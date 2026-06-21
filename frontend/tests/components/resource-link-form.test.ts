import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ResourceLinkForm from '../../app/components/ResourceLinkForm.vue'

describe('ResourceLinkForm', () => {
  it('emits normalized target identifiers from selected scope', async () => {
    const wrapper = await mountSuspended(ResourceLinkForm, {
      props: {
        targets: [
          { scope: 'COURSE', label: 'Course' },
          { scope: 'LESSON', lessonId: 7, label: 'Lesson' }
        ]
      }
    })

    await wrapper.find('select[name="resourceTarget"]').setValue('1')
    await wrapper.find('input[name="resourceTitle"]').setValue('Reference')
    await wrapper.find('input[name="resourceUrl"]').setValue('https://example.com')
    await wrapper.find('textarea[name="resourceDescription"]').setValue('Description')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[
      {
        scope: 'LESSON',
        sectionId: null,
        lessonId: 7,
        title: 'Reference',
        description: 'Description',
        url: 'https://example.com'
      }
    ]])
  })
})
