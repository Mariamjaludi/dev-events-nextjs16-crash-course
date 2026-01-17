import { Schema, model, models, Document } from 'mongoose'

// TypeScript interface for Event document
export interface IEvent extends Document {
  title: string
  slug: string
  description: string
  overview: string
  image: string
  venue: string
  location: string
  date: string
  time: string
  mode: string
  audience: string
  agenda: string[]
  organizer: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// Event schema definition
const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    overview: {
      type: String,
      required: [true, 'Event overview is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Event image is required'],
    },
    venue: {
      type: String,
      required: [true, 'Event venue is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
    },
    mode: {
      type: String,
      required: [true, 'Event mode is required'],
      enum: ['online', 'offline', 'hybrid'],
      lowercase: true,
    },
    audience: {
      type: String,
      required: [true, 'Event audience is required'],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, 'Event agenda is required'],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'Agenda must have at least one item',
      },
    },
    organizer: {
      type: String,
      required: [true, 'Event organizer is required'],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, 'Event tags are required'],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'Tags must have at least one item',
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
)

/**
 * Generates a URL-friendly slug from the title
 * Converts to lowercase, removes special characters, and replaces spaces with hyphens
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Normalizes and validates date format
 * Converts date to ISO format (YYYY-MM-DD)
 * @throws Error if date format is invalid
 */
function normalizeDate(date: string): string {
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date format')
  }
  // Store as ISO date string for consistency
  return parsedDate.toISOString().split('T')[0]
}

/**
 * Normalizes and validates time format
 * Ensures time is not empty after trimming
 * @throws Error if time is empty
 */
function normalizeTime(time: string): string {
  const normalizedTime = time.trim()
  if (!normalizedTime) {
    throw new Error('Time cannot be empty')
  }
  return normalizedTime
}

// Pre-save hook to generate slug and normalize date/time
EventSchema.pre('save', function () {
  // Generate slug only if title is new or modified
  if (this.isModified('title')) {
    this.slug = generateSlug(this.title)
  }

  // Normalize and validate date format if modified
  if (this.isModified('date')) {
    this.date = normalizeDate(this.date)
  }

  // Normalize time format if modified
  if (this.isModified('time')) {
    this.time = normalizeTime(this.time)
  }
})

// Export the Event model, reusing existing model in development to avoid recompilation errors
const Event = models.Event || model<IEvent>('Event', EventSchema)

export default Event
