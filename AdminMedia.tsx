import React, { useState, useEffect } from 'react';
import { MediaFile, StorageStats } from './types';
import { getMediaFiles, uploadMediaFile, deleteMediaFile, getStorageAnalytics } from './api';
import { useAuth } from './AuthContext';

const AdminMedia = () => {
  const { userProfile } = useAuth();
  
  // State
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [currentFolder, setCurrentFolder] = useState('all'); // 'all', 'courses', 'users', 'thumbnails'
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Fetch Data
  const loadData = async () => {
    const [fileData, statData] = await Promise.all([
      getMediaFiles(currentFolder),
      getStorageAnalytics()
    ]);
    setFiles(fileData);
    setStats(statData);
  };

  useEffect(() => {
    loadData();
  }, [currentFolder]);

  // Handlers
  const handleUpload = async (file: File) => {
    if (!userProfile) return;
    setUploading(true);
    setUploadProgress(10);
    
    // Simulate progress
    const timer = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    const result = await uploadMediaFile(file, currentFolder === 'all' ? 'uploads' : currentFolder, userProfile.uid);
    
    clearInterval(timer);
    setUploadProgress(100);
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      if (result) loadData();
    }, 500);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (file: MediaFile) => {
    if (confirm("Are you sure you want to delete this file permanently?")) {
      await deleteMediaFile(file.id, file.fullPath);
      loadData();
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL Copied!");
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const filteredFiles = files.filter(f => f.originalName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h3 className="text-lg font-bold text-gray-800">Local Storage (200GB Server)</h3>
                <p className="text-gray-500 text-sm">Real-time usage analytics</p>
             </div>
             <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{formatBytes(stats?.usedBytes || 0)}</p>
                <p className="text-xs text-gray-500">used of {formatBytes(stats?.totalCapacityBytes || 0)}</p>
             </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-4 mb-4 overflow-hidden">
             <div 
               className={`h-4 rounded-full transition-all duration-1000 ${stats?.usagePercentage && stats.usagePercentage > 80 ? 'bg-red-500' : 'bg-blue-600'}`} 
               style={{ width: `${stats?.usagePercentage || 0}%` }}
             ></div>
          </div>
          
          <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
             <div className="flex items-center">
               <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
               <span>Images</span>
             </div>
             <div className="flex items-center">
               <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
               <span>Documents</span>
             </div>
             <div className="flex items-center">
               <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
               <span>Videos</span>
             </div>
          </div>
        </div>

        {/* Upload Action */}
        <div 
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
             <div className="w-full px-4">
                <div className="mb-2 flex justify-between text-xs font-bold text-blue-600">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
             </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl mb-3">
                <i className="fas fa-cloud-upload-alt"></i>
              </div>
              <h4 className="font-bold text-gray-800">Upload New File</h4>
              <p className="text-xs text-gray-500 mb-3">Drag & drop or click to browse</p>
              <label className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold cursor-pointer hover:bg-blue-700 transition">
                Browse Files
                <input type="file" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />
              </label>
            </>
          )}
        </div>
      </div>

      {/* 2. File Manager */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
          {/* Folder Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
             {['all', 'courses', 'users', 'thumbnails', 'uploads'].map(folder => (
               <button
                 key={folder}
                 onClick={() => setCurrentFolder(folder)}
                 className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition whitespace-nowrap ${currentFolder === folder ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 {folder}
               </button>
             ))}
          </div>
          
          {/* Search */}
          <div className="relative w-full lg:w-auto">
             <i className="fas fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
             <input 
               type="text" 
               placeholder="Search files..." 
               className="pl-8 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full lg:w-64"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        {/* File Grid */}
        <div className="p-6 flex-grow overflow-y-auto max-h-[600px] custom-scrollbar">
           {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <i className="far fa-folder-open text-6xl mb-4 opacity-50"></i>
                <p>No files found in this folder</p>
              </div>
           ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
               {filteredFiles.map(file => (
                 <div key={file.id} className="group relative bg-gray-50 border rounded-lg hover:shadow-md transition overflow-hidden">
                    {/* Preview */}
                    <div className="h-32 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                      {file.mimeType?.startsWith('image/') ? (
                        <img src={file.url} alt={file.originalName} className="w-full h-full object-cover" />
                      ) : (
                        <i className="fas fa-file-alt text-4xl text-gray-400"></i>
                      )}
                      
                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2">
                        <button onClick={() => copyToClipboard(file.url)} className="bg-white text-gray-800 p-2 rounded-full hover:bg-blue-50" title="Copy Link">
                          <i className="fas fa-link"></i>
                        </button>
                        <button onClick={() => handleDelete(file)} className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50" title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                       <p className="text-xs font-bold text-gray-800 truncate" title={file.originalName}>{file.originalName}</p>
                       <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] text-gray-500 uppercase">{(file.mimeType || '').split('/')[1] || 'FILE'}</span>
                          <span className="text-[10px] text-gray-500">{formatBytes(file.size, 0)}</span>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
           <span>Total Files: {files.length}</span>
           <span>Server Status: <span className="text-green-600 font-bold">● Online</span></span>
        </div>
      </div>
    </div>
  );
};

export default AdminMedia;