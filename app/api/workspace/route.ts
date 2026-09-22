import { and, desc, eq, sql } from "drizzle-orm"

import { getDb } from "../../../db"
import { conversations, employerProgress } from "../../../db/schema"

function getUserId(request: Request) {
  return request.headers.get("oai-authenticated-user-id") ?? "local-preview"
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error"

  return Response.json(
    {
      error: "Your saved workspace is temporarily unavailable.",
      detail: message,
    },
    { status: 500 },
  )
}

export async function GET(request: Request) {
  try {
    const db = getDb()
    const userId = getUserId(request)

    const [progress, savedConversations] = await Promise.all([
      db.select().from(employerProgress).where(eq(employerProgress.userId, userId)),
      db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.createdAt), desc(conversations.id)),
    ])

    return Response.json({ progress, conversations: savedConversations })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as {
      employerId?: string
      starred?: boolean
      stage?: string
    }
    const employerId = payload.employerId?.trim() ?? ""

    if (!employerId) {
      return Response.json({ error: "employerId is required" }, { status: 400 })
    }

    const userId = getUserId(request)
    const db = getDb()
    const existing = await db
      .select()
      .from(employerProgress)
      .where(
        and(
          eq(employerProgress.userId, userId),
          eq(employerProgress.employerId, employerId),
        ),
      )
      .limit(1)

    const current = existing[0]
    const starred = payload.starred ?? current?.starred ?? false
    const stage = payload.stage?.trim() || current?.stage || "planned"

    const [progress] = await db
      .insert(employerProgress)
      .values({ userId, employerId, starred, stage })
      .onConflictDoUpdate({
        target: [employerProgress.userId, employerProgress.employerId],
        set: { starred, stage, updatedAt: sql`CURRENT_TIMESTAMP` },
      })
      .returning()

    return Response.json({ progress })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      employerId?: string
      recruiterName?: string
      note?: string
      interest?: string
    }
    const employerId = payload.employerId?.trim() ?? ""
    const note = payload.note?.trim() ?? ""

    if (!employerId || !note) {
      return Response.json(
        { error: "employerId and note are required" },
        { status: 400 },
      )
    }

    const userId = getUserId(request)
    const db = getDb()
    const [conversation] = await db
      .insert(conversations)
      .values({
        userId,
        employerId,
        recruiterName: payload.recruiterName?.trim() ?? "",
        note,
        interest: payload.interest?.trim() || "promising",
      })
      .returning()

    await db
      .insert(employerProgress)
      .values({ userId, employerId, stage: "met" })
      .onConflictDoUpdate({
        target: [employerProgress.userId, employerProgress.employerId],
        set: { stage: "met", updatedAt: sql`CURRENT_TIMESTAMP` },
      })

    return Response.json({ conversation }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
