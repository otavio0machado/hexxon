import { NextResponse } from 'next/server'
import {
  getTasks,
  getTasksByDate,
  getTasksByRange,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
} from '@/lib/services/tasks'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    let tasks
    if (date) {
      tasks = await getTasksByDate(date)
    } else if (startDate && endDate) {
      tasks = await getTasksByRange(startDate, endDate)
    } else {
      tasks = await getTasks()
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, date } = body

    if (!title || !date) {
      return NextResponse.json(
        { error: 'title and date are required' },
        { status: 400 },
      )
    }

    const task = await createTask(body)
    return NextResponse.json({ task })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 },
      )
    }

    if ('is_completed' in updates && Object.keys(updates).length === 1) {
      const task = await toggleTaskComplete(id, updates.is_completed)
      return NextResponse.json({ task })
    }

    const task = await updateTask(id, updates)
    return NextResponse.json({ task })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 },
      )
    }

    await deleteTask(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    )
  }
}
