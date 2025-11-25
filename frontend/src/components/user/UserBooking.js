import { api } from "../../api.js";

export const UserBooking = {
  name: "UserBooking",
  emits: ["notify"],
  data() {
    return {
      lots: [],
      loading: false,
      bookingBusy: false,
      selectedLotId: "",
      quantity: 1,
      vehicleNumber: "",
    };
  },
  mounted() {
    this.loadLots();
  },
  methods: {
    async loadLots() {
      this.loading = true;
      const response = await api.user.listLots();
      if (response.ok) {
        this.lots = response.data.lots || [];
      }
      this.loading = false;
    },
    async bookSpot() {
      // Validate selection
      if (!this.selectedLotId) {
        this.$emit("notify", "Please select a parking lot", "warning");
        return;
      }
      
      // Validate vehicle number
      const vehiclePattern = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;
      if (!this.vehicleNumber || !vehiclePattern.test(this.vehicleNumber.toUpperCase())) {
        this.$emit("notify", "Vehicle number must be in format XXNNXXNNNN (e.g., AB12CD3456)", "warning");
        return;
      }
      
      // Check if selected lot has enough spots
      const selectedLot = this.lots.find(lot => lot.id == this.selectedLotId);
      if (selectedLot && selectedLot.available_spots < this.quantity) {
        this.$emit("notify", `Only ${selectedLot.available_spots} spot(s) available`, "warning");
        return;
      }
      
      this.bookingBusy = true;
      const response = await api.user.createReservation({ 
        lot_id: Number(this.selectedLotId),
        quantity: Number(this.quantity),
        vehicle_number: this.vehicleNumber.toUpperCase()
      });
      this.bookingBusy = false;
      
      if (!response.ok) {
        this.$emit("notify", response.data?.error || "Booking failed", "danger");
        return;
      }
      
      const booked = response.data.booked || 1;
      const requested = response.data.requested || 1;
      if (booked < requested) {
        this.$emit("notify", `Booked ${booked} out of ${requested} spots (limited availability)`, "warning");
      } else {
        this.$emit("notify", `Successfully booked ${booked} spot(s)!`, "success");
      }
      
      this.selectedLotId = "";
      this.quantity = 1;
      this.vehicleNumber = "";
      await this.loadLots();
    },
  },
  template: `
    <div>
      <div class="card-header-custom">
        <i class="bi bi-car-front page-icon"></i>Book a Parking Spot
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-success"></div>
          <p class="mt-2 text-secondary">Loading available lots...</p>
        </div>
        <div v-else>
          <div class="row g-4">
            <div class="col-lg-6">
              <div class="card" style="background-color: var(--light-green);">
                <div class="card-body">
                  <h5 class="mb-3"><i class="bi bi-pin-map-fill"></i> Select Parking Lot</h5>
                  <div class="mb-3">
                    <label class="form-label">Available Lots</label>
                    <select class="form-select form-select-lg" v-model="selectedLotId" :disabled="bookingBusy">
                      <option value="" disabled>Choose a parking lot...</option>
                      <option v-for="lot in lots" :key="lot.id" :value="lot.id" :disabled="lot.available_spots === 0">
                        {{ lot.name }} — ₹{{ lot.price_per_hour }}/hr 
                        ({{ lot.available_spots }} spot{{ lot.available_spots !== 1 ? 's' : '' }} free)
                      </option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Vehicle Number <span class="text-danger">*</span></label>
                    <input 
                      type="text" 
                      class="form-control form-control-lg" 
                      v-model="vehicleNumber" 
                      placeholder="e.g., AB12CD3456" 
                      maxlength="10"
                      style="text-transform: uppercase;"
                      :disabled="bookingBusy"
                    />
                    <small class="form-text text-muted">Format: XXNNXXNNNN (2 letters, 2 digits, 2 letters, 4 digits)</small>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Number of Spots</label>
                    <div class="input-group">
                      <button class="btn btn-outline-secondary" type="button" @click="quantity = Math.max(1, quantity - 1)" :disabled="bookingBusy">
                        <i class="bi bi-dash"></i>
                      </button>
                      <input type="number" class="form-control text-center" v-model.number="quantity" min="1" max="10" :disabled="bookingBusy" />
                      <button class="btn btn-outline-secondary" type="button" @click="quantity = Math.min(10, quantity + 1)" :disabled="bookingBusy">
                        <i class="bi bi-plus"></i>
                      </button>
                    </div>
                    <small class="form-text text-muted">You can book up to 10 spots at once</small>
                  </div>
                  <button class="btn btn-primary btn-lg w-100" @click="bookSpot" :disabled="bookingBusy || !selectedLotId">
                    <span v-if="bookingBusy" class="spinner-border spinner-border-sm me-2"></span>
                    <i class="bi bi-check-circle"></i> Reserve {{ quantity }} Spot{{ quantity !== 1 ? 's' : '' }}
                  </button>
                </div>
              </div>
            </div>
            <div class="col-lg-6">
              <h5 class="mb-3">
                <i class="bi bi-list-ul"></i> Available Parking Lots
              </h5>
              <div v-if="lots.length === 0" class="alert alert-info">
                <i class="bi bi-info-circle"></i> No parking lots available at the moment.
              </div>
              <div v-else class="list-group">
                <div class="list-group-item" v-for="lot in lots" :key="lot.id">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="mb-1">
                        <i class="bi bi-geo-alt-fill text-warning"></i> {{ lot.name }}
                      </h6>
                      <p class="mb-1"><strong>₹{{ lot.price_per_hour }}/hour</strong></p>
                      <small class="text-muted" v-if="lot.address">
                        <i class="bi bi-map"></i> {{ lot.address }}
                        <span v-if="lot.pin_code"> · {{ lot.pin_code }}</span>
                      </small>
                    </div>
                    <div class="text-end">
                      <span v-if="lot.available_spots > 0" class="badge bg-success">
                        <i class="bi bi-check-circle"></i> {{ lot.available_spots }} Available
                      </span>
                      <span v-else class="badge bg-danger">
                        <i class="bi bi-x-circle"></i> Full
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-3">
            <button class="btn btn-outline-primary" @click="loadLots" :disabled="loading">
              <i class="bi bi-arrow-clockwise"></i> Refresh Lots
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
