import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLanguage } from '../components/LanguageProvider';
import { createPageUrl } from '../utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Calendar, Clock, Edit, Trash2, Video, FileText, Search, Filter, Tag, FolderPlus, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import ProjectMetaDialog from '../components/projects/ProjectMetaDialog';
import CreateFolderDialog from '../components/projects/CreateFolderDialog';
import PullToRefresh from '../components/mobile/PullToRefresh';

export default function Projects() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [search, setSearch] = React.useState("");
    const [dateFrom, setDateFrom] = React.useState("");
    const [dateTo, setDateTo] = React.useState("");
    const [folderFilter, setFolderFilter] = React.useState("");
    const [tagsFilter, setTagsFilter] = React.useState("");
    const [editingProject, setEditingProject] = React.useState(null);
    const [showFolderDialog, setShowFolderDialog] = React.useState(false);


    const { data: user } = useQuery({
        queryKey: ['userMe'],
        queryFn: () => base44.auth.me().catch(() => null),
    });

    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects', user?.email],
        queryFn: () => base44.entities.Project.filter({ created_by: user.email }, '-updated_date'),
        enabled: !!user?.email,
    });

    const { data: folders = [] , refetch: refetchFolders } = useQuery({
        queryKey: ['projectFolders', user?.email],
        queryFn: () => base44.entities.ProjectFolder.list(),
        enabled: !!user?.email,
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Project.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });

    const handleDelete = (id) => {
        if (window.confirm(t('confirm_delete'))) {
            deleteMutation.mutate(id);
        }
    };

    const handleResume = (project) => {
        navigate(createPageUrl('Home'), { 
            state: { 
                projectData: project,
                isResume: true 
            } 
        });
    };

    const onCreateFolder = async ({ name, color }) => {
        await base44.entities.ProjectFolder.create({ name, color });
        await refetchFolders();
    };

    const filteredProjects = React.useMemo(() => {
        const q = (search || "").toLowerCase();
        const tags = (tagsFilter || "").split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
        return (projects || []).filter(p => {
            if (folderFilter && (p.folder_id || "") !== folderFilter) return false;
            if (q) {
                const hay = `${p.name || ''} ${p.description || ''} ${p.script || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (tags.length > 0) {
                const ptags = (p.tags || []).map(t => t.toLowerCase());
                if (!tags.every(t => ptags.includes(t))) return false;
            }
            const d = new Date(p.updated_date || p.created_date);
            if (from && d < from) return false;
            if (to && d > to) return false;
            return true;
        });
    }, [projects, search, tagsFilter, dateFrom, dateTo, folderFilter]);

    if (!user) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Please Log In</h2>
                <p className="text-gray-500 mb-6">You need to be logged in to manage projects.</p>
                <Button onClick={() => base44.auth.redirectToLogin()}>
                    {t('btn_login')}
                </Button>
            </div>
        );
    }

    const handlePullRefresh = async () => {
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
        await queryClient.invalidateQueries({ queryKey: ['projectFolders'] });
    };

    return (
        <PullToRefresh onRefresh={handlePullRefresh}>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{t('projects_title')}</h1>
                        <p className="mt-2 text-slate-600">{t('projects_desc')}</p>
                    </div>
                    <Link to={createPageUrl('Home')}>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                            + {t('nav_storyboard')}
                        </Button>
                    </Link>
                </div>

                {/* Filtres */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-10">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher..."
                                className="flex-1 outline-none text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={folderFilter}
                            onChange={(e) => setFolderFilter(e.target.value)}
                            className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm"
                        >
                            <option value="">Tous les dossiers</option>
                            {folders.map((f) => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-10">
                            <Tag className="w-4 h-4 text-slate-400" />
                            <input
                                value={tagsFilter}
                                onChange={(e) => setTagsFilter(e.target.value)}
                                placeholder="Tags (a,b,c)"
                                className="flex-1 outline-none text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm" />
                        <Button variant="outline" className="whitespace-nowrap" onClick={() => setShowFolderDialog(true)}>
                            <FolderPlus className="w-4 h-4 mr-2" /> Nouveau dossier
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : projects?.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">{t('no_projects')}</h3>
                        <Link to={createPageUrl('Home')} className="mt-4 inline-block">
                            <Button variant="outline">{t('nav_storyboard')}</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.length === 0 ? (
                            <div className="col-span-full text-center py-16 bg-white border-2 border-dashed border-gray-200 rounded-xl text-slate-500">
                                Aucun projet ne correspond à vos filtres.
                            </div>
                        ) : filteredProjects.map((project) => (
                            <Card key={project.id} className="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                                {(project.thumbnail_url || (project.generated_images && project.generated_images[0]?.url)) && (
                                    <div className="aspect-video w-full bg-gray-100">
                                        <img
                                            src={project.thumbnail_url || project.generated_images[0]?.url}
                                            alt="Miniature du projet"
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                )}
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <Badge variant={project.status === 'completed' ? 'default' : 'secondary'} className={project.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                                            {project.status === 'completed' ? 'Completed' : 'Draft'}
                                        </Badge>
                                        <span className="text-xs text-gray-400 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {format(new Date(project.updated_date || project.created_date), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    <CardTitle className="text-xl mt-2 line-clamp-1">{project.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                        {project.description || project.script?.substring(0, 100) || "No description"}
                                    </CardDescription>
                                    {project.tags && project.tags.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {project.tags.map((tg, idx) => (
                                                <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-700">#{tg}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <div className="flex gap-4 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <FileText className="w-4 h-4 mr-1.5" />
                                            {project.script ? `${project.script.length} chars` : 'No script'}
                                        </div>
                                        <div className="flex items-center">
                                            <Video className="w-4 h-4 mr-1.5" />
                                            {project.generated_images?.length || 0} scenes
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-3 border-t bg-gray-50/50 flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-slate-600 hover:text-slate-800"
                                            onClick={() => setEditingProject(project)}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Éditer
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(project.id)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {t('btn_delete')}
                                        </Button>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleResume(project)}
                                        className="bg-slate-900 text-white hover:bg-slate-800"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        {t('btn_resume')}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            {/* Dialogs */}
            <ProjectMetaDialog
                open={!!editingProject}
                onClose={() => setEditingProject(null)}
                project={editingProject}
                folders={folders}
                onSave={(data) => {
                    if (editingProject) {
                        updateMutation.mutate({ id: editingProject.id, data });
                        setEditingProject(null);
                    }
                }}
            />
            <CreateFolderDialog
                open={showFolderDialog}
                onClose={() => setShowFolderDialog(false)}
                onCreate={onCreateFolder}
            />
            </div>
            </div>
            </PullToRefresh>
            );
            }