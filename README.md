# 📱 Datitos

**Datitos** es una aplicación web diseñada para comparar y calcular el costo real de los packs de datos móviles. Te ayuda a optimizar tu consumo y ahorrar dinero sugiriéndote la opción que mejor se adapta a tus necesidades reales de navegación.

## ✨ Características principales

- 🧮 **Cálculo inteligente:** Calcula el costo real basándose en tu uso diario de datos (MB) y la cantidad de días que necesitas cobertura.
- 🏆 **Mejor opción:** Destaca automáticamente el pack más económico según tu perfil de consumo.
- 📦 **Packs comunitarios:** Base de datos precargada de compañías en varios países (Argentina, Chile, Uruguay, México, etc.). Los datos se obtienen del repositorio [`datitos-packs`](https://github.com/CrysoK/datitos-packs).
- ➕ **Packs personalizados:** Permite crear y evaluar packs de forma local. Es ideal para cuando las listas comunitarias están desactualizadas, o para calcular ofertas especiales que te ofrezca tu compañía y no figuren en el sistema.
- 🤝 **Colaboración integrada:** Herramienta visual incorporada para modificar precios desactualizados, generar el JSON automáticamente y enviar la actualización al repositorio de datos.
- 📱 **Diseño responsivo y PWA:** Interfaz moderna, rápida, adaptable a móviles e instalable como aplicación nativa.

## 🧠 ¿Cómo funciona el cálculo?

El motor de Datitos toma 3 variables clave definidas por el usuario:
1. Uso diario promedio (MB)
2. Días de uso necesarios
3. Día de renovación del plan (para calcular los días restantes)

Luego, evalúa cada pack disponible:
- Calcula cuántos datos provee el pack por día.
- Si el pack *no alcanza* para tu uso diario, calcula cuántas veces tendrías que comprar o recargar ese mismo pack para cubrir los días que necesitas.
- Finalmente, multiplica la cantidad de recargas por el precio del pack para darte el **costo total real**.

## 🤝 Cómo colaborar con los datos

¡La base de datos de Datitos se mantiene al día gracias a los usuarios! No necesitas saber programar para ayudar a actualizar los precios o agregar nuevos planes.

Desde la misma aplicación web:
1. Selecciona la compañía que deseas actualizar.
2. Haz clic en el botón **Actualizar datos comunitarios**.
3. En el modal que se abre, ajusta los precios, megas o duración de los packs.
4. Utiliza el botón final para copiar el JSON generado o ir directamente a GitHub para enviar la actualización (*Pull Request*).

Repositorio de datos: [`datitos-packs`](https://github.com/CrysoK/datitos-packs)

## 🚀 Instalación local

Si deseas correr el proyecto en tu máquina local para visualizar la aplicación:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/datitos.git
   cd datitos
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible en `http://localhost:5173`*

## 🛠️ Tecnologías y arquitectura

Este proyecto está construido con herramientas web modernas:
- **Core:** Vue 3 (Composition API + `<script setup>`) y TypeScript.
- **Build tool:** Vite.
- **Testing:** Vitest + Vue Test Utils.
- **Estilos:** CSS puro responsivo (variables CSS, Flexbox/Grid).

### Estructura principal:
- `src/components/`: Componentes reutilizables (modales, formularios, tarjetas).
- `src/composables/usePacks.ts`: Lógica de estado para el manejo, edición y guardado local de packs en el navegador (`localStorage`).
- `src/services/packService.ts`: Servicio encargado de conectarse a GitHub para descargar y cachear los manifiestos y la base de datos de packs comunitarios.
- `src/utils.ts`: Funciones puras de cálculo (`calcularCosto`), manejo de fechas y utilidades generales.
