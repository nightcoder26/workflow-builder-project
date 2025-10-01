import { Mail, FileSpreadsheet, Slack, Send, Calendar, Clock, Filter, Settings2 } from 'lucide-react'
import React from 'react'
import { Service } from '@/types/nodes'

export const SERVICE_META: Record<Service, { label: string; color: string; Icon: React.ComponentType<any> }> = {
  gmail: { label: 'Gmail', color: '#EA4335', Icon: Mail },
  sheets: { label: 'Sheets', color: '#34A853', Icon: FileSpreadsheet },
  slack: { label: 'Slack', color: '#4A154B', Icon: Slack },
  telegram: { label: 'Telegram', color: '#0088cc', Icon: Send },
  gcal: { label: 'Calendar', color: '#4285F4', Icon: Calendar },
  special: { label: 'Special', color: '#3B82F6', Icon: Settings2 },
}
