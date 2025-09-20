import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Document, Clause, Alert } from '../types'
import apiService from '../services/api'

interface AppState {
  // Documents
  documents: Document[]
  currentDocument: Document | null
  
  // Analysis data
  summary: string | null
  clauses: Clause[]
  alerts: Alert[]
  qaSessions: Array<{
    id: string
    question: string
    answer: string
    timestamp: string
  }>
  
  // UI state
  isLoading: boolean
  uploadProgress: number
  error: string | null
  successMessage: string | null
  
  // Actions
  setCurrentDocument: (document: Document | null) => void
  setDocuments: (documents: Document[]) => void
  addDocument: (document: Document) => void
  updateDocument: (documentId: string, updates: Partial<Document>) => void
  removeDocument: (documentId: string) => void
  
  setSummary: (summary: string | null) => void
  setClauses: (clauses: Clause[]) => void
  setAlerts: (alerts: Alert[]) => void
  addQASession: (session: { question: string; answer: string }) => void
  
  setLoading: (loading: boolean) => void
  setUploadProgress: (progress: number) => void
  setError: (error: string | null) => void
  setSuccessMessage: (message: string | null) => void
  clearError: () => void
  clearMessages: () => void
  
  // Async actions
  uploadDocument: (file: File) => Promise<Document | null>
  fetchDocuments: () => Promise<void>
  generateSummary: (documentId: string, language?: string) => Promise<void>
  extractClauses: (documentId: string) => Promise<void>
  askQuestion: (documentId: string, question: string) => Promise<string | null>
  fetchAlerts: (documentId: string) => Promise<void>
  deleteDocument: (documentId: string) => Promise<void>
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      documents: [],
      currentDocument: null,
      summary: null,
      clauses: [],
      alerts: [],
      qaSessions: [],
      isLoading: false,
      uploadProgress: 0,
      error: null,
      successMessage: null,

      // Sync actions
      setCurrentDocument: (document) => set({ currentDocument: document }),
      setDocuments: (documents) => set({ documents }),
      addDocument: (document) => 
        set((state) => ({ documents: [...state.documents, document] })),
      updateDocument: (documentId, updates) =>
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.document_id === documentId ? { ...doc, ...updates } : doc
          ),
          currentDocument:
            state.currentDocument?.document_id === documentId
              ? { ...state.currentDocument, ...updates }
              : state.currentDocument,
        })),
      removeDocument: (documentId) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.document_id !== documentId),
          currentDocument:
            state.currentDocument?.document_id === documentId
              ? null
              : state.currentDocument,
        })),

      setSummary: (summary) => set({ summary }),
      setClauses: (clauses) => set({ clauses }),
      setAlerts: (alerts) => set({ alerts }),
      addQASession: (session) =>
        set((state) => ({ 
          qaSessions: [...state.qaSessions, {
            ...session,
            id: `qa_${Date.now()}`,
            timestamp: new Date().toISOString()
          }] 
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setUploadProgress: (uploadProgress) => set({ uploadProgress }),
      setError: (error) => set({ error, successMessage: null }),
      setSuccessMessage: (successMessage) => set({ successMessage, error: null }),
      clearError: () => set({ error: null }),
      clearMessages: () => set({ error: null, successMessage: null }),

      // Async actions
      uploadDocument: async (file: File) => {
        try {
          set({ isLoading: true, uploadProgress: 0, error: null })
          
          const result = await apiService.uploadDocument(file)
          
          const newDocument: Document = {
            document_id: result.document_id,
            filename: result.filename,
            document_type: result.document_type as any,
            file_size: result.file_size,
            upload_timestamp: result.upload_timestamp,
            processing_status: result.processing_status as any,
          }
          
          get().addDocument(newDocument)
          set({ 
            successMessage: 'Document uploaded successfully!',
            uploadProgress: 100 
          })
          
          return newDocument
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Upload failed'
          set({ error: errorMessage })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      fetchDocuments: async () => {
        try {
          set({ isLoading: true, error: null })
          const result = await apiService.listDocuments()
          set({ documents: result.documents })
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch documents'
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },

      generateSummary: async (documentId: string, language: string = 'en') => {
        try {
          set({ isLoading: true, error: null })
          const result = await apiService.summarizeDocument({
            document_id: documentId,
            language: language as any,
          })
          
          set({ summary: result.summary, successMessage: 'Summary generated successfully!' })
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to generate summary'
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },

      extractClauses: async (documentId: string) => {
        try {
          set({ isLoading: true, error: null })
          const result = await apiService.extractClauses({
            document_id: documentId,
            include_explanations: true,
          })
          
          set({ clauses: result.clauses, successMessage: 'Clauses extracted successfully!' })
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to extract clauses'
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },

      askQuestion: async (documentId: string, question: string) => {
        try {
          set({ isLoading: true, error: null })
          const result = await apiService.askQuestion({
            document_id: documentId,
            question,
          })
          
          get().addQASession({ question, answer: result.answer })
          return result.answer
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to get answer'
          set({ error: errorMessage })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      fetchAlerts: async (documentId: string) => {
        try {
          set({ isLoading: true, error: null })
          const result = await apiService.getAlerts({ document_id: documentId })
          set({ alerts: result.alerts })
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch alerts'
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },

      deleteDocument: async (documentId: string) => {
        try {
          set({ isLoading: true, error: null })
          await apiService.deleteDocument(documentId)
          get().removeDocument(documentId)
          set({ successMessage: 'Document deleted successfully!' })
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to delete document'
          set({ error: errorMessage })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    { name: 'legal-ai-store' }
  )
)