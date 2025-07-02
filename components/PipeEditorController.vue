<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, FilePenLine, Loader2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import type { Pipe } from '../backend/types.d.ts';
import 'vue-sonner/style.css'; // vue-sonner v2 requires this import

// Import shadcn-vue components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

// Import the editor component
import PipeEditor from './PipeEditor.vue';

// --- Component State ---
const pipes = ref<Pipe[]>([]);
const selectedPipe = ref<Pipe | null>(null);
const isEditorOpen = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);

// --- API Communication ---
async function fetchPipes() {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch('/pipes');
    if (!response.ok) throw new Error(`Failed to fetch pipes: ${response.statusText}`);
    pipes.value = await response.json();
  } catch (e: any) {
    error.value = e.message;
    toast.error('Error fetching data', { description: e.message });
  } finally {
    loading.value = false;
  }
}

async function handleSave(pipeData: Pipe) {
  try {
    const response = await fetch('/pipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pipeData),
    });
    if (!response.ok) throw new Error(`Failed to save pipe: ${response.statusText}`);

    toast.success('Success!', {
      description: `Pipe ${pipeData.id ? 'updated' : 'created'} successfully.`,
    });
    closeDialog();
    await fetchPipes(); // Refresh list
  } catch (e: any) {
    toast.error('Error saving data', { description: e.message });
  }
}

function handleNoChanges() {
  closeDialog();
  toast.message('No changes', {
    description: `Pipe had no changes, and was not saved`,
  });
}

function handleAgentMessage(m: { name: string; message: string }) {
  toast.message(`Agent: ${m.name}`, { description: m.message });
}

// --- Dialog and UI Logic ---
function openEditDialog(pipe: Pipe) {
  selectedPipe.value = pipe;
  isEditorOpen.value = true;
}

function openCreateDialog() {
  selectedPipe.value = { id: 0 };
  isEditorOpen.value = true;
}

function closeDialog() {
  isEditorOpen.value = false;
  selectedPipe.value = null;
}

// --- Lifecycle Hook ---
onMounted(fetchPipes);
</script>

<template>
  <div class="p-4 md:p-8">
    <header class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Pipe Inventory Management</h1>
        <p class="text-muted-foreground">Browse, create, and edit pipe specifications.</p>
      </div>
      <Button @click="openCreateDialog">
        <Plus class="w-4 h-4 mr-2" />
        Create New Pipe
      </Button>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4 border rounded-lg bg-destructive/10 text-destructive">
      <h3 class="font-semibold">An Error Occurred</h3>
      <p>{{ error }}</p>
    </div>

    <!-- Main Content -->
    <div v-else>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Diameter (mm)</TableHead>
              <TableHead class="hidden md:table-cell">Description</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="pipes.length > 0">
              <TableRow v-for="pipe in pipes" :key="pipe.id">
                <TableCell class="font-medium">{{ pipe.material || 'N/A' }}</TableCell>
                <TableCell>{{ pipe.diameter || 'N/A' }}</TableCell>
                <TableCell class="hidden md:table-cell truncate max-w-sm">{{
                  pipe.description || 'No description'
                }}</TableCell>
                <TableCell class="text-right">
                  <Button variant="ghost" size="icon" @click="openEditDialog(pipe)">
                    <FilePenLine class="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </template>
            <TableRow v-else>
              <TableCell :colspan="4" class="h-24 text-center">
                No pipes found. Create one to get started.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>

    <!-- Editor Dialog -->
    <Dialog :open="isEditorOpen" @update:open="isEditorOpen = $event">
      <DialogContent class="max-w-7xl">
        <DialogTitle>
          <template v-if="selectedPipe?.id">Edit Pipe</template>
          <template v-else>Create Pipe</template>
        </DialogTitle>
        <!-- The PipeEditor component is rendered inside the dialog -->
        <PipeEditor
          :pipe="selectedPipe"
          @save="handleSave"
          @cancel="closeDialog"
          @no-changes="handleNoChanges"
          @agent-message="handleAgentMessage"
        />
      </DialogContent>
    </Dialog>

    <!-- Sonner Toaster component from shadcn-vue -->
    <SonnerToaster />
  </div>
</template>
