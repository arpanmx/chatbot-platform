'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useApiClient } from '@/lib/api-client'
import type { FileMetadata } from '@/types'

function formatBytes(value: number | null) {
  if (value === null || Number.isNaN(value)) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`
}

export default function ProjectFilesManager({
  projectId,
}: {
  projectId: string
}) {
  const { fetchApi } = useApiClient()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function loadFiles() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchApi(`/projects/${projectId}/files`)
      setFiles(response as FileMetadata[])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [projectId])

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setUploadError(null)

    const file = inputRef.current?.files?.[0]
    if (!file) {
      setUploadError('Select a file to upload.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetchApi(`/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
      })

      setFiles((prev) => [response as FileMetadata, ...prev])
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (err) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-100">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-200">Project files</h2>
        <button
          onClick={loadFiles}
          className="text-xs text-zinc-400 hover:text-zinc-200"
          type="button"
        >
          Refresh
        </button>
      </div>

      <form onSubmit={handleUpload} className="mt-4 space-y-3">
        <input
          ref={inputRef}
          type="file"
          className="block w-full text-xs text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-100 hover:file:bg-zinc-700"
        />
        <button
          type="submit"
          disabled={uploading}
          className="w-full rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {uploading ? 'Uploading…' : 'Upload to OpenAI Files'}
        </button>
        {uploadError ? (
          <p className="text-xs text-red-200">{uploadError}</p>
        ) : null}
      </form>

      <div className="mt-4">
        {loading ? (
          <p className="text-xs text-zinc-400">Loading files…</p>
        ) : error ? (
          <p className="text-xs text-red-200">{error}</p>
        ) : files.length === 0 ? (
          <p className="text-xs text-zinc-400">
            No files uploaded yet. Upload a file to attach it to this project.
          </p>
        ) : (
          <ul className="space-y-2 text-xs text-zinc-200">
            {files.map((file) => (
              <li
                key={file.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-100">
                    {file.filename}
                  </span>
                  <span className="text-zinc-400">
                    {formatBytes(file.size_bytes)}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-400">
                  OpenAI file ID: {file.openai_file_id}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
