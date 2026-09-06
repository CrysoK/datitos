<script setup lang="ts">
import { Smartphone, X } from 'lucide-vue-next'
import { useInstallPrompt } from '../composables/useInstallPrompt'
import { useOnlineStatus } from '../composables/useOnlineStatus'

const { visible, canPrompt, dismiss, install } = useInstallPrompt()
const { isOnline } = useOnlineStatus()
</script>

<template>
  <aside v-if="visible && isOnline" class="install-hint" role="note">
    <Smartphone :size="16" class="hint-icon" aria-hidden="true" />
    <p v-if="canPrompt">Instalar para usar sin datos</p>
    <p v-else>En Safari: Compartir → Agregar a inicio.</p>
    <button v-if="canPrompt" type="button" class="install-btn" @click="install">
      Instalar
    </button>
    <button type="button" class="dismiss-btn" aria-label="Cerrar aviso de instalación" @click="dismiss">
      <X :size="16" />
    </button>
  </aside>
</template>

<style scoped>
.install-hint {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0.75rem;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 0.75rem;
  color: #3730a3;
  font-size: 0.8125rem;
}

.hint-icon {
  flex-shrink: 0;
}

.install-hint p {
  flex: 1;
  margin: 0;
  line-height: 1.35;
  min-width: 0;
}

.install-btn {
  flex-shrink: 0;
  background: var(--color-primario);
  color: white;
  border: none;
  border-radius: 0.625rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.install-btn:hover {
  background: var(--color-primario-hover);
}

.dismiss-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: #4338ca;
  cursor: pointer;
}

.dismiss-btn:hover {
  background: #e0e7ff;
}
</style>
