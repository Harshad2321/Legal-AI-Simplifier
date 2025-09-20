import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Eye,
  FileText,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { useAppStore } from '../store'
import { formatRiskLevel } from '../lib/utils'

interface ClauseExplorerProps {
  documentId?: string
}

const ClauseExplorer: React.FC<ClauseExplorerProps> = ({ documentId }) => {
  const { 
    currentDocument, 
    clauses, 
    isLoading,
    extractClauses
  } = useAppStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedClauses, setExpandedClauses] = useState<string[]>([])

  useEffect(() => {
    if (currentDocument && documentId === currentDocument.document_id) {
      extractClauses(currentDocument.document_id)
    }
  }, [currentDocument, documentId])

  // Filter clauses based on search and filters
  const filteredClauses = clauses.filter(clause => {
    const matchesSearch = clause.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clause.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRisk = selectedRiskFilter === 'all' || clause.risk_level === selectedRiskFilter
    const matchesCategory = selectedCategory === 'all' || clause.category === selectedCategory
    
    return matchesSearch && matchesRisk && matchesCategory
  })

  // Group clauses by category
  const clausesByCategory = filteredClauses.reduce((acc, clause) => {
    const category = clause.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(clause)
    return acc
  }, {} as Record<string, typeof clauses>)

  // Get unique categories for filter
  const categories = Array.from(new Set(clauses.map(c => c.category || 'Other')))

  const riskCounts = {
    low: clauses.filter(c => c.risk_level === 'low').length,
    medium: clauses.filter(c => c.risk_level === 'medium').length,
    high: clauses.filter(c => c.risk_level === 'high').length,
    critical: clauses.filter(c => c.risk_level === 'critical').length,
  }

  const toggleClauseExpansion = (clauseId: string) => {
    setExpandedClauses(prev => 
      prev.includes(clauseId) 
        ? prev.filter(id => id !== clauseId)
        : [...prev, clauseId]
    )
  }

  if (!currentDocument) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Document Selected</h2>
            <p className="text-gray-600">Upload a document to explore its clauses</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clause Explorer</h1>
              <p className="text-gray-600 mt-1">Analyze key clauses in {currentDocument.filename}</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              View Document
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clauses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{clauses.length}</div>
              <div className="text-sm text-gray-600">Total Clauses</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{riskCounts.low}</div>
              <div className="text-sm text-gray-600">Low Risk</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{riskCounts.medium + riskCounts.high}</div>
              <div className="text-sm text-gray-600">Medium-High Risk</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{riskCounts.critical}</div>
              <div className="text-sm text-gray-600">Critical Risk</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Clauses by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Extracting clauses...</p>
                </div>
              </CardContent>
            </Card>
          ) : Object.keys(clausesByCategory).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(clausesByCategory).map(([category, categoryClauses]) => (
                <Card key={category} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {category}
                      </div>
                      <Badge variant="secondary">{categoryClauses.length} clauses</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Accordion type="multiple" className="w-full">
                      {categoryClauses.map((clause, index) => {
                        const riskInfo = formatRiskLevel(clause.risk_level)
                        return (
                          <AccordionItem key={clause.clause_id} value={clause.clause_id}>
                            <AccordionTrigger className="px-6 hover:bg-gray-50">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0">
                                    <Badge className={riskInfo.className}>
                                      {riskInfo.label}
                                    </Badge>
                                  </div>
                                  <div className="text-left">
                                    <h4 className="font-medium text-gray-900">
                                      {clause.title || `Clause ${index + 1}`}
                                    </h4>
                                    <p className="text-sm text-gray-600 truncate max-w-md">
                                      {clause.content.substring(0, 100)}...
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                              >
                                {/* Clause Content */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <h5 className="font-medium text-gray-900 mb-2">Full Text</h5>
                                  <p className="text-gray-700 leading-relaxed">{clause.content}</p>
                                </div>

                                {/* Risk Analysis */}
                                {clause.risk_level !== 'low' && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                      <div>
                                        <h5 className="font-medium text-yellow-900 mb-1">Risk Analysis</h5>
                                        <p className="text-yellow-800 text-sm">
                                          This clause has been flagged as {riskInfo.label.toLowerCase()} due to potential legal implications.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* AI Explanation */}
                                {clause.explanation && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                                      <div>
                                        <h5 className="font-medium text-blue-900 mb-1">AI Explanation</h5>
                                        <p className="text-blue-800 text-sm">{clause.explanation}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Page Reference */}
                                {clause.page_number && (
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <FileText className="h-4 w-4" />
                                    Found on page {clause.page_number}
                                  </div>
                                )}
                              </motion.div>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Clauses Found</h3>
                <p className="text-gray-600">
                  {searchTerm || selectedRiskFilter !== 'all' || selectedCategory !== 'all'
                    ? 'Try adjusting your search criteria'
                    : 'No clauses have been extracted yet'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* AI Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  ⚠️ AI-generated clause analysis. Please consult with a qualified legal professional for important decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default ClauseExplorer