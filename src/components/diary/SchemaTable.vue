<script setup lang="ts">
import type { SchemaTable } from '@/types'

defineProps<{ schema: SchemaTable }>()
</script>

<template>
  <div class="schema">
    <p v-if="schema.caption" class="schema__caption">{{ schema.caption }}</p>
    <div class="schema__scroll">
      <table>
        <thead>
          <tr>
            <th v-for="h in schema.headers" :key="h">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in schema.rows" :key="i">
            <td v-for="(cell, j) in row" :key="j">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.schema {
  margin: 1rem 0;
  padding: 0.75rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(201, 184, 168, 0.55);
}

.schema__caption {
  font-family: var(--font-display);
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.schema__scroll {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(160, 140, 120, 0.3) transparent;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

th,
td {
  text-align: left;
  padding: 0.55rem 0.65rem;
  border-bottom: 1px solid rgba(201, 184, 168, 0.45);
}

th {
  color: var(--ink-soft);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
