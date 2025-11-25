import { api } from "../api.js";

export const AuthPane = {
  name: "AuthPane",
  emits: ["authed", "notify"],
  data() {
    return {
      mode: "login",
      form: {
        username: "",
        password: "",
        email: "",
      },
      busy: false,
      error: null,
      success: null,
      showPassword: false,
    };
  },
  methods: {
    switchMode(mode) {
      if (this.busy) return;
      this.mode = mode;
      this.error = null;
      this.success = null;
    },
    resetForm() {
      this.form = {
        username: "",
        password: "",
        email: "",
      };
    },
    async submit() {
      this.busy = true;
      this.error = null;
      this.success = null;
      try {
        // Validate required fields
        if (!this.form.username || !this.form.password) {
          this.error = "Username and password are required";
          return;
        }
        if (this.mode === "register" && !this.form.email) {
          this.error = "Email is required for registration";
          return;
        }
        if (this.mode === "login") {
          // Handle login request
          const response = await api.auth.login({
            username: this.form.username,
            password: this.form.password,
          });
          if (!response.ok) {
            this.error = response.data?.error || "Login failed";
            return;
          }
          this.$emit("authed");
          this.resetForm();
        } else {
          // Handle registration request
          const payload = {
            username: this.form.username,
            password: this.form.password,
            email: this.form.email,
          };
          const response = await api.auth.register(payload);
          if (!response.ok) {
            this.error = response.data?.error || "Registration failed";
            return;
          }
          this.success = "Account created successfully! Please login.";
          this.switchMode("login");
          this.$emit("notify", "Registration complete");
        }
      } catch (error) {
        console.error(error);
        this.error = "Network error occurred";
      } finally {
        this.busy = false;
      }
    },
  },
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-5">
        <div class="card border-0">
          <div class="card-body p-4">
            <h2 class="h4 text-center mb-3">{{ mode === 'login' ? 'Login' : 'Sign Up' }}</h2>
            <p class="text-secondary text-center mb-4">
              {{ mode === 'login' ? 'Continue booking your space.' : 'Create your parking account.' }}
            </p>
            <form @submit.prevent="submit">
              <div class="mb-3">
                <label class="form-label">Username</label>
                <input
                  type="text"
                  class="form-control"
                  v-model.trim="form.username"
                  autocomplete="username"
                  required
                />
              </div>
              <div class="mb-3" v-if="mode === 'register'">
                <label class="form-label">Email (Gmail only) <span class="text-danger">*</span></label>
                <input
                  type="email"
                  class="form-control"
                  v-model.trim="form.email"
                  autocomplete="email"
                  pattern="[a-zA-Z0-9._%+\\-]+@gmail\\.com$"
                  placeholder="yourname@gmail.com"
                  required
                />
                <small class="text-muted">Must be a valid Gmail address</small>
              </div>
              <div class="mb-3">
                <label class="form-label">Password</label>
                <div class="input-group">
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control"
                    v-model="form.password"
                    autocomplete="current-password"
                    required
                  />
                  <button class="btn btn-outline-secondary" type="button" @click="showPassword = !showPassword">
                    <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </div>
              </div>
              <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
              <div v-if="success" class="alert alert-success py-2">{{ success }}</div>
              <button type="submit" class="btn btn-primary w-100" :disabled="busy">
                <span v-if="busy" class="spinner-border spinner-border-sm me-2"></span>
                {{ mode === 'login' ? 'Login' : 'Register' }}
              </button>
            </form>
            <hr class="my-4" />
            <div class="text-center">
              <button
                class="btn btn-link"
                type="button"
                @click="switchMode(mode === 'login' ? 'register' : 'login')"
              >
                {{ mode === 'login' ? 'New here? Sign up' : 'Already registered? Login' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
