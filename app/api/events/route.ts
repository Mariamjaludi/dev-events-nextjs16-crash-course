import { v2 as cloudinary } from "cloudinary";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { Event } from "@/database";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData()

    let event

    try {
      event = Object.fromEntries(formData.entries())
    } catch {
      return NextResponse.json({ message: 'Invalid JSON data format' }, { status: 400 })
    }
    const file = formData.get('image') as File

    if (!file) return NextResponse.json({ message: "Image file is required" }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({resource_type: "image", folder: "DevEvent"}, (error, results) => {
        if(error) return reject(error)
        resolve(results)
      }).end(buffer)
    })

    const eventData = {
      title: event.title,
      description: event.description,
      overview: event.overview,
      image: (uploadResult as { secure_url: string }).secure_url,
      venue: event.venue,
      location: event.location,
      date: event.date,
      time: event.time,
      mode: event.mode,
      audience: event.audience,
      agenda: event.agenda,
      organizer: event.organizer,
      tags: event.tags
    }

    const createdEvent = await Event.create(eventData)
    return NextResponse.json({ message: 'Event created successfully', event: createdEvent }, { status: 201 })
  } catch(e) {
    console.log(e)
    return NextResponse.json({ message: 'Event Creation Failed', error: e instanceof Error ? e.message : "Unknown" }, { status: 500 })
  }
}

export async function GET() {
  try {
    connectDB()

    const events = await Event.find().sort({ createdAt: -1 })

    return NextResponse.json({ message: 'Event list fetched successfully', events }, { status: 200 })

  } catch(e) {
    NextResponse.json({ message: "Event fetching failed", error: e }, { status: 500 })
  }
}