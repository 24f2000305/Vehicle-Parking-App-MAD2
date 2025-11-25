import { api } from "../../api.js";

export const UserExports = {
  name: "UserExports",
  emits: ["notify"],
  data() {
    return {
      exports: [],
      loading: false,
      exportBusy: false,
      pollTimer: null,
    };
  },
  mounted() {
    this.loadExports();
    // Poll for export status every 5 seconds
    this.pollTimer = setInterval(() => {
      this.loadExports();
    }, 5000);
  },
  beforeUnmount() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  },
  methods: {
    async loadExports() {
      this.loading = true;
      const response = await api.user.listExports();
      if (response.ok) {
        this.exports = response.data.jobs || [];
      }
      this.loading = false;
    },
    async requestExport() {
      this.exportBusy = true;
      const response = await api.user.requestExport();
      this.exportBusy = false;
      
      if (!response.ok) {
        this.$emit("notify", response.data?.error || "Export request failed", "danger");
        return;
      }
      
      this.$emit("notify", "Export job queued successfully", "info");
      await this.loadExports();
    },
    statusBadge(status) {
      const map = {
        queued: "secondary",
        pending: "secondary",
        processing: "warning",
        completed: "success",
      };
      return map[status] || "secondary";
    },
    statusIcon(status) {
      const map = {
        queued: "hourglass",
        pending: "hourglass-split",
        processing: "arrow-repeat",
        completed: "check-circle-fill",
      };
      return map[status] || "question-circle";
    },
  },
  template: `
    <div>
      <div class="card-header-custom d-flex justify-content-between align-items-center">
        <span><i class="bi bi-file-earmark-arrow-down page-icon"></i>Export History (CSV)</span>
        <button class="btn btn-warning btn-sm" @click="loadExports" :disabled="loading">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
      <div class="card-body">
        <div class="card mb-4" style="background-color: var(--light-yellow);">
          <div class="card-body">
            <h5 class="mb-3"><i class="bi bi-download"></i> Request New Export</h5>
            <p class="text-muted mb-3">
              Export all your booking history as a CSV file. The file will be generated in the background 
              and will be available for download once completed.
            </p>
            <button class="btn btn-primary btn-lg" @click="requestExport" :disabled="exportBusy">
              <span v-if="exportBusy" class="spinner-border spinner-border-sm me-2"></span>
              <i class="bi bi-file-earmark-plus"></i> Request CSV Export
            </button>
          </div>
        </div>

        <div v-if="loading && exports.length === 0" class="text-center py-5">
          <div class="spinner-border text-success"></div>
          <p class="mt-2 text-secondary">Loading export jobs...</p>
        </div>
        
        <div v-else>
          <h5 class="mb-3"><i class="bi bi-list-task"></i> Export Jobs</h5>
          <div v-if="exports.length === 0" class="alert alert-info">
            <i class="bi bi-info-circle"></i> No export jobs yet. Click "Request CSV Export" to create one.
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle">
              <thead>
                <tr>
                  <th><i class="bi bi-hash"></i> Job ID</th>
                  <th><i class="bi bi-tag"></i> Status</th>
                  <th><i class="bi bi-calendar"></i> Requested</th>
                  <th><i class="bi bi-calendar-check"></i> Completed</th>
                  <th><i class="bi bi-download"></i> Download</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="job in exports" :key="job.id">
                  <td><strong>#{{ job.id }}</strong></td>
                  <td>
                    <span class="badge" :class="'bg-' + statusBadge(job.status)">
                      <i :class="'bi bi-' + statusIcon(job.status)"></i> {{ job.status }}
                    </span>
                  </td>
                  <td><small>{{ job.created_at }}</small></td>
                  <td><small>{{ job.completed_at || '—' }}</small></td>
                  <td>
                    <a
                      v-if="job.download_url"
                      :href="job.download_url"
                      target="_blank"
                      rel="noopener"
                      class="btn btn-success btn-sm"
                    >
                      <i class="bi bi-download"></i> Download CSV
                    </a>
                    <span v-else class="text-muted">
                      <i class="bi bi-hourglass-split"></i> Processing...
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
};
