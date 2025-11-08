import React from 'react'
import { useWorkflowStore } from '@/store/workflow'
import type { Service } from '@/types/nodes'
import { Mail, FileSpreadsheet, Slack, Send, Calendar, Zap, Tag, Plus, MessageSquare, Clock, Filter, Settings2, Trash, Smile, Image, File } from 'lucide-react'

export const NodePalette: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { startDragNode } = useWorkflowStore()
  if (collapsed) return null

  const Section: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({ title, color, children }) => (
    <div className="border rounded-md shadow-card bg-white">
      <div className="px-3 py-2 border-b font-medium text-sm" style={{ color }}>{title}</div>
      <div className="p-2 grid grid-cols-2 gap-2">{children}</div>
    </div>
  )

  const Item: React.FC<{ label: string; icon: React.ReactNode; type: string; service: Service }> = ({ label, icon, type, service }) => (
    <div
      className="flex items-center gap-2 border rounded p-2 hover:bg-slate-50 cursor-grab"
      draggable
      onDragStart={(e) => startDragNode(e, { type, service })}
      title={label}
    >
      <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded">{icon}</div>
      <span className="text-xs">{label}</span>
    </div>
  )

  return (
    <div className="space-y-3">
      <Section title="Gmail" color="#EA4335">
        <Item label="New Email Received" icon={<Zap className="w-4 h-4" />} type="gmail.newEmail" service="gmail" />
        <Item label="Send Email" icon={<Send className="w-4 h-4" />} type="gmail.sendEmail" service="gmail" />
        <Item label="Create Draft" icon={<Plus className="w-4 h-4" />} type="gmail.createDraft" service="gmail" />
      </Section>
      <Section title="Google Sheets" color="#34A853">
        <Item label="New Row Added" icon={<Plus className="w-4 h-4" />} type="sheets.newRow" service="sheets" />
        <Item label="Row Updated" icon={<Settings2 className="w-4 h-4" />} type="sheets.rowUpdated" service="sheets" />
        <Item label="Add Row" icon={<Plus className="w-4 h-4" />} type="sheets.addRow" service="sheets" />
        <Item label="Update Row" icon={<Settings2 className="w-4 h-4" />} type="sheets.updateRow" service="sheets" />
        <Item label="Find Row" icon={<Filter className="w-4 h-4" />} type="sheets.findRow" service="sheets" />
        <Item label="Clear Row" icon={<Trash className="w-4 h-4" />} type="sheets.clearRow" service="sheets" />
      </Section>
      {/* <Section title="Slack" color="#4A154B">
        <Item label="New Message in Channel" icon={<Zap className="w-4 h-4" />} type="slack.newMessage" service="slack" />
        <Item label="New Direct Message" icon={<Zap className="w-4 h-4" />} type="slack.newDm" service="slack" />
        <Item label="Send Message" icon={<Send className="w-4 h-4" />} type="slack.sendMessage" service="slack" />
        <Item label="Send Direct Message" icon={<Send className="w-4 h-4" />} type="slack.sendDm" service="slack" />
        <Item label="Create Channel" icon={<Plus className="w-4 h-4" />} type="slack.createChannel" service="slack" />
        <Item label="Add Reaction" icon={<Smile className="w-4 h-4" />} type="slack.addReaction" service="slack" />
      </Section> */}
      {/* <Section title="Telegram" color="#0088cc">
        <Item label="New Message Received" icon={<Zap className="w-4 h-4" />} type="telegram.newMessage" service="telegram" />
        <Item label="Send Message" icon={<Send className="w-4 h-4" />} type="telegram.sendMessage" service="telegram" />
        <Item label="Send Photo" icon={<Image className="w-4 h-4" />} type="telegram.sendPhoto" service="telegram" />
        <Item label="Send Document" icon={<File className="w-4 h-4" />} type="telegram.sendDocument" service="telegram" />
        <Item label="Reply to Message" icon={<MessageSquare className="w-4 h-4" />} type="telegram.reply" service="telegram" />
      </Section> */}
      <Section title="Google Calendar" color="#4285F4">
        <Item label="New Event Created" icon={<Zap className="w-4 h-4" />} type="gcal.newEvent" service="gcal" />
        <Item label="Event Starting Soon" icon={<Clock className="w-4 h-4" />} type="gcal.eventSoon" service="gcal" />
        <Item label="Create Event" icon={<Plus className="w-4 h-4" />} type="gcal.createEvent" service="gcal" />
        <Item label="Update Event" icon={<Settings2 className="w-4 h-4" />} type="gcal.updateEvent" service="gcal" />
        <Item label="Delete Event" icon={<Trash className="w-4 h-4" />} type="gcal.deleteEvent" service="gcal" />
        <Item label="Find Event" icon={<Filter className="w-4 h-4" />} type="gcal.findEvent" service="gcal" />
      </Section>
      {/* <Section title="Special" color="#3B82F6">
        <Item label="Delay" icon={<Clock className="w-4 h-4" />} type="special.delay" service="special" />
        <Item label="Condition / Filter" icon={<Filter className="w-4 h-4" />} type="special.condition" service="special" />
        <Item label="Data Transformer" icon={<Settings2 className="w-4 h-4" />} type="special.transform" service="special" />
      </Section> */}
    </div>
  )
}
