import { ref, watch, onMounted, computed } from 'vue'
import { guardarEnLocalStorage, cargarDesdeLocalStorage, defaultPack, calcularDiasHastaRenovacion, migrateLegacyData } from '../utils'
import type { Pack } from '../types'
import { packService } from '../services/packService'

export function usePacks() {
  const packs = ref<Pack[]>(cargarDesdeLocalStorage<Pack[]>('packs') || [])
  const cachedData = packService.getCachedPacks()
  const predefinedPacks = ref<Pack[]>(cachedData?.packs || [])
  const dataSchemaVersion = ref<number>(cachedData?.schemaVersion || 1)
  const loadingPredefined = ref(false)
  const usoDiarioGlobal = ref(300)
  const diasUsoGlobal = ref(30)
  const diaRenovacionGlobal = ref(1)
  const editingPack = ref<Pack>(defaultPack())

  const diasHastaRenovacion = computed(() => calcularDiasHastaRenovacion(diaRenovacionGlobal.value))

  // Cargar configuración inicial
  onMounted(() => {
    // Migración de datos desde versión vanilla
    const migrated = migrateLegacyData()
    if (migrated) {
      if (migrated.packs.length > 0) {
        packs.value = [...packs.value, ...migrated.packs]
        guardarEnLocalStorage('packs', packs.value)
      }
      if (migrated.config) {
        usoDiarioGlobal.value = migrated.config.usoDiario
        diaRenovacionGlobal.value = migrated.config.diaRenovacion
        // La persistencia se encargará el watcher, pero aseguramos estado inicial
      }
    }

    const config = cargarDesdeLocalStorage<{ usoDiario: number; diasUso: number; diaRenovacion: number }>('config')
    if (config) {
      usoDiarioGlobal.value = config.usoDiario || 300
      diasUsoGlobal.value = config.diasUso || 30
      diaRenovacionGlobal.value = config.diaRenovacion || 1
    }

    if (predefinedPacks.value.length === 0) {
      refreshPredefinedPacks()
    }
  })

  // Persistencia de configuración
  watch([usoDiarioGlobal, diasUsoGlobal, diaRenovacionGlobal], ([nuevoUso, nuevosDias, nuevaRenovacion]) => {
    guardarEnLocalStorage('config', {
      usoDiario: nuevoUso,
      diasUso: nuevosDias,
      diaRenovacion: nuevaRenovacion
    })
  })

  // Handlers
  const savePack = (pack: Pack) => {
    const index = packs.value.findIndex((p) => p.id === pack.id)
    if (index === -1) {
      packs.value.push({ ...pack, id: Date.now() })
    } else {
      packs.value.splice(index, 1, pack)
    }
    guardarEnLocalStorage('packs', packs.value)
    editingPack.value = defaultPack()
  }

  const deletePack = (id: number) => {
    packs.value = packs.value.filter((p) => p.id !== id)
    guardarEnLocalStorage('packs', packs.value)
  }

  const setEditingPack = (pack: Pack) => {
    editingPack.value = { ...pack }
  }

  const resetEditingPack = () => {
    editingPack.value = defaultPack()
  }

  const refreshPredefinedPacks = async () => {
    loadingPredefined.value = true
    try {
      const { packs: data, schemaVersion } = await packService.fetchAllPacks()
      if (data.length > 0) {
        predefinedPacks.value = data
        dataSchemaVersion.value = schemaVersion
        packService.saveToCache(data, schemaVersion)
      }
    } finally {
      loadingPredefined.value = false
    }
  }

  return {
    packs,
    predefinedPacks,
    dataSchemaVersion,
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
  }
}
