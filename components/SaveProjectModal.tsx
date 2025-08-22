import React, { useState, useContext, useEffect } from 'react';
import type { SavedProject } from '../types';
import { XMarkIcon, SaveIcon, SpinnerIcon, TrashIcon, FolderOpenIcon } from './icons';
import { I18nContext } from '../lib/i18n';
import * as db from '../lib/db';

interface SaveProjectModalProps {
  onClose: () => void;
  onSave: (name: string, id?: number) => Promise<void>;
  onLoad: (id: number) => Promise<void>;
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
    onClose, onSave, onLoad, isSaving, currentProjectName, currentProjectId
}) => {
  const { t } = useContext(I18nContext);
  const [projectName, setProjectName] = useState(currentProjectName);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 flex items-center justify-between border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{t('save_project_modal_title')}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title={t('close')}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 space-y-6 overflow-y-auto">
            {/* Save Section */}
            <div className="bg-gray-900/50 p-4 rounded-lg">
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-2">{t('save_project_modal_name_label')}</label>
                <div className="flex items-center gap-3">
                    <input 
                        id="project-name"
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder={t('save_project_modal_placeholder')}
                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <h3 className="text-lg font-semibold text-gray-200 mb-3">{t('save_project_modal_saved_projects_title')}</h3>
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
        </main>
      </div>
    </div>
  );
};
