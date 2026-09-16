import React, { useState } from 'react';
import { 
  FolderGit2, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  X, 
  Download,
  Maximize2,
  FileSpreadsheet,
  Files,
  FileCode
} from 'lucide-react';
import { parseUploadedFiles, UploadedFileItem } from './TaskProofSubmitter';

interface ProofViewerProps {
  url?: string;
  fileName?: string;
  className?: string;
}

export const ProofViewer: React.FC<ProofViewerProps> = ({
  url,
  fileName,
  className = ''
}) => {
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<{ url: string; name: string } | null>(null);

  if (!url || !url.trim()) return null;

  const files = parseUploadedFiles(url, fileName);
  if (files.length === 0) return null;

  const isImgFile = (fileUrl: string, name?: string) => 
    fileUrl.startsWith('data:image') || 
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name || '') || 
    /\.(jpg|jpeg|png|webp|gif|svg)/i.test(fileUrl);

  const isDriveUrl = (fileUrl: string) => 
    fileUrl.includes('drive.google.com') || 
    fileUrl.includes('docs.google.com') || 
    fileUrl.includes('photos.app.goo.gl');

  const isPdfFile = (fileUrl: string, name?: string) => 
    /\.pdf/i.test(name || '') || /\.pdf/i.test(fileUrl) || fileUrl.includes('application/pdf');

  const isSheetFile = (fileUrl: string, name?: string) => 
    /\.(xls|xlsx|csv)$/i.test(name || '') || /\.(xls|xlsx|csv)/i.test(fileUrl);

  // Single file card renderer
  const renderSingleFile = (file: UploadedFileItem, idx: number, isMulti = false) => {
    const isGoogleDrive = isDriveUrl(file.url);
    const isImage = isImgFile(file.url, file.name);
    const isPdf = isPdfFile(file.url, file.name);
    const isSheet = isSheetFile(file.url, file.name);

    if (isImage) {
      return (
        <div 
          key={idx} 
          className={`p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-2xl space-y-2 ${isMulti ? 'flex-1 min-w-[240px]' : ''}`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5 truncate max-w-[200px]">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{file.name || 'Image Proof'}</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedLightboxImage({ url: file.url, name: file.name })}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3" /> Enlarge
              </button>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="Open in new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div
            onClick={() => setSelectedLightboxImage({ url: file.url, name: file.name })}
            className="relative group cursor-pointer overflow-hidden rounded-xl border border-[var(--panel-border)] bg-black/40 h-36 flex items-center justify-center"
          >
            <img
              src={file.url}
              alt={file.name || 'Proof image'}
              className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-102"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
              <Eye className="w-4 h-4" /> View Full Image
            </div>
          </div>
        </div>
      );
    }

    if (isGoogleDrive) {
      return (
        <div 
          key={idx} 
          className={`p-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-400/30 dark:border-blue-700/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${isMulti ? 'flex-1 min-w-[240px]' : ''}`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md font-bold text-xs">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div className="overflow-hidden min-w-0">
              <span className="font-bold text-xs text-blue-700 dark:text-blue-300 block truncate">
                {file.name || 'Google Drive Document'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block font-mono">
                {file.url}
              </span>
            </div>
          </div>

          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Drive File ↗
          </a>
        </div>
      );
    }

    // PDF or other document
    return (
      <div 
        key={idx} 
        className={`p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${isMulti ? 'flex-1 min-w-[240px]' : ''}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          {isSheet ? (
            <FileSpreadsheet className="w-6 h-6 text-teal-500 shrink-0" />
          ) : (
            <FileText className="w-6 h-6 text-amber-500 shrink-0" />
          )}
          <div className="overflow-hidden min-w-0">
            <span className="font-bold text-xs text-[var(--text-primary)] block truncate">
              {file.name || (isPdf ? 'PDF Document' : 'Attached Document')}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] truncate block font-mono">
              {file.url}
            </span>
          </div>
        </div>

        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 active:scale-95"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View File ↗
        </a>
      </div>
    );
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {files.length === 1 ? (
        renderSingleFile(files[0], 0, false)
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Files className="w-3.5 h-3.5 text-blue-500" />
              Attached Proof Files ({files.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((f, i) => renderSingleFile(f, i, true))}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {selectedLightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div 
            className="w-full max-w-4xl max-h-[90vh] glass-panel border border-[var(--panel-border)] rounded-3xl p-3.5 sm:p-4 shadow-2xl relative flex flex-col space-y-3 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--panel-border)] text-[var(--text-primary)] text-xs">
              <span className="font-bold truncate max-w-[180px] sm:max-w-md">{selectedLightboxImage.name || 'Proof Image Preview'}</span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedLightboxImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Tab
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedLightboxImage(null)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center">
              <img
                src={selectedLightboxImage.url}
                alt="Full size proof"
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

