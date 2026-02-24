'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, FileText, CheckCircle, AlertTriangle, Loader } from 'lucide-react'
import { toast } from 'sonner'

interface BulkAddDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const UNIT_OPTIONS = {
  weight: ['kg', 'g', 'lb', 'oz'],
  count: ['box', 'packet', 'piece', 'bottle', 'can', 'carton', 'dozen', 'bag'],
}

type TabType = 'manual' | 'upload'

export function BulkAddDialog({ isOpen, onClose, onSuccess }: BulkAddDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('manual')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null)

  // Manual form state
  const [manualForms, setManualForms] = useState([
    {
      sku: '',
      name: '',
      category: '',
      description: '',
      unitType: 'count' as const,
      baseUnit: 'piece',
      defaultSupplier: '',
    },
  ])

  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<any[]>([])

  // Manual entry handlers
  const addManualForm = () => {
    setManualForms([
      ...manualForms,
      {
        sku: '',
        name: '',
        category: '',
        description: '',
        unitType: 'count' as const,
        baseUnit: 'piece',
        defaultSupplier: '',
      },
    ])
  }

  const updateManualForm = (index: number, field: string, value: string) => {
    const updated = [...manualForms]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'unitType') {
      // Reset base unit when unit type changes
      updated[index].baseUnit = value === 'weight' ? 'kg' : 'piece'
    }
    setManualForms(updated)
  }

  const removeManualForm = (index: number) => {
    setManualForms(manualForms.filter((_, i) => i !== index))
  }

  const submitManualProducts = async () => {
    if (manualForms.some((form) => !form.sku.trim() || !form.name.trim())) {
      toast.error('Please fill in SKU and Name for all products')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: manualForms,
          source: 'manual',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to add products')
        return
      }

      setResults({ success: data.successCount, failed: data.failedCount })
      toast.success(`${data.successCount} products added successfully!`)
      
      if (onSuccess) {
        onSuccess()
      }
      
      // Reset form after successful submission
      setTimeout(() => {
        setManualForms([
          {
            sku: '',
            name: '',
            category: '',
            description: '',
            unitType: 'count',
            baseUnit: 'piece',
            defaultSupplier: '',
          },
        ])
        setResults(null)
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error submitting manual products:', error)
      toast.error('An error occurred while adding products')
    } finally {
      setLoading(false)
    }
  }

  // File upload handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a CSV or Excel file')
      return
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setFile(selected)

    // Parse preview
    try {
      const text = await selected.text()
      const lines = text.split('\n').slice(0, 5) // Preview first 5 rows
      const preview = lines.map((line) => {
        const cells = line.split(',').map((cell) => cell.trim())
        return cells
      })
      setFilePreview(preview)
    } catch (error) {
      console.error('Error reading file:', error)
      toast.error('Error reading file')
    }
  }

  const submitFileUpload = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev < 90 ? prev + 10 : prev))
      }, 200)

      const response = await fetch('/api/products/bulk-upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to upload products')
        return
      }

      setResults({ success: data.successCount, failed: data.failedCount })
      toast.success(
        `Uploaded! ${data.successCount} added, ${data.failedCount} failed`
      )

      if (onSuccess) {
        onSuccess()
      }

      // Reset form after successful submission
      setTimeout(() => {
        setFile(null)
        setFilePreview([])
        setResults(null)
        setUploadProgress(0)
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('An error occurred while uploading')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `SKU,Name,Category,Description,Unit Type,Base Unit,Default Supplier
SUGAR001,Sugar,Groceries,White sugar,count,bag,Local Supplier
FLOUR001,Flour,Groceries,All-purpose flour,weight,kg,Local Supplier`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product-template.csv'
    a.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Products in Bulk</DialogTitle>
          <DialogDescription>
            Choose to add products manually or upload a CSV/Excel file (max 50 products)
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Upload Complete!</p>
              <p className="text-sm text-gray-600">
                {results.success} products added successfully
              </p>
              {results.failed > 0 && (
                <p className="text-sm text-orange-500">
                  {results.failed} products failed to process
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'manual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Add Manually
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Upload File
              </button>
            </div>

            {/* Manual Entry Tab */}
            {activeTab === 'manual' && (
              <div className="space-y-4 py-4">
                <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
                  {manualForms.map((form, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg space-y-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Product {index + 1}</h4>
                        {manualForms.length > 1 && (
                          <button
                            onClick={() => removeManualForm(index)}
                            className="text-red-500 text-sm hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">SKU *</Label>
                          <Input
                            placeholder="e.g., SUGAR001"
                            value={form.sku}
                            onChange={(e) =>
                              updateManualForm(index, 'sku', e.target.value)
                            }
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Product Name *</Label>
                          <Input
                            placeholder="e.g., Sugar"
                            value={form.name}
                            onChange={(e) =>
                              updateManualForm(index, 'name', e.target.value)
                            }
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <Input
                            placeholder="e.g., Groceries"
                            value={form.category}
                            onChange={(e) =>
                              updateManualForm(index, 'category', e.target.value)
                            }
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Default Supplier</Label>
                          <Input
                            placeholder="e.g., Local Supplier"
                            value={form.defaultSupplier}
                            onChange={(e) =>
                              updateManualForm(
                                index,
                                'defaultSupplier',
                                e.target.value
                              )
                            }
                            disabled={loading}
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Unit Type *</Label>
                          <Select
                            value={form.unitType}
                            onValueChange={(value: string) =>
                              updateManualForm(
                                index,
                                'unitType',
                                value as any
                              )
                            }
                            disabled={loading}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weight">Weight (kg/g)</SelectItem>
                              <SelectItem value="count">Count (box/piece)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Base Unit *</Label>
                          <Select
                            value={form.baseUnit}
                            onValueChange={(value: string) =>
                              updateManualForm(index, 'baseUnit', value)
                            }
                            disabled={loading}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS[form.unitType].map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Label className="text-xs">Description</Label>
                          <Input
                            placeholder="Optional description"
                            value={form.description}
                            onChange={(e) =>
                              updateManualForm(index, 'description', e.target.value)
                            }
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={addManualForm}
                  variant="outline"
                  className="w-full"
                  disabled={loading || manualForms.length >= 50}
                >
                  + Add Another Product
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={submitManualProducts}
                    className="flex-1"
                    disabled={loading || manualForms.length === 0}
                  >
                    {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                    Add {manualForms.length} Product
                    {manualForms.length !== 1 ? 's' : ''}
                  </Button>
                  <Button onClick={onClose} variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* File Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-4 py-4">
                {/* File Input */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    disabled={loading}
                  />
                  <label
                    htmlFor="file-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div className="text-sm">
                      <span className="font-semibold text-blue-600">
                        Click to upload
                      </span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      CSV or Excel files, max 5MB, up to 50 products
                    </div>
                  </label>
                </div>

                {/* File Preview */}
                {file && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">{file.name}</span>
                    </div>

                    {filePreview.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p className="font-semibold mb-2">Preview:</p>
                        <table className="w-full text-xs border">
                          <tbody>
                            {filePreview.map((row: string[], i: number) => (
                              <tr key={i} className="border-b">
                                {row.map((cell: string, j: number) => (
                                  <td key={j} className="px-2 py-1 border-r">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Progress */}
                {loading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Template Download */}
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <p className="text-blue-900 mb-2">Need help? Download our template:</p>
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Download CSV Template
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={submitFileUpload}
                    className="flex-1"
                    disabled={loading || !file}
                  >
                    {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                    Upload & Process
                  </Button>
                  <Button onClick={onClose} variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
