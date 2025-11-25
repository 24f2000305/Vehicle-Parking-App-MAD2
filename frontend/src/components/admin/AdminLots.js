import { api } from "../../api.js";

export const AdminLots = {
  name: "AdminLots",
  emits: ["notify"],
  data() {
    return {
      lots: [],
      busy: false,
      formBusy: false,
      showForm: false,
      editingLotId: null,
      form: {
        name: "",
        price_per_hour: "",
        total_spots: "",
        address: "",
        pin_code: "",
      },
      error: null,
    };
  },
  mounted() {
    this.fetchLots();
  },
  methods: {
    async fetchLots() {
      this.busy = true;
      const res = await api.admin.listLots();
      if (res.ok) {
        this.lots = res.data.lots || [];
      }
      this.busy = false;
    },
    resetForm() {
      this.form = {
        name: "",
        price_per_hour: "",
        total_spots: "",
        address: "",
        pin_code: "",
      };
      this.error = null;
      this.showForm = false;
      this.editingLotId = null;
    },
    editLot(lot) {
      this.editingLotId = lot.id;
      this.form = {
        name: lot.name,
        price_per_hour: lot.price_per_hour,
        total_spots: lot.total_spots,
        address: lot.address || "",
        pin_code: lot.pin_code || "",
      };
      this.showForm = true;
      this.error = null;
    },
    async submitLot() {
      this.formBusy = true;
      this.error = null;
      try {
        const payload = {
          name: this.form.name,
          price_per_hour: Number(this.form.price_per_hour),
          total_spots: Number(this.form.total_spots),
        };
        
        // Validate required fields
        if (!payload.name || !payload.price_per_hour || !payload.total_spots) {
          this.error = "All fields are required";
          return;
        }
        
        if (this.form.address) payload.address = this.form.address;
        if (this.form.pin_code) payload.pin_code = this.form.pin_code;
        
        let response;
        if (this.editingLotId) {
          // Update existing lot
          response = await api.admin.updateLot(this.editingLotId, payload);
          if (!response.ok) {
            this.error = response.data?.error || "Failed to update lot";
            return;
          }
          this.$emit("notify", "Parking lot updated successfully", "success");
        } else {
          // Create new lot
          response = await api.admin.createLot(payload);
          if (!response.ok) {
            this.error = response.data?.error || "Failed to create lot";
            return;
          }
          this.$emit("notify", "Parking lot created successfully", "success");
        }
        
        this.resetForm();
        await this.fetchLots();
      } finally {
        this.formBusy = false;
      }
    },
    async deleteLot(lotId, lotName) {
      if (!confirm(`Delete "${lotName}"? All spots must be free.`)) return;
      
      const response = await api.admin.deleteLot(lotId);
      if (!response.ok) {
        this.$emit("notify", response.data?.error || "Failed to delete lot", "danger");
        return;
      }
      
      this.$emit("notify", "Lot deleted successfully", "success");
      await this.fetchLots();
    },
  },
  template: `
    <div>
      <div class="card-header-custom d-flex justify-content-between align-items-center">
        <span><i class="bi bi-building page-icon"></i>Parking Lots Management</span>
        <button class="btn btn-warning btn-sm" @click="showForm = !showForm">
          <i class="bi bi-plus-circle"></i> {{ showForm ? 'Cancel' : 'Create New Lot' }}
        </button>
      </div>
      <div class="card-body">
        <div v-if="showForm" class="card mb-4" style="background-color: var(--light-yellow);">
          <div class="card-body">
            <h5 class="mb-3">
              <i :class="editingLotId ? 'bi bi-pencil-square' : 'bi bi-plus-square'"></i> 
              {{ editingLotId ? 'Edit Parking Lot' : 'Create New Parking Lot' }}
            </h5>
            <form @submit.prevent="submitLot">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Lot Name *</label>
                  <input class="form-control" v-model="form.name" required placeholder="e.g., Downtown Parking" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">Price per Hour (₹) *</label>
                  <input class="form-control" v-model="form.price_per_hour" type="number" step="0.1" required placeholder="50" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">Total Spots *</label>
                  <input class="form-control" v-model="form.total_spots" type="number" required placeholder="100" />
                </div>
                <div class="col-md-8">
                  <label class="form-label">Address</label>
                  <input class="form-control" v-model="form.address" placeholder="123 Main Street" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">PIN Code</label>
                  <input class="form-control" v-model="form.pin_code" placeholder="400001" />
                </div>
              </div>
              <div v-if="error" class="alert alert-danger mt-3 py-2">{{ error }}</div>
              <div class="mt-3">
                <button class="btn btn-primary" type="submit" :disabled="formBusy">
                  <span v-if="formBusy" class="spinner-border spinner-border-sm me-2"></span>
                  <i class="bi bi-check-circle"></i> {{ editingLotId ? 'Update Lot' : 'Create Lot' }}
                </button>
                <button class="btn btn-secondary ms-2" type="button" @click="resetForm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <div v-if="busy" class="text-center py-5">
          <div class="spinner-border text-success"></div>
          <p class="mt-2 text-secondary">Loading lots...</p>
        </div>
        <div v-else>
          <div class="mb-3 d-flex justify-content-between align-items-center">
            <h5 class="mb-0">All Parking Lots ({{ lots.length }})</h5>
            <button class="btn btn-outline-primary btn-sm" @click="fetchLots">
              <i class="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
          <div v-if="lots.length === 0" class="alert alert-info">
            <i class="bi bi-info-circle"></i> No parking lots created yet. Click "Create New Lot" to add one.
          </div>
          <div v-else class="row g-3">
            <div class="col-md-6" v-for="lot in lots" :key="lot.id">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 class="card-title mb-1">
                        <i class="bi bi-geo-alt-fill text-warning"></i> {{ lot.name }}
                      </h5>
                      <p class="text-muted small mb-2">ID: #{{ lot.id }}</p>
                    </div>
                    <div class="btn-group">
                      <button class="btn btn-outline-primary btn-sm" @click="editLot(lot)" title="Edit">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-danger btn-sm" @click="deleteLot(lot.id, lot.name)" title="Delete">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div class="mt-3">
                    <div class="d-flex justify-content-between mb-2">
                      <span><i class="bi bi-currency-rupee"></i> <strong>₹{{ lot.price_per_hour }}/hr</strong></span>
                      <span class="badge bg-success">{{ lot.available_spots }}/{{ lot.total_spots }} Available</span>
                    </div>
                    <div v-if="lot.address" class="small text-muted">
                      <i class="bi bi-map"></i> {{ lot.address }}
                      <span v-if="lot.pin_code"> · PIN: {{ lot.pin_code }}</span>
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
