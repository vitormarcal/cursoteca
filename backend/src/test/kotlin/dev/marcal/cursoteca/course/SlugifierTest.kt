package dev.marcal.cursoteca.course

import kotlin.test.Test
import kotlin.test.assertEquals

class SlugifierTest {
	@Test
	fun `normalizes accented names and punctuation`() {
		assertEquals("curso-de-gramatica-integral-professor-jorge-miguel", Slugifier.slugify("Curso de Gramática Integral – Professor Jorge Miguel"))
	}

	@Test
	fun `falls back for blank input`() {
		assertEquals("curso", Slugifier.slugify("   "))
	}
}
