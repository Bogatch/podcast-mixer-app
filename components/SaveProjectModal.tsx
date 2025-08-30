import React, { useState, useContext, useEffect, useRef } from 'react';
import type { SavedProject } from '../types';
import { SaveIcon, SpinnerIcon, TrashIcon, FolderOpenIcon } from './icons';
import { I18nContext } from '../lib/i18n';
import * as db from '../lib/db';
import { ModalShell } from './ModalShell';
import { InfoTooltip } from './InfoTooltip';

interface SaveProjectModalProps {
  onClose: () => void;
  onSave: (name: string, id?: number) => Promise<void>;
  onLoad: (id: number) => Promise<void>;
  onLoadFromFile: (projectJsonFile: File | undefined, sourceFiles: File[]) => Promise<void>;
  isSaving: boolean;
  isLoadingProject: boolean;
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
    onClose, onSave, onLoad, onLoadFromFile, isSaving, isLoadingProject, currentProjectName, currentProjectId
}) => {
  const { t } = useContext(I18nContext);
  const [projectName, setProjectName] = useState(currentProjectName);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = isSaving || isLoadingProject;

  useEffect(() => {
    setProjectName(currentProjectName);
  }, [currentProjectName]);

  useEffect(() => {
    const fetchProjects = async () => {
        setIsLoadingList(true);
        try {
            const projects = await db.getProjects();
            setSavedProjects(projects);
        } catch (error) {
            console.error("Failed to load projects from DB", error);
        } finally {
            setIsLoadingList(false);
        }
    }
    fetchProjects();
  }, []);

  const handleSave = async (isOverwrite: boolean) => {
    if (isBusy || !projectName.trim()) return;
    const idToSave = isOverwrite ? currentProjectId : undefined;
    await onSave(projectName.trim(), idToSave ?? undefined);
    onClose();
  };
  
  const handleDelete = async (id: number) => {
    if (isBusy) return;
    if (window.confirm(t('confirm_delete_project'))) {
        setActionId(id);
        try {
            await db.deleteProject(id);
            setSavedProjects(projects => projects.filter(p => p.id !== id));
        } catch (error) {
            console.error("Failed to delete project", error);
        } finally {
            setActionId(null);
        }
    }
  };

  const handleLoad = async (id: number) => {
    if (isBusy) return;
    setActionId(id);
    await onLoad(id);
    onClose();
  };
  
  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isBusy || !event.target.files) return;

    const files = Array.from(event.target.files);
    const projectJsonFile = files.find(f => f.name === 'project.json');
    const sourceFiles = files.filter(f => f.webkitRelativePath.startsWith('source_files/'));

    await onLoadFromFile(projectJsonFile, sourceFiles);
    onClose();

    if (event.target) {
        event.target.value = '';
    }
  };

  return (
    <ModalShell title={t('save_project_modal_title')} onClose={onClose} maxWidth="max-w-2xl">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        {...{ webkitdirectory: "true", directory: "true" }}
        onChange={handleFileLoad} 
        disabled={isBusy}
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
                        className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        disabled={isBusy}
                    />
                    <button 
                        onClick={() => handleSave(false)} 
                        disabled={isBusy || !projectName.trim()}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors whitespace-nowrap"
                    >
                        {isSaving ? <SpinnerIcon className="animate-spin h-5 w-5 mr-2" /> : <SaveIcon className="w-5 h-5 mr-2"/>}
                        {t('save_project_modal_save_as_new')}
                    </button>
                </div>
                {currentProjectId && (
                    <button 
                        onClick={() => handleSave(true)}
                        disabled={isBusy || !projectName.trim()}
                        className="w-full mt-3 flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors"
                    >
                         {t('save_project_modal_overwrite')} "{currentProjectName}"
                    </button>
                )}
            </div>
            
            {/* Load Section */}
            <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-200">{t('save_project_modal_saved_projects_title')}</h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isBusy}
                            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-md transition-colors"
                        >
                            <FolderOpenIcon className="w-4 h-4" />
                            <span>{t('load_from_disk')}</span>
                        </button>
                        <InfoTooltip text={t('tooltip_load_from_disk')} position="left" />
                    </div>
                </div>
                {isLoadingList ? (
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
                                    <button 
                                      onClick={() => handleLoad(p.id!)} 
                                      disabled={isBusy}
                                      className="flex items-center justify-center w-28 text-center space-x-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-xs font-semibold text-white rounded-md transition-colors"
                                    >
                                      {(isLoadingProject && actionId === p.id) ? (
                                        <SpinnerIcon className="animate-spin h-4 w-4 text-white" />
                                      ) : (
                                        <>
                                          <FolderOpenIcon className="w-4 h-4" />
                                          <span>{t('load_project')}</span>
                                        </>
                                      )}
                                    </button>
                                     <button 
                                      onClick={() => handleDelete(p.id!)} 
                                      disabled={isBusy}
                                      className="p-2 rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                      title={t('delete_project')}
                                     >
                                      {(isBusy && actionId === p.id && !isLoadingProject) ? (
                                        <SpinnerIcon className="animate-spin h-4 w-4 text-red-400" />
                                      ) : (
                                        <TrashIcon className="w-4 h-4 text-red-400" />
                                      )}
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