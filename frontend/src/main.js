import {
  createApp,
  ref,
  computed,
  onMounted,
  watch,
} from "https://unpkg.com/vue@3/dist/vue.esm-browser.js";

import { api } from "./api.js";
import { AuthPane } from "./components/AuthPane.js";
import { AdminPanel } from "./components/AdminPanel.js";
import { UserPanel } from "./components/UserPanel.js";

const ToastList = {
  name: "ToastList",
  props: {
    messages: {
      type: Array,
      required: true,
    },
  },
  emits: ["dismiss"],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1080">
      <div
        v-for="message in messages"
        :key="message.id"
        class="toast show align-items-center text-white"
        :class="'bg-' + message.variant"
        role="alert"
      >
        <div class="d-flex">
          <div class="toast-body">
            {{ message.text }}
          </div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            @click="$emit('dismiss', message.id)"
          ></button>
        </div>
      </div>
    </div>
  `,
};

const AppRoot = {
  name: "AppRoot",
  components: { AuthPane, AdminPanel, UserPanel, ToastList },
  setup() {
    const user = ref(null);
    const loading = ref(true);
    const messages = ref([]);
    let counter = 0;

    const navActionsEl = document.getElementById("nav-actions");

    function pushToast(text, variant = "success", timeout = 4000) {
      const id = ++counter;
      messages.value.push({ id, text, variant });
      if (timeout > 0) {
        setTimeout(() => dismissToast(id), timeout);
      }
    }

    function dismissToast(id) {
      messages.value = messages.value.filter((item) => item.id !== id);
    }

    async function loadProfile() {
      loading.value = true;
      const response = await api.auth.profile();
      if (response.ok && response.data.user) {
        user.value = response.data.user;
      } else {
        user.value = null;
      }
      loading.value = false;
    }

    async function logout() {
      await api.auth.logout();
      user.value = null;
      pushToast("Logged out successfully", "info");
      await loadProfile();
    }

    function renderNav() {
      if (!navActionsEl) return;
      navActionsEl.innerHTML = "";
      if (loading.value) {
        navActionsEl.innerHTML = `
          <div class="spinner-border text-light" role="status" style="width: 1.5rem; height: 1.5rem;">
            <span class="visually-hidden">Loading...</span>
          </div>`;
        return;
      }
      if (user.value) {
        navActionsEl.innerHTML = `
          <div class="d-flex align-items-center gap-3">
            <span class="text-white"><i class="bi bi-person-circle"></i> ${user.value.username}</span>
            <button class="btn logout-btn btn-sm" id="logout-btn"><i class="bi bi-box-arrow-right"></i> Logout</button>
          </div>`;
        const btn = navActionsEl.querySelector("#logout-btn");
        if (btn) btn.addEventListener("click", logout);
      } else {
        navActionsEl.innerHTML = `
          <div class="d-flex gap-2">
          </div>`;
      }
    }

    watch([user, loading], renderNav, { immediate: true });

    onMounted(() => {
      loadProfile();
    });

    const isAdmin = computed(() => user.value?.role === "admin");
    const isUser = computed(() => user.value?.role === "user");

    return {
      user,
      loading,
      loadProfile,
      pushToast,
      dismissToast,
      messages,
      isAdmin,
      isUser,
    };
  },
  template: `
    <div>
      <toast-list :messages="messages" @dismiss="dismissToast" />
      <div v-if="loading" class="text-center py-5 text-secondary">Loading profile...</div>
      <div v-else>
        <auth-pane
          v-if="!user"
          @authed="loadProfile"
          @notify="(msg, variant) => pushToast(msg, variant || 'info')"
        />
        <div v-else>
          <admin-panel
            v-if="isAdmin"
            @notify="(msg, variant) => pushToast(msg, variant || 'success')"
          />
          <user-panel
            v-else-if="isUser"
            @notify="(msg, variant) => pushToast(msg, variant || 'success')"
          />
          <div v-else class="alert alert-warning mt-4">
            Role configuration missing. Please contact admin.
          </div>
        </div>
      </div>
    </div>
  `,
};

createApp(AppRoot).mount("#app");
