<script lang="ts" setup>
import { buildTestToken, useGumnutDoc } from '@gumnutdev/vue';
import { GumnutText } from '@gumnutdev/vue';
import PipeEditorController from './PipeEditorController.vue';

useGumnutDoc({
  docId: 'hello',
  getToken: () => buildTestToken(),
});

// const doc = useGumnut
</script>

<template>
  App here
  <PipeEditorController />
</template>
