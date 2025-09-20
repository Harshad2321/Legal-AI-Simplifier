import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Loader2,
  Cloud
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { ThemeToggle } from '../components/theme-toggle'
import { useAppStore } from '../store'
import { formatBytes, getFileIcon } from '../lib/utils'

const UploadPage: React.FC = () => {
  const { 
    uploadDocument, 
    isLoading, 
    uploadProgress, 
    error, 
    successMessage, 
    clearMessages 
  } = useAppStore()
  
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; status: 'uploading' | 'success' | 'error'; progress: number }>>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const isValidType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.type)
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })
    
    setSelectedFiles(prev => [...prev, ...validFiles])
    clearMessages()
  }, [clearMessages])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false)
  })

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    const uploads = selectedFiles.map(file => ({
      file,
      status: 'uploading' as const,
      progress: 0
    }))
    
    setUploadedFiles(uploads)

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      try {
        const result = await uploadDocument(file)
        if (result) {
          setUploadedFiles(prev => 
            prev.map((upload, index) => 
              index === i ? { ...upload, status: 'success', progress: 100 } : upload
            )
          )
        } else {
          setUploadedFiles(prev => 
            prev.map((upload, index) => 
              index === i ? { ...upload, status: 'error', progress: 0 } : upload
            )
          )
        }
      } catch (error) {
        setUploadedFiles(prev => 
          prev.map((upload, index) => 
            index === i ? { ...upload, status: 'error', progress: 0 } : upload
          )
        )
      }
    }

    // Clear selected files after upload
    setTimeout(() => {
      setSelectedFiles([])
      setUploadedFiles([])
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 relative"
        >
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Upload Legal Documents
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Drag and drop your legal documents to get instant AI-powered analysis, 
            summaries, and risk assessments.
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="p-8 border-2 border-dashed border-gray-300 hover:border-primary transition-colors duration-300">
            <div
              {...getRootProps()}
              className={`cursor-pointer transition-all duration-300 ${
                dragActive || isDragActive ? 'scale-[1.02]' : ''
              }`}
            >
              <input {...getInputProps()} />
              <CardContent className="text-center py-12">
                <motion.div
                  animate={dragActive || isDragActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Cloud className="h-16 w-16 text-primary mx-auto mb-6" />
                </motion.div>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {dragActive || isDragActive ? 'Drop files here' : 'Upload Documents'}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Drag and drop files here, or{' '}
                  <span className="text-primary font-medium">click to browse</span>
                </p>
                
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  <Badge variant="secondary">PDF</Badge>
                  <Badge variant="secondary">DOC</Badge>
                  <Badge variant="secondary">DOCX</Badge>
                  <Badge variant="secondary">TXT</Badge>
                </div>
                
                <p className="text-sm text-gray-500">
                  Maximum file size: 10MB per file
                </p>
              </CardContent>
            </div>
          </Card>

          {/* Selected Files */}
          <AnimatePresence>
            {selectedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Selected Files ({selectedFiles.length})
                    </CardTitle>
                    <CardDescription>
                      Review your files before uploading
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedFiles.map((file, index) => (
                        <motion.div
                          key={`${file.name}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getFileIcon(file.name)}</span>
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                      <Button
                        onClick={uploadFiles}
                        disabled={isLoading}
                        className="px-8 py-3"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Progress */}
          <AnimatePresence>
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {uploadedFiles.map((upload, index) => (
                        <motion.div
                          key={`upload-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{upload.file.name}</span>
                            {upload.status === 'success' && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {upload.status === 'error' && (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                            {upload.status === 'uploading' && (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            )}
                          </div>
                          <Progress 
                            value={upload.status === 'uploading' ? uploadProgress : upload.progress} 
                            className="h-2"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <AnimatePresence>
            {(error || successMessage) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6"
              >
                <Card className={`border-l-4 ${error ? 'border-l-red-500 bg-red-50' : 'border-l-green-500 bg-green-50'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      {error ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <p className={`font-medium ${error ? 'text-red-800' : 'text-green-800'}`}>
                        {error || successMessage}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Smart Analysis</h3>
                <p className="text-sm text-gray-600">
                  AI-powered document analysis extracts key clauses and identifies potential risks
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Instant Summaries</h3>
                <p className="text-sm text-gray-600">
                  Get concise summaries in multiple languages with key insights highlighted
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Risk Assessment</h3>
                <p className="text-sm text-gray-600">
                  Automated risk detection helps you understand potential legal implications
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default UploadPage