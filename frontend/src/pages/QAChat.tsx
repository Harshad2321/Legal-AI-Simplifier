import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send,
  MessageCircle,
  Bot,
  User,
  FileText,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { useAppStore } from '../store'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  confidence?: number
  sources?: string[]
}

interface QAChatProps {
  documentId?: string
}

const QAChat: React.FC<QAChatProps> = ({ documentId }) => {
  const { 
    currentDocument, 
    isLoading,
    askQuestion
  } = useAppStore()

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI legal assistant. I've analyzed your document and I'm ready to answer any questions you have about its contents, clauses, or legal implications. What would you like to know?",
      timestamp: new Date(),
      confidence: 95
    }
  ])
  
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {

      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(userMessage.content),
        timestamp: new Date(),
        confidence: Math.floor(Math.random() * 20) + 80,
        sources: ['Page 3, Section 2.1', 'Clause 4.5']
      }

      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
        confidence: 0
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const generateAIResponse = (question: string): string => {
    const responses = [
      "Based on my analysis of your document, this clause appears in Section 3.2 and establishes specific obligations for both parties. The language used suggests a moderate risk level due to its binding nature.",
      "I found several relevant provisions related to your question. The document includes termination clauses that allow for cancellation under specific circumstances outlined in Section 5.1.",
      "This is an important question regarding liability. The document contains limitation of liability clauses that may significantly impact your legal exposure. I recommend reviewing Section 7.3 carefully.",
      "The payment terms specified in your contract include net-30 payment requirements with late fees. This is standard practice but you should be aware of the penalty structure in Section 4.2.",
      "Your document includes an arbitration clause which means disputes must be resolved through binding arbitration rather than court proceedings. This can affect your legal options.",
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const suggestedQuestions = [
    "What are the key risks in this contract?",
    "Explain the termination clauses",
    "What are my payment obligations?",
    "Are there any liability limitations?",
    "What happens if I breach this contract?"
  ]

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!currentDocument) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Document Loaded</h2>
            <p className="text-gray-600">Upload a document to start asking questions</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Legal Assistant</h1>
              <p className="text-gray-600 mt-1">Ask questions about {currentDocument.filename}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                Document Loaded
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                AI Ready
              </Badge>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat with AI Assistant
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                          <div className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              message.type === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            

                            <div className={`rounded-2xl px-4 py-3 max-w-md ${
                              message.type === 'user'
                                ? 'bg-blue-500 text-white ml-2'
                                : 'bg-white border border-gray-200 mr-2'
                            }`}>
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              

                              {message.type === 'ai' && (
                                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                  {message.confidence && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <CheckCircle2 className="h-3 w-3" />
                                      {message.confidence}% confidence
                                    </div>
                                  )}
                                  {message.sources && (
                                    <div className="text-xs text-gray-500">
                                      <span className="font-medium">Sources:</span> {message.sources.join(', ')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          

                          <div className={`mt-1 text-xs text-gray-500 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-1">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                

                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question about your document..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className="px-3"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          

          <div className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSuggestedQuestion(question)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                  >
                    {question}
                  </motion.button>
                ))}
              </CardContent>
            </Card>
            

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{currentDocument.filename}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Uploaded {new Date().toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                  Tip: Ask specific questions about clauses, obligations, or risks for the most helpful responses.
                </div>
              </CardContent>
            </Card>
            

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Clause Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Risk Assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Legal Explanations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Contract Interpretation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">
                  AI responses are for informational purposes only. Always consult with a qualified legal professional for important decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default QAChat