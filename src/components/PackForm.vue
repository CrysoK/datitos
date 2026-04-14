<script setup lang="ts">
import { ref, watch } from 'vue';
import type { PropType } from 'vue';
import { Save, AlertCircle } from 'lucide-vue-next';
import type { Pack } from '../types';
import { defaultPack } from '@/utils';

const props = defineProps({
  pack: {
    type: Object as PropType<Pack>,
    required: true
  },
  editing: {
    type: Boolean,
    default: false
  },
  countries: {
    type: Object as PropType<Record<string, string>>,
    default: () => ({})
  }
})

const emit = defineEmits(['submit', 'reset']);

const localPack = ref<Pack>({ ...props.pack });
const mensaje = ref<{ texto: string; clase: string }>({ texto: '', clase: '' });

watch(() => props.pack, (newVal) => {
  localPack.value = { ...newVal };
})

const validateForm = (): boolean => {
  const camposValidos = 
    (localPack.value.price ?? 0) > 0 && 
    (localPack.value.mb ?? 0) > 0 && 
    (localPack.value.days ?? -1) >= 0;

  if (!camposValidos) {
    mensaje.value = {
      texto: 'Precio y MB deben ser > 0. Días debe ser >= 0.',
      clase: 'error'
    }
    setTimeout(() => { mensaje.value.texto = '' }, 3000)
    return false
  }
  return true
}

const handleSubmit = () => {
  if (!validateForm()) return
  emit('submit', localPack.value)
}

</script>

<template>
  <form v-bind="$attrs" @submit.prevent="handleSubmit">
    <div class="input-grid">
      <div class="input-group">
        <label for="pais">País:</label>
        <input 
          list="country-list" 
          id="pais" 
          v-model="localPack.country" 
          placeholder="Ej: AR, Argentina..."
          required
        >
        <datalist id="country-list">
          <option v-for="(name, code) in countries" :key="code" :value="code">{{ name }}</option>
        </datalist>
      </div>

      <div class="input-group">
        <label for="compania">Compañía (opcional):</label>
        <input type="text" id="compania" v-model="localPack.company" placeholder="Ej: Movistar">
      </div>
    </div>

    <div class="input-grid duo">
      <div class="input-group">
        <label for="precio">Precio:</label>
        <input type="number" id="precio" step="0.01" required v-model.number="localPack.price">
      </div>

      <div class="input-group">
        <label for="mb">Datos (MB):</label>
        <input type="number" id="mb" required v-model.number="localPack.mb">
      </div>
    </div>

    <div class="input-grid duo">
      <div class="input-group">
        <label for="dias">Duración (días):</label>
        <input type="number" id="dias" required v-model.number="localPack.days">
      </div>

      <div class="input-group">
        <label>Tipo de Plan:</label>
        <select v-model="localPack.type">
          <option :value="undefined">Sin especificar</option>
          <option value="prepaid">Prepago</option>
          <option value="postpaid">Abono / Pospago</option>
        </select>
      </div>
    </div>
    
    <div class="hint-container">
      <span class="hint-form">Usá <b>0</b> para "Hasta renovación del plan"</span>
    </div>

    <div class="input-group">
      <label for="grupo">Lista de packs (opcional):</label>
      <input type="text" id="grupo" v-model="localPack.group" placeholder="Ej: Standard, Gold, Turistas, etc.">
    </div>

    <div class="input-group">
      <label for="comentario">Comentario:</label>
      <textarea id="comentario" v-model="localPack.comment" rows="2" placeholder="Detalles adicionales..."></textarea>
    </div>

    <div v-if="mensaje.texto" class="resultado" :class="mensaje.clase">
      <AlertCircle :size="18" v-if="mensaje.clase === 'error'" />
      {{ mensaje.texto }}
    </div>
  </form>
</template>

<style scoped>
.input-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.input-grid.duo {
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 480px) {
  .input-grid.duo {
    grid-template-columns: 1fr;
  }
}

.input-group {
  margin-bottom: 1rem;
}

.hint-container {
  margin-top: -0.5rem;
  margin-bottom: 1rem;
}

.hint-form {
  font-size: 0.75rem;
  opacity: 0.7;
}

.hint-form b {
  color: var(--color-primario);
}

.resultado {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.resultado.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
</style>
