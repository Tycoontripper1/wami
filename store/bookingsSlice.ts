import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Booking {
  id: string;
  creativeId: string;
  creativeName: string;
  creativeRole: string;
  creativeImage?: string;
  date: string;
  time: string;
  service?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

interface BookingsState {
  items: Booking[];
}

const initialState: BookingsState = {
  items: [],
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.items.unshift(action.payload);
    },
    updateBookingStatus: (state, action: PayloadAction<{ id: string; status: Booking['status'] }>) => {
      const booking = state.items.find((item) => item.id === action.payload.id);
      if (booking) {
        booking.status = action.payload.status;
      }
    },
    cancelBooking: (state, action: PayloadAction<string>) => {
      const booking = state.items.find((item) => item.id === action.payload);
      if (booking) {
        booking.status = 'cancelled';
      }
    },
    removeBooking: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearBookings: (state) => {
      state.items = [];
    },
  },
});

export const { addBooking, updateBookingStatus, cancelBooking, removeBooking, clearBookings } = bookingsSlice.actions;
export default bookingsSlice.reducer;
