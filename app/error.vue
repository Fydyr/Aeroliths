<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-content">
        <!-- Error Code -->
        <div class="error-code">
          <h1>{{ error.statusCode }}</h1>
        </div>

        <!-- Error Icon -->
        <div class="error-icon">
          <UIcon
            :name="errorIcon"
            class="icon"
          />
        </div>

        <!-- Error Message -->
        <div class="error-message">
          <h2>{{ errorTitle }}</h2>
          <p>{{ errorDescription }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="error-actions">
          <UButton
            to="/"
            color="primary"
            size="lg"
            icon="i-heroicons-home"
          >
            Back to Home
          </UButton>

          <UButton
            @click="handleError"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-heroicons-arrow-path"
          >
            Try Again
          </UButton>
        </div>

        <!-- Additional Info for Dev -->
        <div v-if="isDev && error.message" class="error-debug">
          <details>
            <summary>Error details (dev)</summary>
            <pre>{{ error }}</pre>
          </details>
        </div>
      </div>

      <!-- Decorative Elements -->
      <div class="error-decoration">
        <div class="floating-lithos lithos-1"></div>
        <div class="floating-lithos lithos-2"></div>
        <div class="floating-lithos lithos-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  error: {
    type: Object,
    required: true
  }
})

const isDev = import.meta.dev

const errorIcon = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'i-heroicons-magnifying-glass-circle'
    case 403:
      return 'i-heroicons-lock-closed'
    case 500:
      return 'i-heroicons-exclamation-triangle'
    default:
      return 'i-heroicons-x-circle'
  }
})

const errorTitle = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'Page Not Found'
    case 403:
      return 'Access Forbidden'
    case 500:
      return 'Server Error'
    default:
      return 'An Error Occurred'
  }
})

const errorDescription = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'The page you are looking for seems to have disappeared into the clouds...'
    case 403:
      return "You don't have permission to access this page."
    case 500:
      return 'An internal error occurred. Please try again later.'
    default:
      return props.error.message || 'An unexpected error occurred.'
  }
})

const handleError = () => {
  clearError({ redirect: '/' })
}

useHead({
  title: `Error ${props.error.statusCode} - Aeroliths`,
  meta: [
    { name: 'description', content: errorDescription.value }
  ]
})
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(rgba(22, 33, 62, 0.95), rgba(22, 33, 62, 0.95)),
              radial-gradient(circle at 50% 50%, rgba(94, 23, 235, 0.1) 0%, transparent 50%);
  background-color: #16213e;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.error-container {
  max-width: 600px;
  width: 100%;
  position: relative;
  z-index: 10;
}

.error-content {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.error-code {
  margin-bottom: 1rem;
}

.error-code h1 {
  font-size: 8rem;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1;
  text-shadow: 0 0 40px rgba(102, 126, 234, 0.3);
}

.error-icon {
  margin-bottom: 1.5rem;
}

.error-icon .icon {
  width: 80px;
  height: 80px;
  color: #667eea;
  opacity: 0.8;
}

.error-message {
  margin-bottom: 2rem;
}

.error-message h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem 0;
}

.error-message p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-debug {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.error-debug summary {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.error-debug summary:hover {
  color: rgba(255, 255, 255, 0.8);
}

.error-debug pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 8px;
  color: #fff;
  font-size: 0.85rem;
  text-align: left;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

/* Decorative floating elements */
.error-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-lithos {
  position: absolute;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
  border-radius: 12px;
  animation: float 6s ease-in-out infinite;
  opacity: 0.3;
}

.lithos-1 {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.lithos-2 {
  top: 60%;
  right: 15%;
  animation-delay: 2s;
  width: 80px;
  height: 80px;
}

.lithos-3 {
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
  width: 50px;
  height: 50px;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .error-code h1 {
    font-size: 5rem;
  }

  .error-icon .icon {
    width: 60px;
    height: 60px;
  }

  .error-message h2 {
    font-size: 1.5rem;
  }

  .error-message p {
    font-size: 1rem;
  }

  .error-content {
    padding: 2rem 1.5rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .floating-lithos {
    display: none;
  }
}
</style>
