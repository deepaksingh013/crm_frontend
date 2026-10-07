import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  UploadCloud,
} from 'lucide-react'
import Modal from '../../../components/modal/Modal'

const allowedTypes = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'text/plain',
]

/**
 * Simple CSV parser for preview.
 *
 * Note:
 * Actual import backend ko file as-is milti hai.
 * Ye parser sirf preview ke liye hai.
 */
const parseCsv = (text) => {
  const rows = text
    .split(/\r?\n/)
    .map((row) =>
      row
        .split(',')
        .map((cell) =>
          cell.trim().replace(/^"|"$/g, ''),
        ),
    )
    .filter((row) => row.some((cell) => cell))

  if (rows.length === 0) {
    return []
  }

  const headers = rows[0]

  return rows.slice(1, 6).map((values) => {
    const entry = {}

    headers.forEach((header, index) => {
      entry[header || `column${index + 1}`] =
        values[index] || ''
    })

    return entry
  })
}

const ImportCampaignModal = ({
  open,
  onClose,
  onImport,
  isLoading = false,
  campaignId,
}) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)

  /**
   * Modal close hone par state reset.
   */
  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setPreviewRows([])
      setError('')
      setIsDragging(false)
      setIsPreparing(false)
    }
  }, [open])

  const resetState = () => {
    setSelectedFile(null)
    setPreviewRows([])
    setError('')
    setIsDragging(false)
    setIsPreparing(false)
  }

  const handleFileSelection = async (file) => {
    if (!file) return

    const fileName = file.name.toLowerCase()

    const isAllowedType =
      allowedTypes.includes(file.type) ||
      fileName.endsWith('.csv') ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')

    if (!isAllowedType) {
      setError(
        'Please choose a spreadsheet or CSV file.',
      )
      setSelectedFile(null)
      setPreviewRows([])
      return
    }

    setError('')
    setSelectedFile(file)
    setPreviewRows([])
    setIsPreparing(true)

    try {
      if (fileName.endsWith('.csv')) {
        const text = await file.text()

        const parsedRows = parseCsv(text)

        setPreviewRows(parsedRows)
      }
    } catch (parseError) {
      console.error(
        'FILE PREVIEW ERROR:',
        parseError,
      )

      setError(
        'We could not read the selected file. Please try another file.',
      )

      setSelectedFile(null)
      setPreviewRows([])
    } finally {
      setIsPreparing(false)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()

    setIsDragging(false)

    const droppedFile =
      event.dataTransfer.files?.[0]

    if (droppedFile) {
      handleFileSelection(droppedFile)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      setError(
        'Select a spreadsheet or CSV file before importing.',
      )
      return
    }

    setError('')
    setIsPreparing(true)

    try {
      /**
       * Parent actual API import karega.
       *
       * Agar import fail hua to parent error throw karega.
       */
      await onImport(selectedFile)

      /**
       * IMPORTANT:
       * Yahan toast nahi hai.
       * Parent ek hi toast show karega.
       *
       * Parent successful import ke baad modal close karega.
       */
    } catch (importError) {
      console.error(
        'MODAL IMPORT ERROR:',
        importError,
      )

      setError(
        importError?.message ||
          'The import could not be completed. Please try again.',
      )
    } finally {
      setIsPreparing(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Import Leads"
      onClose={onClose}
      size="md"
      closeOnBackdrop={
        !isLoading && !isPreparing
      }
      closeOnEscape={
        !isLoading && !isPreparing
      }
      isLoading={
        isLoading || isPreparing
      }
    >
      <div className="space-y-5">
        {/* Information */}
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-alt)] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[rgba(11,116,255,0.12)] p-2.5 text-[var(--primary)]">
              <FileSpreadsheet size={20} />
            </div>

            <div>
              <h3 className="text-base font-semibold text-[var(--text)]">
                Import leads with one click
              </h3>

              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Upload an Excel or CSV file
                containing lead data. We'll add them
                to the current campaign.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <label
          className={`block cursor-pointer rounded-[1.5rem] border border-dashed p-5 transition ${
            isDragging
              ? 'border-[var(--primary)] bg-[rgba(11,116,255,0.08)]'
              : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:bg-[rgba(11,116,255,0.05)]'
          }`}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() =>
            setIsDragging(false)
          }
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={
              isLoading || isPreparing
            }
            onChange={(event) => {
              handleFileSelection(
                event.target.files?.[0],
              )

              /**
               * Same file ko dobara select karne ke liye
               * input reset.
               */
              event.target.value = ''
            }}
          />

          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-[rgba(11,116,255,0.12)] p-3 text-[var(--primary)]">
              <UploadCloud size={24} />
            </div>

            <div>
              <p className="text-base font-semibold text-[var(--text)]">
                Drag and drop your file here
              </p>

              <p className="mt-1 text-sm text-[var(--muted)]">
                or tap to browse your device
              </p>
            </div>

            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
              .xlsx .xls .csv
            </span>
          </div>
        </label>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-[1rem] border border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.08)] p-3 text-sm text-[var(--danger)]">
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        {/* Selected File */}
        {selectedFile && (
          <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text)]">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  {(selectedFile.size / 1024).toFixed(
                    1,
                  )}{' '}
                  KB • Ready for import
                </p>
              </div>

              <button
                type="button"
                onClick={resetState}
                disabled={
                  isLoading || isPreparing
                }
                className="shrink-0 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>

            {/* CSV Preview */}
            {previewRows.length > 0 ? (
              <div className="mt-4 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Preview
                </p>

                <div className="mt-3 space-y-2">
                  {previewRows
                    .slice(0, 3)
                    .map((row, index) => (
                      <div
                        key={`${row.name || 'row'}-${index}`}
                        className="rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                      >
                        <p
                          className="text-sm font-semibold text-[var(--text)]"
                          title={row.name || ''}
                        >
                          {row.name ||
                            `Lead ${index + 1}`}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Mobile:{' '}
                          {row.mobile || 'N/A'}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-sm text-[var(--muted)]">
                <CheckCircle2
                  size={16}
                  className="shrink-0 text-[var(--success)]"
                />

                <span>
                  Your file is ready. We will
                  create new leads from the
                  uploaded workbook.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={
              isLoading || isPreparing
            }
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-alt)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={
              !selectedFile ||
              isLoading ||
              isPreparing
            }
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPreparing
              ? 'Preparing...'
              : isLoading
                ? 'Importing...'
                : 'Import Leads'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ImportCampaignModal
