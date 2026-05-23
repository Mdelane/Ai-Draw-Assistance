'use client'

import { useState, useRef, useEffect } from 'react'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'
import type { ScoutPoints } from '@/lib/types'

type Message = { role: 'user' | 'assistant'; content: string }

type Props = {
  pointsCombos: ScoutPoints[]
  isPro: boolean
  freeQueryUsed: boolean
  emailVerified: boolean
}

const STARTER_PROMPTS = [
  (tag: ScoutPoints) => `What's my best unit to apply for with ${tag.points} ${tag.species} points in ${tag.state}?`,
  (tag: ScoutPoints) => `Should I apply this year or wait and build more ${tag.state} ${tag.species} points?`,
  (tag: ScoutPoints) => `Which unit gives me the best odds I can realistically draw with ${tag.points} points?`,
  (tag: ScoutPoints) => `What unit has the best trophy quality I can draw with my ${tag.points} points?`,
  (tag: ScoutPoints) => `I have ${tag.points} points — am I close to drawing a premium unit, or should I change strategy?`,
  (tag: ScoutPoints) => `Which ${tag.state} ${tag.species} units are trending better this year?`,
  (tag: ScoutPoints) => `Compare my top 3 unit options for ${tag.state} ${tag.species} with ${tag.points} points`,
  (tag: ScoutPoints) => `What if I wait one more year — how does that change my options?`,
]

export default function ScoutChat({ pointsCombos, isPro, freeQueryUsed, emailVerified }: Props) {
  const [selectedTag, setSelectedTag] = useState<ScoutPoints | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [freeUsed, setFreeUsed] = useState(freeQueryUsed)
  const [showTagSelector, setShowTagSelector] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Reset conversation when tag changes
  function selectTag(tag: ScoutPoints) {
    setSelectedTag(tag)
    setMessages([])
    setShowTagSelector(false)
  }

  async function sendMessage(text: string) {
    if (!selectedTag) return
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    trackEvent(GA_EVENTS.SCOUT_QUERY_RUN, {
      state: selectedTag.state,
      species: selectedTag.species,
      weapon_type: selectedTag.weapon_type,
      points: selectedTag.points,
    })

    const res = await fetch('/api/scout/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: selectedTag.state,
        species: selectedTag.species,
        weaponType: selectedTag.weapon_type,
        points: selectedTag.points,
        year: new Date().getFullYear(),
        messages: newMessages,
        isFreeQuery: !isPro && !freeUsed,
      }),
    })

    if (res.status === 402) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: `That's your free Scout AI query used up. Subscribe to Scout Pro to keep the conversation going and see all your unit recommendations.`,
      }])
      setFreeUsed(true)
      setLoading(false)
      return
    }

    if (!res.ok || !res.body) {
      setMessages(m => [...m, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
      setLoading(false)
      return
    }

    if (!isPro) setFreeUsed(true)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let assistantMessage = ''
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      assistantMessage += decoder.decode(value, { stream: true })
      setMessages(m => [...m.slice(0, -1), { role: 'assistant', content: assistantMessage }])
    }

    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input.trim())
  }

  const canChat = isPro || !freeUsed
  const prompts = selectedTag ? STARTER_PROMPTS.map(fn => fn(selectedTag)) : []

  // Tag selector screen
  if (showTagSelector || !selectedTag) {
    return (
      <div className="border border-stone-200 rounded-2xl overflow-hidden">
        <div className="bg-[#1B4332] text-white px-6 py-4">
          <h2 className="font-black text-lg tracking-tight">Scout AI</h2>
          <p className="text-green-200 text-sm">Which tag are we working on today?</p>
        </div>
        <div className="p-6">
          {pointsCombos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="mb-2">No tags saved to your profile yet.</p>
              <p className="text-sm">Add your points inventory in your Scout profile to get personalized recommendations.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {pointsCombos.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => selectTag(tag)}
                  className="w-full text-left border border-stone-200 rounded-xl px-5 py-4 hover:border-[#1B4332] hover:bg-green-50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-gray-900 tracking-tight">{tag.state} {tag.species}</span>
                      <span className="text-gray-400 text-sm ml-2">· {tag.weapon_type}</span>
                      {tag.is_primary && <span className="ml-2 text-xs bg-[#1B4332] text-white px-2 py-0.5 rounded-full">Primary</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#1B4332]">{tag.points}</span>
                      <span className="text-gray-400 text-sm ml-1">pts</span>
                    </div>
                  </div>
                  {tag.years_applying > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{tag.years_applying} year{tag.years_applying !== 1 ? 's' : ''} applying</p>
                  )}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => window.location.href = '/account'}
            className="w-full border-2 border-dashed border-stone-200 rounded-xl py-3 text-sm text-gray-400 hover:border-stone-300 hover:text-gray-500 transition-colors"
          >
            + Add a tag to my profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-stone-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#1B4332] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{selectedTag.state} {selectedTag.species} — {selectedTag.weapon_type}</h2>
          <p className="text-green-200 text-sm">{selectedTag.points} preference points</p>
        </div>
        <button
          onClick={() => { setShowTagSelector(true); setMessages([]) }}
          className="text-green-300 text-sm hover:text-white transition-colors"
        >
          Switch tag →
        </button>
      </div>

      {/* Free query banner */}
      {!isPro && !freeUsed && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-amber-800">🎯 You have <strong>1 free Scout AI query</strong> — try it free</p>
          <a href="/scout/upgrade" className="text-xs font-medium text-amber-700 underline hover:text-amber-900">Upgrade for unlimited →</a>
        </div>
      )}

      {/* Paywall state */}
      {!isPro && freeUsed && (
        <div className="p-8 text-center bg-stone-50">
          <p className="font-black text-gray-900 tracking-tight mb-1">You've used your free query</p>
          <p className="text-gray-500 text-sm mb-5">Subscribe to Scout Pro to continue your strategy conversation and unlock all unit recommendations.</p>
          <a
            href="/scout/upgrade"
            className="bg-amber-400 text-black px-6 py-2.5 rounded-xl font-black hover:bg-amber-300 transition-colors inline-block"
          >
            Upgrade to Scout Pro — $9.99/mo
          </a>
        </div>
      )}

      {/* Chat area — shown when can chat */}
      {canChat && (
        <>
          <div className="h-96 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="pt-4">
                <p className="text-sm text-gray-400 mb-4 text-center">Ask Scout anything, or pick a question below:</p>
                <div className="space-y-2">
                  {prompts.slice(0, 5).map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left bg-stone-50 border border-stone-200 text-gray-700 text-sm px-4 py-3 rounded-xl hover:bg-green-50 hover:border-[#1B4332] transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#1B4332] text-white rounded-br-sm'
                    : 'bg-stone-100 text-gray-900 rounded-bl-sm'
                }`}>
                  {m.content || (loading && i === messages.length - 1 ? '...' : '')}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-stone-200 px-4 py-3 flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your draw strategy..."
              disabled={loading}
              className="flex-1 border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] disabled:bg-stone-50"
            />
            <button
              type="submit" disabled={loading || !input.trim()}
              className="bg-[#1B4332] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#163828] disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  )
}
