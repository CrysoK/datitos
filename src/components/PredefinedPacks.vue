<template>
  <div class="predefined-container">
    <div class="section-header">
      <h3>Comparar Packs</h3>
      <div class="header-btns">
        <button class="filter-toggle-btn" :class="{ 'active': showFilters }" @click="toggleFilters">
          <Filter :size="16" />
          <span>Filtros</span>
          <ChevronDown v-if="!showFilters" :size="16" />
          <ChevronUp v-else :size="16" />
        </button>
        <button class="refresh-btn" :class="{ loading }" @click="$emit('refresh-predefined')" :disabled="loading">
          <RefreshCw :size="16" :class="{ 'spin': loading }" />
          {{ loading ? 'Actualizando...' : 'Actualizar' }}
        </button>
        <button class="nuevo-pack-btn" @click="$emit('nuevo-pack', { country: filters.country, company: filters.company, type: filters.offer })">
          <PlusCircle :size="16" />
          Nuevo pack
        </button>
      </div>
    </div>

    <div v-if="!showFilters" class="filter-summary-bar" @click="showFilters = true">
      <Filter :size="14" />
      <span>{{ filterSummary }}</span>
    </div>

    <div v-show="showFilters" class="filters-container">
      <div class="filter-group">
        <label>Origen:</label>
        <select v-model="filters.source">
          <option value="all">Todos</option>
          <option value="community">Comunidad</option>
          <option value="local">Propios</option>
        </select>
      </div>
      <div class="filter-group">
        <label>País:</label>
        <select v-model="filters.country">
          <option v-for="c in countries" :key="c" :value="c">{{ _(c) }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Compañía:</label>
        <select v-model="filters.company">
          <option :value="null">Todas</option>
          <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Lista:</label>
        <select v-model="filters.offer">
          <option :value="null">Todas</option>
          <option v-for="o in availableOffers" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading && predefinedPacks.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando datos desde GitHub...</p>
    </div>

    <div v-else-if="predefinedPacks.length === 0" class="empty-state">
      <AlertTriangle :size="48" />
      <p>No se encontraron packs precargados</p>
      <button class="retry-btn" @click="$emit('refresh-predefined')">Intentar cargar de nuevo</button>
    </div>

    <div v-if="filteredPacks.length === 0" class="empty-state">
      <AlertTriangle :size="48" />
      <p>No se encontraron packs para esta selección</p>
    </div>

    <div v-else>
      <div class="contribuir-container">
        <div class="aviso-reporte">
          ¿Encontraste datos incorrectos?
          <a href="#" @click.prevent="reportarError">Reportar error</a>
        </div>
        <button v-if="filters.company && filters.offer" class="reportar-btn colaborar-btn" @click="handleContribute">
          <Zap :size="16" />
          Actualizar datos comunitarios
        </button>
      </div>

      <div class="packs">
        <div v-for="(pack, index) in sortedPacks" :key="pack.id || index" class="pack-item" :class="{ 
          'best-value': index === 0,
          'pack-predefinido': pack.isCommunity,
          'pack-local': !pack.isCommunity
        }">
          <div v-if="index === 0" class="best-badge">Mejor opción</div>
          <div class="pack-info">
            <div class="pack-meta">
              <span v-if="!pack.isCommunity" class="propios-tag">Propio</span>
              <span class="compania-tag">{{ pack.company || 'Sin compañía' }}</span>
              <span v-if="pack.group" class="tipo-tag" :class="pack.type">{{ _(pack.group) }}</span>
            </div>
            <strong>${{ calcularCosto(pack, usoDiario, diasUso, diasRestantes).toFixed(2) }}</strong> -
            {{ pack.mb >= 1024 ? (pack.mb / 1024).toFixed(1) + 'GB' : pack.mb + 'MB' }} / 
            {{ pack.days === 0 ? 'Hasta renovación' : pack.days + ' días' }}
            <div v-if="pack.comment" class="comentario">
              <MessageSquare :size="14" />
              {{ pack.comment }}
            </div>
          </div>
          <div class="pack-acciones">
            <template v-if="pack.isCommunity">
              <button class="modificar-btn" @click="$emit('modificar-pack', pack)">
                <PencilLine :size="16" />
                Modificar
              </button>
            </template>
            <template v-else>
              <button class="editar-btn" @click="$emit('editar', pack)">
                <Pencil :size="16" />
                Editar
              </button>
              <button class="eliminar-btn" @click="$emit('eliminar', pack.id)">
                <Trash2 :size="16" />
                Eliminar
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { PropType } from 'vue'
import { Pencil, Trash2, PencilLine, AlertTriangle, MessageSquare, Zap, RefreshCw, PlusCircle, Filter, ChevronDown, ChevronUp } from 'lucide-vue-next'
import type { Pack } from '../types'
import { calcularCosto, _, detectUserCountry, guardarEnLocalStorage, cargarDesdeLocalStorage } from '../utils'

const props = defineProps({
  predefinedPacks: {
    type: Array as PropType<Pack[]>,
    required: true
  },
  localPacks: {
    type: Array as PropType<Pack[]>,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  usoDiario: {
    type: Number,
    required: true
  },
  diasUso: {
    type: Number,
    required: true
  },
  diasRestantes: {
    type: Number,
    default: 30
  }
})

const emit = defineEmits(['modificar-pack', 'editar', 'eliminar', 'nuevo-pack', 'reportar-pack', 'contribuir-pack', 'refresh-predefined'])

const filters = ref({
  source: 'all' as 'all' | 'community' | 'local',
  country: detectUserCountry(),
  company: null as string | null,
  offer: null as string | null
})

const showFilters = ref(window.innerWidth > 768)
const toggleFilters = () => showFilters.value = !showFilters.value

// Persistence
onMounted(() => {
  const savedFilters = cargarDesdeLocalStorage<{ source: string; country: string; company: string | null; offer: string | null }>('predefined_filters')
  if (savedFilters) {
    if (savedFilters.source) filters.value.source = savedFilters.source as any
    if (savedFilters.country) filters.value.country = savedFilters.country
    filters.value.company = savedFilters.company
    filters.value.offer = savedFilters.offer
  }
})

watch(filters, (newVal) => {
  guardarEnLocalStorage('predefined_filters', newVal)
}, { deep: true })

// Reset company/offer if country/company changes
watch(() => filters.value.country, () => {
  if (filters.value.company && !companies.value.includes(filters.value.company)) {
    filters.value.company = null
  }
})

watch(() => filters.value.company, () => {
  // We reset offer when company changes to avoid invalid combinations
  filters.value.offer = null
})

const countries = computed(() => {
  const c1 = props.predefinedPacks.map(p => p.country)
  const c2 = props.localPacks.map(p => p.country)
  return [...new Set([...c1, ...c2].filter(Boolean))] as string[]
})

const companies = computed(() => {
  const c1 = props.predefinedPacks
    .filter(p => p.country === filters.value.country)
    .map(p => p.company)
  const c2 = props.localPacks
    .filter(p => p.country === filters.value.country)
    .map(p => p.company)
  return [...new Set([...c1, ...c2])] as string[]
})


const allPacksCombined = computed(() => {
  const community = props.predefinedPacks.map(p => ({ ...p, isCommunity: true }))
  const local = props.localPacks.map(p => ({ ...p, isCommunity: false }))
  
  if (filters.value.source === 'community') return community
  if (filters.value.source === 'local') return local
  return [...community, ...local]
})

const availableOffers = computed(() => {
  const packs = allPacksCombined.value.filter(p => 
    p.country === filters.value.country && 
    (!filters.value.company || p.company === filters.value.company)
  )
  
  if (!filters.value.company) {
    const types = [...new Set(packs.map(p => p.type))].filter(Boolean) as string[]
    return types.map(t => ({ value: t, label: _(t) }))
  } else {
    const groups = [...new Set(packs.map(p => p.group))].filter(Boolean) as string[]
    return groups.map(g => ({ value: g, label: _(g) }))
  }
})

const filteredPacks = computed(() => {
  return allPacksCombined.value.filter(p => {
    const countryMatch = p.country === filters.value.country
    const companyMatch = !filters.value.company || p.company === filters.value.company
    
    let offerMatch = true
    if (filters.value.offer) {
      if (!filters.value.company) {
        offerMatch = p.type === filters.value.offer
      } else {
        offerMatch = p.group === filters.value.offer
      }
    }
    
    return countryMatch && companyMatch && offerMatch
  })
})

const sortedPacks = computed(() => {
  return [...filteredPacks.value].sort((a, b) => {
    return calcularCosto(a, props.usoDiario, props.diasUso, props.diasRestantes) -
      calcularCosto(b, props.usoDiario, props.diasUso, props.diasRestantes)
  })
})

const reportarError = () => {
  window.open('https://github.com/CrysoK/datitos-packs/issues/new', '_blank')
}

const handleContribute = () => {
  const communityPack = filteredPacks.value.find(p => p.isCommunity)
  emit('contribuir-pack', {
    country: filters.value.country,
    company: filters.value.company,
    type: filters.value.offer,
    packs: filteredPacks.value,
    path: communityPack?.path
  })
}

const filterSummary = computed(() => {
  const parts = []
  
  // Origen
  if (filters.value.source === 'community') parts.push('Comunidad')
  else if (filters.value.source === 'local') parts.push('Propios')
  
  if (filters.value.country) parts.push(_(filters.value.country))
  if (filters.value.company) parts.push(filters.value.company)
  if (filters.value.offer) {
    const label = availableOffers.value.find(o => o.value === filters.value.offer)?.label
    if (label) parts.push(label)
  }
  
  if (parts.length === 0) return 'Todos los packs'
  return parts.join(' • ')
})
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h3 {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.header-btns {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-toggle-btn {
  background: white;
  border: 1px solid var(--color-borde);
  color: var(--color-texto);
  padding: 0.5rem 0.75rem;
  white-space: nowrap;
}

.filter-toggle-btn:hover {
  background: #f8fafc;
  border-color: var(--color-primario);
  color: var(--color-primario);
}

.filter-toggle-btn.active {
  background: #eef2ff;
  border-color: var(--color-primario);
  color: var(--color-primario);
}

.filter-summary-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: var(--color-texto-muted);
  transition: all 0.2s;
}

.filter-summary-bar:hover {
  background: #f1f5f9;
  border-color: var(--color-borde);
  color: var(--color-texto);
}

.filter-summary-bar span {
  font-weight: 600;
  color: var(--color-primario);
}

@media (max-width: 640px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-btns {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .nuevo-pack-btn {
    grid-column: span 2;
    order: 1;
  }
  
  .filter-toggle-btn {
    order: 2;
  }
  
  .refresh-btn {
    order: 3;
  }
  
  .filter-toggle-btn, .refresh-btn, .nuevo-pack-btn {
    width: 100%;
    margin: 0;
  }
}

.nuevo-pack-btn {
  background: var(--color-primario);
  color: white;
  padding: 0.5rem 1rem;
  white-space: nowrap;
}

.nuevo-pack-btn:hover {
  background: var(--color-primario-hover);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-texto-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--color-texto-muted);
  text-align: center;
  gap: 1rem;
}

.empty-state p {
  font-size: 1.125rem;
  font-weight: 500;
  max-width: 300px;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.filters-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
}

@media (max-width: 640px) {
  .filters-container {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-group label {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.8;
  color: var(--color-texto);
}

.filter-group select {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--color-borde);
  background: white;
  color: var(--color-texto);
  width: 100%;
  max-width: 100%;
  text-overflow: ellipsis;
  outline: none;
}

.aviso-reporte {
  text-align: left;
  font-size: 0.875rem;
  color: var(--color-texto-muted);
  white-space: nowrap;
  margin: 0;
}

.contribuir-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 1rem;
  border: 1px solid var(--color-borde);
  gap: 1.5rem;
  flex-wrap: wrap;
}

.colaborar-btn {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
  padding: 0.5rem 1rem;
}

.colaborar-btn:hover {
  background: #dcfce7;
  border-color: #86efac;
}

@media (max-width: 640px) {
  .contribuir-container {
    flex-direction: column;
    align-items: stretch;
  }
  .aviso-reporte {
    text-align: left;
  }
}

.propios-tag {
  padding: 0.125rem 0.5rem;
  background: #fef9c3;
  color: #854d0e;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 2rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modificar-btn {
  background: #f1f5f9;
  color: var(--color-texto);
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.modificar-btn:hover {
  background: #e2e8f0;
}

.pack-local {
  border-left: 4px solid #eab308;
}
</style>
