"use client"

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  MapPin,
  MessageSquareText,
  Search,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { employers } from "./data"

type Conversation = {
  id: number
  employerId: string
  recruiterName: string
  note: string
  interest: string
  followUpStatus: string
  createdAt: string
}

type ProgressRecord = {
  employerId: string
  starred: boolean
  stage: string
}

const demoConversation: Conversation = {
  id: 0,
  employerId: "cas-technology",
  recruiterName: "Morgan",
  note: "The platform team uses Java and AWS. Apply tonight and mention the internal tools project.",
  interest: "top-choice",
  followUpStatus: "pending",
  createdAt: "2026-09-17T18:30:00.000Z",
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("plan")
  const [selectedId, setSelectedId] = useState(employers[0].id)
  const [query, setQuery] = useState("")
  const [filterMode, setFilterMode] = useState("top")
  const [starred, setStarred] = useState<string[]>(["cas-technology", "integrated-solutions-for-systems-is4s"])
  const [recruiterName, setRecruiterName] = useState("")
  const [note, setNote] = useState("")
  const [interest, setInterest] = useState("promising")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [saving, setSaving] = useState(false)
  const [workspaceReady, setWorkspaceReady] = useState(false)

  const selected = employers.find((employer) => employer.id === selectedId) ?? employers[0]
  const visibleConversations = conversations.length > 0 ? conversations : [demoConversation]

  useEffect(() => {
    let cancelled = false

    async function loadWorkspace() {
      try {
        const response = await fetch("/api/workspace")

        if (!response.ok) {
          throw new Error("Workspace request failed")
        }

        const data = (await response.json()) as {
          progress: ProgressRecord[]
          conversations: Conversation[]
        }

        if (cancelled) {
          return
        }

        const savedStars = data.progress
          .filter((record) => record.starred)
          .map((record) => record.employerId)

        if (data.progress.length > 0) {
          setStarred(savedStars)
        }

        setConversations(data.conversations)
        setWorkspaceReady(true)
      } catch {
        if (!cancelled) {
          setWorkspaceReady(false)
        }
      }
    }

    void loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const context = document.modelContext

    if (!context?.registerTool) {
      return
    }

    const lifecycle = new AbortController()
    const employerIds = employers.map((employer) => employer.id)

    const registrations = [
      context.registerTool(
        {
          name: "open_employer_brief",
          title: "Open employer brief",
          description:
            "Open one employer's ranked briefing card in the FairSignal planning view.",
          inputSchema: {
            type: "object",
            properties: {
              employerId: { type: "string", enum: employerIds },
            },
            required: ["employerId"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute(input) {
            const employerId = (input as { employerId?: string }).employerId

            if (!employerId || !employerIds.includes(employerId)) {
              throw new Error("Choose a valid employer ID")
            }

            setSelectedId(employerId)
            setActiveTab("plan")
            const employer = employers.find((item) => item.id === employerId)

            return {
              employerId,
              employerName: employer?.name,
              matchScore: employer?.score,
              view: "plan",
            }
          },
        },
        { signal: lifecycle.signal },
      ),
      context.registerTool(
        {
          name: "set_employer_starred",
          title: "Set employer priority",
          description: "Star or unstar an employer in the FairSignal target list.",
          inputSchema: {
            type: "object",
            properties: {
              employerId: { type: "string", enum: employerIds },
              starred: { type: "boolean" },
            },
            required: ["employerId", "starred"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input) {
            const values = input as { employerId?: string; starred?: boolean }

            if (!values.employerId || !employerIds.includes(values.employerId)) {
              throw new Error("Choose a valid employer ID")
            }

            if (typeof values.starred !== "boolean") {
              throw new Error("starred must be true or false")
            }

            const response = await fetch("/api/workspace", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            })

            if (!response.ok) {
              throw new Error("The employer priority could not be saved")
            }

            setStarred((current) => {
              const withoutEmployer = current.filter((id) => id !== values.employerId)

              if (values.starred) {
                return [...withoutEmployer, values.employerId as string]
              }

              return withoutEmployer
            })

            return values
          },
        },
        { signal: lifecycle.signal },
      ),
      context.registerTool(
        {
          name: "save_recruiter_conversation",
          title: "Save recruiter conversation",
          description:
            "Save notes from a recruiter conversation and add it to the follow-up queue.",
          inputSchema: {
            type: "object",
            properties: {
              employerId: { type: "string", enum: employerIds },
              recruiterName: { type: "string" },
              note: { type: "string", minLength: 1 },
              interest: {
                type: "string",
                enum: ["low", "promising", "top-choice"],
              },
            },
            required: ["employerId", "note", "interest"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
          async execute(input) {
            const values = input as {
              employerId?: string
              recruiterName?: string
              note?: string
              interest?: string
            }

            if (!values.employerId || !employerIds.includes(values.employerId)) {
              throw new Error("Choose a valid employer ID")
            }

            if (!values.note?.trim()) {
              throw new Error("A conversation note is required")
            }

            if (!values.interest || !["low", "promising", "top-choice"].includes(values.interest)) {
              throw new Error("Choose a valid interest level")
            }

            const response = await fetch("/api/workspace", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            })

            if (!response.ok) {
              throw new Error("The conversation could not be saved")
            }

            const data = (await response.json()) as { conversation: Conversation }
            setConversations((current) => [data.conversation, ...current])
            setSelectedId(values.employerId)
            setActiveTab("follow-up")

            return {
              conversationId: data.conversation.id,
              employerId: values.employerId,
              followUpStatus: data.conversation.followUpStatus,
              view: "follow-up",
            }
          },
        },
        { signal: lifecycle.signal },
      ),
    ]

    for (const registration of registrations) {
      void Promise.resolve(registration).catch(() => undefined)
    }

    return () => lifecycle.abort()
  }, [])

  const filteredEmployers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return employers.filter((employer) => {
      const matchesMode = filterMode === "all"
        || (filterMode === "top" && employer.score >= 68)
        || (filterMode === "eligible" && employer.eligibility === "eligible")
        || (filterMode === "future" && employer.eligibility === "future")
      const searchable = [
        employer.name,
        employer.industry,
        employer.role,
        employer.schoolYears,
        ...employer.skills,
      ]
        .join(" ")
        .toLowerCase()

      return matchesMode && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [filterMode, query])

  async function toggleStar(id: string) {
    const nextStarred = !starred.includes(id)

    setStarred((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id)
      }

      return [...current, id]
    })

    try {
      const response = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employerId: id, starred: nextStarred }),
      })

      if (!response.ok) {
        throw new Error("Save failed")
      }

      setWorkspaceReady(true)
    } catch {
      setWorkspaceReady(false)
      toast.error("Star saved for this visit only")
    }
  }

  async function saveConversation() {
    if (!note.trim()) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employerId: selected.id,
          recruiterName,
          note,
          interest,
        }),
      })

      if (!response.ok) {
        throw new Error("Save failed")
      }

      const data = (await response.json()) as { conversation: Conversation }
      setConversations((current) => [data.conversation, ...current])
      setRecruiterName("")
      setNote("")
      setInterest("promising")
      setWorkspaceReady(true)
      toast.success("Conversation saved. Follow-up is queued.")
    } catch {
      setWorkspaceReady(false)
      toast.error("Could not save yet. Your note is still here.")
    } finally {
      setSaving(false)
    }
  }

  async function copyFollowUp(conversation: Conversation) {
    const employer =
      employers.find((item) => item.id === conversation.employerId) ?? employers[0]
    const greeting = conversation.recruiterName
      ? `Hi ${conversation.recruiterName.split(" ")[0]},`
      : "Hello,"
    const draft = `${greeting}\n\nThank you for speaking with me at the Ohio University career fair. I enjoyed learning more about ${employer.name}, especially our conversation about ${conversation.note}\n\nMy work on SkillTape and my experience building Java APIs have made me excited to contribute to a production engineering team. I’ll follow the next steps we discussed and would be glad to stay in touch.\n\nBest,\nEthan Claybourn`

    try {
      await navigator.clipboard.writeText(draft)
      toast.success("Follow-up draft copied")
    } catch {
      toast.error("Could not copy the draft")
    }
  }

  return (
    <main className="min-h-screen bg-[#07100f] text-[#edf7f3]">
      <Toaster richColors position="top-center" />
      <div className="signal-grid min-h-screen">
        <header className="border-b border-white/10 bg-[#07100f]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-7 lg:px-10">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl border border-[#58f2cf]/30 bg-[#58f2cf]/10 text-[#58f2cf] shadow-[0_0_30px_rgba(88,242,207,0.12)]">
                <Target className="size-5" />
              </div>
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#58f2cf]">
                  FairSignal
                </p>
                <p className="text-sm text-[#8ca39e]">Career fair field guide</p>
              </div>
            </div>

            <div className="hidden items-center gap-5 text-sm md:flex">
              <div className="flex items-center gap-2 text-[#b6c9c4]">
                <CalendarDays className="size-4 text-[#58f2cf]" />
                Thu, Sep 17 · 10:00–3:00
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-[#b6c9c4]">
                <Clock3 className="size-4 text-[#ffcb65]" />
                Tomorrow
              </div>
            </div>

            <Badge className="border border-[#ffcb65]/30 bg-[#ffcb65]/10 text-[#ffda8e] hover:bg-[#ffcb65]/10">
              {employers.length} real employers
            </Badge>
          </div>
        </header>

        <section className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 lg:px-10 lg:py-7">
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#78908a]">
                <CircleDot className="size-3.5 text-[#58f2cf]" />
                Active mission
              </div>
              <h1 className="max-w-3xl text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">
                Turn a crowded employer list into a focused plan.
              </h1>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-[#b6c9c4]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#58f2cf] opacity-50" />
                <span className="relative inline-flex size-2 rounded-full bg-[#58f2cf]" />
              </span>
              {workspaceReady ? "Notes synced" : "Demo mode ready"}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-5">
            <div className="flex flex-col justify-between gap-3 border-b border-white/10 sm:flex-row sm:items-center">
              <TabsList variant="line" className="h-11 gap-5 p-0 text-[#8ca39e]">
                <TabsTrigger
                  value="plan"
                  className="px-0 text-[0.92rem] data-[state=active]:text-white after:bg-[#58f2cf]"
                >
                  <Target /> Plan
                </TabsTrigger>
                <TabsTrigger
                  value="live"
                  className="px-0 text-[0.92rem] data-[state=active]:text-white after:bg-[#58f2cf]"
                >
                  <MessageSquareText /> Live capture
                </TabsTrigger>
                <TabsTrigger
                  value="follow-up"
                  className="px-0 text-[0.92rem] data-[state=active]:text-white after:bg-[#58f2cf]"
                >
                  <ArrowRight /> Follow-up
                </TabsTrigger>
              </TabsList>

              <div className="pb-3 text-xs text-[#78908a] sm:pb-0">
                {employers.length} employers · {starred.length} starred · {conversations.length} conversations
              </div>
            </div>

            <TabsContent value="plan">
              <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
                <aside className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1715]/95">
                  <div className="border-b border-white/10 p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#78908a]" />
                      <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search companies, roles, or skills"
                        className="h-11 border-white/10 bg-[#07100f] pl-10 text-base text-white placeholder:text-[#60766f] focus-visible:border-[#58f2cf]/50 focus-visible:ring-[#58f2cf]/15"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        { label: "Top route", value: "top" },
                        { label: "Eligible now", value: "eligible" },
                        { label: "Future", value: "future" },
                        { label: "All", value: "all" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          variant="outline"
                          size="sm"
                          onClick={() => setFilterMode(option.value)}
                          className={`border-white/10 ${filterMode === option.value ? "bg-[#58f2cf]/10 text-[#8af8df]" : "bg-transparent text-[#8ca39e]"}`}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 pb-2 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#78908a]">
                      Ranked targets
                    </p>
                    <span className="text-xs text-[#60766f]">{filteredEmployers.length} shown</span>
                  </div>

                  <div className="max-h-[670px] space-y-1 overflow-y-auto p-2">
                    {filteredEmployers.map((employer, index) => {
                      const isSelected = employer.id === selected.id
                      const isStarred = starred.includes(employer.id)

                      return (
                        <Button
                          key={employer.id}
                          variant="ghost"
                          onClick={() => setSelectedId(employer.id)}
                          className={`grid h-auto w-full grid-cols-[2rem_1fr_auto] justify-stretch gap-3 rounded-xl border p-3 text-left ${
                            isSelected
                              ? "border-[#58f2cf]/25 bg-[#58f2cf]/[0.075] hover:bg-[#58f2cf]/[0.1]"
                              : "border-transparent hover:border-white/10 hover:bg-white/[0.035]"
                          }`}
                        >
                          <span className="text-center font-mono text-xs text-[#60766f]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-semibold text-white">
                                {employer.name}
                              </span>
                              {isStarred && (
                                <Star className="size-3.5 fill-[#ffcb65] text-[#ffcb65]" />
                              )}
                            </span>
                            <span className="mt-1 block truncate text-sm font-normal text-[#8ca39e]">
                              {employer.role}
                            </span>
                            <span className={`mt-1 block text-xs font-medium ${employer.eligibility === "eligible" ? "text-[#58f2cf]" : employer.eligibility === "future" ? "text-[#ffcb65]" : "text-[#75a7ff]"}`}>
                              {employer.eligibilityLabel}
                            </span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-white">
                              {employer.score}
                            </span>
                            <ChevronRight
                              className={`size-4 ${isSelected ? "text-[#58f2cf]" : "text-[#4d625d]"}`}
                            />
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </aside>

                <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1715]/95">
                  <div className="relative border-b border-white/10 p-5 sm:p-7">
                    <div
                      className="absolute inset-x-0 top-0 h-px"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${selected.accent}, transparent)`,
                      }}
                    />
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                      <div className="flex items-start gap-4">
                        <div
                          className="grid size-13 shrink-0 place-items-center rounded-xl border font-mono text-sm font-bold"
                          style={{
                            color: selected.accent,
                            borderColor: `${selected.accent}55`,
                            background: `${selected.accent}12`,
                          }}
                        >
                          {selected.initials}
                        </div>
                        <div>
                          <p className="mb-1 text-sm text-[#8ca39e]">{selected.industry}</p>
                          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                            {selected.name}
                          </h2>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#a9bcb7]">
                            <span className="flex items-center gap-1.5">
                              <BriefcaseBusiness className="size-4" /> {selected.role}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="size-4" /> {selected.location}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge className={`border ${selected.eligibility === "eligible" ? "border-[#58f2cf]/30 bg-[#58f2cf]/10 text-[#8af8df]" : selected.eligibility === "future" ? "border-[#ffcb65]/30 bg-[#ffcb65]/10 text-[#ffda8e]" : "border-[#75a7ff]/30 bg-[#75a7ff]/10 text-[#a9c6ff]"}`}>
                              {selected.eligibilityLabel}
                            </Badge>
                            <span className="text-xs text-[#78908a]">School years: {selected.schoolYears}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleStar(selected.id)}
                          aria-label={starred.includes(selected.id) ? "Remove star" : "Star company"}
                          className="border-white/10 bg-transparent text-[#a9bcb7] hover:bg-white/[0.06] hover:text-[#ffcb65]"
                        >
                          <Star
                            className={
                              starred.includes(selected.id)
                                ? "fill-[#ffcb65] text-[#ffcb65]"
                                : ""
                            }
                          />
                        </Button>
                        <a
                          href={selected.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm text-[#b6c9c4] transition hover:bg-white/[0.05] hover:text-white"
                        >
                          Website
                        </a>
                        <Button
                          onClick={() => setActiveTab("live")}
                          className="bg-[#58f2cf] text-[#07100f] hover:bg-[#8af8df]"
                        >
                          Open live card <ArrowRight />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="space-y-7">
                      <section>
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#58f2cf]">
                              Route intelligence
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-white">
                              Why this ranks here
                            </h3>
                          </div>
                          <div
                            className="score-ring grid size-16 place-items-center rounded-full"
                            style={{ "--score": `${selected.score * 3.6}deg` } as CSSProperties}
                          >
                            <div className="grid size-12 place-items-center rounded-full bg-[#0b1715] font-mono text-lg font-bold text-white">
                              {selected.score}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {selected.reasons.map((reason) => (
                            <div
                              key={reason}
                              className="flex gap-3 rounded-xl border border-white/[0.07] bg-[#07100f]/55 p-3.5"
                            >
                              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#58f2cf]/10 text-[#58f2cf]">
                                <Check className="size-3" />
                              </span>
                              <p className="text-sm leading-6 text-[#b9cbc6]">{reason}</p>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ffcb65]">
                          Conversation ammunition
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-white">
                          Questions worth asking
                        </h3>
                        <div className="mt-4 space-y-2">
                          {selected.questions.map((question, index) => (
                            <div
                              key={question}
                              className="grid grid-cols-[1.75rem_1fr] gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.035]"
                            >
                              <span className="font-mono text-xs text-[#ffcb65]">Q{index + 1}</span>
                              <p className="text-sm leading-6 text-[#c5d5d1]">{question}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <aside className="space-y-5">
                      <div className="rounded-xl border border-white/[0.08] bg-[#07100f]/65 p-4">
                        <div className="mb-4 flex items-center gap-2">
                          <Sparkles className="size-4 text-[#58f2cf]" />
                          <h3 className="text-sm font-semibold text-white">Score anatomy</h3>
                        </div>
                        <div className="space-y-4">
                          {selected.breakdown.map((factor) => (
                            <div key={factor.label}>
                              <div className="mb-1.5 flex items-center justify-between text-xs">
                                <span className="text-[#a9bcb7]">{factor.label}</span>
                                <span className="font-mono text-[#78908a]">
                                  {factor.score} · {factor.weight}
                                </span>
                              </div>
                              <Progress
                                value={factor.score}
                                className="h-1.5 bg-white/[0.07] [&>div]:bg-[#58f2cf]"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 border-t border-white/[0.08] pt-4 text-xs leading-5 text-[#6f857f]">
                          Priority is based on technical fit, sophomore eligibility, role clarity, and location. Future-only targets are capped so they cannot outrank actionable stops.
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.08] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78908a]">
                          Evidence to mention
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selected.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="border-white/10 bg-white/[0.035] text-[#c5d5d1]"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-4 rounded-lg bg-[#58f2cf]/[0.06] p-3">
                          <p className="text-xs leading-5 text-[#9cb1ab]">
                            Lead with <span className="font-semibold text-[#d7e6e2]">SkillTape</span>,
                            then connect it to your Spring Boot and research experience.
                          </p>
                        </div>
                      </div>
                    </aside>
                  </div>
                </article>
              </div>
            </TabsContent>

            <TabsContent value="live">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
                <section className="rounded-2xl border border-white/10 bg-[#0b1715]/95 p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#58f2cf]">
                        Fast capture
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">
                        Save the details before they blur together.
                      </h2>
                    </div>
                    <Badge className="border border-white/10 bg-white/[0.04] text-[#b6c9c4]">
                      Designed for one-handed use
                    </Badge>
                  </div>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm text-[#a9bcb7]">
                      Company
                      <div className="flex h-11 items-center rounded-md border border-white/10 bg-[#07100f] px-3 text-base text-white">
                        {selected.name}
                      </div>
                    </label>
                    <label className="space-y-2 text-sm text-[#a9bcb7]">
                      Recruiter
                      <Input
                        value={recruiterName}
                        onChange={(event) => setRecruiterName(event.target.value)}
                        placeholder="Name or leave blank"
                        className="h-11 border-white/10 bg-[#07100f] text-base text-white placeholder:text-[#60766f] focus-visible:border-[#58f2cf]/50 focus-visible:ring-[#58f2cf]/15"
                      />
                    </label>
                  </div>

                  <label className="mt-4 block space-y-2 text-sm text-[#a9bcb7]">
                    What mattered in the conversation?
                    <Textarea
                      value={note}
                      onChange={(event) => {
                        setNote(event.target.value)
                      }}
                      placeholder="Example: Their platform team uses Java and AWS. Morgan suggested applying tonight and mentioning the internal tools project."
                      className="min-h-40 border-white/10 bg-[#07100f] text-base leading-6 text-white placeholder:text-[#60766f] focus-visible:border-[#58f2cf]/50 focus-visible:ring-[#58f2cf]/15"
                    />
                  </label>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: "Low", value: "low" },
                      { label: "Promising", value: "promising" },
                      { label: "Top choice", value: "top-choice" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        onClick={() => setInterest(option.value)}
                        className={`h-11 border-white/10 hover:border-[#58f2cf]/35 hover:bg-[#58f2cf]/[0.07] hover:text-white ${
                          interest === option.value
                            ? "border-[#58f2cf]/40 bg-[#58f2cf]/10 text-white"
                            : "bg-transparent text-[#a9bcb7]"
                        }`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>

                  <Button
                    onClick={saveConversation}
                    disabled={!note.trim() || saving}
                    className="mt-5 h-12 w-full bg-[#58f2cf] text-base text-[#07100f] hover:bg-[#8af8df]"
                  >
                    {saving ? <CircleDot className="animate-pulse" /> : <MessageSquareText />}
                    {saving ? "Saving conversation" : "Save conversation"}
                  </Button>
                </section>

                <aside className="rounded-2xl border border-white/10 bg-[#0b1715]/95 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ffcb65]">
                    Pocket brief
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="grid size-11 place-items-center rounded-xl border font-mono text-xs font-bold"
                      style={{
                        color: selected.accent,
                        borderColor: `${selected.accent}55`,
                        background: `${selected.accent}12`,
                      }}
                    >
                      {selected.initials}
                    </div>
                    <div>
                      <h2 className="font-semibold text-white">{selected.name}</h2>
                      <p className="text-sm text-[#8ca39e]">{selected.score}% profile match</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    <BriefItem label="Open with">
                      “I built a self-hosted study platform and recently started working with
                      Spring Boot APIs. I’m interested in how your teams develop software at a
                      larger scale.”
                    </BriefItem>
                    <BriefItem label="Best question">{selected.questions[0]}</BriefItem>
                    <BriefItem label="Do not forget">
                      Ask for the recruiter&apos;s preferred next step and application timeline.
                    </BriefItem>
                  </div>
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="follow-up">
              <section className="rounded-2xl border border-white/10 bg-[#0b1715]/95 p-5 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#58f2cf]">
                      Follow-up queue
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">
                      Turn conversations into next steps.
                    </h2>
                  </div>
                  <Badge className="border border-[#58f2cf]/25 bg-[#58f2cf]/10 text-[#8af8df]">
                    {conversations.length || 1} draft ready
                  </Badge>
                </div>

                <div className="mt-7 overflow-hidden rounded-xl border border-white/[0.08]">
                  {visibleConversations.map((conversation) => {
                    const employer =
                      employers.find((item) => item.id === conversation.employerId) ??
                      employers[0]

                    return (
                      <div
                        key={conversation.id}
                        className="grid gap-4 border-b border-white/[0.08] bg-[#07100f]/55 p-4 last:border-0 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 place-items-center rounded-lg bg-white/[0.05] text-[#8ca39e]">
                            <Users className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{employer.name}</p>
                            <p className="text-sm text-[#78908a]">
                              {conversation.recruiterName || "Recruiter name not captured"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-[#ffda8e]">Send within 24 hours</p>
                          <p className="mt-1 line-clamp-1 text-sm text-[#78908a]">
                            {conversation.note}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => void copyFollowUp(conversation)}
                          className="border-white/10 bg-transparent text-[#b6c9c4] hover:bg-white/[0.05] hover:text-white"
                        >
                          Copy draft <ArrowRight />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  )
}

function BriefItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/[0.08] pt-4 first:border-0 first:pt-0">
      <p className="text-xs uppercase text-[#78908a]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#c5d5d1]">{children}</p>
    </div>
  )
}
