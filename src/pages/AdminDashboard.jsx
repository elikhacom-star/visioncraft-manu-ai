import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users, Shield, Zap, Search, RefreshCw, Crown, Trash2, Clock, FileText, Activity, Settings, DollarSign } from 'lucide-react';
import { useLanguage } from '../components/LanguageProvider';
import UserLimitEditor from '../components/admin/UserLimitEditor';
import PlanManager from '../components/admin/PlanManager';
import { toast } from 'sonner';

export default function AdminDashboard() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [limitEditorOpen, setLimitEditorOpen] = useState(false);
    const [selectedUserForLimit, setSelectedUserForLimit] = useState(null);

    // Fetch current user to check permissions
    const { data: currentUser } = useQuery({
        queryKey: ['userMe'],
        queryFn: () => base44.auth.me(),
    });

    // Fetch all users (only works if admin)
    const { data: users = [], isLoading, error } = useQuery({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            // We fetch the schema to know we have access, then list
            return await base44.entities.User.list();
        },
        enabled: currentUser?.role === 'admin' || currentUser?.email === 'elikhacom@gmail.com',
    });

    // Fetch activity logs
    const { data: logs = [] } = useQuery({
        queryKey: ['activityLogs'],
        queryFn: () => base44.entities.ActivityLog.list('-created_date', 100),
        enabled: currentUser?.role === 'admin' || currentUser?.email === 'elikhacom@gmail.com',
    });

    // Mutation to update user
    const updateUserMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            return await base44.entities.User.update(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsers']);
        },
    });

    // Mutation to delete user
    const deleteUserMutation = useMutation({
        mutationFn: async (id) => {
            return await base44.entities.User.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['adminUsers']);
        },
    });

    // Special mutation for self-promotion
    const promoteMeMutation = useMutation({
        mutationFn: async () => {
            return await base44.functions.invoke('promoteMe', {});
        },
        onSuccess: () => {
            window.location.reload();
        },
    });

    const handlePlanChange = (userId, newPlan) => {
        updateUserMutation.mutate({ id: userId, data: { subscription_plan: newPlan } });
    };

    const handleRoleChange = (userId, newRole) => {
        if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            updateUserMutation.mutate({ id: userId, data: { role: newRole } });
            base44.entities.ActivityLog.create({
                action: 'update_role',
                details: `Changed role for user ${userId} to ${newRole}`,
                metadata: { target_user_id: userId, new_role: newRole }
            });
        }
    };

    const handleDeleteUser = (userId, userEmail) => {
        // Protection super admin
        if (userEmail === 'elikhacom@gmail.com') {
            toast.error("Impossible de supprimer le super administrateur");
            return;
        }
        
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
            deleteUserMutation.mutate(userId);
            base44.entities.ActivityLog.create({
                action: 'delete_user',
                details: `Deleted user ${userId}`,
                metadata: { target_user_id: userId }
            });
        }
    };

    const handleOpenLimitEditor = (user) => {
        setSelectedUserForLimit(user);
        setLimitEditorOpen(true);
    };

    const handleSaveUserLimits = (data) => {
        updateUserMutation.mutate({ 
            id: selectedUserForLimit.id, 
            data 
        });
        toast.success("Limites mises à jour");
        base44.entities.ActivityLog.create({
            action: 'update_limits',
            details: `Modified limits for user ${selectedUserForLimit.email}`,
            metadata: { target_user_id: selectedUserForLimit.id, ...data }
        });
    };

    const filteredUsers = users.filter(u => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const totalUsers = users.length;
    const proUsers = users.filter(u => u.subscription_plan === 'pro').length;
    const totalVideos = users.reduce((acc, curr) => acc + (curr.monthly_video_count || 0), 0);

    if (currentUser?.email === 'elikhacom@gmail.com' && currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <CardTitle>Admin Access Required</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>Welcome, Owner. You currently don't have the 'admin' role in the database.</p>
                        <Button 
                            onClick={() => promoteMeMutation.mutate()} 
                            disabled={promoteMeMutation.isPending}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
                        >
                            {promoteMeMutation.isPending ? "Promoting..." : "Claim Admin Rights Now"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl text-slate-500">Access Denied. Admins only.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                        <p className="text-slate-500">Gestion des utilisateurs, abonnements et plans.</p>
                    </div>
                    <Button onClick={() => queryClient.invalidateQueries()} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="p-4 rounded-full bg-blue-100 text-blue-600 mr-4">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Users</p>
                                <h3 className="text-2xl font-bold text-slate-900">{totalUsers}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="p-4 rounded-full bg-amber-100 text-amber-600 mr-4">
                                <Crown className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pro Subscribers</p>
                                <h3 className="text-2xl font-bold text-slate-900">{proUsers}</h3>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center p-6">
                            <div className="p-4 rounded-full bg-green-100 text-green-600 mr-4">
                                <Zap className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Videos Generated (Mo)</p>
                                <h3 className="text-2xl font-bold text-slate-900">{totalVideos}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="users" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md">
                        <TabsTrigger value="users">
                            <Users className="w-4 h-4 mr-2" />
                            Utilisateurs
                        </TabsTrigger>
                        <TabsTrigger value="plans">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Plans
                        </TabsTrigger>
                        <TabsTrigger value="logs">
                            <FileText className="w-4 h-4 mr-2" />
                            Logs
                        </TabsTrigger>
                    </TabsList>

                    {/* Users Tab */}
                    <TabsContent value="users" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>User Management</CardTitle>
                            <div className="relative w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by email or name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-10">Loading users...</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Usage (Videos)</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-slate-900">{u.full_name || 'No Name'}</p>
                                                    <p className="text-xs text-slate-500">{u.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                                    {u.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Select 
                                                    defaultValue={u.subscription_plan || 'free'} 
                                                    onValueChange={(val) => handlePlanChange(u.id, val)}
                                                >
                                                    <SelectTrigger className="w-[120px] h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="free">Free</SelectItem>
                                                        <SelectItem value="pro">Pro</SelectItem>
                                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{u.monthly_video_count || 0}</span>
                                                    <span className="text-xs text-slate-400">
                                                        / {u.monthly_video_limit || (u.subscription_plan === 'pro' ? 50 : 3)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                                                        onClick={() => handleOpenLimitEditor(u)}
                                                    >
                                                        <Settings className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {new Date(u.created_date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {u.email !== currentUser.email && (
                                                     <div className="flex justify-end gap-2">
                                                        {u.role !== 'admin' ? (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => handleRoleChange(u.id, 'admin')}
                                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                            >
                                                                <Shield className="w-4 h-4 mr-1" />
                                                                Make Admin
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => handleRoleChange(u.id, 'user')}
                                                                className="text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                                                            >
                                                                <Shield className="w-4 h-4 mr-1" />
                                                                Remove Admin
                                                            </Button>
                                                        )}
                                                        {u.email !== 'elikhacom@gmail.com' && (
                                                            <Button
                                                               variant="ghost"
                                                               size="sm"
                                                               onClick={() => handleDeleteUser(u.id, u.email)}
                                                               className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                               title="Supprimer Utilisateur"
                                                           >
                                                               <Trash2 className="w-4 h-4" />
                                                           </Button>
                                                        )}
                                                     </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Plans Tab */}
                    <TabsContent value="plans">
                        <PlanManager />
                    </TabsContent>

                    {/* Activity Log Tab */}
                    <TabsContent value="logs">
                    <Card className="h-full max-h-[800px] flex flex-col">
                        <CardHeader className="border-b border-gray-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="w-5 h-5 text-slate-500" />
                                Activity Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto flex-1">
                            {logs && logs.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {logs.map((log) => (
                                        <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 p-1.5 rounded-full flex-shrink-0 ${
                                                    log.action === 'visit' ? 'bg-blue-100 text-blue-600' :
                                                    log.action?.includes('delete') ? 'bg-red-100 text-red-600' :
                                                    log.action?.includes('role') ? 'bg-amber-100 text-amber-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {log.action === 'visit' ? <Users className="w-3 h-3" /> :
                                                     log.action?.includes('delete') ? <Trash2 className="w-3 h-3" /> :
                                                     log.action?.includes('role') ? <Shield className="w-3 h-3" /> :
                                                     <Activity className="w-3 h-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">
                                                        {log.details || log.action}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <p className="text-xs text-slate-500 truncate max-w-[120px]" title={log.created_by}>
                                                            {log.created_by}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(log.created_date).toLocaleDateString()} {new Date(log.created_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No activity recorded yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    </TabsContent>
                </Tabs>

                {/* User Limit Editor Modal */}
                {selectedUserForLimit && (
                    <UserLimitEditor
                        isOpen={limitEditorOpen}
                        onClose={() => setLimitEditorOpen(false)}
                        user={selectedUserForLimit}
                        onSave={handleSaveUserLimits}
                    />
                )}
            </div>
        </div>
    );
}