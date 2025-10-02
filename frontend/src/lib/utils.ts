import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const formatFileSize = formatBytes

export function formatRiskLevel(level: string): { 
  color: string; 
  label: string; 
  className: string;
} {
  switch (level.toLowerCase()) {
    case 'low':
      return {
        color: '#10b981',
        label: 'Low Risk',
        className: 'badge-risk-low'
      }
    case 'medium':
      return {
        color: '#f59e0b',
        label: 'Medium Risk',
        className: 'badge-risk-medium'
      }
    case 'high':
      return {
        color: '#ef4444',
        label: 'High Risk',
        className: 'badge-risk-high'
      }
    case 'critical':
      return {
        color: '#dc2626',
        label: 'Critical Risk',
        className: 'badge-risk-critical'
      }
    default:
      return {
        color: '#6b7280',
        label: 'Unknown',
        className: 'badge-risk-medium'
      }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getFileIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  
  switch (extension) {
    case 'pdf':
      return 'PDF'
    case 'doc':
    case 'docx':
      return 'DOC'
    case 'txt':
      return 'TXT'
    case 'rtf':
      return 'RTF'
    default:
      return 'FILE'
  }
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}