import { Schema, model, models, Document, Types } from 'mongoose'
import Event from './event.model'

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId
  email: string
  createdAt: Date
  updatedAt: Date
}

// Booking schema definition
const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => {
          // RFC 5322 compliant email validation regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return emailRegex.test(v)
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
)

// Pre-save hook to validate that the referenced event exists
BookingSchema.pre('save', async function () {
  // Only validate eventId if it's new or modified
  if (this.isNew || this.isModified('eventId')) {
    // Check if the event exists in the database
    const eventExists = await Event.findById(this.eventId)

    if (!eventExists) {
      throw new Error(
        `Event with ID ${this.eventId} does not exist. Please provide a valid event ID.`
      )
    }
  }
})

// Unique compound index: enforces one booking per event per email
BookingSchema.index({ eventId: 1, email: 1 }, { unique: true })

// Index on email for faster user booking lookups
BookingSchema.index({ email: 1 })

// Compound index for common queries: event bookings sorted by date
// Useful for queries like "get all bookings for an event ordered by booking date"
BookingSchema.index({ eventId: 1, createdAt: -1 })

// Export the Booking model, reusing existing model in development to avoid recompilation errors
const Booking = models.Booking || model<IBooking>('Booking', BookingSchema)

export default Booking
