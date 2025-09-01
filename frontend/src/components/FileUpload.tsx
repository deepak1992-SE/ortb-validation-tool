import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileUpload: (content: string) => void
  accept?: Record<string, string[]>
  maxSize?: number
  className?: string
}

export function FileUpload({
  onFileUpload,
  accept = {
    'application/json': ['.json'],
    'text/plain': ['.txt']
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  className
}: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        onFileUpload(content)
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
    }
    reader.readAsText(file)
  }, [onFileUpload])

  const onDropRejected = useCallback((rejectedFiles: any[]) => {
    const file = rejectedFiles[0]
    if (file) {
      const errors = file.errors
      if (errors.some((e: any) => e.code === 'file-too-large')) {
        toast.error('File is too large. Maximum size is 5MB.')
      } else if (errors.some((e: any) => e.code === 'file-invalid-type')) {
        toast.error('Invalid file type. Please upload a JSON or text file.')
      } else {
        toast.error('Failed to upload file')
      }
    }
  }, [])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxSize,
    multiple: false
  })

  return (
    <div className={cn("relative", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive && "border-primary-400 bg-primary-50",
          isDragAccept && "border-success-400 bg-success-50",
          isDragReject && "border-error-400 bg-error-50",
          !isDragActive && "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-2">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            isDragActive ? "bg-primary-100" : "bg-gray-100"
          )}>
            {isDragActive ? (
              <Upload className={cn(
                "w-6 h-6",
                isDragAccept ? "text-success-600" : 
                isDragReject ? "text-error-600" : "text-primary-600"
              )} />
            ) : (
              <FileText className="w-6 h-6 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isDragActive ? (
                isDragAccept ? "Drop the file here" : "File type not supported"
              ) : (
                "Drop a file here, or click to select"
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JSON or TXT files up to 5MB
            </p>
          </div>
        </div>
      </div>
      
      {/* Alternative button for mobile/accessibility */}
      <button
        {...getRootProps()}
        className="btn-secondary btn-sm mt-2 w-full md:hidden"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload File
      </button>
    </div>
  )
}