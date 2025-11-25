import { api } from "../../api.js";

export const UserActiveReservations = {
  name: "UserActiveReservations",
  emits: ["notify"],
  data() {
    return {
      reservations: [],
      loading: false,
      releaseBusy: new Set(),
    };
  },
  mounted() {
    this.loadReservations();
  },
  computed: {
    activeReservations() {
      return this.reservations.filter(r => !r.left_at);
    },
  },
  methods: {
    async loadReservations() {
      this.loading = true;
      const response = await api.user.listReservations();
      if (response.ok) {
        this.reservations = response.data.reservations || [];
      }
      this.loading = false;
    },
    async releaseReservation(reservationId) {
      this.releaseBusy.add(reservationId);
      const response = await api.user.releaseReservation(reservationId);
      this.releaseBusy.delete(reservationId);
      
      if (!response.ok) {
        this.$emit("notify", response.data?.error || "Failed to release spot", "danger");
        return;
      }
      
      this.$emit("notify", "Spot released successfully!", "success");
      await this.loadReservations();
    },
  },
  template: `
    <div>
      <div class="card-header-custom d-flex justify-content-between align-items-center">
        <span><i class="bi bi-hourglass-split page-icon"></i>Active Reservations</span>
        <button class="btn btn-warning btn-sm" @click="loadReservations" :disabled="loading">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-success"></div>
          <p class="mt-2 text-secondary">Loading active reservations...</p>
        </div>
        <div v-else-if="activeReservations.length === 0" class="alert alert-info">
          <i class="bi bi-info-circle"></i> No active reservations. Book a parking spot to see it here!
        </div>
        <div v-else>
          <div class="row g-3 mb-3">
            <div class="col-md-12">
              <div class="stat-card" style="background: linear-gradient(135deg, var(--light-yellow), var(--light-green));">
                <h3>{{ activeReservations.length }}</h3>
                <p><i class="bi bi-hourglass-split"></i> Currently Active</p>
              </div>
            </div>
          </div>
          
          <h5 class="mb-3"><i class="bi bi-list-check text-warning"></i> Your Active Parking Spots</h5>
          <div class="row g-3">
            <div class="col-md-6" v-for="item in activeReservations" :key="item.id">
              <div class="card h-100" style="border-left: 4px solid var(--primary-yellow);">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0">
                      <i class="bi bi-geo-alt-fill text-warning"></i> {{ item.lot }}
                    </h6>
                    <span class="badge bg-warning text-dark">Active</span>
                  </div>
                  <p class="mb-2">
                    <strong>Spot:</strong> 
                    <span class="badge bg-secondary">#{{ item.spot_id }}</span>
                  </p>
                  <p class="mb-2" v-if="item.vehicle_number">
                    <strong>Vehicle:</strong> 
                    <span class="badge bg-info"><i class="bi bi-car-front"></i> {{ item.vehicle_number }}</span>
                  </p>
                  <p class="mb-2">
                    <small class="text-muted">
                      <i class="bi bi-clock"></i> Parked at: {{ item.parked_at }}
                    </small>
                  </p>
                  <div class="d-grid mt-3">
                    <button
                      class="btn btn-success"
                      :disabled="releaseBusy.has(item.id)"
                      @click="releaseReservation(item.id)"
                    >
                      <span v-if="releaseBusy.has(item.id)" class="spinner-border spinner-border-sm me-1"></span>
                      <i class="bi bi-check-circle"></i> Release Spot
                    </button>
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
