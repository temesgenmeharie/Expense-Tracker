import { FileJson, FileText, File } from 'lucide-react'
import Modal from './Modal'

export type ExportFormat = 'csv' | 'json' | 'pdf'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  onExport: (format: ExportFormat) => void
  loading?: boolean
}

export default function ExportDialog({ open, onClose, onExport, loading = false }: ExportDialogProps) {
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

  return (
    <Modal open={open} onClose={onClose} title="Export data">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose a file format to download your filtered expenses data.
        </p>

        <div className="grid grid-cols-1 gap-3">
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => onExport(fmt.id)}
              disabled={loading}
              className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`mt-0.5 ${fmt.color}`}>
                <fmt.icon size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{fmt.label}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{fmt.description}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          disabled={loading}
          className="w-full btn-secondary mt-4"
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
