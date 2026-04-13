<script setup lang="ts">
import { Settings2 } from 'lucide-vue-next'

defineProps<{
  usoDiario: number;
  diasUso: number;
  diaRenovacion: number;
  diasRestantes: number;
}>()

const emit = defineEmits<{
  (e: 'update:uso-diario', value: number): void
  (e: 'update:dias-uso', value: number): void
  (e: 'update:dia-renovacion', value: number): void
}>()

const actualizarUsoDiario = (event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  emit('update:uso-diario', value)
}

const actualizarDiasUso = (event: Event) => {
  const value = parseInt((event.target as HTMLInputElement).value)
  emit('update:dias-uso', value)
}

const actualizarDiaRenovacion = (event: Event) => {
  let value = parseInt((event.target as HTMLInputElement).value)
  if (value < 1) value = 1
  if (value > 31) value = 31
  emit('update:dia-renovacion', value)
}
</script>

<template>
  <div class="configuracion-global">
    <h2>
      <Settings2 :size="20" />
      Configuración de uso
    </h2>
    <div class="input-group">
      <label>Uso diario (MB):</label>
      <input
        type="number"
        :value="usoDiario"
        @input="actualizarUsoDiario($event)"
      >
    </div>
    
    <div class="input-group">
      <label>Días necesarios:</label>
      <input
        type="number"
        :value="diasUso"
        @input="actualizarDiasUso($event)"
      >
    </div>

    <div class="input-group">
      <label>Día de renovación:</label>
      <input
        type="number"
        min="1"
        max="31"
        :value="diaRenovacion"
        @input="actualizarDiaRenovacion($event)"
      >
      <span class="hint">Faltan <b>{{ diasRestantes }}</b> días</span>
    </div>
  </div>
</template>

<style scoped>
.input-with-hint {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hint {
  font-size: 0.875rem;
  color: var(--color-texto-muted);
}

.hint b {
  color: var(--color-primary);
}
</style>
