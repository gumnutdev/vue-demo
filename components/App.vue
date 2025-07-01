<script lang="ts" setup>
import { buildTestToken, useGumnutDoc } from '@gumnutdev/vue';
import { GumnutText } from '@gumnutdev/vue';

useGumnutDoc({
  docId: 'hello',
  getToken: () => buildTestToken(),
});

// const doc = useGumnut
</script>

<template>
  Zing
  <GumnutText name="whatever"></GumnutText>

  Hello World
</template>
