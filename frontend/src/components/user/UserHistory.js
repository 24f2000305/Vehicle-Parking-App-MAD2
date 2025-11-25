import { api } from "../../api.js";

export const UserHistory = {
  name: "UserHistory",
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
    completedReservations() {
      return this.reservations.filter(r => r.left_at);
    },
    totalSpent() {
      return this.reservations
        .filter(r => r.cost)
        .reduce((sum, r) => sum + Number(r.cost), 0);
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
        <span><i class="bi bi-clock-history page-icon"></i>My Booking History</span>
        <button class="btn btn-warning btn-sm" @click="loadReservations" :disabled="loading">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-success"></div>
          <p class="mt-2 text-secondary">Loading your reservations...</p>
        </div>
        <div v-else>
          <div class="row g-3 mb-4">
            <div class="col-md-4">
              <div class="stat-card">
                <h3>{{ reservations.length }}</h3>
                <p><i class="bi bi-list-check"></i> Total Bookings</p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="stat-card">
                <h3>{{ activeReservations.length }}</h3>
                <p><i class="bi bi-hourglass-split"></i> Active</p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="stat-card">
                <h3>₹{{ totalSpent.toFixed(2) }}</h3>
                <p><i class="bi bi-currency-rupee"></i> Total Spent</p>
              </div>
            </div>
          </div>

          <div v-if="reservations.length === 0" class="alert alert-info">
            <i class="bi bi-info-circle"></i> No reservations yet. Book your first parking spot!
          </div>
          
          <div v-else>
            <div v-if="activeReservations.length > 0" class="mb-4">
              <h5 class="mb-3"><i class="bi bi-hourglass-split text-warning"></i> Active Reservations</h5>
              <div class="list-group">
                <div class="list-group-item" v-for="item in activeReservations" :key="item.id">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="mb-1"><i class="bi bi-geo-alt-fill text-warning"></i> {{ item.lot }}</h6>
                      <p class="mb-1">
                        <span class="badge bg-warning text-dark">Spot #{{ item.spot_id }}</span>
                        <span v-if="item.vehicle_number" class="badge bg-secondary ms-2">
                          <i class="bi bi-car-front"></i> {{ item.vehicle_number }}
                        </span>
                      </p>
                      <small class="text-muted">
                        <i class="bi bi-clock"></i> Parked at: {{ item.parked_at }}
                      </small>
                    </div>
                    <button
                      class="btn btn-success"
                      :disabled="releaseBusy.has(item.id)"
                      @click="releaseReservation(item.id)"
                    >
                      <span v-if="releaseBusy.has(item.id)" class="spinner-border spinner-border-sm me-1"></span>
                      <i class="bi bi-check-circle"></i> Release
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="completedReservations.length > 0">
              <h5 class="mb-3"><i class="bi bi-check-circle text-success"></i> Completed Reservations</h5>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Lot</th>
                      <th>Spot</th>
                      <th>Vehicle</th>
                      <th>Parked At</th>
                      <th>Left At</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in completedReservations" :key="item.id">
                      <td><strong>#{{ item.id }}</strong></td>
                      <td>{{ item.lot }}</td>
                      <td><span class="badge bg-secondary">#{{ item.spot_id }}</span></td>
                      <td><span class="badge bg-info">{{ item.vehicle_number || 'N/A' }}</span></td>
                      <td><small>{{ item.parked_at }}</small></td>
                      <td><small>{{ item.left_at }}</small></td>
                      <td><strong>₹{{ Number(item.cost || 0).toFixed(2) }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
