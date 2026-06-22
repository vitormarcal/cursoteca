import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ResourceFileForm from '../../app/components/ResourceFileForm.vue'

describe('ResourceFileForm', () => {
  it('emits selected target and file', async () => {
    const wrapper = await mountSuspended(ResourceFileForm, {
      props: {
        targets: [{ scope: 'SECTION', sectionId: 10, label: 'Module' }]
      }
    })
    const file = new File(['audio'], 'audio.mp3', { type: 'audio/mpeg' })
    const input = wrapper.find<HTMLInputElement>('input[name="resourceFile"]')
    Object.defineProperty(input.element, 'files', { value: [file] })

    await wrapper.find('input[name="fileTitle"]').setValue('Audio lesson')
    await wrapper.find('textarea[name="fileDescription"]').setValue('Transcript audio')
    await input.trigger('change')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[
      {
        scope: 'SECTION',
        sectionId: 10,
        lessonId: null,
        title: 'Audio lesson',
        description: 'Transcript audio',
        file
      }
    ]])
  })
})
