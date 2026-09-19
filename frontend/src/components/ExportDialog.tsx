import { useState, useEffect } from 'react'
import { FileJson, FileText, File, Download } from 'lucide-react'
import Modal from './Modal'

export type ExportFormat = 'csv' | 'json' | 'pdf'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  onExport: (format: ExportFormat) => void
  loading?: boolean
}

export default function ExportDialog({ open, onClose, onExport, loading = false }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null)

  // Reset selected format when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFormat(null)
    }
  }, [open])

  const formats: { id: ExportFormat; label: string; description: string; icon: React.ElementType; color: string }[] = [
    {
      id: 'csv',
      label: 'CSV',
      description: 'Spreadsheet format (Excel, Sheets)',
      icon: FileText,
      color: 'text-green-600',
    },
    {
      id: 'json',
      label: 'JSON',
      description: 'Structured data format',
      icon: FileJson,
      color: 'text-blue-600',
    },
    {
      id: 'pdf',
      label: 'PDF',
      description: 'Printable report format',
      icon: File,
      color: 'text-red-600',
    },
  ]

  const handleClose = () => {
    setSelectedFormat(null)
    onClose()
  }

  const handleFormatSelect = (format: ExportFormat) => {
    setSelectedFormat(format)
  }

  const handleDownload = () => {
    if (selectedFormat) {
      onExport(selectedFormat)
    }
  }

  const selectedFormatObj = selectedFormat ? formats.find(f => f.id === selectedFormat) : null

  return (
    <Modal open={open} onClose={handleClose} title={selectedFormat ? 'Confirm download' : 'Export data'}>
      <div className="space-y-4">
        {!selectedFormat ? (
          <>
            <p className="text-sm text-gray-300">
              Choose a file format to download your data.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {formats.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => handleFormatSelect(fmt.id)}
                  disabled={loading}
                  className="flex items-start gap-4 p-4 border border-primary-800 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`mt-0.5 ${fmt.color}`}>
                    <fmt.icon size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-primary-100">{fmt.label}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{fmt.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleClose}
              disabled={loading}
              className="w-full btn-secondary"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {/* Confirmation Screen */}
            <div className="flex flex-col items-center justify-center py-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                selectedFormatObj?.color || ''
              } bg-opacity-10`}>
                {selectedFormatObj && <selectedFormatObj.icon size={32} />}
              </div>
              <h2 className="text-lg font-bold text-primary-300 mb-2">
                Ready to download?
              </h2>
              <p className="text-center text-sm text-gray-300 mb-6">
                Your data will be exported as <span className="font-semibold">{selectedFormatObj?.label}</span> format
              </p>

              <div className="w-full bg-dark-inner rounded-lg p-4 mb-6 text-sm border border-primary-800">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">File format:</span>
                  <span className="font-medium text-primary-200">{selectedFormatObj?.label}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-400">File size:</span>
                  <span className="font-medium text-primary-200">Calculated on download</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedFormat(null)}
                disabled={loading}
                className="flex-1 btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleDownload}
                disabled={loading}
                className="flex-1 btn-primary gap-2 flex items-center justify-center"
              >
                <Download size={16} />
                {loading ? 'Downloading…' : 'Download'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
