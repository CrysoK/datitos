<script setup lang="ts">
import { X, Settings2, Calendar, HardDrive, Clock } from 'lucide-vue-next'

defineProps<{
  show: boolean;
  usoDiario: number;
  diasUso: number;
  diaRenovacion: number;
  diasRestantes: number;
}>()

const emit = defineEmits<{
  (e: 'close'): void
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
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <header class="modal-header">
          <div class="header-info">
            <Settings2 :size="24" class="header-icon" />
            <div>
              <h3>Configuración de uso</h3>
              <p>Personalizá tus necesidades para comparar packs</p>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')">
            <X :size="20" />
          </button>
        </header>

        <div class="modal-body">
          <div class="config-grid">
            <div class="input-card">
              <div class="card-icon">
                <HardDrive :size="20" />
              </div>
              <div class="card-content">
                <label>Uso diario promedio</label>
                <div class="input-wrapper">
                  <input
                    type="number"
                    :value="usoDiario"
                    @input="actualizarUsoDiario($event)"
                  >
                  <span class="unit">MB</span>
                </div>
                <p class="description">Consumo de datos por día</p>
              </div>
            </div>

            <div class="input-card">
              <div class="card-icon">
                <Calendar :size="20" />
              </div>
              <div class="card-content">
                <label>Días de uso necesarios</label>
                <div class="input-wrapper">
                  <input
                    type="number"
                    :value="diasUso"
                    @input="actualizarDiasUso($event)"
                  >
                  <span class="unit">Días</span>
                </div>
                <p class="description">Duración total solicitada</p>
              </div>
            </div>

            <div class="input-card">
              <div class="card-icon">
                <Clock :size="20" />
              </div>
              <div class="card-content">
                <label>Día de renovación</label>
                <div class="input-wrapper">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    :value="diaRenovacion"
                    @input="actualizarDiaRenovacion($event)"
                  >
                  <span class="unit">de cada mes</span>
                </div>
                <p class="description">Faltan <b>{{ diasRestantes }}</b> días para renovar</p>
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="primary-btn" @click="$emit('close')">
            Listo
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-borde);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  margin-bottom: 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  color: var(--color-primario);
  background: #eef2ff;
  padding: 0.5rem;
  border-radius: 0.75rem;
  width: 40px;
  height: 40px;
}

.modal-header h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-texto);
}

.modal-header p {
  font-size: 0.875rem;
  color: var(--color-texto-muted);
}

.close-btn {
  background: transparent;
  color: var(--color-texto-muted);
  padding: 0.5rem;
  border: none;
  cursor: pointer;
  border-radius: 0.5rem;
  display: flex;
}

.close-btn:hover {
  background: #f1f5f9;
  color: var(--color-texto);
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
}

.config-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-card {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding: 1.25rem;
  border-radius: 1rem;
  background: #f8fafc;
  border: 1px solid var(--color-borde);
  transition: all 0.2s;
}

.input-card:focus-within {
  border-color: var(--color-primario);
  background: white;
  box-shadow: var(--shadow);
}

.card-icon {
  background: white;
  color: var(--color-primario);
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-borde);
  display: flex;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-content label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-texto-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.input-wrapper {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.input-wrapper input {
  font-family: 'Outfit', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-texto);
  background: transparent;
  border: none;
  width: auto;
  min-width: 2ch;
  max-width: 120px;
  padding: 0;
}

.input-wrapper input:focus {
  outline: none;
}

.unit {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-texto-muted);
  opacity: 0.7;
}

.description {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-texto-muted);
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--color-borde);
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
}

.primary-btn {
  background: var(--color-primario);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.75rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  background: var(--color-primario-hover);
  transform: translateY(-1px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .modal-content {
    max-height: 95vh;
  }
}
</style>
