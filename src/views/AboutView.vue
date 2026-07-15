<script setup lang="ts">
const contacts = [
  {
    label: '官方QQ群',
    value: '139646813',
    href: 'https://qm.qq.com/q/IfGxL0EaQw',
    color: '#90ca74',
  },
  {
    label: '开发者 QQ',
    value: '2659055656',
    href: '',
    color: '#f98c45',
  },
]
</script>

<template>
  <div class="about-page fl-shell">
    <section class="about-hero">
      <span class="about-kicker">About FlowLoss</span>
      <h1>关于我们</h1>
      <p>了解 FlowLoss 的项目说明与联系方式。</p>
    </section>

    <section class="about-grid">
      <article class="about-card intro-card">
        <header class="card-head">
          <span class="head-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5V5a2 2 0 0 1 2-2h11.5a2.5 2.5 0 0 1 0 5H7" />
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M8 11h8" />
              <path d="M8 14h5" />
            </svg>
          </span>
          <div>
            <h2>程序介绍</h2>
            <p>项目说明</p>
          </div>
        </header>

        <p class="intro-text">
          你看到的 FlowLoss 是经过许多用户反馈意见和建议迭代而成。同时 FlowLoss 也在尽最大可能性提高其灵活以及多样化，希望为每一个用户提供不一样的精彩。
        </p>

        <p class="powered-by">
          本网站由
          <a href="https://edgeone.ai/zh?ref=net.arsn.cn" target="_blank" rel="noreferrer" class="edgeone-link">
            <img src="https://edgeone.ai/favicon.ico" alt="EdgeOne" class="edgeone-ico" />
            <span>EdgeOne</span>
          </a>
          提供 CDN、边缘和安全解决方案
        </p>
      </article>

      <article class="about-card contact-card">
        <header class="card-head">
          <span class="head-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              <path d="M8 10h8" />
              <path d="M8 14h5" />
            </svg>
          </span>
          <div>
            <h2>联系我们</h2>
            <p>反馈与沟通</p>
          </div>
        </header>

        <p class="contact-lead">
          任何产品相关的问题可以通过下面的方式进行反馈。
        </p>

        <div class="contact-list">
          <a
            v-for="item in contacts"
            :key="item.label"
            class="contact-row"
            :href="item.href || undefined"
            :target="item.href && !item.href.startsWith('mailto:') ? '_blank' : undefined"
            :rel="item.href && !item.href.startsWith('mailto:') ? 'noreferrer' : undefined"
          >
            <span class="contact-dot" :style="{ background: item.color }" />
            <span class="contact-label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </a>
        </div>
      </article>
    </section>

    <section class="about-card faq-card">
      <header class="card-head">
        <span class="head-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" />
            <path d="M12 17h.01" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </span>
        <div>
          <h2>疑问解答</h2>
          <p>常见问题</p>
        </div>
      </header>

      <div class="faq-list">
        <article class="faq-item">
          <h3>APP/后端代码开源吗？</h3>
          <p>不开源</p>
        </article>
        <article class="faq-item">
          <h3>能否添加 xxx 功能？</h3>
          <p>有合理的建议请联系我</p>
        </article>
        <article class="faq-item">
          <h3>我使用了 FlowLoss 开源项目，能否添加到跨域白名单？</h3>
          <p>添加链接指向本项目开源仓库，然后联系我加白名单</p>
        </article>
      </div>
    </section>

    <section class="about-card open-source-card">
      <header class="card-head">
        <span class="head-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 18l6-6-6-6" />
            <path d="M8 6l-6 6 6 6" />
            <path d="M14.5 4l-5 16" />
          </svg>
        </span>
        <div>
          <h2>开源地址</h2>
          <p>仓库与依赖项目</p>
        </div>
      </header>

      <a
        class="repo-card"
        href="https://github.com/arsnyeon/FlowLoss_SpeedTestPanel"
        target="_blank"
        rel="noreferrer"
      >
        <span class="repo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 7h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3" />
            <path d="M12 3v12" />
            <path d="M8 7l4-4 4 4" />
          </svg>
        </span>
        <span class="repo-main">
          <strong>FlowLoss_SpeedTestPanel</strong>
          <span>github.com/arsnyeon/FlowLoss_SpeedTestPanel</span>
        </span>
        <span class="repo-open">GitHub</span>
      </a>

      <div class="oss-section">
        <h3>使用到的开源项目</h3>
        <div class="oss-list">
          <a href="https://github.com/vuejs/core" target="_blank" rel="noreferrer"><strong>Vue</strong><span>vuejs/core</span></a>
          <a href="https://github.com/vitejs/vite" target="_blank" rel="noreferrer"><strong>Vite</strong><span>vitejs/vite</span></a>
          <a href="https://github.com/tusen-ai/naive-ui" target="_blank" rel="noreferrer"><strong>Naive UI</strong><span>tusen-ai/naive-ui</span></a>
          <a href="https://github.com/vuejs/pinia" target="_blank" rel="noreferrer"><strong>Pinia</strong><span>vuejs/pinia</span></a>
          <a href="https://github.com/vuejs/router" target="_blank" rel="noreferrer"><strong>Vue Router</strong><span>vuejs/router</span></a>
          <a href="https://github.com/apache/echarts" target="_blank" rel="noreferrer"><strong>Apache ECharts</strong><span>apache/echarts</span></a>
          <a href="https://github.com/ecomfe/vue-echarts" target="_blank" rel="noreferrer"><strong>Vue ECharts</strong><span>ecomfe/vue-echarts</span></a>
          <a href="https://github.com/vueuse/vueuse" target="_blank" rel="noreferrer"><strong>VueUse</strong><span>vueuse/vueuse</span></a>
          <a href="https://github.com/tailwindlabs/tailwindcss" target="_blank" rel="noreferrer"><strong>Tailwind CSS</strong><span>tailwindlabs/tailwindcss</span></a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-page {
  padding-top: 34px;
  padding-bottom: 58px;
}

.about-hero {
  margin-bottom: 20px;
}

.about-kicker {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 650;
}

.about-hero h1 {
  margin: 12px 0 0;
  color: var(--text-primary);
  font-size: clamp(26px, 4vw, 34px);
  font-weight: 760;
  line-height: 1.08;
  letter-spacing: 0;
}

.about-hero p {
  margin-top: 9px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.about-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
  gap: 16px;
}

.about-card {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-card);
  box-shadow: var(--shadow);
  padding: 22px;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.head-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.head-icon svg {
  width: 20px;
  height: 20px;
}

.card-head h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 760;
  line-height: 1.25;
}

.card-head p {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
}

.intro-text,
.contact-lead {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 520;
  line-height: 1.85;
}

.powered-by {
  margin: 14px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.edgeone-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  text-decoration: none;
  vertical-align: middle;
}

.edgeone-link span {
  color: #798bff;
  font-weight: 600;
}

.edgeone-link:hover span {
  text-decoration: underline;
}

.edgeone-ico {
  width: 14px;
  height: 14px;
}

.contact-list {
  display: grid;
  gap: 9px;
  margin-top: 18px;
}

.contact-row {
  display: grid;
  grid-template-columns: 10px 82px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 9px 11px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-subtle);
  text-decoration: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.contact-row:hover {
  border-color: var(--text-muted);
  background: var(--bg-input-hover);
}

.contact-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.contact-label {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 650;
}

.contact-row strong {
  min-width: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 720;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.faq-card {
  margin-top: 16px;
}

.open-source-card {
  margin-top: 16px;
}

.faq-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.faq-item {
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-subtle);
}

.faq-item h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 720;
  line-height: 1.4;
}

.faq-item p {
  margin: 7px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 560;
  line-height: 1.6;
}

.faq-item code {
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.repo-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 13px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: linear-gradient(180deg, var(--bg-subtle), var(--bg-card));
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
}

.repo-card:hover {
  border-color: var(--text-muted);
  transform: translateY(-1px);
}

.repo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-card);
  color: var(--text-primary);
}

.repo-icon svg {
  width: 20px;
  height: 20px;
}

.repo-main {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.repo-main strong {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 760;
  line-height: 1.35;
}

.repo-main span {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.repo-open {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.oss-section {
  margin-top: 18px;
}

.oss-section h3 {
  margin: 0 0 12px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}

.oss-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 10px;
}

.oss-list a {
  display: grid;
  gap: 4px;
  min-width: 0;
  min-height: 62px;
  padding: 11px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-subtle);
  text-decoration: none;
  transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
}

.oss-list a:hover {
  border-color: var(--text-muted);
  background: var(--bg-input-hover);
  transform: translateY(-1px);
}

.oss-list strong {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 720;
  line-height: 1.35;
}

.oss-list span {
  min-width: 0;
  overflow: hidden;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 820px) {
  .about-grid,
  .faq-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .about-page {
    padding-top: 24px;
    padding-bottom: 44px;
  }

  .about-card {
    padding: 18px;
  }

  .contact-row {
    grid-template-columns: 10px minmax(0, 1fr);
    gap: 8px 10px;
  }

  .contact-label {
    grid-column: 2;
  }

  .contact-row strong {
    grid-column: 2;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .repo-card {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .repo-icon {
    width: 38px;
    height: 38px;
  }

  .repo-open {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
