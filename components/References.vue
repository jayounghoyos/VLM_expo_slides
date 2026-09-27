<!--
  The references slide: every paper and link the talk leans on, grouped.
  Kept as data here (not in the locales): titles and IDs don't translate.
  docs/RESEARCH.md has the facts each one supports.
-->
<script setup lang="ts">
type Ref = { t: string; a: string; id: string }
const groups: { h: string; items: Ref[] }[] = [
  {
    h: 'Vision encoders',
    items: [
      { t: 'ViT', a: 'Dosovitskiy et al. 2020', id: 'arXiv:2010.11929' },
      { t: 'CLIP', a: 'Radford et al. 2021', id: 'arXiv:2103.00020' },
      { t: 'SigLIP', a: 'Zhai et al. 2023', id: 'arXiv:2303.15343' },
    ],
  },
  {
    h: 'VLMs',
    items: [
      { t: 'Flamingo', a: 'Alayrac et al. 2022', id: 'arXiv:2204.14198' },
      { t: 'BLIP-2', a: 'Li et al. 2023', id: 'arXiv:2301.12597' },
      { t: 'LLaVA', a: 'Liu et al. 2023', id: 'arXiv:2304.08485' },
      { t: 'LLaVA-1.5', a: 'Liu et al. 2023', id: 'arXiv:2310.03744' },
      { t: 'PaliGemma', a: 'Beyer et al. 2024', id: 'arXiv:2407.07726' },
      { t: 'Qwen2-VL', a: 'Wang et al. 2024', id: 'arXiv:2409.12191' },
      { t: 'Molmo / PixMo', a: 'Deitke et al. 2024', id: 'arXiv:2409.17146' },
      { t: 'SmolVLM', a: 'Marafioti et al. 2025', id: 'arXiv:2504.05299' },
      { t: 'InternVL3.5', a: 'Wang et al. 2025', id: 'arXiv:2508.18265' },
      { t: 'Qwen3-VL', a: 'Qwen Team 2025', id: 'arXiv:2511.21631' },
    ],
  },
  {
    h: 'Evaluation and limits',
    items: [
      { t: 'POPE', a: 'Li et al. 2023', id: 'arXiv:2305.10355' },
      { t: 'MMMU', a: 'Yue et al. 2023', id: 'arXiv:2311.16502' },
      { t: 'Eyes Wide Shut (MMVP)', a: 'Tong et al. 2024', id: 'arXiv:2401.06209' },
    ],
  },
  {
    h: 'From VLM to robot',
    items: [
      { t: 'RT-2', a: 'Brohan et al. 2023', id: 'arXiv:2307.15818' },
      { t: 'OpenVLA', a: 'Kim et al. 2024', id: 'arXiv:2406.09246' },
      { t: 'SmolVLA', a: 'Shukor et al. 2025', id: 'arXiv:2506.01844' },
      { t: 'MuJoCo', a: 'Google DeepMind', id: 'github.com/google-deepmind/mujoco' },
      { t: 'MuJoCo Playground', a: 'Zakka et al. 2025', id: 'arXiv:2502.08844' },
    ],
  },
]
</script>

<template>
  <div class="refs">
    <section v-for="(g, gi) in groups" :key="g.h" class="refs__g">
      <h3 class="refs__h t-mono">{{ g.h }}</h3>
      <ul class="refs__l">
        <li v-for="r in g.items" :key="r.id" class="refs__i">
          <span class="refs__t">{{ r.t }} <span class="refs__a">· {{ r.a }}</span></span>
          <span class="refs__id t-mono">{{ r.id }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
/* doubled classes: the theme's h3 / ul / li rules are more specific than one */
.refs.refs { display: grid; grid-template-columns: 0.9fr 1.1fr 1fr 1.2fr; gap: 26px; }
.refs .refs__h.refs__h {
  font-family: 'Geist Mono Variable', monospace;
  font-size: 12px;
  line-height: 1.3;
  color: var(--accent-vis);
  margin: 0 0 10px;
  letter-spacing: 0.02em;
  font-variation-settings: 'wght' 500;
}
.refs ul.refs__l { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.refs li.refs__i { display: flex; flex-direction: column; line-height: 1.2; margin: 0; padding: 0; }
.refs li.refs__i::before, .refs li.refs__i::marker { content: none; display: none; }
.refs__t { font-size: 12px; color: var(--text-primary); font-variation-settings: 'wght' 560; }
.refs__a { font-size: 11px; color: var(--text-secondary); }
.refs__id { font-size: 10px; color: var(--text-muted); word-break: break-all; }
</style>
