import React, { useContext } from 'react';
import { SaveIcon, UploadIcon, TrashIcon, FolderPlusIcon, FolderOpenIcon } from './icons';
import { I18nContext } from '../lib/i18n';

interface ProjectManagerProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  savedProjects: string[];
  onSaveAs: () => void;
  onUpdate: () => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
  isProjectLoaded: boolean;
  hasTracks: boolean;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projectName,
  onProjectNameChange,
  savedProjects,
  onSaveAs,
  onUpdate,
  onLoad,
  onDelete,
  isProjectLoaded,
  hasTracks,
}) => {
  const { t } = useContext(I18nContext);

  const handleDeleteClick = (name: string) => {
    if (window.confirm(t('confirm_delete_project', { projectName: name }))) {
      onDelete(name);
    }
  };

  const canSave = hasTracks && projectName.trim() !== '';

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg space-y-6">
      <h3 className="text-lg font-semibold text-gray-200">{t('project_manager_title')}</h3>
      
      <div className="space-y-2">
        <label htmlFor="project-name" className="block text-sm font-medium text-gray-400">
          {t('project_name_label')}
        </label>
        <input
          id="project-name"
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="My Awesome Podcast"
          className="w-full bg-gray-900/70 border border-gray-600 rounded-md px-3 py-2 text-base text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onSaveAs}
          disabled={!canSave}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
        >
          <FolderPlusIcon className="w-5 h-5 mr-2" />
          <span>{t('save_as_new_project')}</span>
        </button>
        <button
          onClick={onUpdate}
          disabled={!canSave || !isProjectLoaded}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600/80 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
        >
          <SaveIcon className="w-5 h-5 mr-2" />
          <span>{t('update_project')}</span>
        </button>
      </div>

      <div className="border-t border-gray-700/50 pt-4">
        <h4 className="text-md font-semibold text-gray-300 mb-3">{t('saved_projects')}</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {savedProjects.length > 0 ? (
            savedProjects.map((name) => (
              <div key={name} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                <p className="text-sm text-gray-200 truncate flex-grow" title={name}>{name}</p>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => onLoad(name)}
                    className="p-2 rounded-md hover:bg-gray-600 transition-colors"
                    title={t('load_project')}
                  >
                    <FolderOpenIcon className="w-4 h-4 text-teal-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(name)}
                    className="p-2 rounded-md hover:bg-red-500/20 transition-colors"
                    title={t('delete_project')}
                  >
                    <TrashIcon className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">{t('no_saved_projects')}</p>
          )}
        </div>
      </div>
    </div>
  );
};
