import React, { useState, useRef } from 'react';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';

const FileUpload = ({ onUploadSuccess, accept = 'image/*,application/pdf', maxSize = 10 * 1024 * 1024 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const uploadFile = async (file) => {
    if (file.size > maxSize) {
      toast.error(`File is too large. Maximum size allowed is ${maxSize / (1024 * 1024)}MB.`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setProgress(0);

    try {
      const response = await apiClient.post('/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        },
      });

      if (response.data?.success) {
        toast.success('File uploaded successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(response.data.data);
        }
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'File upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
        dragActive
          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'border-slate-300 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-900/30'
      }`}
      onClick={onButtonClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
        disabled={uploading}
      />

      <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-full text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </div>

      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
        Drag & drop your files here, or <span className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">browse</span>
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Supports images, PDF files (Max 10MB)
      </p>

      {uploading && (
        <div className="absolute inset-0 bg-white/90 dark:bg-slate-950/90 rounded-xl flex flex-col items-center justify-center p-6 backdrop-blur-sm z-10">
          <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Uploading... {progress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
