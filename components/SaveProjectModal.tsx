import React, { useState, useContext, useEffect, useRef } from 'react';
import type { SavedProject } from '../types';
import { SaveIcon, SpinnerIcon, TrashIcon, FolderOpenIcon } from './icons';
import { I18nContext } from '../lib/i18n';
import * as db from '../lib/db';
import { ModalShell } from './ModalShell';

interface SaveProjectModalProps {
  onClose: () => void;
  onSave: (name: string, id?: number) => Promise<void>;
  onLoad: (id: number) => Promise<void>;
  onLoadFromFile: (file: File) => Promise<void>;
  isSaving: boolean;
  currentProjectName: string;
  currentProjectId: number | null;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export const SaveProjectModal: React.FC<SaveProjectModalProps> = ({ 
    onClose, onSave, onLoad, onLoadFromFile, isSaving, currentProjectName, currentProjectId
}) => {
  const { t } = useContext(I18nContext);
  const [projectName, setProjectName] = useState(currentProjectName);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProjectName(currentProjectName);
  }, [currentProjectName]);

  useEffect(() => {
    const fetchProjects = async () => {
        setIsLoading(true);
        try {
            const projects = await db.getProjects();
            setSavedProjects(projects);
        } catch (error) {
            console.error("Failed to load projects from DB", error);
        } finally {
            setIsLoading(false);
        }
    }
    fetchProjects();
  }, []);

  const handleSave = async (isOverwrite: boolean) => {
    if (!projectName.trim()) return;
    const idToSave = isOverwrite ? currentProjectId : undefined;
    await onSave(projectName.trim(), idToSave ?? undefined);
    onClose();
  };
  
  const handleDelete = async (id: number) => {
    if (window.confirm(t('confirm_delete_project'))) {
        try {
            await db.deleteProject(id);
            setSavedProjects(projects => projects.filter(p => p.id !== id));
        } catch (error) {
            console.error("Failed to delete project", error);
        }
    }
  };

  const handleLoad = async (id: number) => {
    await onLoad(id);
    onClose();
  };
  
  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        await onLoadFromFile(file);
        onClose();
    }
  };

  return (
    <ModalShell title={t('save_project_modal_title')} onClose={onClose} maxWidth="max-w-2xl">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".zip" 
        onChange={handleFileLoad} 
      />
        <div className="space-y-6">
            {/* Save Section */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-2">{t('save_project_modal_name_label')}</label>
                <div className="flex items-center gap-3">
                    <input 
                        id="project-name"
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder={t('save_project_modal_placeholder')}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button 
                        onClick={() => handleSave(false)} 
                        disabled={isSaving || !projectName.trim()}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-md transition-colors whitespace-nowrap"
                    >
                        {isSaving ? <SpinnerIcon className="animate-spin h-5 w-5 mr-2" /> : <SaveIcon className="w-5 h-5 mr-2"/>}
                        {t('save_project_modal_save_as_new')}
                    </button>
                </div>
                {currentProjectId && (
                    <button 
                        onClick={() => handleSave(true)}
                        disabled={isSaving || !projectName.trim()}
                        className="w-full mt-3 flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white font-semibold rounded-md transition-colors"
                    >
                         {t('save_project_modal_overwrite')} "{currentProjectName}"
                    </button>
                )}
            </div>
            
            {/* Load Section */}
            <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-200">{t('save_project_modal_saved_projects_title')}</h3>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-xs font-semibold text-white rounded-md transition-colors"
                    >
                        <FolderOpenIcon className="w-4 h-4" />
                        <span>{t('load_from_disk')}</span>
                    </button>
                </div>
                {isLoading ? (
                    <div className="text-center py-4 text-gray-400">{t('loading')}...</div>
                ) : savedProjects.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {savedProjects.map(p => (
                            <div key={p.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-white">{p.name}</p>
                                    <p className="text-xs text-gray-400">{t('saved_at')} {formatDate(p.createdAt)}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleLoad(p.id!)} className="flex items-center space-x-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white rounded-md transition-colors">
                                        <FolderOpenIcon className="w-4 h-4" />
                                        <span>{t('load_project')}</span>
                                    </button>
                                     <button onClick={() => handleDelete(p.id!)} className="p-2 rounded-md hover:bg-red-500/20 transition-colors" title={t('delete_project')}>
                                        <TrashIcon className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">{t('no_saved_projects')}</p>
                )}
            </div>
        </div>
    </ModalShell>
  );
};