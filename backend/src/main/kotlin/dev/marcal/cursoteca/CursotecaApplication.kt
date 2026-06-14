package dev.marcal.cursoteca

import dev.marcal.cursoteca.assets.AssetsProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
@EnableConfigurationProperties(AssetsProperties::class)
class CursotecaApplication

fun main(args: Array<String>) {
	runApplication<CursotecaApplication>(*args)
}
