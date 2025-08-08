<template>
  <!-- The container is now just a direct host for the dynamic component -->
  <component :is="experimentComponent" v-if="experimentComponent" />
</template>

<script setup>
import { ref, watch, defineAsyncComponent } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
});

const experimentComponent = ref(null);

// Function to load component
const loadComponent = (name) => {
  if (!name) return;
  // Using defineAsyncComponent for better performance and code splitting
  experimentComponent.value = defineAsyncComponent(() =>
    import(`../experiments/${name}.vue`)
  );
};

// Load component initially and watch for changes in route param
watch(() => props.name, (newName) => {
  loadComponent(newName);
}, { immediate: true });

</script>