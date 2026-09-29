import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { FileAttachment } from '../../types/index.js';
import { api } from '../../lib/api.js';

interface DocumentViewerModalProps {
  attachment: FileAttachment | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ attachment, onClose }) => {
  const [zoom, setZoom] = useState<number>(1);

  if (!attachment) return null;

  const isPdf = attachment.fileType.toLowerCase().includes('pdf') || attachment.fileName.toLowerCase().endsWith('.pdf');
  const previewUrl = api.getAttachmentPreviewUrl(attachment.id);
  const downloadUrl = api.getAttachmentDownloadUrl(attachment.id);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-blue-600/30 rounded-lg text-blue-400 border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-white truncate max-w-md">
                {attachment.fileName}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure Encrypted Storage
                </span>
                <span>•</span>
                <span>Category: <strong className="text-slate-200">{attachment.category}</strong></span>
                <span>•</span>
                <span>Size: {formatFileSize(attachment.fileSize)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isPdf && (
              <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-2 text-slate-300">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            <a
              href={downloadUrl}
              download={attachment.fileName}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
              title="Download file"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-100 overflow-auto p-4 flex items-center justify-center">
          {isPdf ? (
            <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-inner overflow-hidden border border-slate-200">
              <iframe
                src={`${previewUrl}#toolbar=1`}
                title={attachment.fileName}
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={previewUrl}
                alt={attachment.fileName}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                className="max-w-full max-h-full object-contain rounded-md shadow-lg transition-transform duration-100"
              />
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div>
            Uploaded by: <span className="font-semibold text-slate-700">{attachment.uploadedBy}</span> on{' '}
            <span>{new Date(attachment.uploadedAt).toLocaleString()}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Protected Document • Team Member Document Repository
          </div>
        </div>
      </div>
    </div>
  );
};
