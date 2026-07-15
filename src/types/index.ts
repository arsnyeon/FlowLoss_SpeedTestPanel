export interface NodeItem {
  title: string
  url: string
  status: boolean
}

export interface NodeGroup {
  [groupName: string]: NodeItem[]
}

export interface CustomNode {
  label: string
  value: string
  time: string
}

export interface IpInfo {
  ip: string
  country?: { code: string; name: string }
  regions_short?: string[]
  regions?: string[]
  as?: { name: string; info: string }
  type?: string
  show: string[]
}

export interface RankingItem {
  rank: number
  user: string
  avatar: string
  data: string
  type: string
  short: string
  addr: string
}

export interface AdItem {
  url: string
  content: string
  type: string
  time: string
  uuid: string
}

export interface FriendLink {
  name: string
  url: string
  desc: string
}
