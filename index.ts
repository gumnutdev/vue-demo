import { createApp } from 'vue';
import App from './components/App.vue';
import { configureGumnut } from '@gumnutdev/vue';

configureGumnut({
  projectId: 'sam-test-proj',
  localDevKey: '_DO_NOT_USE_IN_PROD_rwiGk-LGtoz8i6bugZkWnw',
});

const app = createApp(App);
app.mount(document.body);
