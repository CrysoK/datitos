<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { 
  X, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  AlertCircle,
  Package,
  ExternalLink as GithubIcon
} from 'lucide-vue-next';
import type { Pack } from '../types';
import { _, getGithubEditUrl } from '../utils';
import { SUPPORTED_SCHEMA_VERSION } from '../services/packService';

const props = defineProps<{
  show: boolean;
  country: string;
  company: string;
  type: 'prepaid' | 'postpaid';
  initialPacks: Pack[];
}>();

defineEmits(['close']);

const localPacks = ref<Pack[]>([]);
const copied = ref(false);
const error = ref('');

watch(() => props.show, (newVal) => {
  if (newVal) {
    localPacks.value = JSON.parse(JSON.stringify(props.initialPacks)).map((p: Pack) => ({
      ...p,
      id: p.id || Math.random()
    }));
    error.value = '';
  }
});

const addPack = () => {
  localPacks.value.push({
    id: Math.random(),
    company: props.company,
    country: props.country,
    type: props.type,
    mb: 0,
    price: 0,
    days: 0,
    comment: ''
  });
};

const removePack = (id: number | undefined) => {
  localPacks.value = localPacks.value.filter(p => p.id !== id);
};

const generatedJson = computed(() => {
  const packs = localPacks.value.map(({ mb, price, days, comment }) => ({
    mb,
    days,
    price,
    comment: comment || undefined
  }));

  const currencyMap: Record<string, string> = {
    'AR': 'ARS',
    'CL': 'CLP',
    'UY': 'UYU',
    'MX': 'MXN'
  };

  return JSON.stringify({
    schema_version: SUPPORTED_SCHEMA_VERSION,
    updated_at: new Date().toISOString(),
    currency: currencyMap[props.country] || 'USD',
    packs
  }, null, 2);
});

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(generatedJson.value);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  } catch (err) {
    error.value = 'No se pudo copiar al portapapeles';
  }
};

const openGithub = () => {
  copyJson();
  const url = getGithubEditUrl(props.country, props.company, props.type);
  window.open(url, '_blank');
};
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <header class="modal-header">
          <div class="header-info">
            <Package :size="24" class="header-icon" />
            <div>
              <h3>Colaborar con {{ company }}</h3>
              <p>{{ _(country) }} • {{ _(type) }}</p>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')">
            <X :size="20" />
          </button>
        </header>

        <div class="modal-body">
          <div class="instructions">
            <p>Ajustá los packs comunitarios. Al terminar, hacé clic en el botón para copiarlos y proponer el PR en GitHub.</p>
          </div>

          <div class="packs-editor">
            <div v-for="pack in localPacks" :key="pack.id" class="pack-row">
              <div class="row-inputs">
                <div class="input-field shrink">
                  <label>MB</label>
                  <input type="number" v-model.number="pack.mb" placeholder="MB">
                </div>
                <div class="input-field shrink">
                  <label>Días</label>
                  <input type="number" v-model.number="pack.days" placeholder="Días">
                </div>
                <div class="input-field">
                  <label>Precio</label>
                  <input type="number" v-model.number="pack.price" placeholder="Precio">
                </div>
                <div class="input-field comment">
                  <label>Comentario</label>
                  <input type="text" v-model="pack.comment" placeholder="Opcional">
                </div>
              </div>
              <button class="remove-btn" @click="removePack(pack.id)">
                <Trash2 :size="16" />
              </button>
            </div>

            <button class="add-btn" @click="addPack">
              <Plus :size="16" />
              Agregar Pack
            </button>
          </div>

          <div class="preview-section">
            <label>Vista previa del JSON:</label>
            <pre><code>{{ generatedJson }}</code></pre>
          </div>
        </div>

        <footer class="modal-footer">
          <p v-if="error" class="error-msg"><AlertCircle :size="16" /> {{ error }}</p>
          <div class="actions">
            <button class="secondary-btn" @click="copyJson">
              <component :is="copied ? Check : Copy" :size="18" />
              {{ copied ? 'Copiado' : 'Copiar JSON' }}
            </button>
            <button class="primary-btn github-btn" @click="openGithub">
              <GithubIcon :size="18" />
              Copiar y enviar PR
            </button>
          </div>
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
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
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
}

.close-btn:hover {
  background: #f1f5f9;
  color: var(--color-texto);
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.instructions {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  font-size: 0.9375rem;
  color: #1e40af;
  line-height: 1.5;
}

.packs-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.pack-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-borde);
}

.row-inputs {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}

.input-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
}

.input-field.shrink {
  flex: 0 0 100px;
}

.input-field.comment {
  flex: 2;
}

.input-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-texto-muted);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.input-field input {
  padding: 0.5rem 0.75rem;
}

.remove-btn {
  background: transparent;
  color: var(--color-peligro);
  padding: 0.5rem;
  margin-bottom: 2px;
}

.remove-btn:hover {
  background: #fee2e2;
}

.add-btn {
  align-self: flex-start;
  background: white;
  border: 2px dashed var(--color-borde);
  color: var(--color-texto-muted);
  width: 100%;
}

.add-btn:hover {
  border-color: var(--color-primario);
  color: var(--color-primario);
  background: #f5f3ff;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-section label {
  font-weight: 600;
  font-size: 0.875rem;
}

.preview-section pre {
  background: #1e293b;
  color: #f8fafc;
  padding: 1rem;
  border-radius: 0.75rem;
  font-size: 0.8125rem;
  overflow-x: auto;
  max-height: 200px;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--color-borde);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
}

.error-msg {
  color: var(--color-peligro);
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: auto;
}

.actions {
  display: flex;
  gap: 1rem;
}

.primary-btn {
  background: var(--color-primario);
  color: white;
}

.primary-btn:hover {
  background: var(--color-primario-hover);
  transform: translateY(-1px);
}

.github-btn {
  background: #24292f;
}

.github-btn:hover {
  background: #000;
}

.secondary-btn {
  background: white;
  border: 1px solid var(--color-borde);
  color: var(--color-texto);
}

.secondary-btn:hover {
  background: #f1f5f9;
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .row-inputs {
    flex-direction: column;
  }
  .input-field.shrink {
    flex: 1;
  }
}
</style>
