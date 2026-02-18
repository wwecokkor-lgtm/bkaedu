import React, { useState, useEffect } from 'react';
import { SoundAsset, SoundTrigger, SoundCategory } from './types';
import { getSoundAssets, saveSoundAsset, deleteSoundAsset, uploadMediaFile } from './api';
import { useAuth } from './AuthContext';

const AdminSounds = () => {
  const { userProfile } = useAuth();
  const [sounds, setSounds] = useState<SoundAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SoundCategory>('ui');
  const [trigger, setTrigger] = useState<SoundTrigger>('click');
  const [volume, setVolume] = useState(1.0);
  const [soundUrl, setSoundUrl] = useState('');
  const [soundFile, setSoundFile] = useState<File | null>(null);

  const triggers: SoundTrigger[] = ['click', 'hover', 'success', 'error', 'warning', 'complete', 'popup', 'spin', 'win', 'notification', 'tab_switch'];
  const categories: SoundCategory[] = ['ui', 'notification', 'lesson', 'event', 'alert'];

  useEffect(() => {
    refreshSounds();
  }, []);

  const refreshSounds = async () => {
    setLoading(true);
    const data = await getSoundAssets();
    setSounds(data);
    setLoading(false);
  };

  const handleEdit = (sound: SoundAsset) => {
    setEditId(sound.id);
    setName(sound.name);
    setCategory(sound.category);
    setTrigger(sound.trigger);
    setVolume(sound.volume);
    setSoundUrl(sound.url);
    setSoundFile(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setUploading(true);

    let finalUrl = soundUrl;
    if (soundFile) {
        const file = await uploadMediaFile(soundFile, 'sounds', userProfile.uid);
        if (file) finalUrl = file.url;
    }

    const soundData: Partial<SoundAsset> = {
        name,
        category,
        trigger,
        volume: Number(volume),
        url: finalUrl,
        isEnabled: true
    };

    if (editId) {
        await saveSoundAsset({ id: editId, ...soundData });
    } else {
        await saveSoundAsset(soundData);
    }

    setUploading(false);
    setEditId(null);
    setName('');
    setSoundUrl('');
    setSoundFile(null);
    refreshSounds();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this sound effect?")) {
        await deleteSoundAsset(id);
        refreshSounds();
    }
  };

  const playPreview = (url: string, vol: number) => {
    const audio = new Audio(url);
    audio.volume = vol;
    audio.play();
  };

  return (
    <div className="space-y-8">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{editId ? 'Edit Sound' : 'Add New Sound Effect'}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sound Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. Button Click" />
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Trigger Action</label>
                <select value={trigger} onChange={e => setTrigger(e.target.value as any)} className="w-full border p-2 rounded bg-white">
                   {triggers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full border p-2 rounded bg-white">
                   {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Default Volume ({volume})</label>
                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-full" />
             </div>
             <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Audio File (MP3/WAV)</label>
                <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
                   <input type="file" accept="audio/*" onChange={e => setSoundFile(e.target.files ? e.target.files[0] : null)} className="text-sm w-full md:w-auto" />
                   {soundUrl && !soundFile && <button type="button" onClick={() => playPreview(soundUrl, volume)} className="text-blue-600 hover:underline text-sm"><i className="fas fa-play mr-1"></i> Current File</button>}
                </div>
             </div>
             <div className="md:col-span-2 flex justify-end space-x-3">
                {editId && <button type="button" onClick={() => {setEditId(null); setName('');}} className="px-4 py-2 border rounded text-gray-600">Cancel</button>}
                <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 w-full md:w-auto">
                   {uploading ? 'Uploading...' : 'Save Sound'}
                </button>
             </div>
          </form>
       </div>

       <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Trigger</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Preview</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sounds.map(sound => (
                    <tr key={sound.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-bold text-gray-800">{sound.name}</td>
                        <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-blue-600">{sound.trigger}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-500 capitalize">{sound.category}</td>
                        <td className="px-6 py-4">
                            <button onClick={() => playPreview(sound.url, sound.volume)} className="bg-green-100 text-green-700 p-2 rounded-full hover:bg-green-200 transition">
                                <i className="fas fa-play"></i>
                            </button>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => handleEdit(sound)} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><i className="fas fa-edit"></i></button>
                            <button onClick={() => handleDelete(sound.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><i className="fas fa-trash"></i></button>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
          </div>
          {sounds.length === 0 && <p className="text-center p-8 text-gray-500">No sounds configured.</p>}
       </div>
    </div>
  );
};

export default AdminSounds;