import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon,
  X, 
  Loader2, 
  FolderGit2,
  Paperclip,
  Plus,
  Trash2,
  FileSpreadsheet,
  Files
} from 'lucide-react';

import { apiRequest } from '../../lib/api';

export interface UploadedFileItem {
  url: string;
  name: string;
  size?: number;
}

interface TaskProofSubmitterProps {
  valueUrl: string;
  valueName?: string;
  onChange: (url: string, fileName?: string) => void;
  facultyName?: string;
  taskName?: string;
  disabled?: boolean;
}

const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdnLapR8FacMxMw_q5fJn4Gf5bUPJVrLTmoPzuFmOtcnCDuotK4KubjuSkVHNf1O_b/exec";
const DEFAULT_DRIVE_FOLDER_ID = "1cljBSpx8NlB24yN_7N0jH7kPBvYY6QHZ";
const DEFAULT_DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1cljBSpx8NlB24yN_7N0jH7kPBvYY6QHZ";

// MIME type detection helper for docx, doc, xlsx, pdf, zip, etc.
const getMimeType = (file: File): string => {
  if (file.type && file.type.trim()) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc': return 'application/msword';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'xls': return 'application/vnd.ms-excel';
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'ppt': return 'application/vnd.ms-powerpoint';
    case 'pdf': return 'application/pdf';
    case 'zip': return 'application/zip';
    case 'txt': return 'text/plain';
    case 'csv': return 'text/csv';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
};

export const parseUploadedFiles = (valueUrl?: string, valueName?: string): UploadedFileItem[] => {
  if (!valueUrl || !valueUrl.trim()) return [];
  const trimmed = valueUrl.trim();

  // 1. JSON Array format
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item && (item.url || typeof item === 'string'))
          .map((item, idx) => {
            if (typeof item === 'string') {
              return { url: item, name: `Attachment ${idx + 1}` };
            }
            return {
              url: item.url || '',
              name: item.name || item.fileName || `Attachment ${idx + 1}`,
              size: item.size
            };
          });
      }
    } catch {
      // fallback to delimiter parsing
    }
  }

  // 2. Comma or newline delimited URLs
  if (trimmed.includes(',') || trimmed.includes('\n')) {
    const urls = trimmed.split(/[,\n]+/).map(u => u.trim()).filter(Boolean);
    const names = valueName ? valueName.split(/[,\n]+/).map(n => n.trim()).filter(Boolean) : [];
    return urls.map((url, idx) => ({
      url,
      name: names[idx] || `Attachment ${idx + 1}`
    }));
  }

  // 3. Single URL
  return [{
    url: trimmed,
    name: valueName?.trim() || 'Uploaded Submission File'
  }];
};

export const TaskProofSubmitter: React.FC<TaskProofSubmitterProps> = ({
  valueUrl,
  valueName,
  onChange,
  facultyName = 'Faculty Member',
  taskName = 'Assigned Duty',
  disabled = false
}) => {
  const [files, setFiles] = useState<UploadedFileItem[]>(() => parseUploadedFiles(valueUrl, valueName));
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const OLD_APPS_SCRIPT_PREFIX = "AKfycbxvqiDv2QH";

  const rawEnvUrl = (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string) || '';
  const appsScriptUrl = (!rawEnvUrl || rawEnvUrl.includes(OLD_APPS_SCRIPT_PREFIX))
    ? DEFAULT_APPS_SCRIPT_URL
    : rawEnvUrl;

  const targetFolderId = 
    (import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID as string) || 
    DEFAULT_DRIVE_FOLDER_ID;

  const targetFolderUrl = 
    (import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_URL as string) || 
    DEFAULT_DRIVE_FOLDER_URL;

  // Keep internal files in sync with incoming props
  useEffect(() => {
    const parsed = parseUploadedFiles(valueUrl, valueName);
    setFiles(parsed);
  }, [valueUrl, valueName]);

  const notifyChange = (updatedFiles: UploadedFileItem[]) => {
    setFiles(updatedFiles);
    if (updatedFiles.length === 0) {
      onChange('', '');
    } else if (updatedFiles.length === 1) {
      onChange(updatedFiles[0].url, updatedFiles[0].name);
    } else {
      onChange(
        JSON.stringify(updatedFiles.map(f => ({ url: f.url, name: f.name, size: f.size }))),
        updatedFiles.map(f => f.name).join(', ')
      );
    }
  };

  // Convert File to base64 string without data prefix
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Fallback upload directly through DSW server backend
  const uploadViaBackend = async (file: File): Promise<UploadedFileItem> => {
    const formData = new FormData();
    formData.append('file', file);
    const data = await apiRequest<{ file_url: string; file_name: string; file_size?: number }>(
      '/uploads',
      'POST',
      formData,
      true
    );
    return {
      url: data.file_url,
      name: data.file_name || file.name,
      size: data.file_size || file.size
    };
  };

  const uploadSingleFile = async (file: File): Promise<UploadedFileItem> => {
    const mime = getMimeType(file);
    const base64Data = await fileToBase64(file);

    const payload = {
      facultyName: facultyName.trim() || 'Faculty Member',
      taskName: taskName.trim() || 'Assigned Duty',
      fileName: file.name,
      mimeType: mime,
      fileData: base64Data,
      folderId: targetFolderId,
      folder_id: targetFolderId,
      driveFolderId: targetFolderId,
      drive_folder_id: targetFolderId,
      targetFolderId: targetFolderId,
      target_folder_id: targetFolderId,
      parentFolderId: targetFolderId,
      parent_folder_id: targetFolderId,
      parentFolder: targetFolderId
    };

    // 1. Attempt Google Apps Script / Drive Upload
    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let result: any = null;
      try {
        result = JSON.parse(responseText);
      } catch {
        // Non-JSON or HTML redirect response from Apps Script
      }

      if (result && result.success && (result.fileUrl || result.url || result.link)) {
        return {
          url: result.fileUrl || result.url || result.link,
          name: result.fileName || file.name,
          size: file.size
        };
      }

      // If Apps Script returned success=false or invalid response, transparently fallback to backend
      console.warn('Apps Script returned non-success response, falling back to server upload:', result || responseText.slice(0, 100));
      return await uploadViaBackend(file);
    } catch (appsScriptErr) {
      console.warn('Apps Script network error, seamlessly falling back to server upload:', appsScriptErr);
      return await uploadViaBackend(file);
    }
  };

  const handleMultipleFilesUpload = async (incomingFiles: FileList | File[]) => {
    const fileList = Array.from(incomingFiles);
    if (fileList.length === 0 || disabled || uploading) return;

    setUploading(true);
    setErrorMessage('');
    setUploadProgress(10);
    setUploadStatus(`Preparing ${fileList.length} file${fileList.length > 1 ? 's' : ''}...`);

    const successfullyUploaded: UploadedFileItem[] = [];
    const errors: string[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const stepProgress = Math.round(15 + ((i / fileList.length) * 80));
        setUploadProgress(stepProgress);
        setUploadStatus(`Uploading (${i + 1}/${fileList.length}): ${file.name}...`);

        try {
          const item = await uploadSingleFile(file);
          successfullyUploaded.push(item);
        } catch (fileErr: any) {
          console.error(`Error uploading ${file.name}:`, fileErr);
          errors.push(`${file.name}: ${fileErr.message || 'Upload failed'}`);
        }
      }

      setUploadProgress(100);
      setUploadStatus('Upload finished!');

      if (successfullyUploaded.length > 0) {
        const nextFiles = [...files, ...successfullyUploaded];
        notifyChange(nextFiles);
      }

      if (errors.length > 0) {
        setErrorMessage(`Some files failed: ${errors.join('; ')}`);
      }

    } catch (err: any) {
      console.error('Batch Upload Error:', err);
      setErrorMessage(err.message || 'Failed to upload files to Google Drive.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadStatus('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 400);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    if (disabled || uploading) return;
    const nextFiles = files.filter((_, idx) => idx !== indexToRemove);
    notifyChange(nextFiles);
  };

  const getFileIcon = (fileName: string, url: string) => {
    const isImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName) || url.includes('photo');
    const isSheet = /\.(xls|xlsx|csv)$/i.test(fileName);
    if (isImg) return <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (isSheet) return <FileSpreadsheet className="w-4 h-4 text-teal-500 shrink-0" />;
    return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
  };

  return (
    <div className="space-y-3">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="block text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
          <Files className="w-4 h-4 text-blue-500" />
          Proof Attachments (Multi-File Google Drive Upload)
        </label>
        <a
          href={targetFolderUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium truncate"
          title={`Upload folder: ${targetFolderId}`}
        >
          <FolderGit2 className="w-3.5 h-3.5 shrink-0" />
          <span>Drive Folder: <strong>DSW Tasks Upload</strong></span>
          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
        </a>
      </div>

      {/* 1. LIST OF ATTACHED FILES */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)] px-1">
            <span>Uploaded Files ({files.length}):</span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              Auto-saved to Google Drive
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="p-3 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    {getFileIcon(file.name, file.url)}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                        {file.name}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                      {file.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold shadow-xs transition-all active:scale-95"
                  >
                    <ExternalLink className="w-3 h-3" /> View ↗
                  </a>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      disabled={uploading}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      title={`Remove ${file.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. MULTI-FILE DROPZONE / UPLOADER BUTTON */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl text-center transition-all ${
          files.length > 0 ? 'p-4' : 'p-6'
        } ${
          disabled ? 'opacity-60 cursor-not-allowed border-slate-300' :
          dragActive
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 cursor-pointer'
            : 'border-[var(--panel-border)] bg-[var(--card-bg-to)] hover:border-blue-400 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          disabled={disabled || uploading}
          onChange={(e) => e.target.files && handleMultipleFilesUpload(e.target.files)}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{uploadStatus || 'Uploading files to Google Drive...'} ({uploadProgress}%)</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full max-w-xs mx-auto bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Uploading to Google Drive folder: <span className="font-mono">{targetFolderId}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
              {files.length > 0 ? <Plus className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {files.length > 0 ? '+ Add More Proof Files' : 'Upload Proof Files (Multiple Files Allowed)'}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Drag & drop or select multiple PDFs, Images, Word documents, Excel, PPT or ZIPs
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                disabled={disabled}
                className="btn-secondary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 font-bold pointer-events-none"
              >
                <Paperclip className="w-3.5 h-3.5" />
                {files.length > 0 ? 'Select More Files' : 'Choose Files (Multiple)'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-600 dark:text-rose-400 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
