import { api } from "../../api.js";

export const AdminUsers = {
  name: "AdminUsers",
  data() {
    return {
      users: [],
      busy: false,
    };
  },
  mounted() {
    this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      this.busy = true;
      const res = await api.admin.listUsers();
      if (res.ok) {
        this.users = res.data.users || [];
      }
      this.busy = false;
    },
  },
  template: `
    <div>
      <div class="card-header-custom d-flex justify-content-between align-items-center">
        <span><i class="bi bi-people page-icon"></i>Registered Users</span>
        <button class="btn btn-warning btn-sm" @click="fetchUsers" :disabled="busy">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
      <div class="card-body">
        <div v-if="busy" class="text-center py-5">
          <div class="spinner-border text-success"></div>
          <p class="mt-2 text-secondary">Loading users...</p>
        </div>
        <div v-else>
          <div class="mb-3">
            <h5>Total Users: {{ users.length }}</h5>
          </div>
          <div v-if="users.length === 0" class="alert alert-info">
            <i class="bi bi-info-circle"></i> No users registered yet.
          </div>
          <div v-else class="row g-3">
            <div class="col-md-6 col-lg-4" v-for="user in users" :key="user.id">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex align-items-center mb-3">
                    <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" 
                         style="width: 50px; height: 50px; font-size: 1.5rem;">
                      <i class="bi bi-person-fill"></i>
                    </div>
                    <div class="ms-3">
                      <h6 class="mb-0">{{ user.username }}</h6>
                      <small class="text-muted">ID: #{{ user.id }}</small>
                    </div>
                  </div>
                  <div class="small">
                    <div class="mb-2">
                      <i class="bi bi-envelope"></i>
                      <strong> Email:</strong> {{ user.email || 'Not provided' }}
                    </div>
                    <div>
                      <i class="bi bi-calendar3"></i>
                      <strong> Joined:</strong><br/>
                      <small>{{ user.created_at }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
