// App.vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Settings2 } from 'lucide-vue-next'

import ConfigModal from './components/ConfigModal.vue'
import PackForm from './components/PackForm.vue'
import PredefinedPacks from './components/PredefinedPacks.vue'
import PackContributorModal from './components/PackContributorModal.vue'
import NotFound from './components/NotFound.vue'
import { usePacks } from './composables/usePacks'
import type { Pack } from './types'

const route = useRoute();
const isNotFound = computed(() => route.name === 'NotFound');

const showConfigModal = ref(false);
const showPackModal = ref(false);
const showContributorModal = ref(false);

const contributorData = ref({
  country: '',
  company: '',
  type: 'prepaid' as 'prepaid' | 'postpaid',
  packs: [] as Pack[]
});

const {
  packs,
  predefinedPacks,
  loadingPredefined,
  usoDiarioGlobal,
  diasUsoGlobal,
  diaRenovacionGlobal,
  diasHastaRenovacion,
  editingPack,
  savePack,
  deletePack,
  setEditingPack,
  resetEditingPack,
  refreshPredefinedPacks
} = usePacks()

const openContributorModal = (data: any) => {
  contributorData.value = data;
  showContributorModal.value = true;
};

const openPackModal = (pack?: Pack, initialData?: Partial<Pack>) => {
  if (pack && (pack as any).isCommunity) {
    // Si viene de la comunidad, es un clon (Nuevo Pack)
    resetEditingPack();
    const { id, ...rest } = pack;
    editingPack.value = { ...editingPack.value, ...rest };
  } else if (pack) {
    // Editando uno local ya existente
    setEditingPack(pack);
  } else {
    resetEditingPack();
    if (initialData) {
      editingPack.value = { 
        ...editingPack.value, 
        ...initialData,
        company: initialData.company || ''
      };
    }
  }
  showPackModal.value = true;
};

const handleSavePack = (pack: Pack) => {
  savePack(pack);
  showPackModal.value = false;
};

const appVersion = __APP_VERSION__
</script>

<template>
  <div class="container">
    <header>
      <div class="brand">
        <h1>
          <RouterLink to="/">Datitos</RouterLink>
        </h1>
        <h2>Conocé qué <i>pack</i> te conviene más</h2>
      </div>
      <div class="header-actions">
        <button class="config-trigger" @click="showConfigModal = true">
          <Settings2 :size="18" />
          <span>Configurar uso</span>
        </button>
        <span class="version-tag">v{{ appVersion }}</span>
      </div>
    </header>

    <main v-if="isNotFound">
      <NotFound />
    </main>
    <main v-else class="main-content">
      <PredefinedPacks 
        :predefinedPacks="predefinedPacks"
        :localPacks="packs"
        :loading="loadingPredefined"
        :uso-diario="usoDiarioGlobal"
        :dias-uso="diasUsoGlobal"
        :dias-restantes="diasHastaRenovacion"
        @editar="openPackModal" 
        @eliminar="deletePack"
        @modificar-pack="openPackModal"
        @nuevo-pack="data => openPackModal(undefined, data)"
        @contribuir-pack="openContributorModal"
        @refresh-predefined="refreshPredefinedPacks" 
      />

      <!-- Modales -->
      <ConfigModal 
        :show="showConfigModal"
        :uso-diario="usoDiarioGlobal"
        :dias-uso="diasUsoGlobal"
        :dia-renovacion="diaRenovacionGlobal"
        :dias-restantes="diasHastaRenovacion"
        @close="showConfigModal = false"
        @update:uso-diario="v => usoDiarioGlobal = v"
        @update:dias-uso="v => diasUsoGlobal = v"
        @update:dia-renovacion="v => diaRenovacionGlobal = v"
      />

      <div v-if="showPackModal" class="modal-overlay" @click.self="showPackModal = false">
        <div class="modal-content pack-modal">
          <header class="modal-header">
            <div class="header-info">
              <h3>{{ editingPack.id ? 'Editar Pack' : 'Nuevo Pack' }}</h3>
              <p v-if="editingPack.company">{{ editingPack.company }} • {{ editingPack.country }}</p>
            </div>
            <button class="close-btn" @click="showPackModal = false">&times;</button>
          </header>
          
          <div class="modal-body">
            <PackForm 
              id="pack-form-element"
              :pack="editingPack"
              :editing="!!editingPack.id"
              @submit="handleSavePack" 
              @reset="() => { resetEditingPack(); showPackModal = false }"
            />
          </div>

          <footer class="modal-footer">
            <button type="button" @click="() => { resetEditingPack(); showPackModal = false }" class="secondary-btn">
              Cancelar
            </button>
            <button type="submit" form="pack-form-element" class="primary-btn">
              {{ editingPack.id ? 'Actualizar' : 'Guardar' }}
            </button>
          </footer>
        </div>
      </div>

      <PackContributorModal 
        :show="showContributorModal" 
        v-bind="contributorData" 
        :initial-packs="contributorData.packs"
        @close="showContributorModal = false" 
      />
    </main>

  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--color-card);
  border-radius: var(--radius);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  box-shadow: var(--shadow-lg);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.header-info h3 {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-texto);
}

.header-info p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-texto-muted);
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--color-borde);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
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
}

.secondary-btn {
  background: white;
  border: 1px solid var(--color-borde);
  color: var(--color-texto);
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  color: var(--color-texto-muted);
}

</style>
