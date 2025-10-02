import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download,
  Eye,
  MessageSquare,
  BarChart3,
  Shield,
  Zap,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { useAppStore } from '../store'
import { formatBytes, formatRiskLevel, formatDate } from '../lib/utils'

interface DashboardProps {
  documentId?: string
}

const Dashboard: React.FC<DashboardProps> = ({ documentId }) => {
  const { 
    currentDocument, 
    summary, 
    clauses, 
    alerts, 
    qaSessions,
    isLoading,
    generateSummary,
    extractClauses,
    fetchAlerts
  } = useAppStore()

  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [showAnalysis, setShowAnalysis] = useState(false)

  useEffect(() => {
    if (currentDocument && documentId === currentDocument.document_id) {
      // Simulate analysis progress
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setShowAnalysis(true)
            return 100
          }
          return prev + 10
        })
      }, 300)

      // Load analysis data
      generateSummary(currentDocument.document_id)
      extractClauses(currentDocument.document_id)
      fetchAlerts(currentDocument.document_id)

      return () => clearInterval(interval)
    }
  }, [currentDocument, documentId])

  const riskDistribution = {
    low: clauses.filter(c => c.risk_level === 'low').length,
    medium: clauses.filter(c => c.risk_level === 'medium').length,
    high: clauses.filter(c => c.risk_level === 'high').length,
    critical: clauses.filter(c => c.risk_level === 'critical').length,
  }

  const totalClauses = Object.values(riskDistribution).reduce((a, b) => a + b, 0)
  const criticalAlerts = alerts.filter(a => a.risk_level === 'critical').length
  const highRiskClauses = riskDistribution.high + riskDistribution.critical

  if (!currentDocument) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Document Selected</h2>
            <p className="text-gray-600">Upload a document to see the analysis dashboard</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Analysis</h1>
              <p className="text-gray-600 mt-1">AI-powered insights for {currentDocument.filename}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                View Document
              </Button>
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Analysis Progress */}
        <AnimatePresence>
          {analysisProgress < 100 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    AI Analysis in Progress
                  </CardTitle>
                  <CardDescription>
                    Our AI is analyzing your document for key insights, risks, and summaries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Analysis Progress</span>
                      <span>{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clauses</p>
                  <p className="text-3xl font-bold text-gray-900">{totalClauses}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600 font-medium">✓ Analyzed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Risk Alerts</p>
                  <p className="text-3xl font-bold text-gray-900">{criticalAlerts}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-red-600 font-medium">⚠ Critical</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Risk Items</p>
                  <p className="text-3xl font-bold text-gray-900">{highRiskClauses}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-yellow-600 font-medium">Attention</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Q&A Sessions</p>
                  <p className="text-3xl font-bold text-gray-900">{qaSessions.length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600 font-medium">💬 Active</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  AI Summary
                </CardTitle>
                <CardDescription>
                  Key insights and simplified explanation of your document
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <div className="space-y-4">
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 leading-relaxed">{summary}</p>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(new Date())}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          AI Confidence: 94%
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-500">Generating AI summary...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk Analysis */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Low Risk</span>
                    </div>
                    <span className="text-sm font-medium">{riskDistribution.low}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Medium Risk</span>
                    </div>
                    <span className="text-sm font-medium">{riskDistribution.medium}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">High Risk</span>
                    </div>
                    <span className="text-sm font-medium">{riskDistribution.high}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-700 rounded-full"></div>
                      <span className="text-sm">Critical</span>
                    </div>
                    <span className="text-sm font-medium">{riskDistribution.critical}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Document Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">File Size</span>
                  <span className="text-sm font-medium">{formatBytes(currentDocument.file_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Upload Date</span>
                  <span className="text-sm font-medium">{formatDate(currentDocument.upload_timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type</span>
                  <Badge variant="secondary">{currentDocument.document_type.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Analyzed
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Risk Alerts
              </CardTitle>
              <CardDescription>
                Important clauses that require your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.slice(0, 3).map((alert, index) => (
                    <motion.div
                      key={alert.alert_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200"
                    >
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900">{alert.title}</h4>
                        <p className="text-sm text-red-700 mt-1">{alert.description}</p>
                        <div className="mt-2">
                          <Badge className={formatRiskLevel(alert.risk_level).className}>
                            {formatRiskLevel(alert.risk_level).label}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Critical Alerts</h3>
                  <p className="text-gray-600">Your document appears to have low risk overall</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  ⚠️ This is AI assistance, not legal advice. Please consult with a qualified legal professional for important decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard