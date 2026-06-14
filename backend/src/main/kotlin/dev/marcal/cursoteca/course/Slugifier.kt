package dev.marcal.cursoteca.course

import java.text.Normalizer

object Slugifier {
    private val nonSpacingMarks = "\\p{M}+".toRegex()
    private val invalidChars = "[^a-z0-9]+".toRegex()
    private val trimDashes = "^-+|-+$".toRegex()

    fun slugify(value: String): String {
        val normalized =
            Normalizer
                .normalize(value.trim(), Normalizer.Form.NFD)
                .replace(nonSpacingMarks, "")
                .lowercase()
                .replace(invalidChars, "-")
                .replace(trimDashes, "")

        return normalized.ifBlank { "curso" }
    }
}
