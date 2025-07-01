<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle>{{ formTitle }}</CardTitle>
      <CardDescription> Fill in the details below. All fields are optional. </CardDescription>
    </CardHeader>
    <CardContent>
      <form @submit.prevent="onSave">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="md:col-span-2 lg:col-span-3">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              v-model="editablePipe.description"
              placeholder="Enter a description for the pipe..."
              class="mt-1"
            />
          </div>

          <div v-for="field in formFields" :key="field.id">
            <Label :for="field.id">{{ field.label }}</Label>
            <Input
              :id="field.id"
              :type="field.type"
              :placeholder="field.placeholder"
              v-model="editablePipe[field.id]"
              class="mt-1"
            />
          </div>
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex justify-end gap-2">
      <Button variant="outline" @click="onCancel">Cancel</Button>
      <Button @click="onSave">Save Pipe</Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Define the Pipe interface
interface Pipe {
  id?: number;
  description?: string;
  diameter?: number;
  material?: string;
  length?: number;
  pressureRating?: number;
  schedule?: string;
  materialGrade?: string;
  tensileStrength?: number;
  yieldStrength?: number;
  hardness?: string;
  ringCrushStrength?: number;
  coating?: string;
  insulationThickness?: number;
}

// Define props
const props = defineProps<{
  pipe: Pipe | null | undefined;
}>();

// Define emits
const emit = defineEmits<{
  (e: 'save', pipeData: Pipe): void;
  (e: 'cancel'): void;
}>();

// Local state for the form
const editablePipe = ref<Pipe>({});

// Watch for prop changes to update local state
watch(
  () => props.pipe,
  (newPipe) => {
    editablePipe.value = newPipe ? structuredClone(newPipe) : {};
  },
  { immediate: true, deep: true },
);

// Computed property for the form title
const formTitle = computed(() => {
  return props.pipe && props.pipe.id ? 'Edit Pipe Specification' : 'Create New Pipe';
});

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

// Event handlers
const onSave = () => {
  // Convert empty strings for number fields to null to avoid backend issues
  for (const field of formFields) {
    if (field.type === 'number' && editablePipe.value[field.id] === '') {
      (editablePipe.value as any)[field.id] = null;
    }
  }
  emit('save', editablePipe.value);
};

const onCancel = () => {
  emit('cancel');
};
</script>
