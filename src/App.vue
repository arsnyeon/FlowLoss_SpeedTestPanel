<script setup lang="ts">
import { NConfigProvider, NMessageProvider, darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const appStore = useAppStore()
const theme = computed(() => appStore.isDark ? darkTheme : null)

onMounted(() => {
  appStore.initTheme()
})

const lightOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#000000',
    primaryColorHover: '#1A1A1A',
    primaryColorPressed: '#000000',
    primaryColorSuppl: '#3B82F6',
    borderRadius: '6px',
    borderRadiusSmall: '4px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'Geist Mono', 'JetBrains Mono', 'SF Mono', Menlo, monospace",
    fontSize: '14px',
    textColor1: '#000000',
    textColor2: '#000000',
    textColor3: '#666666',
    dividerColor: '#EAEAEA',
    hoverColor: '#F5F5F5',
    borderColor: '#EAEAEA',
    bodyColor: '#FAFAFA',
    cardColor: '#FFFFFF',
    inputColor: '#F5F5F5',
  },
  Button: {
    borderRadiusMedium: '6px',
    borderRadiusLarge: '6px',
    fontWeight: '500',
    fontWeightStrong: '500',
    textColorPrimary: '#FFFFFF',
    colorPrimary: '#000000',
    colorHoverPrimary: '#1A1A1A',
    colorPressedPrimary: '#000000',
    colorFocusPrimary: '#000000',
    borderPrimary: '1px solid #000000',
    borderHoverPrimary: '1px solid #1A1A1A',
    borderPressedPrimary: '1px solid #000000',
    borderFocusPrimary: '1px solid #000000',
    rippleColorPrimary: 'rgba(0, 0, 0, 0.1)',
  },
  Card: { borderRadius: '6px' },
  Tooltip: { borderRadius: '6px' },
  Pagination: { borderRadius: '4px' },
}

const darkOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#FFFFFF',
    primaryColorHover: '#EDEDED',
    primaryColorPressed: '#FFFFFF',
    primaryColorSuppl: '#3B82F6',
    borderRadius: '6px',
    borderRadiusSmall: '4px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'Geist Mono', 'JetBrains Mono', 'SF Mono', Menlo, monospace",
    fontSize: '14px',
    textColor1: '#EDEDED',
    textColor2: '#EDEDED',
    textColor3: '#A1A1A1',
    dividerColor: '#262626',
    hoverColor: '#1A1A1A',
    borderColor: '#262626',
    bodyColor: '#000000',
    cardColor: '#0A0A0A',
    modalColor: '#0A0A0A',
    popoverColor: '#111111',
    tableColor: '#0A0A0A',
    inputColor: '#1A1A1A',
    actionColor: '#1A1A1A',
  },
  Button: {
    borderRadiusMedium: '6px',
    borderRadiusLarge: '6px',
    fontWeight: '500',
    fontWeightStrong: '500',
    textColorPrimary: '#000000',
    colorPrimary: '#FFFFFF',
    colorHoverPrimary: '#EDEDED',
    colorPressedPrimary: '#FFFFFF',
    colorFocusPrimary: '#FFFFFF',
    borderPrimary: '1px solid #FFFFFF',
    borderHoverPrimary: '1px solid #EDEDED',
    borderPressedPrimary: '1px solid #FFFFFF',
    borderFocusPrimary: '1px solid #FFFFFF',
    rippleColorPrimary: 'rgba(255, 255, 255, 0.1)',
  },
  Card: { borderRadius: '10px', color: '#0A0A0A' },
  Tooltip: { borderRadius: '6px', color: '#1A1A1A', textColor: '#EDEDED' },
  Pagination: { borderRadius: '4px' },
}

const themeOverrides = computed(() => appStore.isDark ? darkOverrides : lightOverrides)
</script>

<template>
  <NConfigProvider :theme="theme" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <div class="min-h-screen flex flex-col overflow-x-hidden" style="background: var(--bg-body)">
        <AppHeader />
        <main class="flex-1">
          <router-view v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
              <component :is="Component" />
            </Transition>
          </router-view>
        </main>
        <AppFooter />
      </div>
    </NMessageProvider>
  </NConfigProvider>
</template>
