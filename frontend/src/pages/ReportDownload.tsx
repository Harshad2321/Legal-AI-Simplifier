import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Shield,
  Eye,
  Share2,
  Mail,
  Printer,
  Settings,
  Star,
  Clock,
  Users,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { useAppStore } from '../store'
import { formatFileSize, formatRiskLevel } from '../lib/utils'

interface ReportDownloadProps {
  documentId?: string
}

const ReportDownload: React.FC<ReportDownloadProps> = ({ documentId }) => {
  const { 
    currentDocument, 
    summary,
    clauses,
    alerts,
    isLoading
  } = useAppStore()

  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'html'>('pdf')
  const [includeAnnotations, setIncludeAnnotations] = useState(true)
  const [includeRiskAnalysis, setIncludeRiskAnalysis] = useState(true)
  const [includeClauses, setIncludeClauses] = useState(true)
  const [includeQA, setIncludeQA] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsGenerating(false)
    
    // Create download link
    const element = document.createElement('a')
    element.href = '#'
    element.download = `legal-analysis-${currentDocument?.filename || 'report'}.${selectedFormat}`
    element.click()
  }

  const handlePreview = () => {
    // Open preview in new window
    window.open('#', '_blank')
  }

  const handleShare = () => {
    navigator.share?.({
      title: 'Legal Analysis Report',
      text: `Legal analysis report for ${currentDocument?.filename}`,
      url: window.location.href
    })
  }

  if (!currentDocument) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Document Analyzed</h2>
            <p className="text-gray-600">Complete document analysis to generate a report</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const riskCounts = {
    low: clauses.filter(c => c.risk_level === 'low').length,
    medium: clauses.filter(c => c.risk_level === 'medium').length,
    high: clauses.filter(c => c.risk_level === 'high').length,
    critical: clauses.filter(c => c.risk_level === 'critical').length,
  }

  const totalClauses = clauses.length
  const overallRiskScore = totalClauses > 0 
    ? Math.round(((riskCounts.critical * 4 + riskCounts.high * 3 + riskCounts.medium * 2 + riskCounts.low * 1) / (totalClauses * 4)) * 100)
    : 0

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
              <h1 className="text-3xl font-bold text-gray-900">Analysis Report</h1>
              <p className="text-gray-600 mt-1">Download comprehensive legal analysis for {currentDocument.filename}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handlePreview} className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Format Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Report Format</CardTitle>
                  <CardDescription>Choose your preferred download format</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { format: 'pdf' as const, icon: FileText, title: 'PDF', description: 'Best for sharing' },
                      { format: 'docx' as const, icon: FileText, title: 'Word', description: 'Editable format' },
                      { format: 'html' as const, icon: FileText, title: 'HTML', description: 'Web format' }
                    ].map(({ format, icon: Icon, title, description }) => (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedFormat === format
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-8 w-8 mx-auto mb-2" />
                        <div className="font-medium">{title}</div>
                        <div className="text-xs text-gray-500">{description}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Content Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Report Content</CardTitle>
                  <CardDescription>Customize what to include in your report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      id: 'annotations',
                      label: 'Document Annotations',
                      description: 'Highlighted sections with risk indicators',
                      checked: includeAnnotations,
                      onChange: setIncludeAnnotations,
                      icon: Eye
                    },
                    {
                      id: 'risk',
                      label: 'Risk Analysis',
                      description: 'Comprehensive risk assessment and scoring',
                      checked: includeRiskAnalysis,
                      onChange: setIncludeRiskAnalysis,
                      icon: Shield
                    },
                    {
                      id: 'clauses',
                      label: 'Clause Breakdown',
                      description: 'Detailed analysis of all identified clauses',
                      checked: includeClauses,
                      onChange: setIncludeClauses,
                      icon: FileText
                    },
                    {
                      id: 'qa',
                      label: 'Q&A Session',
                      description: 'Include your chat history with AI assistant',
                      checked: includeQA,
                      onChange: setIncludeQA,
                      icon: Users
                    }
                  ].map(({ id, label, description, checked, onChange, icon: Icon }) => (
                    <div key={id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id={id}
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <label htmlFor={id} className="font-medium text-gray-900 cursor-pointer">
                            {label}
                          </label>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Download Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Ready to Download</h3>
                    <p className="text-blue-100 mb-6">
                      Your comprehensive legal analysis report is ready to generate
                    </p>
                    
                    {isGenerating ? (
                      <div className="space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                        <p className="text-sm text-blue-100">Generating your report...</p>
                        <Progress value={66} className="bg-blue-400" />
                      </div>
                    ) : (
                      <Button 
                        onClick={handleDownload}
                        className="bg-white text-blue-600 hover:bg-gray-100 gap-2 px-8 py-3"
                        size="lg"
                      >
                        <Download className="h-5 w-5" />
                        Generate & Download Report
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Report Preview & Stats */}
          <div className="space-y-6">
            {/* Report Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Report Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Document Pages</span>
                      <Badge variant="secondary">{summary?.pageCount || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Clauses Analyzed</span>
                      <Badge variant="secondary">{totalClauses}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Critical Alerts</span>
                      <Badge variant="destructive">{alerts.filter(a => a.severity === 'critical').length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Overall Risk Score</span>
                      <Badge className={
                        overallRiskScore >= 75 ? 'bg-red-500' :
                        overallRiskScore >= 50 ? 'bg-yellow-500' :
                        overallRiskScore >= 25 ? 'bg-blue-500' : 'bg-green-500'
                      }>
                        {overallRiskScore}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Risk Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(riskCounts).map(([level, count]) => {
                        const info = formatRiskLevel(level as any)
                        return (
                          <div key={level} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${info.className.includes('red') ? 'bg-red-500' : 
                                info.className.includes('yellow') ? 'bg-yellow-500' :
                                info.className.includes('blue') ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                              <span className="capitalize">{level}</span>
                            </div>
                            <span className="font-medium">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Document Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Document Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{currentDocument.filename}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Settings className="h-4 w-4" />
                    {formatFileSize(currentDocument.size)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    Analyzed {new Date(currentDocument.uploadDate).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Mail className="h-4 w-4" />
                    Email Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Printer className="h-4 w-4" />
                    Print Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Zap className="h-4 w-4" />
                    Schedule Analysis
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* AI Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  ⚠️ This AI-generated report is for informational purposes only. Professional legal review is recommended for important decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default ReportDownload