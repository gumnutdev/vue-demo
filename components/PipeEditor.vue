<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import type { Pipe } from '../backend/types.d.ts';
import {
  buildTestToken,
  computedGumnutDoc,
  GumnutData,
  GumnutText,
  GumnutFocus,
  useGumnutDoc,
} from '@gumnutdev/vue';
import { cn } from '@/lib/utils';

// Define props
const props = defineProps<{
  pipe: Pipe | null | undefined;
}>();

// Connect to Gumnut for this doc
const doc = computedGumnutDoc(() => {
  return {
    docId: `pipe/${props.pipe?.id ?? 0}`,
    getToken: () => buildTestToken(),
  };
});

// Define emits
const emit = defineEmits<{
  (e: 'save', pipeData: Pipe): void;
  (e: 'no-changes'): void;
  (e: 'cancel'): void;
}>();

// Local state for the form
const editablePipe = ref<Pipe>({ id: 0 });
// const corrosionLevel = ref([0]); // Slider model needs to be an array

// Form fields definition for easy rendering
const formFields: { id: keyof Pipe; label: string; type: string; placeholder: string }[] = [
  { id: 'diameter', label: 'Diameter (mm)', type: 'number', placeholder: 'e.g., 150' },
  { id: 'length', label: 'Length (m)', type: 'number', placeholder: 'e.g., 12.5' },
  {
    id: 'pressureRating',
    label: 'Pressure Rating (PSI)',
    type: 'number',
    placeholder: 'e.g., 300',
  },
  { id: 'material', label: 'Material', type: 'text', placeholder: 'e.g., Carbon Steel' },
  { id: 'materialGrade', label: 'Material Grade', type: 'text', placeholder: 'e.g., A106-B' },
  { id: 'schedule', label: 'Schedule', type: 'text', placeholder: 'e.g., SCH 40' },
  { id: 'coating', label: 'Coating', type: 'text', placeholder: 'e.g., FBE' },
  {
    id: 'tensileStrength',
    label: 'Tensile Strength (MPa)',
    type: 'number',
    placeholder: 'e.g., 415',
  },
  { id: 'yieldStrength', label: 'Yield Strength (MPa)', type: 'number', placeholder: 'e.g., 240' },
  {
    id: 'ringCrushStrength',
    label: 'Ring Crush Strength (kN/m)',
    type: 'number',
    placeholder: 'e.g., 50',
  },
  { id: 'hardness', label: 'Hardness', type: 'text', placeholder: 'e.g., 150 HB' },
  {
    id: 'insulationThickness',
    label: 'Insulation Thickness (mm)',
    type: 'number',
    placeholder: 'e.g., 25',
  },
];

// Watch for prop changes to update local state
watch(
  () => props.pipe,
  (newPipe) => {
    editablePipe.value = newPipe ? { ...newPipe } : { id: 0 };
    // corrosionLevel.value[0] = editablePipe.value.corrosionLevel ?? 0;

    // ensure Gumnut knows about all fields (it may not edit missing fields)
    const loadData: Record<string, any> = { ...newPipe };
    for (const x of formFields) {
      if (!(x.id in loadData)) {
        loadData[x.id] = '';
      }
    }
    loadData.isFlanged ??= '';
    loadData.isJacketed ??= '';
    loadData.corrosionLevel ??= '';

    // Load into Gumnut as side effect
    doc.value.actions.load(loadData);
  },
  { immediate: true, deep: true },
);

// Event handlers
const onSave = () => {
  doc.value.actions.commit(({ dirty, all }) => {
    if (!Object.keys(dirty).length) {
      emit('no-changes');
      return;
    }

    const pipe = { ...all };
    pipe.isFlanged = all.isFlanged === 'true';
    pipe.isJacketed = all.isJacketed === 'true';
    pipe.corrosionLevel = +all.corrosionLevel || 0;
    pipe.id = editablePipe.value.id;

    // Convert number fields back to numbers
    for (const field of formFields) {
      if (field.type === 'number') {
        pipe[field.id] = +all[field.id] || 0;
      }
    }

    emit('save', pipe as Pipe);
  });
};

const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <Card class="w-full">
    <CardContent>
      <form @submit.prevent="onSave">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="md:col-span-2 lg:col-span-3">
            <Label for="description">Description</Label>
            <GumnutText
              name="description"
              id="description"
              multiline
              resize="auto"
              placeholder="Enter a description for the pipe"
              :class="
                cn(
                  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                  'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
                  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                )
              "
            />
          </div>

          <div v-for="field in formFields" :key="field.id">
            <Label :for="field.id">{{ field.label }}</Label>
            <GumnutText
              :id="field.id"
              :input-mode="field.type === 'number' ? 'numeric' : ''"
              :placeholder="field.placeholder"
              :name="field.id"
              :class="
                cn(
                  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                  'mt-1',
                )
              "
            />
          </div>
        </div>

        <div class="md:col-span-2 lg:col-span-3 mt-4">
          <GumnutData name="corrosionLevel" v-slot="{ value, dirty, clients, model }">
            <Label for="corrosionLevel" :class="dirty && 'dirty'"
              >Corrosion Level ({{ value }}%)</Label
            >
            <Slider
              id="corrosionLevel"
              :default-value="[0]"
              :max="100"
              :step="1"
              value:up
              :model-value="[+model.value]"
              @update:modelValue="(v) => (model.value = String(v?.[0] || 0))"
              class="mt-2"
            />
            <GumnutFocus name="corrosionLevel" />
            <!-- nb. the model binding is weird possibly because it expects [number] -->
          </GumnutData>
        </div>

        <!-- Manufacturing & Specification Checkboxes -->
        <div
          class="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-4 mt-4"
        >
          <div class="flex items-center space-x-2">
            <GumnutData name="isJacketed" v-slot="{ dirty, model }">
              <Checkbox
                id="isJacketed"
                :model-value="model.value === 'true'"
                @update:modelValue="(v) => (model.value = String(v))"
              />
              <Label for="isJacketed" :class="dirty && 'dirty'">Is Jacketed?</Label>
            </GumnutData>
            <GumnutFocus name="isJacketed" />
          </div>
          <div class="flex items-center space-x-2">
            <GumnutData name="isFlanged" v-slot="{ dirty, model }">
              <Checkbox
                id="isFlanged"
                :model-value="model.value === 'true'"
                @update:modelValue="(v) => (model.value = String(v))"
              />
              <Label for="isFlanged" :class="dirty && 'dirty'">Is Flanged?</Label>
            </GumnutData>
            <GumnutFocus name="isFlanged" />
          </div>
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex justify-end gap-2">
      <Button variant="outline" @click="onCancel">Close</Button>
      <Button variant="outline" @click="() => doc.actions.revertAll()">Revert Changes</Button>
      <Button @click="onSave">Save Pipe</Button>
    </CardFooter>
  </Card>
</template>

<style scoped>
.dirty {
  color: red;
}
:state(dirty) {
  background: #f002;
}
</style>
