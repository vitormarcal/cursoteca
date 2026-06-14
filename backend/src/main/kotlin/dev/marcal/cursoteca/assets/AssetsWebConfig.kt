package dev.marcal.cursoteca.assets

import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.nio.file.Path

@Configuration
class AssetsWebConfig(
    private val properties: AssetsProperties,
) : WebMvcConfigurer {
    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        val root = Path.of(properties.assetsDir).toAbsolutePath().normalize()
        registry
            .addResourceHandler("/assets/**")
            .addResourceLocations(root.toUri().toString())
    }
}
